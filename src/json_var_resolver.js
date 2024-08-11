import jq from './jq.js'

export function resolve(input) {
    return new JsonVariableResolver().resolve(input);
}

class JsonVariableResolver {
    constructor() {
        this.pathHistory = new Map(); // 用于记录每个路径解析过的变量
        this.unresolvedCount = 0
        this.resolvedCount = 0
    }

    /**
     * Resolve variables in a JSON object.
     * @param {Object} json - The input JSON object with potential variable references.
     * @returns {Object} - A new JSON object with resolved variable references.
     * @throws {Error} - Throws an error if circular references are detected.
     */
    resolve(json) {
        const result = JSON.parse(JSON.stringify(json)); // 深拷贝输入的 JSON

        while (!this.resolveAll(result)) {
        }
        return result;
    }

    /**
     * Resolve all variables in the JSON object.
     * @param {Object} root - The root object being processed.
     * @returns {boolean} - The count of unresolved variables after the current pass.
     */
    resolveAll(root) {
        this.unresolvedCount = 0;
        this.resolvedCount = 0;
        let varList = this.traverse(root);
        this.checkAndResolve(root, varList)
        if (this.resolvedCount !== 0) {
            return false
        }
        if (this.unresolvedCount === 0) {
            return true
        }
        if (this.unresolvedCount > 0) {
            let path = [...new Set(varList.map(v => v.originalValue))].sort().join(", ")
            const errorMessage = `Circular reference exists or variable not resolvable: ${path}`;
            console.log(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Traverse the JSON object and resolve variables if possible.
     * @param {Object} currentObject - The current object being processed.
     * @return
     */
    traverse(currentObject) {
        const variablesToResolve = [];
        const currentPath = []

        const collectVariables = (obj, path) => {
            for (const key in obj) {
                const value = obj[key];
                const newPath = [...path, key];

                if (typeof value != "string") {
                    collectVariables(value, newPath);
                } else {
                    const match = value.match(/^\${(.+)}$/);
                    if (match) {
                        variablesToResolve.push({
                            path: newPath,
                            variablePath: match[1],
                            originalValue: value
                        });
                    }
                }
            }
        };
        collectVariables(currentObject, currentPath);
        return variablesToResolve
    }

    checkAndResolve(root, variablesToResolve) {
        for (const variable of variablesToResolve) {
            const resolvedValue = this.getValueFromPath(root, variable.variablePath);

            if (resolvedValue === undefined) {
                this.unresolvedCount++;
                continue;
            }

            if (this.checkAndRecordCircularReference(variable.path, variable.variablePath)) {
                let path = [...new Set(variablesToResolve.map(v => v.originalValue))].sort().join(", ")
                const errorMessage = `Circular reference detected, variable: ${path}`;
                console.log(errorMessage);
                throw new Error(errorMessage);
            }

            let currentObj = root;
            for (let i = 0; i < variable.path.length - 1; i++) {
                currentObj = currentObj[variable.path[i]];
            }
            currentObj[variable.path[variable.path.length - 1]] = JSON.parse(JSON.stringify(resolvedValue));
            this.resolvedCount++;
        }
    }

    /**
     * Check if resolving the current path would cause a circular reference, and record it.
     * @param {Array<string>} currentPath - The current path being resolved.
     * @param {string} variablePath - The path of the variable being replaced.
     * @returns {boolean} - True if a circular reference would be created, false otherwise.
     */
    checkAndRecordCircularReference(currentPath, variablePath) {
        for (let i = 1; i <= currentPath.length; i++) {
            const parentPath = currentPath.slice(0, i).join('.');
            if (this.pathHistory.get(parentPath) === variablePath) {
                return true; // 检测到循环引用
            }
        }

        const pathStr = currentPath.join('.');
        this.pathHistory.set(pathStr, variablePath);
        return false; // 没有循环引用
    }


    /**
     * Retrieve the value from the JSON object using a dot-separated path.
     * @param {Object} object - The JSON object.
     * @param {string} path - The dot-separated path to the desired value.
     * @returns {*} - The value at the specified path, or undefined if not found.
     * @throws {Error} - Throws an error if array index is out of bounds.
     */
    getValueFromPath(object, path) {
        let filter = jq.compile(path)

        let outputStr = ''
        try {
            for (let i of filter(object)) {
                if (typeof i == 'undefined') {
                    return undefined
                } else {
                    outputStr += jq.prettyPrint(i) + '\n'
                }
            }
            return JSON.parse(outputStr)
        } catch (e) {
            return undefined
        }
    }
}
