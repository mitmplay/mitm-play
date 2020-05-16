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

  window.ws_broadcast = (json, notme=true) => {
    const msg = {data: json, notme};
    ws.send(`broadcast${JSON.stringify(msg)}`);
  }

  window.ws_emitpage = (json, regex='') => {
    const msg = {data: json, regex};
    ws.send(`emitpage${JSON.stringify(msg)}`);
  }

  window.ws__ping = (json) => {
    const msg = {data: json};
    ws.send(`_ping${JSON.stringify(msg)}`);
  }
  
  window.ws__help = () => {
    ws.send(`_help{}`);
  }

  window.ws__open = (json) => {
    const msg = {data: json};
    ws.send(`_open${JSON.stringify(msg)}`);
  }

  window.ws__style = (json, notme=false) => {
    const msg = {data: json, notme};
    ws.send(`_style${JSON.stringify(msg)}`);
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
    //ex: ws__help()
    _help({data}) {
      console.log(data.help);
    },
    //ex: ws__ping("there") 
    _ping({data}) {
      console.log(data);
    },
    //ex: ws__open({url: "https://google.com"})
    _open({data}) {
      console.log(data);
      const features = 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,width=800,height=600';
      windowRef = window.open(data.url, '_logs', features);
      windowRef.blur();
    },
    //ex: ws__style('.intro=>background:red;')
    _style({data}) {
      console.log(data);
      const {query,style} = data;
      document.querySelectorAll(query).forEach(
        node => (node.style.cssText = style)
      );
    },
  };

  function messageParser(event, msg) {
    if (msg.length>40) {
      console.log('received: `%s...`', msg.slice(0,40));
    } else {
      console.log('received: `%s`', msg);
    }
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
      if (wccmd[cmd]) {
        wccmd[cmd].call(event, json)
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
