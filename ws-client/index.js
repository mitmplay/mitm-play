'use strict';

var _ws_postmessage = () => {
  function receiveMessage(event) {
    if (window.mitm.client.postmessage) {
      console.log(`>> Postmessage: ${event.origin} => https://${location.host}`, event.data);
    }
  }
  window.addEventListener("message", receiveMessage, false);

  // if (!chrome.windows) {
  //   function reportWindowSize() {
  //     const {innerWidth, innerHeight} = window;
  //     console.log({innerWidth, innerHeight});
  //   }
  //   window.addEventListener("resize", reportWindowSize);  
  // }
};

var _ws_client = () => {
  let windowRef;
  return {
    //ex: ws__help()
    _help({data}) {
      console.log(data);
    },
    //ex: ws__ping("there") 
    _ping({data}) {
      console.log(data);
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
    //ex: ws__
    _files({typ, data}) {
      const {files} = window.mitm;
      // console.log(`receive brodcast ${typ}`);
      /**
       * event handler after receiving ws packet
       * ie: window.mitm.files.route_events = {eventObject...}
       */
      for (let key in files[`${typ}_events`]) {
        files[`${typ}_events`][key](data);
      }
    },
    _setClient({data}) {
      console.log('_setClient', data);
      window.mitm.client = data;
    }
  };
};

const _ws_wccmd = _ws_client();

var _ws_msgParser = (event, msg) => {
  if (window.mitm.argv.debug) {
    if (msg.length>40) {
      console.log('>> ws-message: `%s...`', msg.slice(0,40));
    } else {
      console.log('>> ws-message: `%s`', msg);
    }  
  }
  const arr = msg.replace(/\s+$/, '').match(/^ *([\w:]+) *(\{.*)/);
  if (arr) {
    let [,cmd,json] = arr;
    try {
      if (typeof(json)==='string') {
        json = JSON.parse(json);
      }
    } catch (error) {
      console.error(json,error);
    }        
    if (window._ws_queue[cmd]) {
      const handler = window._ws_queue[cmd];
      delete window._ws_queue[cmd];
      handler(json.data);
    } else if (_ws_wccmd[cmd]) {
      _ws_wccmd[cmd].call(event, json);
    }       
  }    
};

var _ws_inIframe = () => {
  let ifrm;
  try {
    ifrm = window.self !== window.top;
  } catch (e) {
    ifrm = true;
  }
  return ifrm ? 'iframe' : 'window';
};

var _ws_initSocket = () => {
  const ws = new WebSocket(`wss://localhost:3001/ws?page=${_ws_inIframe()}`);

  ws.onmessage = function (event) { 
    _ws_msgParser(event, event.data);
   };

   ws.onopen = function() {                 
    ws.send(`url:${(location+'').split(/[?#]/)[0]}`);
    // console.log("ws: sent...");
  };  

  ws.onclose = function() { 
    console.log('ws: Connection is closed'); 
  };

  window._ws = ws;
  window._ws_queue = {};
  window._ws_connect = {};
  window._ws_connected = false;
  ws.onopen = (data) => {
    window._ws_connected = true;
    for (let key in window._ws_connect) {
      window._ws_connect[key](data);
    }    
  };
};

var _ws_namespace = () => {
  const {hostname: host} = location;
  let namespace;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\?/g, '\\?');
  }

  for (let key in window.mitm.routes) {
    if (host.match(toRegex(key.replace(/~/,'[^.]*')))) {
      namespace = key;
      break;
    }
  }
  return namespace;
};

var _ws_vendor = () => {
  const {vendor} = navigator;
  const browser = {
    '': 'firefox',
    'Google Inc.': 'chromium',
    'Apple Computer, Inc.': 'webkit',
  }[vendor];
  return browser;
};

let act;
function screenshot(e) {
  if (mitm.argv.lazyclick) {
    if (mitm.screenshot) {
      window.mitm.screenshot = undefined;
      console.log('>> delay action');
      return;
    }
    if (act) {
      act = undefined;
      return;
    }  
  }
  const {hostname: host} = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const route = window.mitm.routes[namespace];
  const {selector} = route.screenshot;

  const arr = document.body.querySelectorAll(selector);
  const fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
  const delay = mitm.argv.lazyclick===true ? 700 : mitm.argv.lazyclick;
  for (let el of arr) {
    let node = e.target;
    while (el!==node && node!==document.body) {
      node = node.parentNode;
    }
    if (node!==document.body) {
      const params = {namespace, host, fname, browser};
      window.ws__send('screenshot', params);
      if (mitm.argv.lazyclick) {
        // delay action to finish screenshot
        window.mitm.screenshot = e.target;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        setTimeout(() => {
          // console.log('>> clicked');
          act = window.mitm.screenshot;
          window.mitm.screenshot.node = undefined;
          act.click();
          act = undefined;
        }, delay);
      }
      return;
    }
  }
}

var _ws_screenshot = () => {
  const route = window.mitm.routes[_ws_namespace()];
  if (route && route.screenshot) {
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelector('body').addEventListener('click', screenshot);
    });
  }
};

