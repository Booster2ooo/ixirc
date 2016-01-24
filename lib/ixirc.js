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
                httpOptionsBase = {
                    method: 'GET'
                  , hostname: 'ixirc.com'
                  , port: 80
                  , path: '/api/'
                }
              , eventNames = {
                    progress:   'search-progress'
                  , complete:   'search-complete'
                  , error:      'search-error'
                }
              , searches = {}
              , events = new EventEmitter()

              , httpSearch = function httpSearch(terms) {
                    return new Promise(function(resolve, reject) {
                        var httpChunks = []
                          , pn = 0
                          , httpRequest
                          , result = {}

                            /* EVENTS HANDLERS */
                          , handlers = {
                                requestError: function requestError(err) {
                                    result.error = err;
                                    return reject(result);
                                }
                              , responseData: function responseData(chunk) {
                                    httpChunks.push(chunk);
                                }
                              , responseEnd: function responseEnd() {
                                    var body = Buffer.concat(httpChunks)
                                      , strBody = body.toString()
                                      , searchResult = {}
                                      ;
                                    httpChunks = [];
                                    if(strBody) {
                                        try {
                                            var deltaP;
                                            searchResult = JSON.parse(strBody);
                                            deltaP = searchResult.pc - searchResult.pn;
                                            if(searchResult.pn != 0) {
                                                // first result of a page is the same than the last result of the previous page, remove it
                                                searchResult.results.shift();
                                            }
                                            events.emit(eventNames.progress, searchResult.results);
                                            if(!result.c) {
                                                result = searchResult;
                                            }
                                            else {
                                                result.c = searchResult.c;
                                                result.results = result.results.concat(searchResult.results);
                                            }
                                            if(deltaP == 2) {
                                                pn++;
                                                makeHttpRequest();
                                                return;
                                            }
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
                            /* METHODS */
                          , makeHttpRequest = function makeHttpRequest() {
                                var httpOptions = extend({}, httpOptionsBase);
                                httpOptions.path += '?q=' + terms + '&pn=' + pn;
                                httpRequest = http.request(httpOptions, function(response) {
                                    response.on('data', handlers.responseData);
                                    response.on('end', handlers.responseEnd);
                                });
                                httpRequest.on('error', handlers.requestError);
                                httpRequest.end();
                            }
                          ;
                        makeHttpRequest();
                    });
                }
              ;
            return resolve({
                search: function search(terms, cached) {
                    return new Promise(function(resolve, reject) {
                        var bindResults = function bindResults(results) {
                            searches[terms].result = results;
                            searches[terms].done = true;
                        };
                        if(!terms) {
                            return reject('no search terms provided');
                        }
                        terms = terms.replace(/\s/g, '+');
                        if(searches[terms] && searches[terms].done && cached) {
                            events.emit(eventNames.complete, searches[terms]);
                            return resolve(searches[terms]);
                        }
                        searches[terms] = {
                            done: false
                            , result: {}
                        };
                        httpSearch(terms)
                            .then(function(results) {
                                bindResults(results);
                                events.emit(eventNames.complete, searches[terms]);
                                resolve(searches[terms]);
                            })
                            .catch(function(results) {
                                bindResults(results);
                                events.emit(eventNames.error, searches[terms]);
                                reject(searches[terms]);
                            })
                        ;
                    });
                }
              , eventNames: eventNames
              , on: events.on.bind(events)
            });
        });
    }
  ;

module.exports = ixirc;