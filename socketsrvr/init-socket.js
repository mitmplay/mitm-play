const WebSocket = require('ws');
const msgParser = require('./msg-parser');
const wsclients = {};

module.exports = () => {
  const wsserver = new WebSocket.Server({ port: 3000 });

  let debunk;
  wsserver.on('connection', function connection(client, request) {
    const {host} = new URL(request.headers.origin);
    const page = request.url.match(/page=(\w+)/)[1];
    wsclients[`${host}:${page}`] = {client, request};
    client._page = `${host}:${page}`;

    function incoming(data) {
      msgParser(client, data);
    }

    client.on('message', incoming);
    client.send('something');

    debunk && clearTimeout(debunk);
    debunk = setTimeout(() => {
      for (let host in wsclients) {
        const {client} = wsclients[host];
        if (client.readyState===3) {
          delete wsclients[host];
        }
      }
      wsserver.clients.forEach(function each(client) {
        if (client.readyState===3) {
          console.log('>> terminate', client._page);
          client.terminate();
        }
      });
      console.log(Object.keys(wsclients));
    }, 1000)
  });  

  global.wsclients = wsclients;
  global.wsserver = wsserver;
}
