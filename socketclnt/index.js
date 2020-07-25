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

  const arr = document.querySelectorAll(selector);
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
    document.querySelector('html').addEventListener('click', screenshot);
  }
};

var _ws_location = () => {
  const event = new Event('urlchanged');

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  function urlChange(event) {
    const namespace = _ws_namespace();
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
  }

  window.addEventListener('urlchanged', urlChange);
  const fn = history.pushState;
  history.pushState = function () {
    fn.apply(history, arguments);
    window.dispatchEvent(event);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const noderef = document.body.firstElementChild;
    const newNode = document.createElement("div");
    newNode.style = 'background: red;position: absolute;z-index: 9999;top: 8px;left: 5px;';
    newNode.innerHTML = '<button>Autofil</button>';
    document.body.insertBefore(newNode, noderef);
    urlChange();
  });  
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
      const el = document.querySelectorAll(id);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19vYnNlcnZlci5qcyIsIl9zcmMvX3dzX2dlbmVyYWwuanMiLCJfc3JjL193c19jc3AtZXJyLmpzIiwiX3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xyXG4gICAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgPj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XHJcblxyXG4gIC8vIGlmICghY2hyb21lLndpbmRvd3MpIHtcclxuICAvLyAgIGZ1bmN0aW9uIHJlcG9ydFdpbmRvd1NpemUoKSB7XHJcbiAgLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0gPSB3aW5kb3c7XHJcbiAgLy8gICAgIGNvbnNvbGUubG9nKHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0pO1xyXG4gIC8vICAgfVxyXG4gIC8vICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7ICBcclxuICAvLyB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCB3aW5kb3dSZWY7XG4gIHJldHVybiB7XG4gICAgLy9leDogd3NfX2hlbHAoKVxuICAgIF9oZWxwKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fcGluZyhcInRoZXJlXCIpIFxuICAgIF9waW5nKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fb3Blbih7dXJsOiBcImh0dHBzOi8vZ29vZ2xlLmNvbVwifSlcbiAgICBfb3Blbih7ZGF0YX0pIHtcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnO1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKTtcbiAgICAgIHdpbmRvd1JlZi5ibHVyKCk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcbiAgICBfc3R5bGUoe2RhdGF9KSB7XG4gICAgICBjb25zdCB7cSxjc3N9ID0gZGF0YTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocSkuZm9yRWFjaChcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxuICAgICAgKTtcbiAgICB9LFxuICAgIC8vZXg6IHdzX19cbiAgICBfZmlsZXMoe3R5cCwgZGF0YX0pIHtcbiAgICAgIGNvbnN0IHtmaWxlc30gPSB3aW5kb3cubWl0bTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApO1xuICAgICAgZm9yIChsZXQga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3NldENsaWVudCh7ZGF0YX0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSk7XG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhO1xuICAgIH1cbiAgfTtcbn1cbiIsImNvbnN0IF93c19jbGllbnQgPSByZXF1aXJlKCcuL193c19jbGllbnQnKTtcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xuICBpZiAod2luZG93Lm1pdG0uYXJndi5kZWJ1Zykge1xuICAgIGlmIChtc2cubGVuZ3RoPjQwKSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLDQwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKTtcbiAgICB9ICBcbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pO1xuICBpZiAoYXJyKSB7XG4gICAgbGV0IFssY21kLGpzb25dID0gYXJyO1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mKGpzb24pPT09J3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoanNvbixlcnJvcik7XG4gICAgfSAgICAgICAgXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXTtcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF07XG4gICAgICBoYW5kbGVyKGpzb24uZGF0YSk7XG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9ICAgICAgIFxuICB9ICAgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgbGV0IGlmcm07XHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcDtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZTtcclxuICB9XHJcbiAgcmV0dXJuIGlmcm0gPyAnaWZyYW1lJyA6ICd3aW5kb3cnO1xyXG59O1xyXG4iLCJjb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpO1xyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldChgd3NzOi8vbG9jYWxob3N0OjMwMDEvd3M/cGFnZT0ke193c19pbklmcmFtZSgpfWApO1xyXG5cclxuICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHsgXHJcbiAgICBfd3NfbXNnUGFyc2VyKGV2ZW50LCBldmVudC5kYXRhKTtcclxuICAgfTtcclxuXHJcbiAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uKCkgeyAgICAgICAgICAgICAgICAgXHJcbiAgICB3cy5zZW5kKGB1cmw6JHsobG9jYXRpb24rJycpLnNwbGl0KC9bPyNdLylbMF19YCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcIndzOiBzZW50Li4uXCIpO1xyXG4gIH07ICBcclxuXHJcbiAgd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkgeyBcclxuICAgIGNvbnNvbGUubG9nKCd3czogQ29ubmVjdGlvbiBpcyBjbG9zZWQnKTsgXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Ll93cyA9IHdzO1xyXG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xuICBsZXQgbmFtZXNwYWNlO1xuXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFwvL2csICdcXFxcLycpO1xuICB9XG5cbiAgZm9yIChsZXQga2V5IGluIHdpbmRvdy5taXRtLnJvdXRlcykge1xuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5KSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlO1xufSIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHt2ZW5kb3J9ID0gbmF2aWdhdG9yO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnLFxyXG4gIH1bdmVuZG9yXTtcclxuICByZXR1cm4gYnJvd3NlcjtcclxufSIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpO1xyXG5cclxubGV0IGFjdDtcclxuZnVuY3Rpb24gc2NyZWVuc2hvdChlKSB7XHJcbiAgaWYgKG1pdG0uYXJndi5sYXp5KSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+PiBkZWxheSBhY3Rpb24nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGFjdCkge1xyXG4gICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gIFxyXG4gIH1cclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBjb25zdCB7c2VsZWN0b3J9ID0gcm91dGUuc2NyZWVuc2hvdDtcclxuXHJcbiAgY29uc3QgYXJyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgY29uc3QgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywnJykucmVwbGFjZSgvXFwvL2csJy0nKTtcclxuICBmb3IgKGxldCBlbCBvZiBhcnIpIHtcclxuICAgIGxldCBub2RlID0gZS50YXJnZXQ7XHJcbiAgICB3aGlsZSAoZWwhPT1ub2RlICYmIG5vZGUhPT1kb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XHJcbiAgICB9XHJcbiAgICBpZiAobm9kZSE9PWRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgcGFyYW1zID0ge25hbWVzcGFjZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXJ9O1xyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpO1xyXG4gICAgICBpZiAobWl0bS5hcmd2LmxhenkpIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXQ7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCc+PiBjbGlja2VkJyk7XHJcbiAgICAgICAgICBhY3QgPSB3aW5kb3cubWl0bS5zY3JlZW5zaG90O1xyXG4gICAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdC5ub2RlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgYWN0LmNsaWNrKCk7XHJcbiAgICAgICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSwgNzAwKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldO1xyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KTtcclxuICB9XHJcbn07XHJcbiIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJyk7XHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXC8vZywgJ1xcXFwvJyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cmxDaGFuZ2UoZXZlbnQpIHtcclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcclxuICAgIGlmIChuYW1lc3BhY2UpIHtcclxuICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IGxvY2F0aW9uO1xyXG4gICAgICBjb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhuYW1lc3BhY2UsIGxvY2F0aW9uKTtcclxuICAgICAgZm9yIChsZXQga2V5IGluIG1hY3Jvcykge1xyXG4gICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCh0b1JlZ2V4KGtleSkpKSB7XHJcbiAgICAgICAgICBtYWNyb3Nba2V5XSgpO1xyXG4gICAgICAgIH0gXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKTtcclxuICBjb25zdCBmbiA9IGhpc3RvcnkucHVzaFN0YXRlO1xyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKTtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcclxuICB9O1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IG5vZGVyZWYgPSBkb2N1bWVudC5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG4gICAgY29uc3QgbmV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBuZXdOb2RlLnN0eWxlID0gJ2JhY2tncm91bmQ6IHJlZDtwb3NpdGlvbjogYWJzb2x1dGU7ei1pbmRleDogOTk5OTt0b3A6IDhweDtsZWZ0OiA1cHg7JztcclxuICAgIG5ld05vZGUuaW5uZXJIVE1MID0gJzxidXR0b24+QXV0b2ZpbDwvYnV0dG9uPic7XHJcbiAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShuZXdOb2RlLCBub2RlcmVmKTtcclxuICAgIHVybENoYW5nZShldmVudCk7XHJcbiAgfSk7ICBcclxufVxyXG4iLCJmdW5jdGlvbiBkZWJvdW5jZShmbiwgZGVsYXk9NTAwKSB7XHJcbiAgICBsZXQgX3RpbWVvdXQ7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgIGNvbnN0IF90aGlzID0gdGhpcztcclxuICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KTtcclxuICAgICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBmbi5hcHBseShfdGhpcywgYXJncyk7XHJcbiAgICAgIH0sIGRlbGF5KVxyXG4gICAgfVxyXG4gIH1cclxuICBtb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlOyIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKTtcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpO1xyXG4gIGxldCBzc2hvdCA9IHt9LCBub2RlcyA9IHt9O1xyXG4gIFxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIGNvbnN0IHtvYnNlcnZlcjogb2J9ID0gcm91dGUuc2NyZWVuc2hvdDtcclxuICAgIGZvciAobGV0IGlkIGluIG9iKSB7XHJcbiAgICAgIGxldCBlbCA9IHt9O1xyXG4gICAgICBpZiAob2JbaWRdPT09dHJ1ZSkge1xyXG4gICAgICAgIGVsID0ge1xyXG4gICAgICAgICAgdGl0bGU6ICdub3RpdGxlJyxcclxuICAgICAgICAgIGluc2VydDogdHJ1ZSxcclxuICAgICAgICAgIHJlbW92ZTogdHJ1ZSxcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IGFyciA9IG9iW2lkXS5zcGxpdCgnOicpO1xyXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcclxuICAgICAgICAgIGVsW2VdID0gdHJ1ZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdO1xyXG4gICAgICB9XHJcbiAgICAgIHNzaG90W2lkXSA9IGVsO1xyXG4gICAgICBub2Rlc1tpZF0gPSB7XHJcbiAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICByZW1vdmU6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgZm5hbWU7XHJcbiAgY29uc3QgY2FsbGJhY2sgPSBfd3NfZGVib3VuY2UoZnVuY3Rpb24oKSB7XHJcbiAgICBmb3IgKGxldCBpZCBpbiBub2Rlcykge1xyXG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoaWQpO1xyXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZTtcclxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlIT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sJycpLnJlcGxhY2UoL1xcLy9nLCctJyk7XHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgO1xyXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7bmFtZXNwYWNlLCBob3N0LCBmbmFtZSwgYnJvd3Nlcn0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoIW5vZGVzW2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSB0cnVlXHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gZmFsc2U7XHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCcnKS5yZXBsYWNlKC9cXC8vZywnLScpO1xyXG4gICAgICAgICAgICBmbmFtZSA9IGAke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0tcmVtb3ZlYDtcclxuICAgICAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90Jywge25hbWVzcGFjZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXJ9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCAxMDApO1xyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XHJcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcclxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxyXG4gICAgICBzdWJ0cmVlOiB0cnVlXHJcbiAgICB9KTsgIFxyXG4gIH0pXHJcbn1cclxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnO1xyXG5cclxubGV0IG5hbm9pZCA9IChzaXplPTgpID0+IHtcclxuICBsZXQgaWQgPSAnJ1xyXG4gIHdoaWxlICgwIDwgc2l6ZS0tKSB7XHJcbiAgICBpZCArPSB0NjRbIE1hdGgucmFuZG9tKCkqNjQgfCAwXVxyXG4gIH1cclxuICByZXR1cm4gaWRcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3Qge193c30gPSB3aW5kb3c7XHJcblxyXG4gIC8vZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvL2V4OiB3c19icm9hZGNhc3QoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfYnJvYWRjYXN0ID0gKGpzb24sIF9hbGw9dHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb24sIF9hbGx9O1xyXG4gICAgX3dzLnNlbmQoYGJyb2FkY2FzdCR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcblxyXG4gIC8vZXg6IHdzX2VtaXRwYWdlKCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxyXG4gIC8vZXg6IHdzX2VtaXRwYWdlKCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4PScnKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbiwgcmVnZXh9O1xyXG4gICAgX3dzLnNlbmQoYGVtaXRwYWdlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgLy9leDogd3NfX3N0eWxlKHtcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn0pXHJcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsPXRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29uLCBfYWxsfTtcclxuICAgIF93cy5zZW5kKGBfc3R5bGUke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19fcGluZygnSGkhJylcclxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb259O1xyXG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuICBcclxuICAvL2V4OiB3c19faGVscCgpXHJcbiAgd2luZG93LndzX19oZWxwID0gKCkgPT4ge1xyXG4gICAgX3dzLnNlbmQoJ19oZWxwe30nKTtcclxuICB9XHJcblxyXG4gIC8vZXg6IHdzX19vcGVuKHt1cmw6J2h0dHBzOi8vZ29vZ2xlLmNvbSd9KVxyXG4gIHdpbmRvdy53c19fb3BlbiA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbn07XHJcbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG5cclxuICB3aW5kb3cud3NfX3NlbmQgPSAoY21kLCBkYXRhLCBoYW5kbGVyKSA9PiB7XHJcbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpO1xyXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWA7XHJcbiAgICB3aW5kb3cuX3dzX3F1ZXVlW2tleV0gPSBoYW5kbGVyIHx8ICh3ID0+IHt9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAod2luZG93Ll93c19xdWV1ZVtrZXldKSB7XHJcbiAgICAgICAgZGVsZXRlICB3aW5kb3cuX3dzX3F1ZXVlW2tleV07XHJcbiAgICAgICAgY29uc29sZS5sb2coJz4+IHdzIHRpbWVvdXQhJywga2V5KTtcclxuICAgICAgfSBcclxuICAgIH0sIDUwMDApXHJcbiAgICBjb25zdCBwYXJhbXMgPSBgJHtrZXl9JHtKU09OLnN0cmluZ2lmeSh7ZGF0YX0pfWA7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXJndi5kZWJ1Zykge1xyXG4gICAgICBjb25zb2xlLmxvZygnX3dzLnNlbmQnLCBwYXJhbXMpOyBcclxuICAgIH1cclxuICAgIF93cy5zZW5kKHBhcmFtcyk7XHJcbiAgfVxyXG59XHJcbi8vd3NfX3NlbmQoJ19waW5nJywgJ0xPTCcsIHc9PmNvbnNvbGUubG9nKCc+cmVzdWx0Jyx3KSk7IiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xuXG5sZXQgX3RpbWVvdXQ7XG5sZXQgX2NzcCA9IHt9O1xubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IGNzcEVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0IHtob3N0bmFtZTogaG9zdH0gPSBsb2NhdGlvbjtcbiAgICBsZXQgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xuICAgIGNvbnN0IHBhdGggPSBsb2NhdGlvbi5wYXRobmFtZVxuICAgIC5yZXBsYWNlKC9eXFwvLywnJylcbiAgICAucmVwbGFjZSgvXFwvL2csJy0nKTtcbiAgICBjb25zdCB7XG4gICAgICBibG9ja2VkVVJJLFxuICAgICAgZGlzcG9zaXRpb24sXG4gICAgICBkb2N1bWVudFVSSSxcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcbiAgICAgIG9yaWdpbmFsUG9saWN5LFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZSxcbiAgICAgIHZpb2xhdGVkRGlyZWN0aXZlLFxuICAgIH0gPSBlO1xuICAgIGNvbnN0IHR5cCA9IGBbJHtkaXNwb3NpdGlvbn1dICR7ZG9jdW1lbnRVUkl9YFxuICAgIGlmICghX2NzcFt0eXBdKSB7XG4gICAgICBfY3NwW3R5cF0gPSB7fTtcbiAgICB9XG4gICAgaWYgKCFfY3NwW3R5cF0uX2dlbmVyYWxfKSB7XG4gICAgICBfY3NwW3R5cF0uX2dlbmVyYWxfID0ge1xuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIGhvc3QsXG4gICAgICAgIHBhdGgsXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBfZG9jID0gX2NzcFt0eXBdO1xuICAgIGlmICghX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0pIHtcbiAgICAgIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdID0ge307XG4gICAgfVxuXG4gICAgY29uc3QgX2VyciA9ICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXTtcbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcbiAgICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7fTtcbiAgICB9XG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApO1xuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IF9tYXRjaCA/IF9tYXRjaFswXSA6IGVmZmVjdGl2ZURpcmVjdGl2ZTtcbiAgICBfZXJyW2Jsb2NrZWRVUkldID0ge1xuICAgICAgZGlyZWN0aXZlLFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZSxcbiAgICB9O1xuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+PiBDU1A6JywgX2NzcCk7ICBcbiAgICAgIC8vIHdpbmRvdy53c19fc2VuZCgnY3NwX2Vycm9yJywge1xuICAgICAgLy8gICBuYW1lc3BhY2UsXG4gICAgICAvLyAgIGhvc3QsXG4gICAgICAvLyAgIHBhdGgsXG4gICAgICAvLyAgIF9jc3AsXG4gICAgICAvLyB9KTtcbiAgICAgIF9jc3AgPSB7fTtcbiAgICAgIH0sIDQwMDApO1xuICB9O1xuXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcik7XG4gIH1cbn1cbi8vIGRpc3Bvc2l0aW9uOiBcInJlcG9ydFwiXG4vLyBkb2N1bWVudFVSSTogXCJodHRwczovL3doYXQvaHRtbC9jb250YWluL2NzcFwiXG4vLyB2aW9sYXRlZERpcmVjdGl2ZTogXCJpbWctc3JjXCJcblxuLy8gYmxvY2tlZFVSSTogXCJodHRwczovL3doYXQvdXJsL2dldHRpbmcvYmxvY2tlZFwiXG4vLyBlZmZlY3RpdmVEaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG4vLyBvcmlnaW5hbFBvbGljeTogXCJzY3JpcHQtc3JjIG51bGw7IGZyYW1lLXNyYyBudWxsOyBzdHlsZS1zcmMgbnVsbDsgc3R5bGUtc3JjLWVsZW0gbnVsbDsgaW1nLXNyYyBudWxsO1wiXG4vLyB0aW1lU3RhbXA6IDE5MzMuODIwMDAwMDA1NjUzMVxuLy8gdHlwZTogXCJzZWN1cml0eXBvbGljeXZpb2xhdGlvblwiXG4iLCJjb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpO1xuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpO1xuY29uc3QgX3dzX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL193c19zY3JlZW5zaG90Jyk7XG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpO1xuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKTtcbmNvbnN0IF93c19nZW5lcmFsID0gcmVxdWlyZSgnLi9fd3NfZ2VuZXJhbCcpO1xuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIF93c19wb3N0bWVzc2FnZSgpO1xuICBfd3NfaW5pdFNvY2tldCgpO1xuICBfd3Nfc2NyZWVuc2hvdCgpO1xuICBfd3NfbG9jYXRpb24oKTtcbiAgX3dzX29ic2VydmVyKCk7XG4gIF93c19nZW5lcmFsKCk7XG4gIF93c19jc3BFcnIoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1CQUFjLEdBQUcsTUFBTTtBQUN2QixFQUFFLFNBQVMsY0FBYyxDQUFDLEtBQUssRUFBRTtBQUNqQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0FBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3RixLQUFLO0FBQ0wsR0FBRztBQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBLGNBQWMsR0FBRyxNQUFNO0FBQ3ZCLEVBQUUsSUFBSSxTQUFTLENBQUM7QUFDaEIsRUFBRSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QixLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QixLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xCLE1BQU0sTUFBTSxRQUFRLEdBQUcsdUZBQXVGLENBQUM7QUFDL0csTUFBTSxTQUFTLEdBQUcsTUFB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QyxDQUFDLENBQUMsQ0FBQztBQUMvQyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxLQUFLO0FBQzFDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25DLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0IsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDeEIsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM3QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxJQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sS0FBSztBQUM1QyxJQUFJLE1BQU0s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
