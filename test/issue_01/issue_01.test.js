const refParser = require('json-schema-ref-parser')
const assert = require('assert');
const path = require('path');


suite("Regression - Issue 01 Tests", function() {

  var source = path.join(__dirname, '/schema/petstore.yaml');
  
  test("Issue 01", function() {
      // @ts-ignore
      var output = refParser.bundle(source, (err, schema) => {
        if (err) {
          console.error('ERROR:', err);
          assert.fail(err, "No Error.");
        }
        else {
          console.log('SUCCESS:', schema);
        }
      });
  });
});