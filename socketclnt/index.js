module.exports = function() {
  function inIframe () {
    let ifrm;
    try {
      ifrm = window.self !== window.top;
    } catch (e) {
      ifrm = true;
    }
    return ifrm ? 'iframe' : 'window';
  }

  var ws = new WebSocket(`ws://localhost:3000/ws?page=${inIframe()}`);
  window.ws = ws;
  
  ws.onopen = function() {                 
    ws.send(`url:${(location+'').split('?')[0]}`);
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
