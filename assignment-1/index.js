const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g,'');
  const method = req.method;

  let respondMessage = {};
  let statusCode = 200;
  if(method === 'GET') {
    statusCode = 404;
    respondMessage = { "message" : "Not found!" };
  }
  else if(method === 'POST') {
    switch (trimmedPath) {
      case 'hello':
        respondMessage = { "message": "Welcome to the NodeJs Master Class!" };
        statusCode = 200;
        break;
      default:
        respondMessage = { "message" : "Not found!" };
        statusCode = 404;
    }
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(respondMessage));
});

server.listen(3000, () =>{
  console.log('Server is listening to port 3000 ...');
})