var _ws_location = () => {
  const containerStyle = 'position: fixed;z-index: 9999;top: 8px;right: 5px;';
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;';
  const event = new Event('urlchanged');
  let container = {};
  let ctrl = false;
  let button = {};
  let buttons;
  let intervId;

  function toRegex(pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item=>item.trim());
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?');
    return {path, msg};
  }

  function setButtons() {
    if (window.mitm.autobuttons) {
      const {autobuttons} = window.mitm;
      setTimeout(() => {
        for (let key in autobuttons) {
          const btn = document.createElement("button");
          const br = document.createElement("span");
          const [caption, color] = key.split('|');
          btn.onclick = autobuttons[key];
          btn.innerText = caption;
          buttons.appendChild(btn);
          buttons.appendChild(br);
          br.innerHTML = '&nbsp;';
          btn.style = buttonStyle + (color ? `background: ${color};` : '');
        }
      },0);  
    }
  }

  function urlChange(event) {
    const namespace = _ws_namespace();
    if (window.mitm.autofill) {
      delete window.mitm.autofill;
    }
    if (window.mitm.autointerval) {
      clearInterval(intervId);
      delete window.mitm.autointerval;
    }
    if (window.mitm.autobuttons) {
      delete window.mitm.autobuttons;
      buttons.innerHTML = '';
    }
    if (window.mitm.macrokeys) {
      delete window.mitm.macrokeys;
    }
    if (namespace) {
      const {pathname} = location;
      const {_macros_, macros} = window.mitm;
      // console.log(namespace, location);
      for (let key in macros) {
        const {path, msg} = toRegex(key);
        if (pathname.match(path)) {
          button.innerHTML = msg || 'Autofill';
          _macros_ && _macros_();
          macros[key]();
          setButtons();
        } 
      }
    }
    container.style = containerStyle;
    const visible = (window.mitm.autofill);
    button.style = buttonStyle + (visible ? 'background-color: azure;' : 'display: none;');
    if (typeof(window.mitm.autointerval)==='function') {
      intervId = setInterval(window.mitm.autointerval, 500);
    }
    ctrl = false;
  }

  function play(autofill) {
    if (autofill) {
      if (typeof(autofill)==='function') {
        autofill = autofill();
      }
      const browser = _ws_vendor();
      const lenth = autofill.length;
      console.log(lenth===1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2));
      window.ws__send('autofill', {autofill, browser});
    }
  }

  function btnclick(e) {
    let {autofill} = window.mitm;
    play(autofill);
  }

  function keybCtrl(e) { 
    const {macrokeys} = window.mitm;
    if (e.ctrlKey && e.key==='Shift') {
      ctrl = !ctrl;
      container.style = containerStyle + (!ctrl ? '' : 'display: none;');      
    } else if (e.ctrlKey && e.altKey) {
      console.log({macro: `ctrl + alt + ${e.code}`});
      if (macrokeys) {
        let macro = macrokeys[e.code];
        if (macro) {
          macro = macro();
          if (Array.isArray(macro)) {
            let macroIndex = 0;
            let interval = setInterval(() => {
              let selector = macro[macroIndex];
              if (selector.match(/^ *[=-]>/)) {
                selector = `${CssSelectorGenerator.getCssSelector(document.activeElement)} ${selector}`;
              }
              play([selector]);
    
              macroIndex += 1;
              if (macroIndex>=macro.length) {
                clearInterval(interval);
              }
            }, 100);  
          }
        }  
      }
    }
  }
  if (!window.chrome) {
    return;
  }
  if (!chrome.tabs) {
    document.querySelector('html').addEventListener('keydown', keybCtrl);
    window.addEventListener('urlchanged', urlChange);
    const fn = history.pushState;
    history.pushState = function () {
      fn.apply(history, arguments);
      window.dispatchEvent(event);
    };
  
    window.addEventListener('DOMContentLoaded', () => {
      const node = document.querySelector('html');
      const noderef = node.firstElementChild;
      const newNode = document.createElement("div");
      let html = '<button class="btn-autofill">Autofill</button>';
     
      newNode.innerHTML = `<span class="autofill-buttons"></span>${html}`;
      newNode.className = 'mitm autofill-container';
      newNode.style = containerStyle;

      node.insertBefore(newNode, noderef);
      setTimeout(()=> {
        container = newNode;
        buttons = newNode.children[0];
        button = newNode.children[1];
        button.onclick = btnclick;
        button.style = `${buttonStyle}background-color: azure;`;
        urlChange();
      },1);
    });
  }
};

function debounce(fn, delay=500) {
    let _timeout;
    return function() {
      const _this = this;
      const args = arguments;
      _timeout && clearTimeout(_timeout);
      _timeout = setTimeout(() => {
        fn.apply(_this, args);
      }, delay);
    }
  }

