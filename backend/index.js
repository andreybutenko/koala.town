const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const { setupFiles } = require('./files.js');
const { setupSockets } = require('./sockets.js');

setupFiles(app);
setupSockets(io);

server.listen(3000, () => {
  console.log('listening on *:3000');
});
