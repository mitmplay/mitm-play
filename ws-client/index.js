'use strict';

/* global location */
var _ws_postmessage = () => {
  function receiveMessage (event) {
    if (window.mitm.client.postmessage) {
      console.log(`>>> Postmessage: ${event.origin} => https://${location.host}`, event.data);
    }
  }
  window.addEventListener('message', receiveMessage, false);

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
    // ex: ws__help()
    _help ({ data }) {
      console.log(data);
    },
    // ex: ws__ping("there")
    _ping ({ data }) {
      console.log(data);
    },
    // ex: ws__open({url: "https://google.com"})
    _open ({ data }) {
      const features = 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,width=800,height=600';
      windowRef = window.open(data.url, '_logs', features);
      windowRef.blur();
    },
    // ex: ws__style('.intro=>background:red;')
    _style ({ data }) {
      const { q, css } = data;
      document.querySelectorAll(q).forEach(
        node => (node.style.cssText = css)
      );
    },
    // ex: ws__
    _files ({ typ, data }) {
      const { files } = window.mitm;
      console.warn(`receive brodcast ${typ}`);
      /**
       * event handler after receiving ws packet
       * ie: window.mitm.files.route_events = {eventObject...}
       */
      for (const key in files[`${typ}_events`]) {
        console.warn(files[`${typ}_events`][key] + '');
        files[`${typ}_events`][key](data);
      }
    },
    _setClient ({ data }) {
      console.log('_setClient', data);
      window.mitm.client = data;
    }
  }
};

/* eslint-disable camelcase */
const _ws_wccmd = _ws_client();

