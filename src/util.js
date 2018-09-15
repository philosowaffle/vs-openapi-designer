const refParser = require('json-schema-ref-parser')

function bundle(rootOpenApiFile) {
    // @ts-ignore
    return refParser.bundle(rootOpenApiFile)
                    .then(function(bundled){
                        return refParser.dereference(bundled)
                                .catch(function(err){
                                    console.log(err);
                                    return Promise.reject(dictToString(err));
                                });
                    })
                    .catch(function(err){
                        console.log(err);
                        return Promise.reject(dictToString(err));
                    });
}

function getPathFromFile(fqFilePath) {
    var filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("/")); // !windows

    return filePath;
}

function dictToString(dict) {
  var res = [];

  // @ts-ignore
  for (const [k, v] of Object.entries(dict)) {
    res.push(`${k}: ${v}`);
  }
  return res.join('\n');
}

exports.bundle = bundle;
exports.dictToString = dictToString;
exports.getPathFromFile = getPathFromFile;
