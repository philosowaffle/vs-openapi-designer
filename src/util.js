const refParser = require('json-schema-ref-parser')

function bundle(rootOpenApiFile) {
    // @ts-ignore
    return refParser.dereference(rootOpenApiFile)
                    .catch(function(err){
                        console.log(err);
                        return Promise.reject(JSON.stringify(err, null, 2));
                    });
}

function getPathFromFile(fqFilePath) {
    var filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("/")); // !windows

    return filePath;
}

exports.bundle = bundle;
exports.getPathFromFile = getPathFromFile;