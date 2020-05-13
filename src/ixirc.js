'use strict';
let cancel = false;

const
    EventEmitter = require('events')
    
  , ixircEvents = require('./ixirc-events.js')
  , ixircHttpClient = require('./ixirc-http-client.js')
  , ixircCache = require('./ixirc-cache.js')
  
  , emitter = new EventEmitter()
  
  , doSearch = (terms) => new Promise((resolve, reject) => {
        let results = []
          , compute = (resp) => new Promise((res, rej) => {
                if (!resp) {
                    return rej('empty ixirc reponse');
                }
                if (!resp.c || !resp.results || cancel) {
                    return res(results);
                }
                // first result of a page is the same than the last result of the previous page            
                if (resp.pn != 0 && resp.results) {
                    resp.results.shift();
                }
                results = results.concat(resp.results);
                emitter.emit(ixircEvents.progress, resp.results);
                ixircHttpClient
                    .get(terms, resp.pn+1 )
                    .then(compute)
                    .then(res)
                    .catch(rej)
                    ;
            })
          ;
        ixircHttpClient
            .get(terms, 0)
            .then(compute)
            .then(resolve)
            .catch(reject)
            ;
    })
    
  , ixirc = {
        search: (terms, cached) => new Promise((resolve, reject) => {
            cancel = false;
            if(!terms) {
                return reject('no search terms provided');
            }
            if(cached) {
                let cache = ixircCache.get(terms);
                if (cache && cache.done) {
                    emitter.emit(ixircEvents.complete, cache.results);
                    return resolve(cache.results);
                }
            }
            doSearch(terms)
                .then((results) => {
                    if (!cancel) {
                        ixircCache.set(terms, results);
                    }
                    emitter.emit(ixircEvents.complete, results);
                    resolve(results);
                })
                .catch((err) => {
                    emitter.emit(ixircEvents.error, err);
                    reject(err);
                })
            ;
        })
      , clearCache: (terms) => {
            if(terms) {
                ixircCache.remove(terms);
            }
            else {
                ixircCache.clear();
            }
            return Promise.resolve();
        }
      , cancel: () => { 
            cancel = true;
            return Promise.resolve();
        }
      , events: ixircEvents
      , on: emitter.on.bind(emitter)
    }
  ;

module.exports = ixirc;