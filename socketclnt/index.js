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
  window.addEventListener('load', () => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19vYnNlcnZlci5qcyIsIl9zcmMvX3dzX2dlbmVyYWwuanMiLCJfc3JjL193c19jc3AtZXJyLmpzIiwiX3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xyXG4gICAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgPj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XHJcblxyXG4gIC8vIGlmICghY2hyb21lLndpbmRvd3MpIHtcclxuICAvLyAgIGZ1bmN0aW9uIHJlcG9ydFdpbmRvd1NpemUoKSB7XHJcbiAgLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0gPSB3aW5kb3c7XHJcbiAgLy8gICAgIGNvbnNvbGUubG9nKHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0pO1xyXG4gIC8vICAgfVxyXG4gIC8vICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7ICBcclxuICAvLyB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCB3aW5kb3dSZWY7XG4gIHJldHVybiB7XG4gICAgLy9leDogd3NfX2hlbHAoKVxuICAgIF9oZWxwKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fcGluZyhcInRoZXJlXCIpIFxuICAgIF9waW5nKHtkYXRhfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fb3Blbih7dXJsOiBcImh0dHBzOi8vZ29vZ2xlLmNvbVwifSlcbiAgICBfb3Blbih7ZGF0YX0pIHtcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnO1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKTtcbiAgICAgIHdpbmRvd1JlZi5ibHVyKCk7XG4gICAgfSxcbiAgICAvL2V4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcbiAgICBfc3R5bGUoe2RhdGF9KSB7XG4gICAgICBjb25zdCB7cSxjc3N9ID0gZGF0YTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocSkuZm9yRWFjaChcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxuICAgICAgKTtcbiAgICB9LFxuICAgIC8vZXg6IHdzX19cbiAgICBfZmlsZXMoe3R5cCwgZGF0YX0pIHtcbiAgICAgIGNvbnN0IHtmaWxlc30gPSB3aW5kb3cubWl0bTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApO1xuICAgICAgZm9yIChsZXQga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3NldENsaWVudCh7ZGF0YX0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSk7XG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhO1xuICAgIH1cbiAgfTtcbn1cbiIsImNvbnN0IF93c19jbGllbnQgPSByZXF1aXJlKCcuL193c19jbGllbnQnKTtcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xuICBpZiAod2luZG93Lm1pdG0uYXJndi5kZWJ1Zykge1xuICAgIGlmIChtc2cubGVuZ3RoPjQwKSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLDQwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKTtcbiAgICB9ICBcbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pO1xuICBpZiAoYXJyKSB7XG4gICAgbGV0IFssY21kLGpzb25dID0gYXJyO1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mKGpzb24pPT09J3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoanNvbixlcnJvcik7XG4gICAgfSAgICAgICAgXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXTtcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF07XG4gICAgICBoYW5kbGVyKGpzb24uZGF0YSk7XG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9ICAgICAgIFxuICB9ICAgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgbGV0IGlmcm07XHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcDtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZTtcclxuICB9XHJcbiAgcmV0dXJuIGlmcm0gPyAnaWZyYW1lJyA6ICd3aW5kb3cnO1xyXG59O1xyXG4iLCJjb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpO1xyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldChgd3NzOi8vbG9jYWxob3N0OjMwMDEvd3M/cGFnZT0ke193c19pbklmcmFtZSgpfWApO1xyXG5cclxuICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHsgXHJcbiAgICBfd3NfbXNnUGFyc2VyKGV2ZW50LCBldmVudC5kYXRhKTtcclxuICAgfTtcclxuXHJcbiAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uKCkgeyAgICAgICAgICAgICAgICAgXHJcbiAgICB3cy5zZW5kKGB1cmw6JHsobG9jYXRpb24rJycpLnNwbGl0KC9bPyNdLylbMF19YCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcIndzOiBzZW50Li4uXCIpO1xyXG4gIH07ICBcclxuXHJcbiAgd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkgeyBcclxuICAgIGNvbnNvbGUubG9nKCd3czogQ29ubmVjdGlvbiBpcyBjbG9zZWQnKTsgXHJcbiAgfTtcclxuXHJcbiAgd2luZG93Ll93cyA9IHdzO1xyXG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xuICBsZXQgbmFtZXNwYWNlO1xuXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFwvL2csICdcXFxcLycpO1xuICB9XG5cbiAgZm9yIChsZXQga2V5IGluIHdpbmRvdy5taXRtLnJvdXRlcykge1xuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5KSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlO1xufSIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHt2ZW5kb3J9ID0gbmF2aWdhdG9yO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnLFxyXG4gIH1bdmVuZG9yXTtcclxuICByZXR1cm4gYnJvd3NlcjtcclxufSIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpO1xyXG5cclxubGV0IGFjdDtcclxuZnVuY3Rpb24gc2NyZWVuc2hvdChlKSB7XHJcbiAgaWYgKG1pdG0uYXJndi5sYXp5KSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+PiBkZWxheSBhY3Rpb24nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGFjdCkge1xyXG4gICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gIFxyXG4gIH1cclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBjb25zdCB7c2VsZWN0b3J9ID0gcm91dGUuc2NyZWVuc2hvdDtcclxuXHJcbiAgY29uc3QgYXJyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgY29uc3QgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywnJykucmVwbGFjZSgvXFwvL2csJy0nKTtcclxuICBmb3IgKGxldCBlbCBvZiBhcnIpIHtcclxuICAgIGxldCBub2RlID0gZS50YXJnZXQ7XHJcbiAgICB3aGlsZSAoZWwhPT1ub2RlICYmIG5vZGUhPT1kb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XHJcbiAgICB9XHJcbiAgICBpZiAobm9kZSE9PWRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgcGFyYW1zID0ge25hbWVzcGFjZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXJ9O1xyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpO1xyXG4gICAgICBpZiAobWl0bS5hcmd2LmxhenkpIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXQ7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCc+PiBjbGlja2VkJyk7XHJcbiAgICAgICAgICBhY3QgPSB3aW5kb3cubWl0bS5zY3JlZW5zaG90O1xyXG4gICAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdC5ub2RlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgYWN0LmNsaWNrKCk7XHJcbiAgICAgICAgICBhY3QgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSwgNzAwKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldO1xyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KTtcclxuICB9XHJcbn07XHJcbiIsImNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJyk7XHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXgoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXC8vZywgJ1xcXFwvJyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cmxDaGFuZ2UoZXZlbnQpIHtcclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKTtcclxuICAgIGlmIChuYW1lc3BhY2UpIHtcclxuICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IGxvY2F0aW9uO1xyXG4gICAgICBjb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhuYW1lc3BhY2UsIGxvY2F0aW9uKTtcclxuICAgICAgZm9yIChsZXQga2V5IGluIG1hY3Jvcykge1xyXG4gICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCh0b1JlZ2V4KGtleSkpKSB7XHJcbiAgICAgICAgICBtYWNyb3Nba2V5XSgpO1xyXG4gICAgICAgIH0gXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKTtcclxuICBjb25zdCBmbiA9IGhpc3RvcnkucHVzaFN0YXRlO1xyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKTtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcclxuICB9O1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xyXG4gICAgdXJsQ2hhbmdlKGV2ZW50KTtcclxuICB9KTsgIFxyXG59XHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlKGZuLCBkZWxheT01MDApIHtcclxuICAgIGxldCBfdGltZW91dDtcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xyXG4gICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xyXG4gICAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcclxuICAgICAgfSwgZGVsYXkpXHJcbiAgICB9XHJcbiAgfVxyXG4gIG1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7IiwiY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpO1xyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpO1xyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7aG9zdG5hbWU6IGhvc3R9ID0gbG9jYXRpb247XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpO1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKCk7XHJcbiAgbGV0IHNzaG90ID0ge30sIG5vZGVzID0ge307XHJcbiAgXHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90O1xyXG4gICAgZm9yIChsZXQgaWQgaW4gb2IpIHtcclxuICAgICAgbGV0IGVsID0ge307XHJcbiAgICAgIGlmIChvYltpZF09PT10cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlLFxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgYXJyID0gb2JbaWRdLnNwbGl0KCc6Jyk7XHJcbiAgICAgICAgYXJyWzFdLnNwbGl0KCcsJykubWFwKGUgPT4ge1xyXG4gICAgICAgICAgZWxbZV0gPSB0cnVlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF07XHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWw7XHJcbiAgICAgIG5vZGVzW2lkXSA9IHtcclxuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgIHJlbW92ZTogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBmbmFtZTtcclxuICBjb25zdCBjYWxsYmFjayA9IF93c19kZWJvdW5jZShmdW5jdGlvbigpIHtcclxuICAgIGZvciAobGV0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChpZCk7XHJcbiAgICAgIGlmIChlbC5sZW5ndGgpIHtcclxuICAgICAgICBpZiAoIW5vZGVzW2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSB0cnVlO1xyXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUhPT11bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywnJykucmVwbGFjZSgvXFwvL2csJy0nKTtcclxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LWluc2VydGA7XHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHtuYW1lc3BhY2UsIGhvc3QsIGZuYW1lLCBicm93c2VyfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZTtcclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sJycpLnJlcGxhY2UoL1xcLy9nLCctJyk7XHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgO1xyXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7bmFtZXNwYWNlLCBob3N0LCBmbmFtZSwgYnJvd3Nlcn0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIDEwMCk7XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcclxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWVcclxuICAgIH0pOyAgXHJcbiAgfSlcclxufVxyXG4iLCJjb25zdCB0NjQgPSAnV2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaaCc7XHJcblxyXG5sZXQgbmFub2lkID0gKHNpemU9OCkgPT4ge1xyXG4gIGxldCBpZCA9ICcnXHJcbiAgd2hpbGUgKDAgPCBzaXplLS0pIHtcclxuICAgIGlkICs9IHQ2NFsgTWF0aC5yYW5kb20oKSo2NCB8IDBdXHJcbiAgfVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7X3dzfSA9IHdpbmRvdztcclxuXHJcbiAgLy9leDogd3NfYnJvYWRjYXN0KCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxyXG4gIC8vZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19icm9hZGNhc3QgPSAoanNvbiwgX2FsbD10cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbiwgX2FsbH07XHJcbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApO1xyXG4gIH1cclxuXHJcbiAgLy9leDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy9leDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXg9JycpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29uLCByZWdleH07XHJcbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG5cclxuICAvL2V4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcclxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGw9dHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0ge2RhdGE6IGpzb24sIF9hbGx9O1xyXG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcblxyXG4gIC8vZXg6IHdzX19waW5nKCdIaSEnKVxyXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7ZGF0YToganNvbn07XHJcbiAgICBfd3Muc2VuZChgX3Bpbmcke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgfVxyXG4gIFxyXG4gIC8vZXg6IHdzX19oZWxwKClcclxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XHJcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpO1xyXG4gIH1cclxuXHJcbiAgLy9leDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXHJcbiAgd2luZG93LndzX19vcGVuID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHtkYXRhOiBqc29ufTtcclxuICAgIF93cy5zZW5kKGBfb3BlbiR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKTtcclxuICB9XHJcblxyXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcclxuICAgIGNvbnN0IGlkID0gbmFub2lkKCk7XHJcbiAgICBjb25zdCBrZXkgPSBgJHtjbWR9OiR7aWR9YDtcclxuICAgIHdpbmRvdy5fd3NfcXVldWVba2V5XSA9IGhhbmRsZXIgfHwgKHcgPT4ge30pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2tleV0pIHtcclxuICAgICAgICBkZWxldGUgIHdpbmRvdy5fd3NfcXVldWVba2V5XTtcclxuICAgICAgICBjb25zb2xlLmxvZygnPj4gd3MgdGltZW91dCEnLCBrZXkpO1xyXG4gICAgICB9IFxyXG4gICAgfSwgNTAwMClcclxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHtkYXRhfSl9YDtcclxuICAgIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdfd3Muc2VuZCcsIHBhcmFtcyk7IFxyXG4gICAgfVxyXG4gICAgX3dzLnNlbmQocGFyYW1zKTtcclxuICB9XHJcbn1cclxuLy93c19fc2VuZCgnX3BpbmcnLCAnTE9MJywgdz0+Y29uc29sZS5sb2coJz5yZXN1bHQnLHcpKTsiLCJjb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJyk7XG5cbmxldCBfdGltZW91dDtcbmxldCBfY3NwID0ge307XG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgY29uc3Qge2hvc3RuYW1lOiBob3N0fSA9IGxvY2F0aW9uO1xuICAgIGxldCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKCk7XG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXG4gICAgLnJlcGxhY2UoL15cXC8vLCcnKVxuICAgIC5yZXBsYWNlKC9cXC8vZywnLScpO1xuICAgIGNvbnN0IHtcbiAgICAgIGJsb2NrZWRVUkksXG4gICAgICBkaXNwb3NpdGlvbixcbiAgICAgIGRvY3VtZW50VVJJLFxuICAgICAgZWZmZWN0aXZlRGlyZWN0aXZlLFxuICAgICAgb3JpZ2luYWxQb2xpY3ksXG4gICAgICB0aW1lU3RhbXAsXG4gICAgICB0eXBlLFxuICAgICAgdmlvbGF0ZWREaXJlY3RpdmUsXG4gICAgfSA9IGU7XG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcbiAgICAgIF9jc3BbdHlwXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIV9jc3BbdHlwXS5fZ2VuZXJhbF8pIHtcbiAgICAgIF9jc3BbdHlwXS5fZ2VuZXJhbF8gPSB7XG4gICAgICAgIHBvbGljeTogb3JpZ2luYWxQb2xpY3ksXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgaG9zdCxcbiAgICAgICAgcGF0aCxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF07XG4gICAgaWYgKCFfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSkge1xuICAgICAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0gPSB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBfZXJyID0gIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdO1xuICAgIGlmICghX2VycltibG9ja2VkVVJJXSkge1xuICAgICAgX2VycltibG9ja2VkVVJJXSA9IHt9O1xuICAgIH1cbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YCk7XG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlO1xuICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7XG4gICAgICBkaXJlY3RpdmUsXG4gICAgICB0aW1lU3RhbXAsXG4gICAgICB0eXBlLFxuICAgIH07XG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KTtcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJz4+IENTUDonLCBfY3NwKTsgIFxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XG4gICAgICAvLyAgIG5hbWVzcGFjZSxcbiAgICAgIC8vICAgaG9zdCxcbiAgICAgIC8vICAgcGF0aCxcbiAgICAgIC8vICAgX2NzcCxcbiAgICAgIC8vIH0pO1xuICAgICAgX2NzcCA9IHt9O1xuICAgICAgfSwgNDAwMCk7XG4gIH07XG5cbiAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5jc3ApIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKTtcbiAgfVxufVxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcbiIsImNvbnN0IF93c19wb3N0bWVzc2FnZSA9IHJlcXVpcmUoJy4vX3dzX3Bvc3RtZXNzYWdlJyk7XG5jb25zdCBfd3NfaW5pdFNvY2tldCA9IHJlcXVpcmUoJy4vX3dzX2luaXQtc29ja2V0Jyk7XG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKTtcbmNvbnN0IF93c19sb2NhdGlvbiA9IHJlcXVpcmUoJy4vX3dzX2xvY2F0aW9uJyk7XG5jb25zdCBfd3Nfb2JzZXJ2ZXIgPSByZXF1aXJlKCcuL193c19vYnNlcnZlcicpO1xuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJyk7XG5jb25zdCBfd3NfY3NwRXJyID0gcmVxdWlyZSgnLi9fd3NfY3NwLWVycicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgX3dzX3Bvc3RtZXNzYWdlKCk7XG4gIF93c19pbml0U29ja2V0KCk7XG4gIF93c19zY3JlZW5zaG90KCk7XG4gIF93c19sb2NhdGlvbigpO1xuICBfd3Nfb2JzZXJ2ZXIoKTtcbiAgX3dzX2dlbmVyYWwoKTtcbiAgX3dzX2NzcEVycigpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUJBQWMsR0FBRyxNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFO0FBQ2pDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZ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YixRQUFRLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUk7QUFDbkMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFNBQVMsRUFBQztBQUNWLFFBQVEsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsT0FBTztBQUNQLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNyQixNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRztBQUNsQixRQUFRLE1BQU0sRUFBRSxLQUFLO0FBQ3JCLFFBQVEsTUFBTSxFQUFFLElBQUk7QUFDcEIsT0FBTyxDQUFDO0FBQ1IsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxLQUFLLENBQUM7QUFDWixFQUFFLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxXQUFXO0FBQzNDLElBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUU7QUFDMUIsTUFBTSxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDL0MsTUFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUU7QUFDckIsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUMvQixVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2xDLFVBQVUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLFNBQVMsRUFBRTtBQUM1QyxZQUFZLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3JDLFdBQVc7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RUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hELElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSztBQUMzQyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxLQUFLO0FBQzFDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25DLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0IsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDeEIsSUFBRztBQUNIO0FBQ0E7QUFD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
