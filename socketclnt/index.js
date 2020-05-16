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

  //ex: ws_broadcast('_style{"data":{"q":"*","css":"color:yellow;"}}')
  //ex: ws_broadcast('_ping{"data":"Hi!"}')
  window.ws_broadcast = (json, _all=true) => {
    const msg = {data: json, _all};
    ws.send(`broadcast${JSON.stringify(msg)}`);
  }

  //ex: ws_emitpage('_style{"data":{"q":"*","css":"color:yellow;"}}')
  //ex: ws_emitpage('_ping{"data":"Hi!"}')
  window.ws_emitpage = (json, regex='') => {
    const msg = {data: json, regex};
    ws.send(`emitpage${JSON.stringify(msg)}`);
  }

  //ex: ws__ping('Hi!')
  window.ws__ping = (json) => {
    const msg = {data: json};
    ws.send(`_ping${JSON.stringify(msg)}`);
  }
  
  //ex: ws__help()
  window.ws__help = () => {
    ws.send(`_help{}`);
  }

  //ex: ws__open({url:'https://google.com'})
  window.ws__open = (json) => {
    const msg = {data: json};
    ws.send(`_open${JSON.stringify(msg)}`);
  }

  window.ws__style = (json, _all=true) => {
    const msg = {data: json, _all};
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
      // console.log(data);
    },
    //ex: ws__ping("there") 
    _ping({data}) {
      // console.log(data);
    },
    //ex: ws__open({url: "https://google.com"})
    _open({data}) {
      const features = 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,width=800,height=600';
      windowRef = window.open(data.url, '_logs', features);
      windowRef.blur();
    },
    //ex: ws__style('.intro=>background:red;')
    _style({data}) {
      const {q,css} = data;
      document.querySelectorAll(q).forEach(
        node => (node.style.cssText = css)
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
        console.log(json.data);
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
