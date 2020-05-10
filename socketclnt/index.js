// https://flaviocopes.com/websockets/

module.exports = () => {

  var ws = new WebSocket("ws://localhost:3000/echo");
  window.ws = ws;
  
  ws.onopen = function() {                 
    ws.send("Message to send");
    console.log("Message is sent...");
  };

  ws.onmessage = function (evt) { 
    var received_msg = evt.data;
    console.log("Message is received...", evt);
  };

  ws.onclose = function() { 
    console.log("Connection is closed..."); 
  };
}
