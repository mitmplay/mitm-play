const _ws_msgParser = require('./_ws_msg-parser');
const _ws_inIframe = require('./_ws_in-iframe');

module.exports = () => {
  const ws = new WebSocket(`ws://localhost:3000/ws?page=${_ws_inIframe()}`);

  ws.onmessage = function (event) { 
    _ws_msgParser(event, event.data);
   };

   ws.onopen = function() {                 
    ws.send(`url:${(location+'').split(/[?#]/)[0]}`);
    console.log("ws: sent...");
  };  

  ws.onclose = function() { 
    console.log("ws: Connection is closed"); 
  };

  window._ws = ws;
  window._ws_queue = {};
}
