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

  function emitpage(json) {
    const {data,regex} = json;
    const pages = [];
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client._page.match(regex)) {
        pages.push(client._page);
        client.send(data);
      }
    });
    console.log('emitpage', pages)
  }

  function emit(json) {
    this.send(json.data);
    console.log('emit', this._page)
  }

  function help() {
    const note = Object.keys(global.mitm.wscmd).map(x => {
      return `* ${x}() => ws_${x}()`;
    }).join('\n');
    this.send(`\n
Available functions that can be use:
${note}\n
double check on client implementation "ws_***()"
on browser console type "ws"
\n`)
  }
/**
 * 
 */
  const _style = function(json) {
    const {data} = json;
    json.data = `[_style]${JSON.stringify({data})}`;
    broadcast(json);
  }

  global.wsserver = wsserver;
  global.wsclients = wsclients;
  global.broadcast = broadcast;
  global.emitpage = emitpage;
  const wscmd = {
    broadcast,
    emitpage,
    emit,
    help,
    _style,
  }
  global.mitm.wscmd = wscmd;

  function messageParser(client, msg) {
    console.log('received: %s', msg);
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
  }

  let debunk;
  wsserver.on('connection', function connection(client, request) {
    const {host} = new URL(request.headers.origin);
    const page = request.url.match(/page=(\w+)/)[1];
    wsclients[`${host}:${page}`] = {client, request};
    client._page = `${host}:${page}`;

    function incoming(data) {
      messageParser(client, data);
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