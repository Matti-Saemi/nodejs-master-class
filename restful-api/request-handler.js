'use strict';
const url = require('url');

const RequestHandler = function(req) {
    this.req = req;
};

RequestHandler.prototype.getUrl = function(){
  return url.parse(this.req.url, true);
}

RequestHandler.prototype.getPath = function(){
  const parsedUrl = this.getUrl();

  const path = parsedUrl.pathname;
  return path.replace(/^\/+|\/+$/g,'');
}

RequestHandler.prototype.getMethod = function(){
  return this.req.method.toLowerCase();
}

RequestHandler.prototype.getQueryString = function(){
  const parsedUrl = this.getUrl();
  return parsedUrl.query;
}

RequestHandler.prototype.getHeaders = function(){
  return this.req.headers;
}

module.exports = RequestHandler;
