"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathFromFile = exports.bundle = void 0;
const refParser = require('json-schema-ref-parser');
function bundle(rootOpenApiFile) {
    return refParser.dereference(rootOpenApiFile)
        .catch(function (err) {
        console.log(err);
        return Promise.reject(JSON.stringify(err, null, 2));
    });
}
exports.bundle = bundle;
function getPathFromFile(fqFilePath) {
    var filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("\\")); // windows
    if (filePath == "")
        filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("/")); // !windows
    return filePath;
}
exports.getPathFromFile = getPathFromFile;
//# sourceMappingURL=util.js.map