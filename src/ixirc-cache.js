'use strict';
let 
    cache = {}
  , getKey = (terms) => terms.replace(/\s/g, '+')
  ;

module.exports = {
    set: (terms, results) => {
        const k = getKey(terms);
        cache[k] = {};
        cache[k].results = results.slice(0);
        cache[k].done = true;
        return cache[k];
    }
  , get: (terms) => {
        const k = getKey(terms);
        return cache.hasOwnProperty(k) ? cache[k] : {};
    }
  , remove: (terms) => {
        const k = getKey(terms);
        if (cache.hasOwnProperty(k)) {
            delete cache[k];
        }
    }
  , clear: () => { cache = {}; }
};