require('dotenv').config();
const isDevelopment = process.env.NODE_ENV === 'development';
const express = require('express');
const app = express();
const fs = require('fs');

let options = {};
if (isDevelopment) {
  options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt'),
  };
}

const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
const port = process.env.PORT || 8443;

app.use(express.static('public'));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});

const { Server } = require('socket.io');
const io = new Server(server);

const clients = {};
io.on('connection', (socket) => {
  clients[socket.id] = { id: socket.id, name: '' };

  socket.on('disconnect', () => {
    //io.emit('client-disconnect', clients[socket.id]);
    delete clients[socket.id];
    io.emit('clients', clients);
    io.emit('client-disconnect', socket.id);
  });

  socket.on('signal', (peerId, signal) => {
    if (!clients[peerId]) {
      return;
    }
    console.log(`Received signal from ${socket.id} to ${peerId}`);
    io.to(peerId).emit('signal', peerId, signal, socket.id);
  });

  io.emit('clients', clients);
  // io.emit('client-connection', clients[socket.id]);

  socket.on('name', (name) => {
    console.log(`name: ${name}`);

    //validation -> check the length
    name = name.trim();
/*     if (name.length === 0) {
      //this one does not work? .. the other errror messages work, meaning client side is ok!
      io.to(peerId).emit('name-error', 'please enter a name');
      return;
    } */

    //validation -> check if anyone else has the same name
    let nameInUse = false;
    for (const socketId in clients) {
      if (clients.hasOwnProperty(socketId)) {
        const otherClient = clients[socketId];
        if (otherClient.name === name) {
          nameInUse = true;
        }
      }
    }

    if (nameInUse) {
      socket.emit('name-error', 'name already in use');
      return;
    }

    //add the name to the name porperty (collect it)
    console.log(clients);
    clients[socket.id].name = name;
    console.log(clients);
    //validation2 framhald-> send back the same name event
    io.emit('name', clients);
  });
});
