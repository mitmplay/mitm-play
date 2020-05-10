// https://flaviocopes.com/websockets/

module.exports = () => {
  // alert('hello!');
  // Let us open a web socket
  var ws = new WebSocket("ws://localhost:3000/echo");
  window.ws = ws;
  
  ws.onopen = function() {                 
    // Web Socket is connected, send data using send()
    ws.send("Message to send");
    console.log("Message is sent...");
  };

  ws.onmessage = function (evt) { 
    var received_msg = evt.data;
    console.log("Message is received...", evt);
  };

  ws.onclose = function() { 
    // websocket is closed.
    console.log("Connection is closed..."); 
  };
}
