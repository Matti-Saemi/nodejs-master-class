'use strict';
// Define the handlers
const handlers = {};

handlers.sample = function(data, callback) {
  // Callback a http status code and a payload object
  callback(200, {'name' : 'sample handler'});
};

handlers.ping = function(data, callback) {
  // Callback a http status code and a payload object
  callback(200, 'OK!');
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
