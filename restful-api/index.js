'use strict';

const config = require('./config');
const http = require('http');
const https = require('https');
const serverCallback = require('./server');
const fs = require('fs');

// HTTP Server
const httpServer = http.createServer((req, res) => {
  serverCallback(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`Listening to http port ${config.httpPort} in ${config.envType} mode ...`);
});

const httpsOption = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
}
// HTTPS Server
const httpsServer = https.createServer(httpsOption, (req, res) => {
  serverCallback(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`Listening to https port ${config.httpsPort} in ${config.envType} mode ...`);
});
