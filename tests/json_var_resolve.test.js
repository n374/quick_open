import * as resolver from "../src/json_var_resolver.js";

describe('JsonVariableResolver', () => {
    test('should resolve simple variables', () => {
        const json = {
            a: {
                hello: ["wor", "ld"]
            },
            b: "${.a.hello}"
        };

        const expected = {
            a: {
                hello: ["wor", "ld"]
            },
            b: ["wor", "ld"]
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve nested variables', () => {
        const json = {
            a: {
                hello: "world"
            },
            b: "${.a.hello}",
            c: "${.b}"
        };

        const expected = {
            a: {
                hello: "world"
            },
            b: "world",
            c: "world"
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve deeply nested variables', () => {
        const json = {
            a: {
                b: {
                    c: "final value"
                }
            },
            d: "${.a.b}",
            e: "${.d.c}"
        };

        const expected = {
            a: {
                b: {
                    c: "final value"
                }
            },
            d: {
                c: "final value"
            },
            e: "final value"
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should throw an error for circular references', () => {
        const json = {
            a: "${.b}",
            b: "${.a}"
        };

        expect(() => resolver.resolve(json)).toThrow(`Circular reference detected, variable: \${.a}`);
    });

    test('should handle self-referencing variables', () => {
        const json = {
            a: "${.a}"
        };

        expect(() => resolver.resolve(json)).toThrow(`Circular reference detected, variable: \${.a}`);
    });

    test('should handle multiple nested variables with circular reference', () => {
        const json = {
            a: {
                b: "${.c}"
            },
            c: {
                d: "${.a.b}"
            }
        };

        expect(() => resolver.resolve(json)).toThrow(`Circular reference detected, variable: \${.a.b}`);
    });

    test('should resolve array elements', () => {
        const json = {
            arr: [1, 2, 3],
            value: "${.arr[1]}"
        };

        const expected = {
            arr: [1, 2, 3],
            value: 2
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve nested array elements', () => {
        const json = {
            nested: {
                arr: [4, 5, 6]
            },
            value: "${.nested.arr[2]}"
        };

        const expected = {
            nested: {
                arr: [4, 5, 6]
            },
            value: 6
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve array of objects', () => {
        const json = {
            users: [
                { name: "Alice", age: 30 },
                { name: "Bob", age: 25 }
            ],
            secondUserName: "${.users[1].name}"
        };

        const expected = {
            users: [
                { name: "Alice", age: 30 },
                { name: "Bob", age: 25 }
            ],
            secondUserName: "Bob"
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should return null for array index out of bounds', () => {
        const json = {
            arr: [1, 2, 3],
            value: "${.arr[3]}"
        };

        const expected = {
            arr: [1, 2, 3],
            value: null
        };
        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve variables when the referenced key is also in an array', () => {
        const json = {
            arr: [
                { key: "value1" },
                { key: "value2" }
            ],
            also_arr: [
                { ref: "${.arr[1].key}" }
            ]
        };

        const expected = {
            arr: [
                { key: "value1" },
                { key: "value2" }
            ],
            also_arr: [
                { ref: "value2" }
            ]
        };

        expect(resolver.resolve(json)).toEqual(expected);
    });

    test('should resolve variables when the referenced key is also in an array', () => {
        const json = {
            arr: [
                { key: "value1" },
                { key: "value2" }
            ],
            also_arr: [
                { ref: "${.arr[1].anotherKey.subKey}" }
            ]
        };

        expect(() => resolver.resolve(json)).toThrow("Circular reference exists or variable not resolvable: ${.arr[1].anotherKey.subKey}");
    });
});
