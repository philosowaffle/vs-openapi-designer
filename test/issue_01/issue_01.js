const refParser = require('json-schema-ref-parser')

var path = "C:\\\\Git\\vs-openapi-designer\\test\\resource\\v2.0\\yaml\\issue_01\\petstore.yaml";
var path2 = "./test/resource/v2.0/yaml/issue_01/petstore.yaml";
refParser.bundle(path, (err, schema) => {
  if (err) {
    console.error('ERROR:', err);
  }
  else {
    console.log('SUCCESS:', schema);
  }
});