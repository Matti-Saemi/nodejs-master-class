'use strict';

const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
const ReqHandler = require('./request-handler');

// Define a request router
const router = {
  'sample': handlers.sample,
  'ping'  : handlers.ping,
  'users' : handlers.users,
  'tokens': handlers.tokens
}

const server = (req, res) => {
  const reqHandlerObj = new ReqHandler(req);
  const parsedUrl = reqHandlerObj.getUrl();
  // console.log("url => ", parsedUrl);

  const trimmedPath = reqHandlerObj.getPath();
  // console.log("trimmedPath => ", trimmedPath);

  const method = reqHandlerObj.getMethod();
  const queryString = reqHandlerObj.getQueryString();
  // console.log('query string => ', queryString);
  // Get header
  const headers = reqHandlerObj.getHeaders();

  // Get the payload, if there is any (streaming)
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });

  // End event gets called no matter what
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to
    const chosenHandler = typeof(router[trimmedPath]) === 'undefined' ? handlers.notFound : router[trimmedPath];

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryString,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    // Rout the request
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
      const payloadString = JSON.stringify(payload);

      // console.log("Status code : ", statusCode);
      // console.log("Payload : ", payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

module.exports = server;
