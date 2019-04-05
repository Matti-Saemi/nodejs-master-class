'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path =  require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const util = require('util');
const debug = util.debuglog('workers');


const handlers = require('../routes/handlers');
const helpers = require('./helpers');
const ReqHandler = require('./request-handler');
const config = require('./config');

const server = {};

// HTTP Server
server.httpServer = http.createServer((req, res) => {
  server.serverCallback(req, res);
});

server.httpsOption = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}
// HTTPS Server
server.httpsServer = https.createServer(server.httpsOption, (req, res) => {
  server.serverCallback(req, res);
});

server.serverCallback = (req, res) => {
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
    const chosenHandler = typeof(server.router[trimmedPath]) === 'undefined' ? handlers.notFound : server.router[trimmedPath];

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryString,
      'method': method,
      'headers': headers,
      'payload': helpers.ParseJsonToObject(buffer)
    };

    // Rout the request
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

// Define a request router
server.router = {
  'sample': handlers.sample,
  'ping'  : handlers.ping,
  'users' : handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks,
}

server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m',`Listening to http port ${config.httpPort} in ${config.envType} mode ...`);
  });

  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[35m%s\x1b[0m',`Listening to https port ${config.httpsPort} in ${config.envType} mode ...`);

  });

};

module.exports = server;
