'use strict';
const
	// node native
    http = require('http')
	
  , defaultRequestOptions = {
		method: 'GET'
	  , hostname: 'ixirc.com'
	  , port: 80
	  , path: '/api/'
	}

  , handlers = {
		data: (httpChunks, chuck) => {
			httpChunks.push(chuck);
		}
	  , end: (httpChunks, resolve) => {
			const
				body = Buffer.concat(httpChunks)
			  , content = body.toString()
			  , result = content ? JSON.parse(content) : {}
			  ;
			return resolve(result);
		}
	  , error: (reject, err) => {
			return reject(err);
		}
	}
	
  , ixircHttpClient = {
		get: (terms, pageIndex) => new Promise((resolve, reject) => {				
			const 
				options = Object.assign({}, defaultRequestOptions)
			  , httpChunks = []
			  ;
			let request;
			options.path += `?q=${encodeURIComponent(terms)}&pn=${pageIndex}`;
			options.path = encodeURI(options.path);
			request = http.request(options, (response) => {
				response.on('data', handlers.data.bind(null, httpChunks) );
				response.on('end', handlers.end.bind(null, httpChunks, resolve) );
			});
			request.on('error', handlers.error.bind(null, reject) );
			request.end();
		})
	}
  ;
  
module.exports = ixircHttpClient;