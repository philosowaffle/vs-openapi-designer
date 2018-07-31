const JsonRefs = require('json-refs');
const yaml = require('js-yaml');
const fs = require('fs');
const refParser = require('json-schema-ref-parser')

<<<<<<< HEAD
function dictToString(dict) {
    var res = [];
    // @ts-ignore
    for (const [k, v] of Object.entries(dict)) {
      res.push(`${k}: ${v}`);
    }
    return res.join('\n');
}

=======
>>>>>>> [01] fixing references in util
/**
 * Given a root openApiFile, resolves all refs and creates
 * a single unified json schema.
 * 
 * @param {string} rootOpenApiFile
 */
// exports.bundle = function (rootOpenApiFile) {
//     var root = yaml.safeLoad(fs.readFileSync(rootOpenApiFile, 'utf8'));
//     var options = {
//         filter : ['relative', 'remote'],
//         resolveCirculars: true,
//         location: rootOpenApiFile,
//         loaderOptions : {
//             processContent : function (res, callback) {
//                 var parsed = yaml.safeLoad(res.text);
//                 callback(undefined, parsed);
//             }
//         }
//     };
//     JsonRefs.clearCache();
//     return JsonRefs.resolveRefs(root, options)
//         .then(function (results) {
//             var resErrors = {};
//             for (const [k,v] of Object.entries(results.refs)) {
//             if ('missing' in v && v.missing === true)
//                 resErrors[k] = v.error;
//             }

//             if (Object.keys(resErrors).length > 0) {
//                 return Promise.reject(this.dictToString(resErrors));
//             }

//             return results.resolved;
//         }, function (e) {
//             var error = {};
//             Object.getOwnPropertyNames(e).forEach(function (key) {
//                 error[key] = e[key];
//             });
//             return Promise.reject(this.dictToString(error));
//         });
// }

function bundle2(rootOpenApiFile) {
    var root = yaml.safeLoad(fs.readFileSync(rootOpenApiFile, 'utf8'));

    var filePath = rootOpenApiFile.substring(0, rootOpenApiFile.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = rootOpenApiFile.substring(0, rootOpenApiFile.lastIndexOf("/")); // !windows

    return refParser.bundle(rootOpenApiFile)
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
  for (const [k, v] of Object.entries(dict)) {
    res.push(`${k}: ${v}`);
  }
  return res.join('\n');
}

exports.bundle2 = bundle2;
exports.dictToString = dictToString;
exports.getPathFromFile = getPathFromFile;