var _ws_observer = () => {
  const {hostname: host} = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  let sshot = {}, nodes = {};
  
  const route = window.mitm.routes[namespace];
  if (route && route.screenshot) {
    const {observer: ob} = route.screenshot;
    for (let id in ob) {
      let el = {};
      if (ob[id]===true) {
        el = {
          title: 'notitle',
          insert: true,
          remove: true,
        };
      } else {
        let arr = ob[id].split(':');
        arr[1].split(',').map(e => {
          el[e] = true;
        });
        el.title = arr[0];
      }
      sshot[id] = el;
      nodes[id] = {
        insert: false,
        remove: true,
      };
    }
  }

  let fname;
  const callback = debounce(function() {
    for (let id in nodes) {
      const el = document.body.querySelectorAll(id);
      if (el.length) {
        if (!nodes[id].insert) {
          nodes[id].insert = true;
          if (nodes[id].remove!==undefined) {
            nodes[id].remove = false;
          }
          if (sshot[id].insert) {
            fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
            fname = `${fname}-${sshot[id].title}-insert`;
            window.ws__send('screenshot', {namespace, host, fname, browser});
          }
        }
      } else {
        if (!nodes[id].remove) {
          nodes[id].remove = true;
          nodes[id].insert = false;
          if (sshot[id].remove) {
            fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
            fname = `${fname}-${sshot[id].title}-remove`;
            window.ws__send('screenshot', {namespace, host, fname, browser});
          }
        }
      }
    }
  }, 100);

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });  
  });
};

const t64 = 'Wabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZh';

let nanoid = (size=8) => {
  let id = '';
  while (0 < size--) {
    id += t64[ Math.random()*64 | 0];
  }
  return id
};

var _ws_general = () => {
  const {_ws} = window;

  //ex: ws_broadcast('_style{"data":{"q":"*","css":"color:blue;"}}')
  //ex: ws_broadcast('_ping{"data":"Hi!"}')
  window.ws_broadcast = (json, _all=true) => {
    const msg = {data: json, _all};
    _ws.send(`broadcast${JSON.stringify(msg)}`);
  };

  //ex: ws_emitpage('_style{"data":{"q":"*","css":"color:blue;"}}')
  //ex: ws_emitpage('_ping{"data":"Hi!"}')
  window.ws_emitpage = (json, regex='') => {
    const msg = {data: json, regex};
    _ws.send(`emitpage${JSON.stringify(msg)}`);
  };

  //ex: ws__style({"q":"*","css":"color:blue;"})
  window.ws__style = (json, _all=true) => {
    const msg = {data: json, _all};
    _ws.send(`_style${JSON.stringify(msg)}`);
  };

  //ex: ws__ping('Hi!')
  window.ws__ping = (json) => {
    const msg = {data: json};
    _ws.send(`_ping${JSON.stringify(msg)}`);
  };
  
  //ex: ws__help()
  window.ws__help = () => {
    _ws.send('_help{}');
  };

  //ex: ws__open({url:'https://google.com'})
  window.ws__open = (json) => {
    const msg = {data: json};
    _ws.send(`_open${JSON.stringify(msg)}`);
  };

  window.ws__send = (cmd, data, handler) => {
    const id = nanoid();
    const key = `${cmd}:${id}`;
    window._ws_queue[key] = handler || (w => {});

    setTimeout(function() {
      if (window._ws_queue[key]) {
        delete  window._ws_queue[key];
        console.log('>> ws timeout!', key);
      } 
    }, 5000);
    const params = `${key}${JSON.stringify({data})}`;
    if (window.mitm.argv.debug) {
      console.log('_ws.send', params); 
    }
    _ws.send(params);
  };
};
//ws__send('_ping', 'LOL', w=>console.log('>result',w));

