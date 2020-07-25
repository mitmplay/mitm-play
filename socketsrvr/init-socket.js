const express = require('express');
const fs = require('fs-extra');
const https = require('https');
const WebSocket = require('ws');
const c = require('ansi-colors');
const msgParser = require('./msg-parser');
const path = `${global.__app}/cert`;

module.exports = () => {
  const app = express();
  const servers = https.createServer({
    cert: fs.readFileSync(`${path}/selfsigned.crt`),
    key: fs.readFileSync(`${path}/selfsigned.key`)
  }, app);
  const wss = new WebSocket.Server({ server: servers, path: "/ws" });
  servers.listen(3001);
  
  app.use(express.static(global.mitm.home));
  app.get('/mitm-play/websocket.js', (r, res) => {
    const _body = global.mitm.fn.wsclient(r);
    res.type('.js');
    res.send(_body);
  })

  app.get('/', (r, res) => {
    res.send('Hi Mitm-play!')
  })

  function connection(client, request) {
    let host;
    try {
      if (request.headers.origin!=='null') {
        host = (new URL(request.headers.origin)).host;
      } else {
        host = 'null';
      }
    } catch (error) {
      console.log(c.redBright('>> Error init Socket'), error)
    }
    const page = request.url.match(/page=(\w+)/)[1];
    client._page = `${host}:${page}`;
  
    if (page==='window' && !global.mitm._session_) {
      global.mitm.fn.session(host);
    }

    function incoming(data) {
      msgParser(client, data);
    }

    client.on('message', incoming);
    client.send('connected');
  }
  wss.on('connection', connection);
  global.wsservers = wss;
}
