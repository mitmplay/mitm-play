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
};

var _ws_namespace = () => {
  const {hostname: host} = location;
  let namespace;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  for (let key in window.mitm.routes) {
    if (host.match(toRegex(key))) {
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
  if (mitm.argv.lazy) {
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
  for (let el of arr) {
    let node = e.target;
    while (el!==node && node!==document.body) {
      node = node.parentNode;
    }
    if (node!==document.body) {
      const params = {namespace, host, fname, browser};
      window.ws__send('screenshot', params);
      if (mitm.argv.lazy) {
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
        }, 700);
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
  const style = 'position: absolute;z-index: 9999;top: 8px;left: 5px;';
  const event = new Event('urlchanged');
  let container;
  let intervId;
  let button;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
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
    if (namespace) {
      const {pathname} = location;
      const {macros} = window.mitm;
      // console.log(namespace, location);
      for (let key in macros) {
        if (pathname.match(toRegex(key))) {
          macros[key]();
        } 
      }
    }
    container.style = style + (window.mitm.autofill ? '' : 'display: none;');
    if (typeof(window.mitm.autointerval)==='function') {
      intervId = setInterval(window.mitm.autointerval, 500);
    }
  }

  function btnclick(e) {
    const {autofill} = window.mitm;
    const browser = _ws_vendor();
    if (autofill) {
      console.log(JSON.stringify(autofill, null, 2));
      window.ws__send('autofill', {autofill, browser});
    }
  }

  if (!chrome.tabs) {
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
      newNode.style = 'position: absolute;z-index: 9999;top: 8px;left: 5px;';
      newNode.innerHTML = '<button>Autofill</button>';
      node.insertBefore(newNode, noderef);
      setTimeout(()=> {
        container = newNode;
        button = newNode.children[0];
        button.onclick = btnclick;
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
  var _ws_debounce = debounce;

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
  const callback = _ws_debounce(function() {
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

var _src = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_screenshot();
  _ws_location();
  _ws_observer();
  _ws_general();
  _ws_cspErr();
};

_src();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19vYnNlcnZlci5qcyIsIl9zcmMvX3dzX2dlbmVyYWwuanMiLCJfc3JjL193c19jc3AtZXJyLmpzIiwiX3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xyXG4gICAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgPj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XHJcblxyXG4gIC8vIGlmICghY2hyb21lLndpbmRvd3MpIHtcclxuICAvLyAgIGZ1bmN0aW9uIHJlcG9ydFdpbmRvd1NpemUoKSB7XHJcbiAgLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0gPSB3aW5kb3c7XHJcbiAgLy8gICAgIGNvbnNvbGUubG9nKHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0pO1xyXG4gIC8vICAgfVxyXG4gIC8vICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7ICBcclxuICAvLyB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCB3aW5kb3dSZWY7XG4gIHJldHVybiB7XG4gICAgLy9leDogd3NfX2hlbHAoKVxuICAgIF9oZWxwKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fcGluZyhcInRoZXJlXCIpIFxuICAgIF9waW5nKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fb3Blbih7dXJsOiBcImh0dHBzOi8vZ29vZ2xlLmNvbVwifSlcbiAgICBfb3Blbih7ZGF0YX0pIHtcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnO1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKTtcbiAgICAgIHdpbmRvd1JlZi5ibHVyKCk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcbiAgICBfc3R5bGUoe2RhdGF9KSB7XG4gICAgICBjb25zdCB7cSxjc3N9ID0gZGF0YTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocSkuZm9yRWFjaChcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxuICAgICAgKTtcbiAgICB9LFxuICAgIC8vZXg6IHdzX19cbiAgICBfZmlsZXMoe3R5cCwgZGF0YX0pIHtcbiAgICAgIGNvbnN0IHtmaWxlc30gPSB3aW5kb3cubWl0bTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApO1xuICAgICAgZm9yIChsZXQga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3NldENsaWVudCh7ZGF0YX0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSk7XG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhO1xuICAgIH1cbiAgfTtcbn1cbiIsImNvbnN0IF93c19jbGllbnQgPSByZXF1aXJlKCcuL193c19jbGllbnQnKTtcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xuICBpZiAod2luZG93Lm1pdG0uYXJndi5kZWJ1Zykge1xuICAgIGlmIChtc2cubGVuZ3RoPjQwKSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLDQwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKTtcbiAgICB9ICBcbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pO1xuICBpZiAoYXJyKSB7XG4gICAgbGV0IFssY21kLGpzb25dID0gYXJyO1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mKGpzb24pPT09J3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoanNvbixlcnJvcik7XG4gICAgfSAgICAgICAgXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXTtcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF07XG4gICAgICBoYW5kbGVyKGpzb24uZGF0YSk7XG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9ICAgICAgIFxuICB9ICAgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgbGV0IGlmcm07XHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcDtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZTtcclxuICB9XHJcbiAgcmV0dXJuIGlmcm0gPyAnaWZyYW1lJyA6ICd3aW5kb3cnO1xyXG59O1xyXG4iLCJjb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpO1xyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldChgd3NzOi8vbG9jYWxob3N0OjMwMDEvd3M/cGFnZT0ke193c19pbklmcmFtZSgpfWApO1xyXG5cclxuICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHsgXHJcbiAgICBfd3NfbXNnUGFyc2VyKGV2ZW50LCBldmVudC5kYXRhKTtcclxuICAgfTtcclxuXHJcbiAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uKCkgeyAgICAgICAgICAgICAgICAgXHJcbiAgICB3cy5zZW5kKGB1cmw6JHsobG9jYXRpb24rJycpLnNwbGl0KC9bPyNdLylbMF19YCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcIndzOiBzZW50Li4uXCIpO1xyXG4gIH07ICBcclxuXHJcbiAgd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkgeyBcclxuICAgIGNvbnNvbGUubG9nKCd3czogQ29ubmVjdGlvbiBpcyBjbG9zZWQnKTsgXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Ll93cyA9IHdzO1xyXG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xuICBsZXQgbmFtZXNwYWNlO1xuXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFwvL2csICdcXFxcLycpO1xuICB9XG5cbiAgZm9yIChsZXQga2V5IGluIHdpbmRvdy5taXRtLnJvdXRlcykge1xuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5KSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlO1xufSIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHt2ZW5kb3J9ID0gbmF2aWdhdG9yO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnLFxyXG4gIH1bdmVuZG9yXTtcclxuICByZXR1cm4gYnJvd3NlcjtcclxufSIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpO1xyXG5cclxubGV0IGFjdDtcclxuZnVuY3Rpb24gc2NyZWVuc2hvdChlKSB7XHJcbiAgaWYgKG1pdG0uYXJndi5sYXp5KSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+PiBkZWxheSBhY3Rpb24nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGFjdCkge1xyXG4gICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gIFxyXG4gIH1cclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBjb25zdCB7c2VsZWN0b3J9ID0gcm91dGUuc2NyZWVuc2hvdDtcclxuXHJcbiAgY29uc3QgYXJyID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCcnKS5yZXBsYWNlKC9cXC8vZywnLScpO1xyXG4gIGZvciAobGV0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldDtcclxuICAgIHdoaWxlIChlbCE9PW5vZGUgJiYgbm9kZSE9PWRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcclxuICAgIH1cclxuICAgIGlmIChub2RlIT09ZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBjb25zdCBwYXJhbXMgPSB7bmFtZXNwYWNlLCBob3N0LCBmbmFtZSwgYnJvd3Nlcn07XHJcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHBhcmFtcyk7XHJcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eSkge1xyXG4gICAgICAgIC8vIGRlbGF5IGFjdGlvbiB0byBmaW5pc2ggc2NyZWVuc2hvdFxyXG4gICAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSBlLnRhcmdldDtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJz4+IGNsaWNrZWQnKTtcclxuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3Q7XHJcbiAgICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90Lm5vZGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBhY3QuY2xpY2soKTtcclxuICAgICAgICAgIGFjdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9LCA3MDApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KTtcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuIiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBzdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7ei1pbmRleDogOTk5OTt0b3A6IDhweDtsZWZ0OiA1cHg7JztcclxuICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpO1xyXG4gIGxldCBjb250YWluZXI7XHJcbiAgbGV0IGludGVydklkO1xyXG4gIGxldCBidXR0b247XHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXC8vZywgJ1xcXFwvJyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cmxDaGFuZ2UoZXZlbnQpIHtcclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ZpbGw7XHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2SWQpO1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ludGVydmFsO1xyXG4gICAgfVxyXG4gICAgaWYgKG5hbWVzcGFjZSkge1xyXG4gICAgICBjb25zdCB7cGF0aG5hbWV9ID0gbG9jYXRpb247XHJcbiAgICAgIGNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKG5hbWVzcGFjZSwgbG9jYXRpb24pO1xyXG4gICAgICBmb3IgKGxldCBrZXkgaW4gbWFjcm9zKSB7XHJcbiAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKHRvUmVnZXgoa2V5KSkpIHtcclxuICAgICAgICAgIG1hY3Jvc1trZXldKCk7XHJcbiAgICAgICAgfSBcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbmVyLnN0eWxlID0gc3R5bGUgKyAod2luZG93Lm1pdG0uYXV0b2ZpbGwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpO1xyXG4gICAgaWYgKHR5cGVvZih3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpPT09J2Z1bmN0aW9uJykge1xyXG4gICAgICBpbnRlcnZJZCA9IHNldEludGVydmFsKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCwgNTAwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJ0bmNsaWNrKGUpIHtcclxuICAgIGNvbnN0IHthdXRvZmlsbH0gPSB3aW5kb3cubWl0bTtcclxuICAgIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgICBpZiAoYXV0b2ZpbGwpIHtcclxuICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpKTtcclxuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIHthdXRvZmlsbCwgYnJvd3Nlcn0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCFjaHJvbWUudGFicykge1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpO1xyXG4gICAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZTtcclxuICAgIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBmbi5hcHBseShoaXN0b3J5LCBhcmd1bWVudHMpO1xyXG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICB9O1xyXG4gIFxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJyk7XHJcbiAgICAgIGNvbnN0IG5vZGVyZWYgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkO1xyXG4gICAgICBjb25zdCBuZXdOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgbmV3Tm9kZS5zdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7ei1pbmRleDogOTk5OTt0b3A6IDhweDtsZWZ0OiA1cHg7JztcclxuICAgICAgbmV3Tm9kZS5pbm5lckhUTUwgPSAnPGJ1dHRvbj5BdXRvZmlsbDwvYnV0dG9uPic7XHJcbiAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIG5vZGVyZWYpO1xyXG4gICAgICBzZXRUaW1lb3V0KCgpPT4ge1xyXG4gICAgICAgIGNvbnRhaW5lciA9IG5ld05vZGU7XHJcbiAgICAgICAgYnV0dG9uID0gbmV3Tm9kZS5jaGlsZHJlblswXTtcclxuICAgICAgICBidXR0b24ub25jbGljayA9IGJ0bmNsaWNrO1xyXG4gICAgICAgIHVybENoYW5nZShldmVudCk7XHJcbiAgICAgIH0sMSlcclxuICAgIH0pOyAgXHJcbiAgfVxyXG59XHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlKGZuLCBkZWxheT01MDApIHtcclxuICAgIGxldCBfdGltZW91dDtcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xyXG4gICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xyXG4gICAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcclxuICAgICAgfSwgZGVsYXkpXHJcbiAgICB9XHJcbiAgfVxyXG4gIG1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7IiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpO1xyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgbGV0IHNzaG90ID0ge30sIG5vZGVzID0ge307XHJcbiAgXHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90O1xyXG4gICAgZm9yIChsZXQgaWQgaW4gb2IpIHtcclxuICAgICAgbGV0IGVsID0ge307XHJcbiAgICAgIGlmIChvYltpZF09PT10cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlLFxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgYXJyID0gb2JbaWRdLnNwbGl0KCc6Jyk7XHJcbiAgICAgICAgYXJyWzFdLnNwbGl0KCcsJykubWFwKGUgPT4ge1xyXG4gICAgICAgICAgZWxbZV0gPSB0cnVlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF07XHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWw7XHJcbiAgICAgIG5vZGVzW2lkXSA9IHtcclxuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgIHJlbW92ZTogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBmbmFtZTtcclxuICBjb25zdCBjYWxsYmFjayA9IF93c19kZWJvdW5jZShmdW5jdGlvbigpIHtcclxuICAgIGZvciAobGV0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKTtcclxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWU7XHJcbiAgICAgICAgICBpZiAobm9kZXNbaWRdLnJlbW92ZSE9PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCcnKS5yZXBsYWNlKC9cXC8vZywnLScpO1xyXG4gICAgICAgICAgICBmbmFtZSA9IGAke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YDtcclxuICAgICAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90Jywge25hbWVzcGFjZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXJ9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlO1xyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywnJykucmVwbGFjZSgvXFwvL2csJy0nKTtcclxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWA7XHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHtuYW1lc3BhY2UsIGhvc3QsIGZuYW1lLCBicm93c2VyfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgMTAwKTtcclxuXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZVxyXG4gICAgfSk7ICBcclxuICB9KVxyXG59XHJcbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJztcclxuXHJcbmxldCBuYW5vaWQgPSAoc2l6ZT04KSA9PiB7XHJcbiAgbGV0IGlkID0gJydcclxuICB3aGlsZSAoMCA8IHNpemUtLSkge1xyXG4gICAgaWQgKz0gdDY0WyBNYXRoLnJhbmRvbSgpKjY0IHwgMF1cclxuICB9XHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHtfd3N9ID0gd2luZG93O1xyXG5cclxuICAvL2V4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy9leDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsPXRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29uLCBfYWxsfTtcclxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvL2V4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19lbWl0cGFnZSA9IChqc29uLCByZWdleD0nJykgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb24sIHJlZ2V4fTtcclxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcblxyXG4gIC8vZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxyXG4gIHdpbmRvdy53c19fc3R5bGUgPSAoanNvbiwgX2FsbD10cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbiwgX2FsbH07XHJcbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgLy9leDogd3NfX3BpbmcoJ0hpIScpXHJcbiAgd2luZG93LndzX19waW5nID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29ufTtcclxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcbiAgXHJcbiAgLy9leDogd3NfX2hlbHAoKVxyXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcclxuICAgIF93cy5zZW5kKCdfaGVscHt9Jyk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcclxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb259O1xyXG4gICAgX3dzLnNlbmQoYF9vcGVuJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xyXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKTtcclxuICAgIGNvbnN0IGtleSA9IGAke2NtZH06JHtpZH1gO1xyXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xyXG4gICAgICAgIGRlbGV0ZSAgd2luZG93Ll93c19xdWV1ZVtrZXldO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCc+PiB3cyB0aW1lb3V0IScsIGtleSk7XHJcbiAgICAgIH0gXHJcbiAgICB9LCA1MDAwKVxyXG4gICAgY29uc3QgcGFyYW1zID0gYCR7a2V5fSR7SlNPTi5zdHJpbmdpZnkoe2RhdGF9KX1gO1xyXG4gICAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcclxuICAgICAgY29uc29sZS5sb2coJ193cy5zZW5kJywgcGFyYW1zKTsgXHJcbiAgICB9XHJcbiAgICBfd3Muc2VuZChwYXJhbXMpO1xyXG4gIH1cclxufVxyXG4vL3dzX19zZW5kKCdfcGluZycsICdMT0wnLCB3PT5jb25zb2xlLmxvZygnPnJlc3VsdCcsdykpOyIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcblxubGV0IF90aW1lb3V0O1xubGV0IF9jc3AgPSB7fTtcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XG4gICAgbGV0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcbiAgICAucmVwbGFjZSgvXlxcLy8sJycpXG4gICAgLnJlcGxhY2UoL1xcLy9nLCctJyk7XG4gICAgY29uc3Qge1xuICAgICAgYmxvY2tlZFVSSSxcbiAgICAgIGRpc3Bvc2l0aW9uLFxuICAgICAgZG9jdW1lbnRVUkksXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXG4gICAgICBvcmlnaW5hbFBvbGljeSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZSxcbiAgICB9ID0gZTtcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xuICAgICAgX2NzcFt0eXBdID0ge307XG4gICAgfVxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBob3N0LFxuICAgICAgICBwYXRoLFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXTtcbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IF9lcnIgPSAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV07XG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge307XG4gICAgfVxuICAgIGNvbnN0IF9tYXRjaCA9IG9yaWdpbmFsUG9saWN5Lm1hdGNoKGAke3Zpb2xhdGVkRGlyZWN0aXZlfSBbXjtdKztgKTtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmU7XG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcbiAgICAgIGRpcmVjdGl2ZSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgfTtcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4gQ1NQOicsIF9jc3ApOyAgXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxuICAgICAgLy8gICBob3N0LFxuICAgICAgLy8gICBwYXRoLFxuICAgICAgLy8gICBfY3NwLFxuICAgICAgLy8gfSk7XG4gICAgICBfY3NwID0ge307XG4gICAgICB9LCA0MDAwKTtcbiAgfTtcblxuICBpZiAod2luZG93Lm1pdG0uY2xpZW50LmNzcCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlY3VyaXR5cG9saWN5dmlvbGF0aW9uJywgY3NwRXJyb3IpO1xuICB9XG59XG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG5cbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxuIiwiY29uc3QgX3dzX3Bvc3RtZXNzYWdlID0gcmVxdWlyZSgnLi9fd3NfcG9zdG1lc3NhZ2UnKTtcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKTtcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpO1xuY29uc3QgX3dzX2xvY2F0aW9uID0gcmVxdWlyZSgnLi9fd3NfbG9jYXRpb24nKTtcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJyk7XG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKTtcbmNvbnN0IF93c19jc3BFcnIgPSByZXF1aXJlKCcuL193c19jc3AtZXJyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBfd3NfcG9zdG1lc3NhZ2UoKTtcbiAgX3dzX2luaXRTb2NrZXQoKTtcbiAgX3dzX3NjcmVlbnNob3QoKTtcbiAgX3dzX2xvY2F0aW9uKCk7XG4gIF93c19vYnNlcnZlcigpO1xuICBfd3NfZ2VuZXJhbCgpO1xuICBfd3NfY3NwRXJyKCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQkFBYyxHQUFHLE1BQU07QUFDdkIsRUFBRSxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUU7QUFDakMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtBQUN4QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0YsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQSxjQUFjLEdBQUcsTUFBTTtBQUN2QixFQUFFLElBQUksU0FBUyxDQUFDO0FBQ2hCLEVBQUUsT0FBTztBQUNUO0FBQ0EsSUFBSSxLQUFLLENBQUMsQ0FBQyxJ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LE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0IsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDeEIsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM3QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxJQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sS0FBSztBQUM1QyxJQUFJLE1BQU0sRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQ3hCLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQixJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNqRDtBQUNBLElBQUksVUFBVSxD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
