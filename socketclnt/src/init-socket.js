const msgParser = require('./msg-parser');
const inIframe = require('./in-iframe');

module.exports = () => {
  const ws = new WebSocket(`ws://localhost:3000/ws?page=${inIframe()}`);

  ws.onmessage = function (event) { 
    msgParser(event, event.data);
   };

   ws.onopen = function() {                 
    ws.send(`url:${(location+'').split(/[?#]/)[0]}`);
    console.log("ws: sent...");
  };  

  ws.onclose = function() { 
    console.log("ws: Connection is closed"); 
  };

  window._ws = ws;
}