const WebSocket = require('ws');
const wsclients = {};

module.exports = () => {
  const wsserver = new WebSocket.Server({ port: 3000 });

  function broadcast(json) {
    const pages = [];
    const {data,notme} = json;
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (notme && client !== this) {
          pages.push(client._page);
          client.send(data);
        } else {
          pages.push(client._page);
          client.send(data);
        }
      }
    });
    console.log('broadcast', pages)
  }

  function broadcastPage(json) {
    const {data,regex} = json;
    const pages = [];
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client._page.match(regex)) {
        client.send(data);
      }
    });
    console.log('broadcastPage', pages)
  }

  global.wsserver = wsserver;
  global.wsclients = wsclients;
  global.broadcast = broadcast;
  global.broadcastPage = broadcastPage;
  const wscmd = {
    broadcast,
    broadcastPage,
  }
  global.mitm.wscmd = wscmd;

  function messageParser(client, msg) {
    console.log('meesssage', msg)
    const arr = msg.replace(/\s+$/, '').match(/^ *\[(\w+)\] *(.+)/);
    if (arr) {
      let [,cmd,json] = arr;
      try {
        json = JSON.parse(json)
        if (wscmd[cmd]) {
          wscmd[cmd].call(client, json)
        }
      } catch (error) {
        console.error(error);
      }        
    }
    console.log('received: %s', msg);
  }

  let debunk;
  wsserver.on('connection', function connection(client, request) {
    const {host} = new URL(request.headers.origin);
    const page = request.url.match(/page=(\w+)/)[1];
    wsclients[`${host}:${page}`] = {client, request};
    client._page = `${host}:${page}`;

    function incoming(message) {
      messageParser(client, message);
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
}
//https://github.com/websockets/ws