var _ws_msgParser = (event, msg) => {
  if (window.mitm.argv.debug) {
    if (msg.length > 40) {
      console.log('>>> ws-message: `%s...`', msg.slice(0, 40));
    } else {
      console.log('>>> ws-message: `%s`', msg);
    }
  }
  const arr = msg.replace(/\s+$/, '').match(/^ *([\w:]+) *(\{.*)/);
  if (arr) {
    let [, cmd, json] = arr;
    try {
      if (typeof (json) === 'string') {
        json = JSON.parse(json);
      }
    } catch (error) {
      console.error(json, error);
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
  return ifrm ? 'iframe' : 'window'
};

/* global WebSocket */

var _ws_initSocket = () => {
  window._ws_queue = {};
  window._ws_connected = false;
  const { __flag } = window.mitm;

  if (window._ws_connect===undefined) {
    window._ws_connect = {};
  }

  const onopen = data => {
    function ws_send() {
      for (const key in window._ws_connect) {
        window._ws_connected_send = true;
        console.warn(window._ws_connect[key] + '');
        window._ws_connect[key](data);
      }
    }

    if (__flag['ws-connect']) {
      console.log('ws: open connection');
    }

    console.timeEnd('ws');
    window._ws_connected = true;

    setTimeout(ws_send, 1); // minimize intermitten
    setTimeout(() => {
      if (!window._ws_connected_send) {
        console.error('RETRY..........');
        ws_send();
      }
    }, 10); // minimize intermitten     
  };

  const onclose = function () {
    if (__flag['ws-connect']) {
      console.log('ws: close connection');
    }
  };

  const onmessage = function (e) {
    // if (__flag['ws-connect']) {
    //   console.log('on-message:', e.data)
    // }
    _ws_msgParser(event, event.data);
  };

  const url = `wss://localhost:3001/ws?page=${_ws_inIframe()}&url=${document.URL.split('?')[0]}`;
  const ws = new WebSocket(url);
  console.time('ws');
  window._ws = ws;

  ws.onopen = onopen;
  ws.onclose = onclose;
  ws.onmessage = onmessage;
  if (__flag['ws-connect']) {
    console.log('ws: init connection');
  }
};

/* global location */
var _ws_namespace = () => {
  const { hostname: host } = location;
  let namespace;

  function toRegex (str) {
    return str.replace(/\./g, '\\.').replace(/\?/g, '\\?')
  }

  for (const key in window.mitm.routes) {
    if (host.match(toRegex(key.replace(/~/, '[^.]*')))) {
      namespace = key;
      break
    }
  }
  return namespace
};

var _ws_vendor = () => {
  const { vendor } = navigator;
  const browser = {
    '': 'firefox',
    'Google Inc.': 'chromium',
    'Apple Computer, Inc.': 'webkit'
  }[vendor];
  return browser
};

/* global location, mitm */

let act;
function screenshot (e) {
  if (mitm.argv.lazyclick) {
    if (mitm.screenshot) {
      window.mitm.screenshot = undefined;
      console.log('>>> delay action');
      return
    }
    if (act) {
      act = undefined;
      return
    }
  }
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const host = location.origin.replace('://' ,'~~');
  const route = window.mitm.routes[namespace];
  const { selector } = route.screenshot;

  const arr = document.body.querySelectorAll(selector);
  const fname = location.pathname.replace(/^\//g, '~');
  const delay = mitm.argv.lazyclick === true ? 700 : mitm.argv.lazyclick;
  for (const el of arr) {
    let node = e.target;
    while (el !== node && node !== document.body) {
      node = node.parentNode;
    }
    if (node !== document.body) {
      const _page = window['xplay-page'];
      const params = { namespace, _page, host, browser };
      params.fname = fname==='~' ? '~_' : fname;
      window.ws__send('screenshot', params);
      if (mitm.argv.lazyclick) {
        // delay action to finish screenshot
        window.mitm.screenshot = e.target;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        setTimeout(() => {
          // console.log('>>> clicked');
          act = window.mitm.screenshot;
          window.mitm.screenshot.node = undefined;
          act.click();
          act = undefined;
        }, delay);
      }
      return
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

/* global location, history, chrome, Event, CssSelectorGenerator */

var _ws_location = () => {
  const containerStyle = 'position: fixed;z-index: 9999;top: 8px;right: 5px;';
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;';
  const event = new Event('urlchanged');
  let container = {};
  let ctrl = false;
  let button = {};
  let buttons;
  let intervId;

  function toRegex (pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item => item.trim());
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?');
    return { path, msg }
  }

  function setButtons () {
    if (window.mitm.autobuttons) {
      const { autobuttons } = window.mitm;
      setTimeout(() => {
        for (const key in autobuttons) {
          const btn = document.createElement('button');
          const br = document.createElement('span');
          const [caption, color] = key.split('|');
          const ev = autobuttons[key];
          btn.onclick = e => {
            const arr = ev(e);
            Array.isArray(arr) && play(arr);
          };
          btn.innerText = caption;
          buttons.appendChild(btn);
          buttons.appendChild(br);
          br.innerHTML = '&nbsp;';
          btn.style = buttonStyle + (color ? `background: ${color};` : '');
        }
      }, 0);
    }
  }

  function urlChange (event) {
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
      const { pathname } = location;
      const { _macros_, macros } = window.mitm;
      // console.log(namespace, location);
      for (const key in macros) {
        const { path, msg } = toRegex(key);
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
    if (typeof (window.mitm.autointerval) === 'function') {
      intervId = setInterval(window.mitm.autointerval, 500);
    }
    ctrl = false;
  }

  function play (autofill) {
    if (autofill) {
      if (typeof (autofill) === 'function') {
        autofill = autofill();
      }
      const browser = _ws_vendor();
      const lenth = autofill.length;
      const _page = window['xplay-page'];
      console.log(lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2));
      window.ws__send('autofill', { autofill, browser, _page });
    }
  }

  function btnclick (e) {
    const { autofill } = window.mitm;
    play(autofill);
  }

  function keybCtrl (e) {
    const { macrokeys } = window.mitm;
    if (e.ctrlKey && e.key === 'Shift') {
      ctrl = !ctrl;
      container.style = containerStyle + (!ctrl ? '' : 'display: none;');
    } else if (e.ctrlKey && e.altKey) {
      console.log({ macro: `ctrl + alt + ${e.code}` });
      if (macrokeys) {
        let macro = macrokeys[e.code];
        if (macro) {
          macro = macro();
          if (Array.isArray(macro)) {
            let macroIndex = 0;
            const interval = setInterval(() => {
              let selector = macro[macroIndex];
              if (selector.match(/^ *[=-]>/)) {
                selector = `${CssSelectorGenerator.getCssSelector(document.activeElement)} ${selector}`;
              }
              play([selector]);

              macroIndex += 1;
              if (macroIndex >= macro.length) {
                clearInterval(interval);
              }
            }, 100);
          }
        }
      }
    }
  }
  if (!window.chrome) {
    return
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
      const newNode = document.createElement('div');
      const html = '<button class="btn-autofill">Autofill</button>';

      newNode.innerHTML = `<span class="autofill-buttons"></span>${html}`;
      newNode.className = 'mitm autofill-container';
      newNode.style = containerStyle;

      node.insertBefore(newNode, noderef);
      setTimeout(() => {
        container = newNode;
        buttons = newNode.children[0];
        button = newNode.children[1];
        button.onclick = btnclick;
        button.style = `${buttonStyle}background-color: azure;`;
        urlChange();
      }, 1);
    });
  }
};

function debounce (fn, delay = 500) {
  let _timeout;
  return function () {
    const _this = this;
    const args = arguments;
    _timeout && clearTimeout(_timeout);
    _timeout = setTimeout(() => {
      fn.apply(_this, args);
    }, delay);
  }
}

/* global location */

var _ws_route = () => {
  const namespace = _ws_namespace();
  return window.mitm.routes[namespace]
};

/* global location, MutationObserver */

var _ws_observer = () => {
  const { hostname: host } = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const sshot = {}; const nodes = {};

  const route = _ws_route();
  if (route && route.screenshot) {
    const { observer: ob } = route.screenshot;
    for (const id in ob) {
      let el = {};
      if (ob[id] === true) {
        el = {
          title: 'notitle',
          insert: true,
          remove: true
        };
      } if (typeof ob[id] !== 'string') {
        el = {
          title: 'nocapture',
          insert: false,
          remove: false
        };
      } else {
        const arr = ob[id].split(':');
        arr[1].split(',').map(e => {
          el[e] = true;
        });
        el.title = arr[0];
      }
      sshot[id] = el;
      nodes[id] = {
        insert: false,
        remove: true
      };
    }
  }

  let fname;
  const callback = debounce(function () {
    const { observer: ob } = route.screenshot;
    const _page = window['xplay-page'];
    for (const id in nodes) {
      const el = document.body.querySelectorAll(id);
      if (el.length) {
        if (!nodes[id].insert) {
          nodes[id].insert = true;
          if (nodes[id].remove !== undefined) {
            nodes[id].remove = false;
          }
          if (typeof ob[id]==='function') {
            const nod = el[0] || el;
            if (nod._ws_count===undefined) {
              nod._ws_count = 0;
            }
            nod._ws_count += 1;
            if (nod._ws_count<2) {
              ob[id](nod);
            }
          } 
          if (sshot[id].insert) {
            fname = location.pathname.replace(/^\//, '').replace(/\//g, '-');
            fname = `${fname}-${sshot[id].title}-insert`;
            window.ws__send('screenshot', { namespace, _page, host, fname, browser });
          }
        }
      } else {
        if (!nodes[id].remove) {
          nodes[id].remove = true;
          nodes[id].insert = false;
          if (sshot[id].remove) {
            fname = location.pathname.replace(/^\//, '').replace(/\//g, '-');
            fname = `${fname}-${sshot[id].title}-remove`;
            window.ws__send('screenshot', { namespace, _page, host, fname, browser });
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

const nanoid = (size = 8) => {
  let id = '';
  while (size-- > 0) {
    id += t64[Math.random() * 64 | 0];
  }
  return id
};

var _ws_general = () => {
  const { _ws } = window;

  // ex: ws_broadcast('_style{"data":{"q":"*","css":"color:blue;"}}')
  // ex: ws_broadcast('_ping{"data":"Hi!"}')
  window.ws_broadcast = (json, _all = true) => {
    const msg = { data: json, _all };
    _ws.send(`broadcast${JSON.stringify(msg)}`);
  };

  // ex: ws_emitpage('_style{"data":{"q":"*","css":"color:blue;"}}')
  // ex: ws_emitpage('_ping{"data":"Hi!"}')
  window.ws_emitpage = (json, regex = '') => {
    const msg = { data: json, regex };
    _ws.send(`emitpage${JSON.stringify(msg)}`);
  };

  // ex: ws__style({"q":"*","css":"color:blue;"})
  window.ws__style = (json, _all = true) => {
    const msg = { data: json, _all };
    _ws.send(`_style${JSON.stringify(msg)}`);
  };

  // ex: ws__ping('Hi!')
  window.ws__ping = (json) => {
    const msg = { data: json };
    _ws.send(`_ping${JSON.stringify(msg)}`);
  };

  // ex: ws__help()
  window.ws__help = () => {
    _ws.send('_help{}');
  };

  // ex: ws__open({url:'https://google.com'})
  window.ws__open = (json) => {
    const msg = { data: json };
    _ws.send(`_open${JSON.stringify(msg)}`);
  };

  window.ws__send = (cmd, data, handler) => {
    const id = nanoid();
    const key = `${cmd}:${id}`;
    window._ws_queue[key] = handler || (w => {});

    setTimeout(function () {
      if (window._ws_queue[key]) {
        delete window._ws_queue[key];
        console.log('>>> ws timeout!', key);
      }
    }, 5000);
    const params = `${key}${JSON.stringify({ data })}`;
    // if (__flag['ws-message']) {
    //   console.log('_ws.send', params)
    // }
    _ws.send(params);
  };
};
// ws__send('_ping', 'LOL', w=>console.log('>result',w));

/* global location */

let _timeout;
let _csp = {};
var _ws_cspErr = () => {
  const cspError = function (e) {
    const { hostname: host } = location;
    const namespace = _ws_namespace();
    const path = location.pathname
      .replace(/^\//, '')
      .replace(/\//g, '-');
    const {
      blockedURI,
      disposition,
      documentURI,
      effectiveDirective,
      originalPolicy,
      timeStamp,
      type,
      violatedDirective
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
        path
      };
    }
    const _doc = _csp[typ];
    if (!_doc[violatedDirective]) {
      _doc[violatedDirective] = {};
    }

    const _err = _doc[violatedDirective];
    if (!_err[blockedURI]) {
      _err[blockedURI] = {};
    }
    const _match = originalPolicy.match(`${violatedDirective} [^;]+;`);
    const directive = _match ? _match[0] : effectiveDirective;
    _err[blockedURI] = {
      directive,
      timeStamp,
      type
    };
    _timeout && clearTimeout(_timeout);
    _timeout = setTimeout(() => {
      console.log('>>> CSP:', _csp);
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

/* eslint-disable camelcase */

var index = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_screenshot();
  _ws_location();
  _ws_observer();
  _ws_general();
  _ws_cspErr();
};
console.log('ws-client loaded...');

index();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19yb3V0ZS5qcyIsIl9zcmMvX3dzX29ic2VydmVyLmpzIiwiX3NyYy9fd3NfZ2VuZXJhbC5qcyIsIl9zcmMvX3dzX2NzcC1lcnIuanMiLCJfc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlIChldmVudCkge1xuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxuICAgIH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcblxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XG4gIC8vICAgZnVuY3Rpb24gcmVwb3J0V2luZG93U2l6ZSgpIHtcbiAgLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodH0gPSB3aW5kb3c7XG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcbiAgLy8gICB9XG4gIC8vICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7XG4gIC8vIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgd2luZG93UmVmXG4gIHJldHVybiB7XG4gICAgLy8gZXg6IHdzX19oZWxwKClcbiAgICBfaGVscCAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgfSxcbiAgICAvLyBleDogd3NfX3BpbmcoXCJ0aGVyZVwiKVxuICAgIF9waW5nICh7IGRhdGEgfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fb3Blbih7dXJsOiBcImh0dHBzOi8vZ29vZ2xlLmNvbVwifSlcbiAgICBfb3BlbiAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnXG4gICAgICB3aW5kb3dSZWYgPSB3aW5kb3cub3BlbihkYXRhLnVybCwgJ19sb2dzJywgZmVhdHVyZXMpXG4gICAgICB3aW5kb3dSZWYuYmx1cigpXG4gICAgfSxcbiAgICAvLyBleDogd3NfX3N0eWxlKCcuaW50cm89PmJhY2tncm91bmQ6cmVkOycpXG4gICAgX3N0eWxlICh7IGRhdGEgfSkge1xuICAgICAgY29uc3QgeyBxLCBjc3MgfSA9IGRhdGFcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocSkuZm9yRWFjaChcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxuICAgICAgKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19cbiAgICBfZmlsZXMgKHsgdHlwLCBkYXRhIH0pIHtcbiAgICAgIGNvbnN0IHsgZmlsZXMgfSA9IHdpbmRvdy5taXRtXG4gICAgICBjb25zb2xlLndhcm4oYHJlY2VpdmUgYnJvZGNhc3QgJHt0eXB9YClcbiAgICAgIC8qKlxuICAgICAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxuICAgICAgICovXG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0gKyAnJylcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpXG4gICAgICB9XG4gICAgfSxcbiAgICBfc2V0Q2xpZW50ICh7IGRhdGEgfSkge1xuICAgICAgY29uc29sZS5sb2coJ19zZXRDbGllbnQnLCBkYXRhKVxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxuICAgIH1cbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XG4gICAgaWYgKG1zZy5sZW5ndGggPiA0MCkge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKVxuICAgIH1cbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pXG4gIGlmIChhcnIpIHtcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgaWZybVxuICB0cnkge1xuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxuICB9IGNhdGNoIChlKSB7XG4gICAgaWZybSA9IHRydWVcbiAgfVxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcbn1cbiIsIi8qIGdsb2JhbCBXZWJTb2NrZXQgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX21zZ1BhcnNlciA9IHJlcXVpcmUoJy4vX3dzX21zZy1wYXJzZXInKVxuY29uc3QgX3dzX2luSWZyYW1lID0gcmVxdWlyZSgnLi9fd3NfaW4taWZyYW1lJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fVxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXG4gIGNvbnN0IHsgX19mbGFnIH0gPSB3aW5kb3cubWl0bVxuXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxuICB9XG5cbiAgY29uc3Qgb25vcGVuID0gZGF0YSA9PiB7XG4gICAgZnVuY3Rpb24gd3Nfc2VuZCgpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xuICAgICAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kID0gdHJ1ZVxuICAgICAgICBjb25zb2xlLndhcm4od2luZG93Ll93c19jb25uZWN0W2tleV0gKyAnJylcbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcbiAgICAgIGNvbnNvbGUubG9nKCd3czogb3BlbiBjb25uZWN0aW9uJylcbiAgICB9XG5cbiAgICBjb25zb2xlLnRpbWVFbmQoJ3dzJylcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IHRydWVcblxuICAgIHNldFRpbWVvdXQod3Nfc2VuZCwgMSkgLy8gbWluaW1pemUgaW50ZXJtaXR0ZW5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICghd2luZG93Ll93c19jb25uZWN0ZWRfc2VuZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdSRVRSWS4uLi4uLi4uLi4nKVxuICAgICAgICB3c19zZW5kKClcbiAgICAgIH1cbiAgICB9LCAxMCkgLy8gbWluaW1pemUgaW50ZXJtaXR0ZW4gICAgIFxuICB9XG5cbiAgY29uc3Qgb25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcbiAgICAgIGNvbnNvbGUubG9nKCd3czogY2xvc2UgY29ubmVjdGlvbicpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAvLyBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdvbi1tZXNzYWdlOicsIGUuZGF0YSlcbiAgICAvLyB9XG4gICAgX3dzX21zZ1BhcnNlcihldmVudCwgZXZlbnQuZGF0YSlcbiAgfVxuXG4gIGNvbnN0IHVybCA9IGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcbiAgY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0KHVybClcbiAgY29uc29sZS50aW1lKCd3cycpXG4gIHdpbmRvdy5fd3MgPSB3c1xuXG4gIHdzLm9ub3BlbiA9IG9ub3BlblxuICB3cy5vbmNsb3NlID0gb25jbG9zZVxuICB3cy5vbm1lc3NhZ2UgPSBvbm1lc3NhZ2VcbiAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgY29uc29sZS5sb2coJ3dzOiBpbml0IGNvbm5lY3Rpb24nKVxuICB9XG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICBsZXQgbmFtZXNwYWNlXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcbiAgICBpZiAoaG9zdC5tYXRjaCh0b1JlZ2V4KGtleS5yZXBsYWNlKC9+LywgJ1teLl0qJykpKSkge1xuICAgICAgbmFtZXNwYWNlID0ga2V5XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxuICBjb25zdCBicm93c2VyID0ge1xuICAgICcnOiAnZmlyZWZveCcsXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcbiAgICAnQXBwbGUgQ29tcHV0ZXIsIEluYy4nOiAnd2Via2l0J1xuICB9W3ZlbmRvcl1cbiAgcmV0dXJuIGJyb3dzZXJcbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgbWl0bSAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuXG5sZXQgYWN0XG5mdW5jdGlvbiBzY3JlZW5zaG90IChlKSB7XG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XG4gICAgaWYgKG1pdG0uc2NyZWVuc2hvdCkge1xuICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IHVuZGVmaW5lZFxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChhY3QpIHtcbiAgICAgIGFjdCA9IHVuZGVmaW5lZFxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXG4gIGNvbnN0IGhvc3QgPSBsb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSgnOi8vJyAsJ35+JylcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXVxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XG5cbiAgY29uc3QgYXJyID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxuICBjb25zdCBkZWxheSA9IG1pdG0uYXJndi5sYXp5Y2xpY2sgPT09IHRydWUgPyA3MDAgOiBtaXRtLmFyZ3YubGF6eWNsaWNrXG4gIGZvciAoY29uc3QgZWwgb2YgYXJyKSB7XG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxuICAgIHdoaWxlIChlbCAhPT0gbm9kZSAmJiBub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG4gICAgfVxuICAgIGlmIChub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxuICAgICAgcGFyYW1zLmZuYW1lID0gZm5hbWU9PT0nficgPyAnfl8nIDogZm5hbWVcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHBhcmFtcylcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XG4gICAgICAgIC8vIGRlbGF5IGFjdGlvbiB0byBmaW5pc2ggc2NyZWVuc2hvdFxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXRcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnPj4+IGNsaWNrZWQnKTtcbiAgICAgICAgICBhY3QgPSB3aW5kb3cubWl0bS5zY3JlZW5zaG90XG4gICAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdC5ub2RlID0gdW5kZWZpbmVkXG4gICAgICAgICAgYWN0LmNsaWNrKClcbiAgICAgICAgICBhY3QgPSB1bmRlZmluZWRcbiAgICAgICAgfSwgZGVsYXkpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV1cbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNjcmVlbnNob3QpXG4gICAgfSlcbiAgfVxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgY29udGFpbmVyU3R5bGUgPSAncG9zaXRpb246IGZpeGVkO3otaW5kZXg6IDk5OTk7dG9wOiA4cHg7cmlnaHQ6IDVweDsnXG4gIGNvbnN0IGJ1dHRvblN0eWxlID0gJ2JvcmRlcjogbm9uZTtib3JkZXItcmFkaXVzOiAxNXB4O2ZvbnQtc2l6ZTogMTBweDsnXG4gIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJylcbiAgbGV0IGNvbnRhaW5lciA9IHt9XG4gIGxldCBjdHJsID0gZmFsc2VcbiAgbGV0IGJ1dHRvbiA9IHt9XG4gIGxldCBidXR0b25zXG4gIGxldCBpbnRlcnZJZFxuXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHBhdGhNc2cpIHtcbiAgICBsZXQgW3BhdGgsIG1zZ10gPSBwYXRoTXNnLnNwbGl0KCc9PicpLm1hcChpdGVtID0+IGl0ZW0udHJpbSgpKVxuICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JylcbiAgICByZXR1cm4geyBwYXRoLCBtc2cgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0QnV0dG9ucyAoKSB7XG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9idXR0b25zKSB7XG4gICAgICBjb25zdCB7IGF1dG9idXR0b25zIH0gPSB3aW5kb3cubWl0bVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGF1dG9idXR0b25zKSB7XG4gICAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICAgICAgICBjb25zdCBiciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgICAgICAgIGNvbnN0IFtjYXB0aW9uLCBjb2xvcl0gPSBrZXkuc3BsaXQoJ3wnKVxuICAgICAgICAgIGNvbnN0IGV2ID0gYXV0b2J1dHRvbnNba2V5XVxuICAgICAgICAgIGJ0bi5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcnIgPSBldihlKVxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheShhcnIpICYmIHBsYXkoYXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgICBidG4uaW5uZXJUZXh0ID0gY2FwdGlvblxuICAgICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnRuKVxuICAgICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnIpXG4gICAgICAgICAgYnIuaW5uZXJIVE1MID0gJyZuYnNwOydcbiAgICAgICAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXG4gICAgICAgIH1cbiAgICAgIH0sIDApXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXJsQ2hhbmdlIChldmVudCkge1xuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9maWxsXG4gICAgfVxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2SWQpXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ludGVydmFsXG4gICAgfVxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvYnV0dG9ucykge1xuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9idXR0b25zXG4gICAgICBidXR0b25zLmlubmVySFRNTCA9ICcnXG4gICAgfVxuICAgIGlmICh3aW5kb3cubWl0bS5tYWNyb2tleXMpIHtcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5tYWNyb2tleXNcbiAgICB9XG4gICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgY29uc3QgeyBwYXRobmFtZSB9ID0gbG9jYXRpb25cbiAgICAgIGNvbnN0IHsgX21hY3Jvc18sIG1hY3JvcyB9ID0gd2luZG93Lm1pdG1cbiAgICAgIC8vIGNvbnNvbGUubG9nKG5hbWVzcGFjZSwgbG9jYXRpb24pO1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWFjcm9zKSB7XG4gICAgICAgIGNvbnN0IHsgcGF0aCwgbXNnIH0gPSB0b1JlZ2V4KGtleSlcbiAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKHBhdGgpKSB7XG4gICAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IG1zZyB8fCAnQXV0b2ZpbGwnXG4gICAgICAgICAgX21hY3Jvc18gJiYgX21hY3Jvc18oKVxuICAgICAgICAgIG1hY3Jvc1trZXldKClcbiAgICAgICAgICBzZXRCdXR0b25zKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb250YWluZXIuc3R5bGUgPSBjb250YWluZXJTdHlsZVxuICAgIGNvbnN0IHZpc2libGUgPSAod2luZG93Lm1pdG0uYXV0b2ZpbGwpXG4gICAgYnV0dG9uLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAodmlzaWJsZSA/ICdiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTsnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpbnRlcnZJZCA9IHNldEludGVydmFsKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCwgNTAwKVxuICAgIH1cbiAgICBjdHJsID0gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XG4gICAgaWYgKGF1dG9maWxsKSB7XG4gICAgICBpZiAodHlwZW9mIChhdXRvZmlsbCkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXG4gICAgICB9XG4gICAgICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXG4gICAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgICAgY29uc29sZS5sb2cobGVudGggPT09IDEgPyBgICAke2F1dG9maWxsfWAgOiBKU09OLnN0cmluZ2lmeShhdXRvZmlsbCwgbnVsbCwgMikpXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ2F1dG9maWxsJywgeyBhdXRvZmlsbCwgYnJvd3NlciwgX3BhZ2UgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBidG5jbGljayAoZSkge1xuICAgIGNvbnN0IHsgYXV0b2ZpbGwgfSA9IHdpbmRvdy5taXRtXG4gICAgcGxheShhdXRvZmlsbClcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleWJDdHJsIChlKSB7XG4gICAgY29uc3QgeyBtYWNyb2tleXMgfSA9IHdpbmRvdy5taXRtXG4gICAgaWYgKGUuY3RybEtleSAmJiBlLmtleSA9PT0gJ1NoaWZ0Jykge1xuICAgICAgY3RybCA9ICFjdHJsXG4gICAgICBjb250YWluZXIuc3R5bGUgPSBjb250YWluZXJTdHlsZSArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICB9IGVsc2UgaWYgKGUuY3RybEtleSAmJiBlLmFsdEtleSkge1xuICAgICAgY29uc29sZS5sb2coeyBtYWNybzogYGN0cmwgKyBhbHQgKyAke2UuY29kZX1gIH0pXG4gICAgICBpZiAobWFjcm9rZXlzKSB7XG4gICAgICAgIGxldCBtYWNybyA9IG1hY3Jva2V5c1tlLmNvZGVdXG4gICAgICAgIGlmIChtYWNybykge1xuICAgICAgICAgIG1hY3JvID0gbWFjcm8oKVxuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG1hY3JvKSkge1xuICAgICAgICAgICAgbGV0IG1hY3JvSW5kZXggPSAwXG4gICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgbGV0IHNlbGVjdG9yID0gbWFjcm9bbWFjcm9JbmRleF1cbiAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yLm1hdGNoKC9eICpbPS1dPi8pKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPSBgJHtDc3NTZWxlY3RvckdlbmVyYXRvci5nZXRDc3NTZWxlY3Rvcihkb2N1bWVudC5hY3RpdmVFbGVtZW50KX0gJHtzZWxlY3Rvcn1gXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGxheShbc2VsZWN0b3JdKVxuXG4gICAgICAgICAgICAgIG1hY3JvSW5kZXggKz0gMVxuICAgICAgICAgICAgICBpZiAobWFjcm9JbmRleCA+PSBtYWNyby5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICghd2luZG93LmNocm9tZSkge1xuICAgIHJldHVyblxuICB9XG4gIGlmICghY2hyb21lLnRhYnMpIHtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWJDdHJsKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxuICAgIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGVcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGZuLmFwcGx5KGhpc3RvcnksIGFyZ3VtZW50cylcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KVxuICAgIH1cblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKVxuICAgICAgY29uc3Qgbm9kZXJlZiA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGRcbiAgICAgIGNvbnN0IG5ld05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgY29uc3QgaHRtbCA9ICc8YnV0dG9uIGNsYXNzPVwiYnRuLWF1dG9maWxsXCI+QXV0b2ZpbGw8L2J1dHRvbj4nXG5cbiAgICAgIG5ld05vZGUuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYXV0b2ZpbGwtYnV0dG9uc1wiPjwvc3Bhbj4ke2h0bWx9YFxuICAgICAgbmV3Tm9kZS5jbGFzc05hbWUgPSAnbWl0bSBhdXRvZmlsbC1jb250YWluZXInXG4gICAgICBuZXdOb2RlLnN0eWxlID0gY29udGFpbmVyU3R5bGVcblxuICAgICAgbm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgbm9kZXJlZilcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb250YWluZXIgPSBuZXdOb2RlXG4gICAgICAgIGJ1dHRvbnMgPSBuZXdOb2RlLmNoaWxkcmVuWzBdXG4gICAgICAgIGJ1dHRvbiA9IG5ld05vZGUuY2hpbGRyZW5bMV1cbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBidG5jbGlja1xuICAgICAgICBidXR0b24uc3R5bGUgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXG4gICAgICAgIHVybENoYW5nZShldmVudClcbiAgICAgIH0sIDEpXG4gICAgfSlcbiAgfVxufVxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xuICBsZXQgX3RpbWVvdXRcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcbiAgICB9LCBkZWxheSlcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICByZXR1cm4gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgTXV0YXRpb25PYnNlcnZlciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c19kZWJvdW5jZSA9IHJlcXVpcmUoJy4vX3dzX2RlYm91bmNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX3dzX3JvdXRlID0gcmVxdWlyZSgnLi9fd3Nfcm91dGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3Qgc3Nob3QgPSB7fTsgY29uc3Qgbm9kZXMgPSB7fVxuXG4gIGNvbnN0IHJvdXRlID0gX3dzX3JvdXRlKClcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxuICAgIGZvciAoY29uc3QgaWQgaW4gb2IpIHtcbiAgICAgIGxldCBlbCA9IHt9XG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XG4gICAgICAgIGVsID0ge1xuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxuICAgICAgICAgIHJlbW92ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGlmICh0eXBlb2Ygb2JbaWRdICE9PSAnc3RyaW5nJykge1xuICAgICAgICBlbCA9IHtcbiAgICAgICAgICB0aXRsZTogJ25vY2FwdHVyZScsXG4gICAgICAgICAgaW5zZXJ0OiBmYWxzZSxcbiAgICAgICAgICByZW1vdmU6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFyciA9IG9iW2lkXS5zcGxpdCgnOicpXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcbiAgICAgICAgICBlbFtlXSA9IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF1cbiAgICAgIH1cbiAgICAgIHNzaG90W2lkXSA9IGVsXG4gICAgICBub2Rlc1tpZF0gPSB7XG4gICAgICAgIGluc2VydDogZmFsc2UsXG4gICAgICAgIHJlbW92ZTogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBmbmFtZVxuICBjb25zdCBjYWxsYmFjayA9IF93c19kZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgeyBvYnNlcnZlcjogb2IgfSA9IHJvdXRlLnNjcmVlbnNob3RcbiAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXG4gICAgZm9yIChjb25zdCBpZCBpbiBub2Rlcykge1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoaWQpXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSB0cnVlXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2Ygb2JbaWRdPT09J2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3Qgbm9kID0gZWxbMF0gfHwgZWxcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PT09dW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIG5vZC5fd3NfY291bnQgPSAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2QuX3dzX2NvdW50ICs9IDFcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PDIpIHtcbiAgICAgICAgICAgICAgb2JbaWRdKG5vZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IFxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIW5vZGVzW2lkXS5yZW1vdmUpIHtcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZVxuICAgICAgICAgIGlmIChzc2hvdFtpZF0ucmVtb3ZlKSB7XG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCAxMDApXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKVxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWVcbiAgICB9KVxuICB9KVxufVxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXG5cbmNvbnN0IG5hbm9pZCA9IChzaXplID0gOCkgPT4ge1xuICBsZXQgaWQgPSAnJ1xuICB3aGlsZSAoc2l6ZS0tID4gMCkge1xuICAgIGlkICs9IHQ2NFtNYXRoLnJhbmRvbSgpICogNjQgfCAwXVxuICB9XG4gIHJldHVybiBpZFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyBfd3MgfSA9IHdpbmRvd1xuXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XG4gICAgX3dzLnNlbmQoYGJyb2FkY2FzdCR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4ID0gJycpID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIHJlZ2V4IH1cbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19waW5nKCdIaSEnKVxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX2hlbHAoKVxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XG4gICAgX3dzLnNlbmQoJ19oZWxwe30nKVxuICB9XG5cbiAgLy8gZXg6IHdzX19vcGVuKHt1cmw6J2h0dHBzOi8vZ29vZ2xlLmNvbSd9KVxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XG4gICAgX3dzLnNlbmQoYF9vcGVuJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICB3aW5kb3cud3NfX3NlbmQgPSAoY21kLCBkYXRhLCBoYW5kbGVyKSA9PiB7XG4gICAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKVxuICAgIGNvbnN0IGtleSA9IGAke2NtZH06JHtpZH1gXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSlcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xuICAgICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtrZXldXG4gICAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MgdGltZW91dCEnLCBrZXkpXG4gICAgICB9XG4gICAgfSwgNTAwMClcbiAgICBjb25zdCBwYXJhbXMgPSBgJHtrZXl9JHtKU09OLnN0cmluZ2lmeSh7IGRhdGEgfSl9YFxuICAgIC8vIGlmIChfX2ZsYWdbJ3dzLW1lc3NhZ2UnXSkge1xuICAgIC8vICAgY29uc29sZS5sb2coJ193cy5zZW5kJywgcGFyYW1zKVxuICAgIC8vIH1cbiAgICBfd3Muc2VuZChwYXJhbXMpXG4gIH1cbn1cbi8vIHdzX19zZW5kKCdfcGluZycsICdMT0wnLCB3PT5jb25zb2xlLmxvZygnPnJlc3VsdCcsdykpO1xuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuXG5sZXQgX3RpbWVvdXRcbmxldCBfY3NwID0ge31cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcbiAgICAgIC5yZXBsYWNlKC9eXFwvLywgJycpXG4gICAgICAucmVwbGFjZSgvXFwvL2csICctJylcbiAgICBjb25zdCB7XG4gICAgICBibG9ja2VkVVJJLFxuICAgICAgZGlzcG9zaXRpb24sXG4gICAgICBkb2N1bWVudFVSSSxcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcbiAgICAgIG9yaWdpbmFsUG9saWN5LFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZSxcbiAgICAgIHZpb2xhdGVkRGlyZWN0aXZlXG4gICAgfSA9IGVcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xuICAgICAgX2NzcFt0eXBdID0ge31cbiAgICB9XG4gICAgaWYgKCFfY3NwW3R5cF0uX2dlbmVyYWxfKSB7XG4gICAgICBfY3NwW3R5cF0uX2dlbmVyYWxfID0ge1xuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIGhvc3QsXG4gICAgICAgIHBhdGhcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXVxuICAgIGlmICghX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0pIHtcbiAgICAgIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdID0ge31cbiAgICB9XG5cbiAgICBjb25zdCBfZXJyID0gX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV1cbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcbiAgICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7fVxuICAgIH1cbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YClcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmVcbiAgICBfZXJyW2Jsb2NrZWRVUkldID0ge1xuICAgICAgZGlyZWN0aXZlLFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZVxuICAgIH1cbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gQ1NQOicsIF9jc3ApXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxuICAgICAgLy8gICBob3N0LFxuICAgICAgLy8gICBwYXRoLFxuICAgICAgLy8gICBfY3NwLFxuICAgICAgLy8gfSk7XG4gICAgICBfY3NwID0ge31cbiAgICB9LCA0MDAwKVxuICB9XG5cbiAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5jc3ApIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKVxuICB9XG59XG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG5cbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXG5jb25zdCBfd3NfaW5pdFNvY2tldCA9IHJlcXVpcmUoJy4vX3dzX2luaXQtc29ja2V0JylcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXG5jb25zdCBfd3Nfb2JzZXJ2ZXIgPSByZXF1aXJlKCcuL193c19vYnNlcnZlcicpXG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKVxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgX3dzX3Bvc3RtZXNzYWdlKClcbiAgX3dzX2luaXRTb2NrZXQoKVxuICBfd3Nfc2NyZWVuc2hvdCgpXG4gIF93c19sb2NhdGlvbigpXG4gIF93c19vYnNlcnZlcigpXG4gIF93c19nZW5lcmFsKClcbiAgX3dzX2NzcEVycigpXG59XG5jb25zb2xlLmxvZygnd3MtY2xpZW50IGxvYWRlZC4uLicpIl0sIm5hbWVzIjpbIl93c19kZWJvdW5jZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLHNCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFF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R0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQ3BDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUM1QyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztBQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDM0MsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDO0FBQ3ZCLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUMzQyxJQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sS0FBSztBQUU1QyxJQUFJLE1BQU0sRUFBRSxHQUFHLE1BQU0sR0FBRTtBQUN2QixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDO0FBQzlCLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLEtBQUssQ0FBQyxJQUFJLEVB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
