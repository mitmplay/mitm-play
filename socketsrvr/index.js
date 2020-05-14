const WebSocket = require('ws');
const wsclients = {};

module.exports = () => {
  const wsserver = new WebSocket.Server({ port: 3000 });

  function broadcast(data, all=true) {
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (all || client !== global.mitm.ws) {
          client.send(data);
        } 
      }
    });
  }

  global.wsserver = wsserver;
  global.wsclients = wsclients;
  global.broadcast = broadcast;

  wsserver.on('connection', function connection(client, request) {
    const {host} = new URL(request.headers.origin);
    wsclients[host] = {client, request};

    client.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    client.send('something');
  });  
}
//https://github.com/websockets/ws