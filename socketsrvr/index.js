const WebSocket = require('ws');

module.exports = () => {
  const {port} = global.mitm;
  const wss = new WebSocket.Server({ port });
  global.mitm.wss = wss;
  
  wss.on('connection', function connection(ws) {
    global.mitm.ws = ws;
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
   
    ws.send('something');
  });  
}