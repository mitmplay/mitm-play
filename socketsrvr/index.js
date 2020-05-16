const WebSocket = require('ws');
const wsclients = {};

module.exports = () => {
  const wsserver = new WebSocket.Server({ port: 3000 });
  global.wsserver = wsserver;

  //ex: broadcast({data:"there"});
  function broadcast({data,_all}) {
    const pages = [];
    const that = this;
    data = typeof(data)==='string' ? data : JSON.stringify(data);
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (_all || client !== that) {
          pages.push(client._page);
          client.send(data);
        }
      }
    });
    console.log('broadcast', data, pages)
  }

  //ex: emitpage({data:"there", regex: "window"});
  function emitpage({data,regex}) {
    const pages = [];
    data = typeof(data)==='string' ? data : JSON.stringify(data);
    wsserver.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client._page.match(regex)) {
        pages.push(client._page);
        client.send(data);
      }
    });
    console.log('emitpage', data, pages)
  }
  global.wsclients = wsclients;
  global.broadcast = broadcast;
  global.emitpage = emitpage;

  /**
   * only be use by client
   */

  //ex: ws__help();
  //    => _help({})
  function _help() {
    const note = Object.keys(global.mitm.wscmd).map(x => {
      const messages = `ws_${x}()`;
      const spaces = ' '.repeat(14 - messages.length);
      return `* ${messages}${spaces} => ${x}()`;
    }).join('\n');
    const data = 
`Available functions:\n\n${note}\n
Double check on client implementation "ws_***()".
On browser console type "ws"`;
    const msg = `_help${JSON.stringify({data})}`
    console.log('_help', msg);
    this.send(msg);
  }

  //ex: ws__ping("there") 
  //    => _ping({data:"there"}) 
  function _ping(json) {
    let {data} = json;
    data = typeof(data)==='string' ? data : JSON.stringify(data);
    const msg = `_ping${JSON.stringify({data})}`
    console.log('_ping', msg);
    this.send(msg);
  }

  //ex: ws__open({url: "https://google.com"})
  //    => _open({data:{url: "https://google.com"}})
  const _open = function(json) {
    const msg = `_open${JSON.stringify(json)}`
    console.log('_open', msg);
    this.send(msg);
  }
  
  //ex: ws__style({query: 'body', style: 'background: red;'})
  //    => _style({data:{query: 'body', style: 'background: red;'}})
  const _style = function(json) {
    let {data,_all} = json;
    data = `_style${JSON.stringify({data})}`
    console.log('_style', data);
    broadcast.call(this, {data,_all});
  }

  // accessible from client
  const wscmd = {
    broadcast,
    emitpage,
    _help,
    _ping,
    _open,
    _style,
  }
  global.mitm.wscmd = wscmd;

  function messageParser(client, msg) {
    console.log('received: "%s"', msg);
    const arr = msg.replace(/\s+$/, '').match(/^ *(\w+) *(\{.*)/);
    if (arr) {
      let [,cmd,json] = arr;
      try {
        if (typeof(json)==='string') {
          json = JSON.parse(json);
        }
      } catch (error) {
        console.error(json,error);
      }        
      if (wscmd[cmd]) {
        wscmd[cmd].call(client, json)
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