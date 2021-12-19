const refParser = require('json-schema-ref-parser')

export function bundle(rootOpenApiFile:string):Promise<string> {
    return refParser.dereference(rootOpenApiFile)
                    .catch(function(err: any){
                        console.log(err);
                        return Promise.reject(JSON.stringify(err, null, 2));
                    });
}

export function getPathFromFile(fqFilePath: string) {
    var filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fqFilePath.substring(0, fqFilePath.lastIndexOf("/")); // !windows

    return filePath;
}