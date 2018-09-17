const refParser = require('json-schema-ref-parser')
const path = require('path');

var source = path.join(__dirname, '/schema/petstore.yaml');

refParser.bundle(source, (err, schema) => {
    if (err) {
        console.error('ERROR:', err);
    }
    else {
        console.log('SUCCESS:', JSON.stringify(schema, null, 2));
        console.log("DEREFERENCE");

        refParser.dereference(schema, (err, drSchema) => {
            if (err) {
                console.error('ERROR:', err);
            }
            else {
                console.log('SUCCESS:', JSON.stringify(drSchema, null, 2));        
            }
        });
    }
});