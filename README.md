# ixirc
Node.js module for ixirc api

## Usage

```javascript
#!/usr/bin/env node

var ixirc = require('./api/ixirc.js')
  , instance
  , start
  , end
  ;
ixirc()
    .then(function(ixircInstance) {
        instance = ixircInstance;
        start = process.hrtime();
        instance.on(instance.eventNames.progress, function(results) {
            console.log(results.length + ' results found');
        });
        instance.on(instance.eventNames.complete, function(search) {
            console.log(search.result.results.length + ' total results found');
        });
        return instance.search('test');
    })
    .then(function(results) {
        end = process.hrtime(start);
        start = process.hrtime();
        console.log(end);
        return instance.search('test', true);
    })
    .then(function(results) {
        end = process.hrtime(start);
        console.log(end);
        console.log('done');
        process.exit();
    })
    .catch(function(err) {
        console.error(err);
        err.stack && console.error(err.stack);
    });
```