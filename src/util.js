const JsonRefs = require('json-refs');
const yaml = require('js-yaml');
const fs = require('fs');
const refParser = require('json-schema-ref-parser')

function dictToString(dict) {
    var res = [];
    // @ts-ignore
    for (const [k, v] of Object.entries(dict)) {
      res.push(`${k}: ${v}`);
    }
    return res.join('\n');
}

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

exports.bundle2 = function (rootOpenApiFile) {
    var root = yaml.safeLoad(fs.readFileSync(rootOpenApiFile, 'utf8'));

    var filePath = rootOpenApiFile.substring(0, rootOpenApiFile.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = rootOpenApiFile.substring(0, rootOpenApiFile.lastIndexOf("/")); // !windows

    var myResolver = {
        order: 1,
        
        canRead: true,
        
        read: function readFile (file) {
            return new Promise(function (resolve, reject) {
                var fqFilePath = file.url;

                console.log('Opening file: %s', fqFilePath);
              try {
                fs.readFile(fqFilePath, function (err, data) {
                  if (err) {
                    
                    var path0 = fqFilePath.substring(0, fqFilePath.lastIndexOf("/"));
                    var path1 = path0.substring(0, path0.lastIndexOf("/"));
                    var path3 = fqFilePath.substring(path0.length, fqFilePath.lenth-1);

                    

                    reject('Error opening file:' + path);
                  }
                  else {
                    resolve(data);
                  }
                });
              }
              catch (err) {
                reject('Error opening file:' + path);
              }
            });
          }
    };

    return refParser.bundle(rootOpenApiFile, {}, function (err, schema) {
        console.log(err);
        return Promise.reject(this.dictToString(err));
    });
}

exports.getPathFromFile = function(fqFilePath) {
    var filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("/")); // !windows

    return filePath;
}
