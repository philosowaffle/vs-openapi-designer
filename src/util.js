const JsonRefs = require('json-refs');
const yaml = require('js-yaml');
const fs = require('fs');

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
function bundle(rootOpenApiFile) {
    var root = yaml.safeLoad(fs.readFileSync(rootOpenApiFile, 'utf8'));
    var options = {
        filter : ['relative', 'remote'],
        resolveCirculars: true,
        location: rootOpenApiFile,
        loaderOptions : {
        processContent : function (res, callback) {
            callback(undefined, yaml.safeLoad(res.text));
        }
        }
    };
    JsonRefs.clearCache();
    return JsonRefs.resolveRefs(root, options).then(function (results) {
        var resErrors = {};
        // @ts-ignore
        for (const [k,v] of Object.entries(results.refs)) {
        if ('missing' in v && v.missing === true)
            resErrors[k] = v.error;
        }

        if (Object.keys(resErrors).length > 0) {
        return Promise.reject(dictToString(resErrors));
        }

        return results.resolved;
    }, function (e) {
        var error = {};
        Object.getOwnPropertyNames(e).forEach(function (key) {
            error[key] = e[key];
        });
        return Promise.reject(dictToString(error));
    });
}

exports.bundle = bundle;
exports.dictToString = dictToString;