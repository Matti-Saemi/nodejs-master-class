'use strict';

const tokenMethods = require('./tokens');
const userMethods = require('./users');
const checkMethods = require('./checks');

// Define the handlers
const handlers = {};

handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.includes(data.method)) {
    checkMethods[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.includes(data.method)) {
    tokenMethods[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.includes(data.method)){
    userMethods[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.sample = (data, callback) => {
  // Callback a http status code and a payload object
  callback(200, {'name' : 'sample handler'});
};

handlers.ping = (data, callback) => {
  // Callback a http status code and a payload object
  callback(200, 'OK!');
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
