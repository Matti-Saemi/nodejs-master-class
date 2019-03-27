'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');

const serverCallback = require('./server');
const config = require('./lib/config');
const dataLib = require('./lib/data');

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
