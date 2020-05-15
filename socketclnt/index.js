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
  window._ws = ws;

  window.ws_broadcast = (data, notme) => {
    const msg = {data};
    if (notme) {
      msg.notme = notme;
    }
    ws.send(`[broadcast]${JSON.stringify(msg)}`);
  }

  window.ws_emitpage = (data, regex='') => {
    const msg = {data,regex};
    ws.send(`[emitpage]${JSON.stringify(msg)}`);
  }

  window.ws_emit = (data) => {
    ws.send(`[emit]${JSON.stringify( {data})}`);
  }
  
  window.ws_help = (data, notme) => {
    ws.send(`[help]{}`);
  }

  window.ws__open = (data) => {
    const msg = {data};
    ws.send(`[_open]${JSON.stringify(msg)}`);
  }

  window.ws__style = (data, notme) => {
    const msg = {data};
    if (notme) {
      msg.notme = notme;
    }
    ws.send(`[_style]${JSON.stringify(msg)}`);
  }

  ws.onopen = function() {                 
    ws.send(`url:${(location+'').split('?')[0]}`);
    console.log("ws: sent...");
  };
/**
 * 
 * @param {*} event 
 * @param {*} msg 
 */
  let windowRef;
  const wccmd = {
    _style({data}) {
      //ws__style('.intro=>background:red;')
      const [query,style] = data.split('=>');
      const node = document.querySelector(query);
      if (node) {
        node.style.cssText = style;
      }
    },
    _open({data}) {
      const [name,url] = data.split('=>');
      const features = 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,width=800,height=600';
      windowRef = window.open(url, name, features);
      windowRef.blur();
    }
  };

  function messageParser(event, msg) {
    console.log('received: %s', msg);
    const arr = msg.replace(/\s+$/, '').match(/^ *\[(\w+)\] *(.+)/);
    if (arr) {
      let [,cmd,json] = arr;
      try {
        json = JSON.parse(json)
        if (wccmd[cmd]) {
          wccmd[cmd].call(event, json)
        }
      } catch (error) {
        console.error(error);
      }        
    }
  }

  ws.onmessage = function (event) { 
    messageParser(event, event.data);
   };

  ws.onclose = function() { 
    console.log("ws: Connection is closed"); 
  };
}
