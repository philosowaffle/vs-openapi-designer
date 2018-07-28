const JsonRefs = require('json-refs');
const yaml = require('js-yaml');
const fs = require('fs');

exports.dictToString = function (dict) {
    var res = [];
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
exports.bundle = function (rootOpenApiFile) {
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
        for (const [k,v] of Object.entries(results.refs)) {
        if ('missing' in v && v.missing === true)
            resErrors[k] = v.error;
        }

        if (Object.keys(resErrors).length > 0) {
        return Promise.reject(this.dictToString(resErrors));
        }

        return results.resolved;
    }, function (e) {
        var error = {};
        Object.getOwnPropertyNames(e).forEach(function (key) {
            error[key] = e[key];
        });
        return Promise.reject(this.dictToString(error));
    });
}