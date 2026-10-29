// Built-in HTTP module provided by Node.js
const http = require('http');

// Port on which the server will listen
const PORT = 3000;

// Create an HTTP server
// The callback function executes whenever a client sends a request
const server = http.createServer((req, res) => {
  // Set the HTTP status code to 200 (OK) and response header
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  // Send the response body
  res.end('Hello');
});

// Start listening for connections on port 3000
server.listen(PORT, () => {
  console.log(`Plain HTTP server running at http://localhost:${PORT}/`);
});

