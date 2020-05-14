const WebSocket = require('ws');

module.exports = () => {
  const {port} = global.mitm;
  const wss = new WebSocket.Server({ port });
  global.mitm.wss = wss;

  function broadcast(data, all=true) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (all || client !== global.mitm.ws) {
          client.send(data);
        } 
      }
    });
  }
  
  wss.on('connection', function connection(ws) {
    global.mitm.ws = ws;
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
   
    ws.send('something');
  });  
}
//https://github.com/websockets/ws