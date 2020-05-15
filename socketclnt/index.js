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

  const ws = new WebSocket(`ws://localhost:3000/ws?page=${inIframe()}`);
  window.ws = ws;
  
  ws.onopen = function() {                 
    ws.send(`url:${(location+'').split('?')[0]}`);
    console.log("ws: sent...");
  };

  ws.onmessage = function (evt) { 
    const received_msg = evt.data;
    console.log("ws: received...", received_msg, evt);
  };

  ws.onclose = function() { 
    console.log("ws: Connection is closed"); 
  };
}
