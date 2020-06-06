const WebSocket = require('ws');
const c = require('ansi-colors');
const msgParser = require('./msg-parser');
const wsclients = {};

module.exports = () => {
  const wsserver = new WebSocket.Server({ port: 3000 });

  let debunk;
  wsserver.on('connection', function connection(client, request) {
    let host;
    try {
      if (request.headers.origin!=='null') {
        host = (new URL(request.headers.origin)).host;
      } else {
        host = 'null';
      }
    } catch (error) {
      debugger;
    }
    const page = request.url.match(/page=(\w+)/)[1];
    wsclients[`${host}:${page}`] = {client, request};
    client._page = `${host}:${page}`;
    if (page==='window') {
      const session = (new Date).toISOString().split('.')[0].replace(/[:-]/g,'');
      console.log(c.yellowBright(`${session}-${host}`));
      global.mitm.session = `${session}-${host}`;
    }

    function incoming(data) {
      msgParser(client, data);
    }

    client.on('message', incoming);
    client.send('connected');

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
      const arr = Object.keys(wsclients);
      console.log(c.redBright(`>> wsclients: ${JSON.stringify(arr, null, 2)}`));
    }, 1000);
  });  

  global.wsclients = wsclients;
  global.wsserver = wsserver;
}
