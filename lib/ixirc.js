'use strict';
var /* NATIVE MODULES */
    // load http module
    http = require('http')
    // load eventEmitter
  , EventEmitter = require('events')

    /* DEPENDENCIES MODULES */
    // load extend module
  , extend = require('extend')

    /* IXIRC Module */
  , ixirc = function() {
        return new Promise(function(resolve, reject) {
            var /* VARS */
                // store http options basic information, will be extended before usage
                httpOptionsBase = {
                    method: 'GET'
                  , hostname: 'ixirc.com'
                  , port: 80
                  , path: '/api/'
                }
                // keep event names to avoid string typo
              , eventNames = {
                    progress:   'search-progress'
                  , complete:   'search-complete'
                  , error:      'search-error'
                }
                // in memory searches cache
              , searchesCache = {}
              , events = new EventEmitter()

                // internal search promise
              , httpSearch = function httpSearch(terms) {
                    return new Promise(function(resolve, reject) {
                            // stored http chucks during response.data
                        var httpChunks = []
                            // ixrc page number
                          , pn = 0
                            // hold http request instance
                          , httpRequest
                            // results object
                          , result = {}

                            // event handlers
                          , handlers = {
                                // error handler
                                requestError: function requestError(err) {
                                    result.error = err;
                                    return reject(result);
                                }
                                // data received handler
                              , responseData: function responseData(chunk) {
                                    httpChunks.push(chunk);
                                }
                                // response ended handler
                              , responseEnd: function responseEnd() {
                                        // concat received chuncks
                                    var body = Buffer.concat(httpChunks)
                                        // convert response to string
                                      , strBody = body.toString()
                                        // hold this page results
                                      , searchResult = {}
                                        // hold the delta between current page and next page available
                                      , deltaP
                                      ;
                                    // reset http check array for next request
                                    httpChunks = [];
                                    // if a response exists
                                    if(strBody) {
                                        try {
                                            // parse response
                                            searchResult = JSON.parse(strBody);
                                            // defined results page delta
                                            deltaP = searchResult.pc - searchResult.pn;
                                            // if it's not the first page of results
                                            if(searchResult.pn != 0) {
                                                // the the first result of the page is the same than the last result of the previous page, remove it
                                                searchResult.results.shift();
                                            }
                                            // emit progress event with retrieved results
                                            events.emit(eventNames.progress, searchResult.results);
                                            // no result found
                                            if(!result.c) {
                                                result = searchResult;
                                            }
                                            // results found
                                            else {
                                                result.c = searchResult.c;
                                                result.results = result.results.concat(searchResult.results);
                                            }
                                            // other results page available
                                            if(deltaP == 2) {
                                                // increase page number
                                                pn++;
                                                // make an other request
                                                makeHttpRequest();
                                                return;
                                            }
                                            // no further result, return
                                            return resolve(result);
                                        }
                                        catch(err) {
                                            result.error = err;
                                            return reject(result);
                                        }
                                    }
                                    else {
                                        result.error = 'empty http response';
                                        return reject(result);
                                    }
                                }
                            }
                            // http request wrapper
                          , makeHttpRequest = function makeHttpRequest() {
                                // copy request options
                                var httpOptions = extend({}, httpOptionsBase);
                                // defines query and result page number
                                httpOptions.path += '?q=' + terms + '&pn=' + pn;
                                // make request & attach handlers
                                httpRequest = http.request(httpOptions, function(response) {
                                    response.on('data', handlers.responseData);
                                    response.on('end', handlers.responseEnd);
                                });
                                httpRequest.on('error', handlers.requestError);
                                httpRequest.end();
                            }
                          ;
                        // start process
                        makeHttpRequest();
                    });
                }
              ;
            // exposed object (module)
            return resolve({
                // search promise
                search: function search(terms, cached) {
                    return new Promise(function(resolve, reject) {
                        // used to bind the search result to the cache object
                        var bindResults = function bindResults(results) {
                            searchesCache[terms].result = results;
                            searchesCache[terms].done = true;
                        };
                        // if nothing to search
                        if(!terms) {
                            // then reject
                            return reject('no search terms provided');
                        }
                        // replace spaces with +
                        terms = terms.replace(/\s/g, '+');
                        // if the term exists and user accept the cached result
                        if(searchesCache[terms] && searchesCache[terms].done && cached) {
                            // send completed event
                            events.emit(eventNames.complete, searchesCache[terms]);
                            // and resolve
                            return resolve(searchesCache[terms]);
                        }
                        // if the term doesn't exists, create an entry in the cache
                        searchesCache[terms] = {
                            done: false
                          , result: {}
                        };
                        // start searching
                        httpSearch(terms)
                            .then(function(results) {
                                bindResults(results);
                                events.emit(eventNames.complete, searchesCache[terms]);
                                resolve(searchesCache[terms]);
                            })
                            .catch(function(results) {
                                bindResults(results);
                                events.emit(eventNames.error, searchesCache[terms]);
                                reject(searchesCache[terms]);
                            })
                        ;
                    });
                }
                // clear all the cache or a specific term
              , clearCache: function clearCache(term) {
                    return new Promise(function(resolve, reject) {
                        if(term) {
                            delete searchesCache[term];
                        }
                        else {
                            searchesCache = {}
                        }
                        resolve();
                    });
                }
                // expose events names
              , eventNames: eventNames
                // expose eventEmitter
              , on: events.on.bind(events)
            });
        });
    }
  ;

module.exports = ixirc;