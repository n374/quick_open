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

        while (!this.resolveAll(result, result)) {}
        return result;
    }

    /**
     * Resolve all variables in the JSON object.
     * @param {Object} currentObject - The current object being processed.
     * @param {Object} rootObject - The root object, used to resolve paths.
     * @returns {number} - The count of unresolved variables after the current pass.
     */
    resolveAll(currentObject, rootObject) {
        this.unresolvedCount = 0;
        this.resolvedCount = 0;
        this.traverseAndResolve(currentObject, rootObject, []);
        if (this.resolvedCount != 0) {
            return false
        }
        if (this.unresolvedCount == 0) {
            return true
        }
        if (this.unresolvedCount > 0) {
            const errorMessage = `Circular reference detected at path: ${this.pathHistory.get(this.pathHistory.keys().next().value)}`;
            console.log(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Traverse the JSON object and resolve variables if possible.
     * @param {Object} currentObject - The current object being processed.
     * @param {Object} rootObject - The root object, used to resolve paths.
     * @param {Array<string>} currentPath - The current path in the JSON tree.
     */
    traverseAndResolve(currentObject, rootObject, currentPath) {
        for (const key in currentObject) {
            const value = currentObject[key];
            const newPath = [...currentPath, key];

            if (typeof value != 'string') {
                // 继续深度遍历
                this.traverseAndResolve(value, rootObject, newPath);
                continue
            }

            // not a variable, skip
            const match = value.match(/^\${(.+)}$/);
            if (!match) {
                continue
            }

            const variablePath = match[1];
            const resolvedValue = this.getValueFromPath(rootObject, variablePath);

            // not resolveable, skip
            if (resolvedValue == undefined) {
                this.unresolvedCount++;
                continue
            }
            // 检测循环引用
            if (this.checkAndRecordCircularReference(newPath, variablePath)) {
                const errorMessage = `Circular reference detected at path: ${newPath.join('.')}`;
                console.log(errorMessage);
                throw new Error(errorMessage);
            }

            // 解析变量
            currentObject[key] =  JSON.parse(JSON.stringify(resolvedValue));
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
        const parts = path.split('.');
        let result = object;

        for (let part of parts) {
            const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, arrayName, index] = arrayMatch;
                result = result[arrayName];
                if (!Array.isArray(result)) {
                    return undefined;
                }
                const arrayIndex = parseInt(index, 10);
                if (arrayIndex >= 0 && arrayIndex < result.length) {
                    result = result[arrayIndex];
                } else {
                    throw new Error(`Array index out of bounds: ${path}`);
                }
            } else {
                result = result[part];
            }

            if (result === undefined) {
                return undefined;
            }
        }

        return result;
    }
}
