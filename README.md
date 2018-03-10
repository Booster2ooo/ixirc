# ixirc
Node.js module for ixirc api

## Disclamer
This module does not intend to facilitate illegal files transfer. The author may not be taken responsible for any copyright infringement or illegal uses.

## Usage

```javascript
#!/usr/bin/env node

var ixirc = require('./src/ixirc.js')
  , start
  , end
  ;
ixirc.on(ixirc.events.progress, function(results) {
	console.log('progress');
	console.log(results.length + ' results found');
});
ixirc.on(ixirc.events.complete, function(results) {
	console.log('complete');
	console.log(results.length + ' total results found');
});
start = process.hrtime();
ixirc.search('test')
    .then(function(results) {
        end = process.hrtime(start);
        start = process.hrtime();
        console.log(end);
        return ixirc.search('test', true);
    })
    .then(function(results) {
        end = process.hrtime(start);
        console.log(end);
        console.log('done');
        return ixirc.clearCache();
    })
    .then(function() {
        process.exit();
    })
    .catch(function(err) {
        console.error(err);
        err.stack && console.error(err.stack);
    });
```