let _timeout;
let _csp = {};
var _ws_cspErr = () => {
  const cspError = function(e) {
    const {hostname: host} = location;
    let namespace = _ws_namespace();
    const path = location.pathname
    .replace(/^\//,'')
    .replace(/\//g,'-');
    const {
      blockedURI,
      disposition,
      documentURI,
      effectiveDirective,
      originalPolicy,
      timeStamp,
      type,
      violatedDirective,
    } = e;
    const typ = `[${disposition}] ${documentURI}`;
    if (!_csp[typ]) {
      _csp[typ] = {};
    }
    if (!_csp[typ]._general_) {
      _csp[typ]._general_ = {
        policy: originalPolicy,
        namespace,
        host,
        path,
      };
    }
    const _doc = _csp[typ];
    if (!_doc[violatedDirective]) {
      _doc[violatedDirective] = {};
    }

    const _err =  _doc[violatedDirective];
    if (!_err[blockedURI]) {
      _err[blockedURI] = {};
    }
    const _match = originalPolicy.match(`${violatedDirective} [^;]+;`);
    const directive = _match ? _match[0] : effectiveDirective;
    _err[blockedURI] = {
      directive,
      timeStamp,
      type,
    };
    _timeout && clearTimeout(_timeout);
    _timeout = setTimeout(() => {
      console.log('>> CSP:', _csp);  
      // window.ws__send('csp_error', {
      //   namespace,
      //   host,
      //   path,
      //   _csp,
      // });
      _csp = {};
      }, 4000);
  };

  if (window.mitm.client.csp) {
    document.addEventListener('securitypolicyviolation', cspError);
  }
};
// disposition: "report"
// documentURI: "https://what/html/contain/csp"
// violatedDirective: "img-src"

// blockedURI: "https://what/url/getting/blocked"
// effectiveDirective: "img-src"
// originalPolicy: "script-src null; frame-src null; style-src null; style-src-elem null; img-src null;"
// timeStamp: 1933.8200000056531
// type: "securitypolicyviolation"

var index = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_screenshot();
  _ws_location();
  _ws_observer();
  _ws_general();
  _ws_cspErr();
};

index();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL1Byb2plY3RzL21pdG0tcGxheS93cy1jbGllbnQvX3NyYy9fd3NfcG9zdG1lc3NhZ2UuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvX3dzX2NsaWVudC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL1Byb2plY3RzL21pdG0tcGxheS93cy1jbGllbnQvX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL1Byb2plY3RzL21pdG0tcGxheS93cy1jbGllbnQvX3NyYy9fd3NfaW4taWZyYW1lLmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vUHJvamVjdHMvbWl0bS1wbGF5L3dzLWNsaWVudC9fc3JjL193c19pbml0LXNvY2tldC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL1Byb2plY3RzL21pdG0tcGxheS93cy1jbGllbnQvX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vUHJvamVjdHMvbWl0bS1wbGF5L3dzLWNsaWVudC9fc3JjL193c192ZW5kb3IuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvX3dzX3NjcmVlbnNob3QuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvX3dzX2xvY2F0aW9uLmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vUHJvamVjdHMvbWl0bS1wbGF5L3dzLWNsaWVudC9fc3JjL193c19kZWJvdW5jZS5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL1Byb2plY3RzL21pdG0tcGxheS93cy1jbGllbnQvX3NyYy9fd3Nfb2JzZXJ2ZXIuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvX3dzX2dlbmVyYWwuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvX3dzX2NzcC1lcnIuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9taXRtLXBsYXkvd3MtY2xpZW50L19zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoZXZlbnQpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYD4+IFBvc3RtZXNzYWdlOiAke2V2ZW50Lm9yaWdpbn0gPT4gaHR0cHM6Ly8ke2xvY2F0aW9uLmhvc3R9YCwgZXZlbnQuZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpO1xyXG5cclxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XHJcbiAgLy8gICBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xyXG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcclxuICAvLyAgIH1cclxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpOyAgXHJcbiAgLy8gfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgd2luZG93UmVmO1xuICByZXR1cm4ge1xuICAgIC8vZXg6IHdzX19oZWxwKClcbiAgICBfaGVscCh7ZGF0YX0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIH0sXG4gICAgLy9leDogd3NfX3BpbmcoXCJ0aGVyZVwiKSBcbiAgICBfcGluZyh7ZGF0YX0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIH0sXG4gICAgLy9leDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXG4gICAgX29wZW4oe2RhdGF9KSB7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9ICdkaXJlY3Rvcmllcz0wLHRpdGxlYmFyPTAsdG9vbGJhcj0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wLHdpZHRoPTgwMCxoZWlnaHQ9NjAwJztcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcyk7XG4gICAgICB3aW5kb3dSZWYuYmx1cigpO1xuICAgIH0sXG4gICAgLy9leDogd3NfX3N0eWxlKCcuaW50cm89PmJhY2tncm91bmQ6cmVkOycpXG4gICAgX3N0eWxlKHtkYXRhfSkge1xuICAgICAgY29uc3Qge3EsY3NzfSA9IGRhdGE7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcbiAgICAgICk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fXG4gICAgX2ZpbGVzKHt0eXAsIGRhdGF9KSB7XG4gICAgICBjb25zdCB7ZmlsZXN9ID0gd2luZG93Lm1pdG07XG4gICAgICAvLyBjb25zb2xlLmxvZyhgcmVjZWl2ZSBicm9kY2FzdCAke3R5cH1gKTtcbiAgICAgIC8qKlxuICAgICAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxuICAgICAgICovXG4gICAgICBmb3IgKGxldCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfc2V0Q2xpZW50KHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coJ19zZXRDbGllbnQnLCBkYXRhKTtcbiAgICAgIHdpbmRvdy5taXRtLmNsaWVudCA9IGRhdGE7XG4gICAgfVxuICB9O1xufVxuIiwiY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpO1xuY29uc3QgX3dzX3djY21kID0gX3dzX2NsaWVudCgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XG4gICAgaWYgKG1zZy5sZW5ndGg+NDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsNDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpO1xuICAgIH0gIFxuICB9XG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLyk7XG4gIGlmIChhcnIpIHtcbiAgICBsZXQgWyxjbWQsanNvbl0gPSBhcnI7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YoanNvbik9PT0nc3RyaW5nJykge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihqc29uLGVycm9yKTtcbiAgICB9ICAgICAgICBcbiAgICBpZiAod2luZG93Ll93c19xdWV1ZVtjbWRdKSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gd2luZG93Ll93c19xdWV1ZVtjbWRdO1xuICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVbY21kXTtcbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKTtcbiAgICB9IGVsc2UgaWYgKF93c193Y2NtZFtjbWRdKSB7XG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxuICAgIH0gICAgICAgXG4gIH0gICAgXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgaWZybTtcclxuICB0cnkge1xyXG4gICAgaWZybSA9IHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmcm0gPSB0cnVlO1xyXG4gIH1cclxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdyc7XHJcbn07XHJcbiIsImNvbnN0IF93c19tc2dQYXJzZXIgPSByZXF1aXJlKCcuL193c19tc2ctcGFyc2VyJyk7XHJcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0KGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9YCk7XHJcblxyXG4gIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkgeyBcclxuICAgIF93c19tc2dQYXJzZXIoZXZlbnQsIGV2ZW50LmRhdGEpO1xyXG4gICB9O1xyXG5cclxuICAgd3Mub25vcGVuID0gZnVuY3Rpb24oKSB7ICAgICAgICAgICAgICAgICBcclxuICAgIHdzLnNlbmQoYHVybDokeyhsb2NhdGlvbisnJykuc3BsaXQoL1s/I10vKVswXX1gKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKFwid3M6IHNlbnQuLi5cIik7XHJcbiAgfTsgIFxyXG5cclxuICB3cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7IFxyXG4gICAgY29uc29sZS5sb2coJ3dzOiBDb25uZWN0aW9uIGlzIGNsb3NlZCcpOyBcclxuICB9O1xyXG5cclxuICB3aW5kb3cuX3dzID0gd3M7XHJcbiAgd2luZG93Ll93c19xdWV1ZSA9IHt9O1xyXG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9O1xyXG4gIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gZmFsc2U7XHJcbiAgd3Mub25vcGVuID0gKGRhdGEpID0+IHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gdHJ1ZTtcclxuICAgIGZvciAobGV0IGtleSBpbiB3aW5kb3cuX3dzX2Nvbm5lY3QpIHtcclxuICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSk7XHJcbiAgICB9ICAgIFxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xuICBsZXQgbmFtZXNwYWNlO1xuXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpO1xuICB9XG5cbiAgZm9yIChsZXQga2V5IGluIHdpbmRvdy5taXRtLnJvdXRlcykge1xuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vLCdbXi5dKicpKSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlO1xufSIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHt2ZW5kb3J9ID0gbmF2aWdhdG9yO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnLFxyXG4gIH1bdmVuZG9yXTtcclxuICByZXR1cm4gYnJvd3NlcjtcclxufSIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpO1xyXG5cclxubGV0IGFjdDtcclxuZnVuY3Rpb24gc2NyZWVuc2hvdChlKSB7XHJcbiAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcclxuICAgIGlmIChtaXRtLnNjcmVlbnNob3QpIHtcclxuICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IHVuZGVmaW5lZDtcclxuICAgICAgY29uc29sZS5sb2coJz4+IGRlbGF5IGFjdGlvbicpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoYWN0KSB7XHJcbiAgICAgIGFjdCA9IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSAgXHJcbiAgfVxyXG4gIGNvbnN0IHtob3N0bmFtZTogaG9zdH0gPSBsb2NhdGlvbjtcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKCk7XHJcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKTtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdO1xyXG4gIGNvbnN0IHtzZWxlY3Rvcn0gPSByb3V0ZS5zY3JlZW5zaG90O1xyXG5cclxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gIGNvbnN0IGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sJycpLnJlcGxhY2UoL1xcLy9nLCctJyk7XHJcbiAgY29uc3QgZGVsYXkgPSBtaXRtLmFyZ3YubGF6eWNsaWNrPT09dHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2s7XHJcbiAgZm9yIChsZXQgZWwgb2YgYXJyKSB7XHJcbiAgICBsZXQgbm9kZSA9IGUudGFyZ2V0O1xyXG4gICAgd2hpbGUgKGVsIT09bm9kZSAmJiBub2RlIT09ZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUhPT1kb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtuYW1lc3BhY2UsIGhvc3QsIGZuYW1lLCBicm93c2VyfTtcclxuICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywgcGFyYW1zKTtcclxuICAgICAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXQ7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCc+PiBjbGlja2VkJyk7XHJcbiAgICAgICAgICBhY3QgPSB3aW5kb3cubWl0bS5zY3JlZW5zaG90O1xyXG4gICAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdC5ub2RlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgYWN0LmNsaWNrKCk7XHJcbiAgICAgICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KTtcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuIiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBjb250YWluZXJTdHlsZSA9ICdwb3NpdGlvbjogZml4ZWQ7ei1pbmRleDogOTk5OTt0b3A6IDhweDtyaWdodDogNXB4Oyc7XHJcbiAgY29uc3QgYnV0dG9uU3R5bGUgPSAnYm9yZGVyOiBub25lO2JvcmRlci1yYWRpdXM6IDE1cHg7Zm9udC1zaXplOiAxMHB4OydcclxuICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpO1xyXG4gIGxldCBjb250YWluZXIgPSB7fTtcclxuICBsZXQgY3RybCA9IGZhbHNlO1xyXG4gIGxldCBidXR0b24gPSB7fTtcclxuICBsZXQgYnV0dG9ucztcclxuICBsZXQgaW50ZXJ2SWQ7XHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXgocGF0aE1zZykge1xyXG4gICAgbGV0IFtwYXRoLCBtc2ddID0gcGF0aE1zZy5zcGxpdCgnPT4nKS5tYXAoaXRlbT0+aXRlbS50cmltKCkpO1xyXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKTtcclxuICAgIHJldHVybiB7cGF0aCwgbXNnfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNldEJ1dHRvbnMoKSB7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2J1dHRvbnMpIHtcclxuICAgICAgY29uc3Qge2F1dG9idXR0b25zfSA9IHdpbmRvdy5taXRtO1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gYXV0b2J1dHRvbnMpIHtcclxuICAgICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgICBjb25zdCBiciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgICAgY29uc3QgW2NhcHRpb24sIGNvbG9yXSA9IGtleS5zcGxpdCgnfCcpO1xyXG4gICAgICAgICAgYnRuLm9uY2xpY2sgPSBhdXRvYnV0dG9uc1trZXldO1xyXG4gICAgICAgICAgYnRuLmlubmVyVGV4dCA9IGNhcHRpb247XHJcbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJ0bik7XHJcbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJyKTtcclxuICAgICAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnO1xyXG4gICAgICAgICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sMCkgIFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJsQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKCk7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ZpbGwpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9maWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydklkKTtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbDtcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvYnV0dG9ucykge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2J1dHRvbnM7XHJcbiAgICAgIGJ1dHRvbnMuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0ubWFjcm9rZXlzKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5tYWNyb2tleXM7XHJcbiAgICB9XHJcbiAgICBpZiAobmFtZXNwYWNlKSB7XHJcbiAgICAgIGNvbnN0IHtwYXRobmFtZX0gPSBsb2NhdGlvbjtcclxuICAgICAgY29uc3Qge19tYWNyb3NfLCBtYWNyb3N9ID0gd2luZG93Lm1pdG07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKG5hbWVzcGFjZSwgbG9jYXRpb24pO1xyXG4gICAgICBmb3IgKGxldCBrZXkgaW4gbWFjcm9zKSB7XHJcbiAgICAgICAgY29uc3Qge3BhdGgsIG1zZ30gPSB0b1JlZ2V4KGtleSk7XHJcbiAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKHBhdGgpKSB7XHJcbiAgICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbXNnIHx8ICdBdXRvZmlsbCc7XHJcbiAgICAgICAgICBfbWFjcm9zXyAmJiBfbWFjcm9zXygpO1xyXG4gICAgICAgICAgbWFjcm9zW2tleV0oKTtcclxuICAgICAgICAgIHNldEJ1dHRvbnMoKTtcclxuICAgICAgICB9IFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb250YWluZXIuc3R5bGUgPSBjb250YWluZXJTdHlsZTtcclxuICAgIGNvbnN0IHZpc2libGUgPSAod2luZG93Lm1pdG0uYXV0b2ZpbGwpO1xyXG4gICAgYnV0dG9uLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAodmlzaWJsZSA/ICdiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTsnIDogJ2Rpc3BsYXk6IG5vbmU7Jyk7XHJcbiAgICBpZiAodHlwZW9mKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCk9PT0nZnVuY3Rpb24nKSB7XHJcbiAgICAgIGludGVydklkID0gc2V0SW50ZXJ2YWwod2luZG93Lm1pdG0uYXV0b2ludGVydmFsLCA1MDApO1xyXG4gICAgfVxyXG4gICAgY3RybCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcGxheShhdXRvZmlsbCkge1xyXG4gICAgaWYgKGF1dG9maWxsKSB7XHJcbiAgICAgIGlmICh0eXBlb2YoYXV0b2ZpbGwpPT09J2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpO1xyXG4gICAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aDtcclxuICAgICAgY29uc29sZS5sb2cobGVudGg9PT0xID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpKTtcclxuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIHthdXRvZmlsbCwgYnJvd3Nlcn0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYnRuY2xpY2soZSkge1xyXG4gICAgbGV0IHthdXRvZmlsbH0gPSB3aW5kb3cubWl0bTtcclxuICAgIHBsYXkoYXV0b2ZpbGwpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24ga2V5YkN0cmwoZSkgeyBcclxuICAgIGNvbnN0IHttYWNyb2tleXN9ID0gd2luZG93Lm1pdG07XHJcbiAgICBpZiAoZS5jdHJsS2V5ICYmIGUua2V5PT09J1NoaWZ0Jykge1xyXG4gICAgICBjdHJsID0gIWN0cmw7XHJcbiAgICAgIGNvbnRhaW5lci5zdHlsZSA9IGNvbnRhaW5lclN0eWxlICsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKTsgICAgICBcclxuICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5ICYmIGUuYWx0S2V5KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKHttYWNybzogYGN0cmwgKyBhbHQgKyAke2UuY29kZX1gfSk7XHJcbiAgICAgIGlmIChtYWNyb2tleXMpIHtcclxuICAgICAgICBsZXQgbWFjcm8gPSBtYWNyb2tleXNbZS5jb2RlXTtcclxuICAgICAgICBpZiAobWFjcm8pIHtcclxuICAgICAgICAgIG1hY3JvID0gbWFjcm8oKTtcclxuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG1hY3JvKSkge1xyXG4gICAgICAgICAgICBsZXQgbWFjcm9JbmRleCA9IDA7XHJcbiAgICAgICAgICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgc2VsZWN0b3IgPSBtYWNyb1ttYWNyb0luZGV4XTtcclxuICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yID0gYCR7Q3NzU2VsZWN0b3JHZW5lcmF0b3IuZ2V0Q3NzU2VsZWN0b3IoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCl9ICR7c2VsZWN0b3J9YDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcGxheShbc2VsZWN0b3JdKTtcclxuICAgIFxyXG4gICAgICAgICAgICAgIG1hY3JvSW5kZXggKz0gMTtcclxuICAgICAgICAgICAgICBpZiAobWFjcm9JbmRleD49bWFjcm8ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgMTAwKTsgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gIFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmICghd2luZG93LmNocm9tZSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpZiAoIWNocm9tZS50YWJzKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWJDdHJsKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKTtcclxuICAgIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGU7XHJcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKTtcclxuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG4gICAgfTtcclxuICBcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpO1xyXG4gICAgICBjb25zdCBub2RlcmVmID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcclxuICAgICAgY29uc3QgbmV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgIGxldCBodG1sID0gJzxidXR0b24gY2xhc3M9XCJidG4tYXV0b2ZpbGxcIj5BdXRvZmlsbDwvYnV0dG9uPic7XHJcbiAgICAgXHJcbiAgICAgIG5ld05vZGUuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYXV0b2ZpbGwtYnV0dG9uc1wiPjwvc3Bhbj4ke2h0bWx9YDtcclxuICAgICAgbmV3Tm9kZS5jbGFzc05hbWUgPSAnbWl0bSBhdXRvZmlsbC1jb250YWluZXInO1xyXG4gICAgICBuZXdOb2RlLnN0eWxlID0gY29udGFpbmVyU3R5bGU7XHJcblxyXG4gICAgICBub2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCBub2RlcmVmKTtcclxuICAgICAgc2V0VGltZW91dCgoKT0+IHtcclxuICAgICAgICBjb250YWluZXIgPSBuZXdOb2RlO1xyXG4gICAgICAgIGJ1dHRvbnMgPSBuZXdOb2RlLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgIGJ1dHRvbiA9IG5ld05vZGUuY2hpbGRyZW5bMV07XHJcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBidG5jbGljaztcclxuICAgICAgICBidXR0b24uc3R5bGUgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXHJcbiAgICAgICAgdXJsQ2hhbmdlKGV2ZW50KTtcclxuICAgICAgfSwxKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlKGZuLCBkZWxheT01MDApIHtcclxuICAgIGxldCBfdGltZW91dDtcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xyXG4gICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xyXG4gICAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcclxuICAgICAgfSwgZGVsYXkpXHJcbiAgICB9XHJcbiAgfVxyXG4gIG1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7IiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpO1xyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgbGV0IHNzaG90ID0ge30sIG5vZGVzID0ge307XHJcbiAgXHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90O1xyXG4gICAgZm9yIChsZXQgaWQgaW4gb2IpIHtcclxuICAgICAgbGV0IGVsID0ge307XHJcbiAgICAgIGlmIChvYltpZF09PT10cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlLFxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgYXJyID0gb2JbaWRdLnNwbGl0KCc6Jyk7XHJcbiAgICAgICAgYXJyWzFdLnNwbGl0KCcsJykubWFwKGUgPT4ge1xyXG4gICAgICAgICAgZWxbZV0gPSB0cnVlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF07XHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWw7XHJcbiAgICAgIG5vZGVzW2lkXSA9IHtcclxuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgIHJlbW92ZTogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBmbmFtZTtcclxuICBjb25zdCBjYWxsYmFjayA9IF93c19kZWJvdW5jZShmdW5jdGlvbigpIHtcclxuICAgIGZvciAobGV0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKTtcclxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWU7XHJcbiAgICAgICAgICBpZiAobm9kZXNbaWRdLnJlbW92ZSE9PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCcnKS5yZXBsYWNlKC9cXC8vZywnLScpO1xyXG4gICAgICAgICAgICBmbmFtZSA9IGAke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YDtcclxuICAgICAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90Jywge25hbWVzcGFjZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXJ9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlO1xyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywnJykucmVwbGFjZSgvXFwvL2csJy0nKTtcclxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWA7XHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHtuYW1lc3BhY2UsIGhvc3QsIGZuYW1lLCBicm93c2VyfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgMTAwKTtcclxuXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZVxyXG4gICAgfSk7ICBcclxuICB9KVxyXG59XHJcbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJztcclxuXHJcbmxldCBuYW5vaWQgPSAoc2l6ZT04KSA9PiB7XHJcbiAgbGV0IGlkID0gJydcclxuICB3aGlsZSAoMCA8IHNpemUtLSkge1xyXG4gICAgaWQgKz0gdDY0WyBNYXRoLnJhbmRvbSgpKjY0IHwgMF1cclxuICB9XHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHtfd3N9ID0gd2luZG93O1xyXG5cclxuICAvL2V4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy9leDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsPXRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29uLCBfYWxsfTtcclxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvL2V4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19lbWl0cGFnZSA9IChqc29uLCByZWdleD0nJykgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb24sIHJlZ2V4fTtcclxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcblxyXG4gIC8vZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxyXG4gIHdpbmRvdy53c19fc3R5bGUgPSAoanNvbiwgX2FsbD10cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbiwgX2FsbH07XHJcbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgLy9leDogd3NfX3BpbmcoJ0hpIScpXHJcbiAgd2luZG93LndzX19waW5nID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29ufTtcclxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcbiAgXHJcbiAgLy9leDogd3NfX2hlbHAoKVxyXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcclxuICAgIF93cy5zZW5kKCdfaGVscHt9Jyk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcclxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb259O1xyXG4gICAgX3dzLnNlbmQoYF9vcGVuJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xyXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKTtcclxuICAgIGNvbnN0IGtleSA9IGAke2NtZH06JHtpZH1gO1xyXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xyXG4gICAgICAgIGRlbGV0ZSAgd2luZG93Ll93c19xdWV1ZVtrZXldO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCc+PiB3cyB0aW1lb3V0IScsIGtleSk7XHJcbiAgICAgIH0gXHJcbiAgICB9LCA1MDAwKVxyXG4gICAgY29uc3QgcGFyYW1zID0gYCR7a2V5fSR7SlNPTi5zdHJpbmdpZnkoe2RhdGF9KX1gO1xyXG4gICAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcclxuICAgICAgY29uc29sZS5sb2coJ193cy5zZW5kJywgcGFyYW1zKTsgXHJcbiAgICB9XHJcbiAgICBfd3Muc2VuZChwYXJhbXMpO1xyXG4gIH1cclxufVxyXG4vL3dzX19zZW5kKCdfcGluZycsICdMT0wnLCB3PT5jb25zb2xlLmxvZygnPnJlc3VsdCcsdykpOyIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcblxubGV0IF90aW1lb3V0O1xubGV0IF9jc3AgPSB7fTtcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XG4gICAgbGV0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcbiAgICAucmVwbGFjZSgvXlxcLy8sJycpXG4gICAgLnJlcGxhY2UoL1xcLy9nLCctJyk7XG4gICAgY29uc3Qge1xuICAgICAgYmxvY2tlZFVSSSxcbiAgICAgIGRpc3Bvc2l0aW9uLFxuICAgICAgZG9jdW1lbnRVUkksXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXG4gICAgICBvcmlnaW5hbFBvbGljeSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZSxcbiAgICB9ID0gZTtcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xuICAgICAgX2NzcFt0eXBdID0ge307XG4gICAgfVxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBob3N0LFxuICAgICAgICBwYXRoLFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXTtcbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IF9lcnIgPSAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV07XG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge307XG4gICAgfVxuICAgIGNvbnN0IF9tYXRjaCA9IG9yaWdpbmFsUG9saWN5Lm1hdGNoKGAke3Zpb2xhdGVkRGlyZWN0aXZlfSBbXjtdKztgKTtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmU7XG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcbiAgICAgIGRpcmVjdGl2ZSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgfTtcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4gQ1NQOicsIF9jc3ApOyAgXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxuICAgICAgLy8gICBob3N0LFxuICAgICAgLy8gICBwYXRoLFxuICAgICAgLy8gICBfY3NwLFxuICAgICAgLy8gfSk7XG4gICAgICBfY3NwID0ge307XG4gICAgICB9LCA0MDAwKTtcbiAgfTtcblxuICBpZiAod2luZG93Lm1pdG0uY2xpZW50LmNzcCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlY3VyaXR5cG9saWN5dmlvbGF0aW9uJywgY3NwRXJyb3IpO1xuICB9XG59XG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG5cbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxuIiwiY29uc3QgX3dzX3Bvc3RtZXNzYWdlID0gcmVxdWlyZSgnLi9fd3NfcG9zdG1lc3NhZ2UnKTtcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKTtcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpO1xuY29uc3QgX3dzX2xvY2F0aW9uID0gcmVxdWlyZSgnLi9fd3NfbG9jYXRpb24nKTtcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJyk7XG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKTtcbmNvbnN0IF93c19jc3BFcnIgPSByZXF1aXJlKCcuL193c19jc3AtZXJyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBfd3NfcG9zdG1lc3NhZ2UoKTtcbiAgX3dzX2luaXRTb2NrZXQoKTtcbiAgX3dzX3NjcmVlbnNob3QoKTtcbiAgX3dzX2xvY2F0aW9uKCk7XG4gIF93c19vYnNlcnZlcigpO1xuICBfd3NfZ2VuZXJhbCgpO1xuICBfd3NfY3NwRXJyKCk7XG59XG4iXSwibmFtZXMiOlsiX3dzX2RlYm91bmNlIl0sIm1hcHBpbmdzIjoiOztBQUFBLHNCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFO0FBQ2pDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdGLEtBQUs7QUFDTCxHQUFHO0FBQ0gsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkEsaUJBQWlCLE1BQU07QUFDdkIsRUFBRSxJQUFJLFNBQVMsQ0FBQztBQUNoQixFQUFFLE9BQU87QUFDVDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsTUFBTSxNQUFNLFFBQVEsR0FBRyx1RkFBdUYsQ0FBQztBQUMvRyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUks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
