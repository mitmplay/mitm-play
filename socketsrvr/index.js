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

  let debunk;
  wsserver.on('connection', function connection(client, request) {
    const {host} = new URL(request.headers.origin);
    const page = request.url.match(/page=(\w+)/)[1];
    wsclients[`${host}:${page}`] = {client, request};

    client.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    client.send('something');

    debunk && clearTimeout(debunk);
    debunk = setTimeout(() => {
      for (let host in wsclients) {
        const {client} = wsclients[host];
        if (client.readyState===3) {
          delete wsclients[host];
        }
      }
      console.log(Object.keys(wsclients));
    }, 1000)

  });  
}
//https://github.com/websockets/ws