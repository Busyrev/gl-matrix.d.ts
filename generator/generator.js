/**
 * @fileoverview gl-matrix.d.ts generator
 * @author chuntaro <chuntaro@sakura-games.jp>
 * @version 1.0.0
 */
// Copyright (c) 2015 chuntaro
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Usage:
//
// $ pwd
// /foo/bar/gl-matrix.d.ts/generator
//
// $ node -v
// v4.2.1
//
// $ tsc -v
// message TS6029: Version 1.7.0-dev.20151016
//
// $ git clone https://github.com/toji/gl-matrix.git
//
// $ ls -1F
// generator.ts
// gl-matrix/
// node.d.ts
// tsconfig.json
//
// $ tsc
//
// $ node generator.js > ../gl-matrix.d.ts
// or
// $ node generator.js --disable-javadoc > ../gl-matrix.d.ts
//
/// <reference path="node.d.ts" />
"use strict";
var fs = require("fs");
let STRICTLY_TYPED = false; // Strict type checking version is still incomplete.
let ARRAY_TYPE = "Float32Array";
let ENABLE_JAVADOC = true;
process.argv.forEach(arg => {
    if (arg === "--strictly-typed") {
        STRICTLY_TYPED = true;
    }
    if (arg === "--disable-javadoc") {
        ENABLE_JAVADOC = false;
    }
});
function debug(obj, message) {
    if (typeof obj === "string") {
        console.log(obj);
    }
    else if (typeof obj === "function") {
        obj();
    }
    else if (!obj) {
        console.error("Assertion failed");
        if (message) {
            console.error(message);
        }
        console.trace();
        process.exit(1);
    }
}
const glMatrixDir = "gl-matrix/src/gl-matrix/";
const klasses = ["vec2", "vec3", "vec4", "mat2", "mat2d", "mat3", "mat4", "quat"];
const javadocTypes = ["number", "Number", "String", "quat4", "Function", "Object", "Array", "Type"];
const validTypes = klasses.concat(javadocTypes);
function convertType(fromType, klass, method) {
    let toType = "void";
    let isArray = false;
    if (!STRICTLY_TYPED && klasses.indexOf(klass) >= 0) {
        klass = ARRAY_TYPE;
    }
    if (validTypes.indexOf(fromType) >= 0) {
        switch (fromType) {
            case "quat4":
                toType = "quat";
                break;
            case "Array":
                isArray = true;
                toType = klass;
                break;
            case "Function":
                toType = `(a: ${klass}, b: ${klass}, arg: T) => void`;
                break;
            case "Object":
            case "Type":
                toType = "T";
                break;
            default:
                toType = fromType.toLowerCase();
                break;
        }
    }
    if (!STRICTLY_TYPED && klasses.indexOf(toType) >= 0) {
        toType = ARRAY_TYPE;
    }
    if (method === "LDU") {
        isArray = true;
    }
    if (isArray) {
        toType += "[]";
    }
    return toType;
}
let signatureDB = new Map();
function ToString(signature) {
    let str = "";
    const method = signature.method;
    const isAlias = signature.isAlias;
    if (isAlias) {
        const targetKlass = signature.targetKlass;
        const targetMethod = signature.targetMethod;
        const targetSig = signatureDB.get(targetKlass).get(targetMethod);
        signature.klass = targetSig.klass;
        signature.method = targetSig.method;
        signature.params = targetSig.params;
        signature.paramTypes = targetSig.paramTypes;
        signature.returnType = targetSig.returnType;
        signature = targetSig;
    }
    const javadoc = signature.javadoc;
    const params = signature.params;
    const paramTypes = signature.paramTypes;
    const returnType = signature.returnType;
    let isGeneric = false;
    let strParams = "";
    for (let i = 0; i < params.length; ++i) {
        const param = params[i];
        const paramType = paramTypes[i];
        if (paramType === "T") {
            isGeneric = true;
        }
        strParams += `${param}: ${paramType}`;
        if (i < params.length - 1) {
            strParams += ", ";
        }
    }
    if (ENABLE_JAVADOC) {
        const javadoc2 = javadoc.replace(/^(.+?)$/mg, "  $1");
        str += `\n${javadoc2}\n`;
    }
    str += `  ${method}`;
    if (isGeneric) {
        str += "<T>";
    }
    str += "(" + strParams + `): ${returnType};\n`;
    return str;
}
const reDocTerm = String.raw `(?:[^*]|\*(?!/))*?`;
const reKlasses = klasses.join("|");
const reMethod = String.raw `\.(?:(?:SIMD|scalar)\.)?(\w+)`;
const reAlias = String.raw `(${reKlasses})(?:SIMD|scalar)?${reMethod}`;
const reClosure = String.raw `\(function[\s\S]*?return\s*function`;
const reFunc = String.raw `(?:function|(?:${reClosure})|(?:${reAlias}))`;
const reParams = String.raw `(?:\((.*)\))?`;
const reFirst = String.raw `(/\*\*${reDocTerm}\*/)${reDocTerm}`;
const reLast = String.raw `${reMethod}\s*=\s*${reFunc}\s*${reParams}\s*(?:\{[\s\S]*?(?:(return)|\}))?`;
const regexMethod = new RegExp(reFirst + "(?:" + reKlasses + ")" + reLast, "g");
const regexParams = /@(?:param|returns)\s*{(\w+)}\s*/g;
const regexReturns = /@returns\s*{(\w+)}/;
const regexVersion = /@version\s*([0-9.]+)/g;
const regex_glMatrix = /^glMatrix\.(\w+)\s*=\s*(.*);$/gm;
function parseKlass(klass, regex, src, callback) {
    let result;
    while ((result = regex.exec(src)) !== null) {
        debug(result.length > 5, `OOPS! unknown format <${klass}.js>`);
        // const [origStr, javadoc, method, targetKlass, targetMethod, paramStr, isExistReturn] = result;
        const origStr = result[0];
        const javadoc = result[1];
        const method = result[2];
        const targetKlass = result[3];
        const targetMethod = result[4];
        const paramStr = result[5];
        const isExistReturn = result[6];
        let javadocParams = [];
        let params = [];
        let paramTypes = [];
        let returnType = convertType(klass, klass, method);
        let resultJavadocParams;
        while ((resultJavadocParams = regexParams.exec(javadoc)) !== null) {
            javadocParams.push(resultJavadocParams[1]);
        }
        const isAlias = !!targetKlass;
        if (!isAlias) {
            String(paramStr).trim().split(",").forEach((str, i) => {
                const param = str.trim();
                if (!param) {
                    return;
                }
                const paramType = convertType(javadocParams[i], klass);
                if (i === 0 && isExistReturn) {
                    returnType = convertType(javadocParams[i], klass, method);
                }
                params.push(param);
                paramTypes.push(paramType);
            });
            const resultReturns = regexReturns.exec(javadoc);
            if (resultReturns) {
                returnType = convertType(resultReturns[1], klass, method);
            }
        }
        callback({
            klass,
            javadoc,
            method,
            isAlias,
            targetKlass,
            targetMethod,
            params,
            paramTypes,
            returnType
        });
    }
}
//
// Creates a header from a gl-matrix.js.
//
let header = "";
{
    const gl_matrix_js = fs.readFileSync(glMatrixDir + "../gl-matrix.js", "utf-8");
    let version = "";
    let resultVersion = regexVersion.exec(gl_matrix_js);
    if (resultVersion) {
        version = resultVersion[1];
    }
    header = `// Type definitions for gl-matrix ${version}
// Project: http://glmatrix.net/
// Definitions by: chuntaro <https://github.com/chuntaro/>
// Definitions: https://github.com/chuntaro/gl-matrix.d.ts\n`;
}
//
// Creates a interface glMatrix from a common.js.
//
let glMatrix = "";
{
    const common_js = fs.readFileSync(glMatrixDir + "common.js", "utf-8");
    glMatrix += "interface glMatrix {\n";
    let result;
    while ((result = regex_glMatrix.exec(common_js)) !== null) {
        const prop = result[1];
        const value = String(result[2]).trim();
        let valueType = value;
        if (value === "Math.random") {
            valueType = "() => number";
        }
        else if ((result = /.*\?\s*(\w+)\s*:\s*(\w+)/.exec(value)) !== null) {
            if (result[1].indexOf("Array") >= 0 && result[2].indexOf("Array") >= 0) {
                if (result[1] === "Array" && result[2].indexOf("Float") >= 0) {
                    ARRAY_TYPE = result[2];
                }
                else if (result[2] === "Array" && result[1].indexOf("Float") >= 0) {
                    ARRAY_TYPE = result[1];
                }
                valueType = `${ARRAY_TYPE} | Array<number>`;
            }
            else {
                valueType = `${result[1]} | ${result[2]}`;
            }
        }
        else if (/true|false|.*&&.*/.test(value)) {
            valueType = "boolean";
        }
        else if (/(?:\.|[0-9])+/.test(value)) {
            valueType = "number";
        }
        glMatrix += `  ${prop}: ${valueType};\n`;
    }
    const klass = "glMatrix";
    parseKlass(klass, new RegExp(reFirst + klass + reLast, "g"), common_js, signature => {
        glMatrix += ToString(signature);
    });
    glMatrix += `}\ndeclare var ${klass}: ${klass};\n`;
}
//
// PASS 1/2:
// Creates a method signature database(signatureDB).
//
for (const klass of klasses) {
    const src = fs.readFileSync(glMatrixDir + klass + ".js", "utf-8");
    // let methodMap = new MethodMap(); // compile error ???
    let methodMap = new Map();
    parseKlass(klass, regexMethod, src, signature => {
        const javadoc = signature.javadoc;
        const method = signature.method;
        const isAlias = signature.isAlias;
        const targetKlass = signature.targetKlass;
        const targetMethod = signature.targetMethod;
        const params = signature.params;
        const paramTypes = signature.paramTypes;
        const returnType = signature.returnType;
        methodMap.set(signature.method, {
            klass,
            javadoc,
            method,
            isAlias,
            targetKlass,
            targetMethod,
            params,
            paramTypes,
            returnType
        });
    });
    signatureDB.set(klass, methodMap);
}
//
// PASS 2/2:
// Creates a console output from a signatureDB.
//
let output = "";
// for (const [klass, methodMap] of signatureDB) {
for (const klass of signatureDB.keys()) {
    const methodMap = signatureDB.get(klass);
    output += `\n\ninterface ${klass} {`;
    if (!ENABLE_JAVADOC) {
        output += "\n";
    }
    // for (let [method, signature] of methodMap) {
    for (const method of methodMap.keys()) {
        const signature = methodMap.get(method);
        output += ToString(signature);
    }
    output += `}\ndeclare var ${klass}: ${klass};\n`;
}
console.log(`${header}\n\n${glMatrix}${output}`);