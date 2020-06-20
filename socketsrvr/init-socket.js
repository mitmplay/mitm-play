const express = require('express');
const http = require('http');
const fs = require('fs-extra');
const WebSocket = require('ws');
const c = require('ansi-colors');
const msgParser = require('./msg-parser');

module.exports = () => {
  const app = express();
  const server = http.createServer(app);
  const wsserver = new WebSocket.Server({ server, path: "/ws" });
  server.listen(3000);
  
  app.use(express.static(global.mitm.home));
  app.get('/mitm-play/websocket.js', (r, res) => {
    const _body = global.mitm.fn.wsclient();
    res.type('.js');
    res.send(_body);
  })

  app.get('/', (r, res) => {
    res.send('Hi Mitm-play!')
  })

  wsserver.on('connection', function connection(client, request) {
    let host;
    try {
      if (request.headers.origin!=='null') {
        host = (new URL(request.headers.origin)).host;
      } else {
        host = 'null';
      }
    } catch (error) {
      console.log(c.redBright('>> Error init Socket'), error)
      // debugger;
    }
    const page = request.url.match(/page=(\w+)/)[1];
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
  });
  global.wsserver = wsserver;
}
