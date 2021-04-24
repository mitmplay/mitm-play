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
    _saveTags ({ routes }) {
      if (!location.origin.match('chrome-extension')) {
        window.mitm.routes = routes;
      }
    },
    // ex: ws__
    _files ({ data, typ }) {
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
      const { href } = location;
      const { _macros_, macros } = window.mitm;
      for (const key in macros) {
        const { path, msg } = toRegex(key);
        if (href.match(path)) {
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
      const _frame = window['xplay-frame'];
      console.log(lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2));
      window.ws__send('autofill', { autofill, browser, _page, _frame });
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
                const activeElement = CssSelectorGenerator.getCssSelector(document.activeElement);
                selector = `${activeElement} ${selector}`;
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
        observed();
      }, 0);
    });
  }

  const {location} = document;
  let oldHref = location.href;

  function compareHref() {
    console.log('DOM mutated!');
    if (oldHref != location.href) {
      window.dispatchEvent(event);
      oldHref = location.href;
    }
  }

  const fn = history.pushState;
  history.pushState = function () {
    fn.apply(history, arguments);
    compareHref();
  };

  const observer = new MutationObserver(compareHref);
  function observed() {
    observer.disconnect();
    const body = document.querySelector("body");
    observer.observe(body, {childList: true, subtree: true});
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
  let route = window.mitm.routes[namespace];
  const {_subns: s} = route._childns;
  if (s && mitm.routes[s]) {
    route= mitm.routes[s];
  }
  return route
};

/* global location, MutationObserver */

var _ws_observer = () => {
  if (location.origin.match('chrome-extension')) {
    return
  }
  const { hostname: host } = location;
  const sshot = {};
  const nodes = {};

  let route = _ws_route();
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

  let ob;
  let fname;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const callback = function () {
    if (route && route.screenshot) {
      ob = route.screenshot.observer;
    }
    const _page = window['xplay-page'];
    for (const id in nodes) {
      const el = document.body.querySelectorAll(id);
      if (el.length) {
        if (!nodes[id].insert) {
          nodes[id].insert = true;
          if (nodes[id].remove !== undefined) {
            nodes[id].remove = false;
          }
          if (ob && typeof ob[id]==='function') {
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
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(debounce(callback, 100));
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
    const { __flag } = window.mitm;
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
    if (__flag['ws-message']) {
      console.log('_ws.send', cmd);
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19yb3V0ZS5qcyIsIl9zcmMvX3dzX29ic2VydmVyLmpzIiwiX3NyYy9fd3NfZ2VuZXJhbC5qcyIsIl9zcmMvX3dzX2NzcC1lcnIuanMiLCJfc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYD4+PiBQb3N0bWVzc2FnZTogJHtldmVudC5vcmlnaW59ID0+IGh0dHBzOi8vJHtsb2NhdGlvbi5ob3N0fWAsIGV2ZW50LmRhdGEpXHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxyXG5cclxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XHJcbiAgLy8gICBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xyXG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcclxuICAvLyAgIH1cclxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xyXG4gIC8vIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgd2luZG93UmVmXHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGV4OiB3c19faGVscCgpXHJcbiAgICBfaGVscCAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX3BpbmcoXCJ0aGVyZVwiKVxyXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxyXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnXHJcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcclxuICAgICAgd2luZG93UmVmLmJsdXIoKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcclxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgeyBxLCBjc3MgfSA9IGRhdGFcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxyXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcclxuICAgICAgKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfc2F2ZVRhZ3MgKHsgcm91dGVzIH0pIHtcclxuICAgICAgaWYgKCFsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xyXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xyXG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICBjb25zb2xlLndhcm4oYHJlY2VpdmUgYnJvZGNhc3QgJHt0eXB9YClcclxuICAgICAgLyoqXHJcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxyXG4gICAgICAgKi9cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0gKyAnJylcclxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSlcclxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpXHJcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xyXG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XHJcbiAgICBpZiAobXNnLmxlbmd0aCA+IDQwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLCA0MCkpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLylcclxuICBpZiAoYXJyKSB7XHJcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHR5cGVvZiAoanNvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2NtZF0pIHtcclxuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxyXG4gICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKVxyXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xyXG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgaWZybVxyXG4gIHRyeSB7XHJcbiAgICBpZnJtID0gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3BcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZVxyXG4gIH1cclxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcclxufVxyXG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXHJcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXHJcbiAgICAgICAgY29uc29sZS53YXJuKHdpbmRvdy5fd3NfY29ubmVjdFtrZXldICsgJycpXHJcbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnd3M6IG9wZW4gY29ubmVjdGlvbicpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS50aW1lRW5kKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IHRydWVcclxuXHJcbiAgICBzZXRUaW1lb3V0KHdzX3NlbmQsIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignUkVUUlkuLi4uLi4uLi4uJylcclxuICAgICAgICB3c19zZW5kKClcclxuICAgICAgfVxyXG4gICAgfSwgMTApIC8vIG1pbmltaXplIGludGVybWl0dGVuICAgICBcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ3dzOiBjbG9zZSBjb25uZWN0aW9uJylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgIC8vICAgY29uc29sZS5sb2coJ29uLW1lc3NhZ2U6JywgZS5kYXRhKVxyXG4gICAgLy8gfVxyXG4gICAgX3dzX21zZ1BhcnNlcihldmVudCwgZXZlbnQuZGF0YSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHVybCA9IGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKVxyXG4gIGNvbnNvbGUudGltZSgnd3MnKVxyXG4gIHdpbmRvdy5fd3MgPSB3c1xyXG5cclxuICB3cy5vbm9wZW4gPSBvbm9wZW5cclxuICB3cy5vbmNsb3NlID0gb25jbG9zZVxyXG4gIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3dzOiBpbml0IGNvbm5lY3Rpb24nKVxyXG4gIH1cclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vLCAnW14uXSonKSkpKSB7XHJcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbmFtZXNwYWNlXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXHJcbiAgfVt2ZW5kb3JdXHJcbiAgcmV0dXJuIGJyb3dzZXJcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIG1pdG0gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxyXG4gICAgICBwYXJhbXMuZm5hbWUgPSBmbmFtZT09PSd+JyA/ICd+XycgOiBmbmFtZVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpXHJcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICAgICAgLy8gZGVsYXkgYWN0aW9uIHRvIGZpbmlzaCBzY3JlZW5zaG90XHJcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCc+Pj4gY2xpY2tlZCcpO1xyXG4gICAgICAgICAgYWN0ID0gd2luZG93Lm1pdG0uc2NyZWVuc2hvdFxyXG4gICAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdC5ub2RlID0gdW5kZWZpbmVkXHJcbiAgICAgICAgICBhY3QuY2xpY2soKVxyXG4gICAgICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgICAgfSwgZGVsYXkpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY29udGFpbmVyU3R5bGUgPSAncG9zaXRpb246IGZpeGVkO3otaW5kZXg6IDk5OTk7dG9wOiA4cHg7cmlnaHQ6IDVweDsnXHJcbiAgY29uc3QgYnV0dG9uU3R5bGUgPSAnYm9yZGVyOiBub25lO2JvcmRlci1yYWRpdXM6IDE1cHg7Zm9udC1zaXplOiAxMHB4OydcclxuICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXHJcbiAgbGV0IGNvbnRhaW5lciA9IHt9XHJcbiAgbGV0IGN0cmwgPSBmYWxzZVxyXG4gIGxldCBidXR0b24gPSB7fVxyXG4gIGxldCBidXR0b25zXHJcbiAgbGV0IGludGVydklkXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHBhdGhNc2cpIHtcclxuICAgIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgICByZXR1cm4geyBwYXRoLCBtc2cgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2V0QnV0dG9ucyAoKSB7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2J1dHRvbnMpIHtcclxuICAgICAgY29uc3QgeyBhdXRvYnV0dG9ucyB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gYXV0b2J1dHRvbnMpIHtcclxuICAgICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXHJcbiAgICAgICAgICBjb25zdCBiciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxyXG4gICAgICAgICAgY29uc3QgW2NhcHRpb24sIGNvbG9yXSA9IGtleS5zcGxpdCgnfCcpXHJcbiAgICAgICAgICBjb25zdCBldiA9IGF1dG9idXR0b25zW2tleV1cclxuICAgICAgICAgIGJ0bi5vbmNsaWNrID0gZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IGV2KGUpXHJcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkoYXJyKSAmJiBwbGF5KGFycilcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJ0bi5pbm5lclRleHQgPSBjYXB0aW9uXHJcbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJ0bilcclxuICAgICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnIpXHJcbiAgICAgICAgICBici5pbm5lckhUTUwgPSAnJm5ic3A7J1xyXG4gICAgICAgICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKVxyXG4gICAgICAgIH1cclxuICAgICAgfSwgMClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVybENoYW5nZSAoZXZlbnQpIHtcclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9maWxsKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvZmlsbFxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydklkKVxyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ludGVydmFsXHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2J1dHRvbnMpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9idXR0b25zXHJcbiAgICAgIGJ1dHRvbnMuaW5uZXJIVE1MID0gJydcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5tYWNyb2tleXMpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLm1hY3Jva2V5c1xyXG4gICAgfVxyXG4gICAgaWYgKG5hbWVzcGFjZSkge1xyXG4gICAgICBjb25zdCB7IGhyZWYgfSA9IGxvY2F0aW9uXHJcbiAgICAgIGNvbnN0IHsgX21hY3Jvc18sIG1hY3JvcyB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWFjcm9zKSB7XHJcbiAgICAgICAgY29uc3QgeyBwYXRoLCBtc2cgfSA9IHRvUmVnZXgoa2V5KVxyXG4gICAgICAgIGlmIChocmVmLm1hdGNoKHBhdGgpKSB7XHJcbiAgICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbXNnIHx8ICdBdXRvZmlsbCdcclxuICAgICAgICAgIF9tYWNyb3NfICYmIF9tYWNyb3NfKClcclxuICAgICAgICAgIG1hY3Jvc1trZXldKClcclxuICAgICAgICAgIHNldEJ1dHRvbnMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbmVyLnN0eWxlID0gY29udGFpbmVyU3R5bGVcclxuICAgIGNvbnN0IHZpc2libGUgPSAod2luZG93Lm1pdG0uYXV0b2ZpbGwpXHJcbiAgICBidXR0b24uc3R5bGUgPSBidXR0b25TdHlsZSArICh2aXNpYmxlID8gJ2JhY2tncm91bmQtY29sb3I6IGF6dXJlOycgOiAnZGlzcGxheTogbm9uZTsnKVxyXG4gICAgaWYgKHR5cGVvZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBpbnRlcnZJZCA9IHNldEludGVydmFsKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCwgNTAwKVxyXG4gICAgfVxyXG4gICAgY3RybCA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwbGF5IChhdXRvZmlsbCkge1xyXG4gICAgaWYgKGF1dG9maWxsKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgKGF1dG9maWxsKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcclxuICAgICAgY29uc3QgbGVudGggPSBhdXRvZmlsbC5sZW5ndGhcclxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgICBjb25zdCBfZnJhbWUgPSB3aW5kb3dbJ3hwbGF5LWZyYW1lJ11cclxuICAgICAgY29uc29sZS5sb2cobGVudGggPT09IDEgPyBgICAke2F1dG9maWxsfWAgOiBKU09OLnN0cmluZ2lmeShhdXRvZmlsbCwgbnVsbCwgMikpXHJcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCB7IGF1dG9maWxsLCBicm93c2VyLCBfcGFnZSwgX2ZyYW1lIH0pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBidG5jbGljayAoZSkge1xyXG4gICAgY29uc3QgeyBhdXRvZmlsbCB9ID0gd2luZG93Lm1pdG1cclxuICAgIHBsYXkoYXV0b2ZpbGwpXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBrZXliQ3RybCAoZSkge1xyXG4gICAgY29uc3QgeyBtYWNyb2tleXMgfSA9IHdpbmRvdy5taXRtXHJcbiAgICBpZiAoZS5jdHJsS2V5ICYmIGUua2V5ID09PSAnU2hpZnQnKSB7XHJcbiAgICAgIGN0cmwgPSAhY3RybFxyXG4gICAgICBjb250YWluZXIuc3R5bGUgPSBjb250YWluZXJTdHlsZSArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5ICYmIGUuYWx0S2V5KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKHsgbWFjcm86IGBjdHJsICsgYWx0ICsgJHtlLmNvZGV9YCB9KVxyXG4gICAgICBpZiAobWFjcm9rZXlzKSB7XHJcbiAgICAgICAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2UuY29kZV1cclxuICAgICAgICBpZiAobWFjcm8pIHtcclxuICAgICAgICAgIG1hY3JvID0gbWFjcm8oKVxyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobWFjcm8pKSB7XHJcbiAgICAgICAgICAgIGxldCBtYWNyb0luZGV4ID0gMFxyXG4gICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgc2VsZWN0b3IgPSBtYWNyb1ttYWNyb0luZGV4XVxyXG4gICAgICAgICAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXiAqWz0tXT4vKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9IGAke2FjdGl2ZUVsZW1lbnR9ICR7c2VsZWN0b3J9YFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBwbGF5KFtzZWxlY3Rvcl0pXHJcblxyXG4gICAgICAgICAgICAgIG1hY3JvSW5kZXggKz0gMVxyXG4gICAgICAgICAgICAgIGlmIChtYWNyb0luZGV4ID49IG1hY3JvLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDEwMClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgaWYgKCF3aW5kb3cuY2hyb21lKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgaWYgKCFjaHJvbWUudGFicykge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpXHJcbiAgICAgIGNvbnN0IG5vZGVyZWYgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkXHJcbiAgICAgIGNvbnN0IG5ld05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICBjb25zdCBodG1sID0gJzxidXR0b24gY2xhc3M9XCJidG4tYXV0b2ZpbGxcIj5BdXRvZmlsbDwvYnV0dG9uPidcclxuXHJcbiAgICAgIG5ld05vZGUuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYXV0b2ZpbGwtYnV0dG9uc1wiPjwvc3Bhbj4ke2h0bWx9YFxyXG4gICAgICBuZXdOb2RlLmNsYXNzTmFtZSA9ICdtaXRtIGF1dG9maWxsLWNvbnRhaW5lcidcclxuICAgICAgbmV3Tm9kZS5zdHlsZSA9IGNvbnRhaW5lclN0eWxlXHJcblxyXG4gICAgICBub2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCBub2RlcmVmKVxyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBjb250YWluZXIgPSBuZXdOb2RlXHJcbiAgICAgICAgYnV0dG9ucyA9IG5ld05vZGUuY2hpbGRyZW5bMF1cclxuICAgICAgICBidXR0b24gPSBuZXdOb2RlLmNoaWxkcmVuWzFdXHJcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBidG5jbGlja1xyXG4gICAgICAgIGJ1dHRvbi5zdHlsZSA9IGAke2J1dHRvblN0eWxlfWJhY2tncm91bmQtY29sb3I6IGF6dXJlO2BcclxuICAgICAgICB1cmxDaGFuZ2UoZXZlbnQpXHJcbiAgICAgICAgb2JzZXJ2ZWQoKVxyXG4gICAgICB9LCAwKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxyXG4gIGxldCBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxyXG5cclxuICBmdW5jdGlvbiBjb21wYXJlSHJlZigpIHtcclxuICAgIGNvbnNvbGUubG9nKCdET00gbXV0YXRlZCEnKVxyXG4gICAgaWYgKG9sZEhyZWYgIT0gbG9jYXRpb24uaHJlZikge1xyXG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudClcclxuICAgICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGVcclxuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZuLmFwcGx5KGhpc3RvcnksIGFyZ3VtZW50cylcclxuICAgIGNvbXBhcmVIcmVmKClcclxuICB9XHJcblxyXG4gIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY29tcGFyZUhyZWYpO1xyXG4gIGZ1bmN0aW9uIG9ic2VydmVkKCkge1xyXG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXHJcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImJvZHlcIilcclxuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge2NoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZX0pXHJcbiAgfVxyXG59XHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlIChmbiwgZGVsYXkgPSA1MDApIHtcclxuICBsZXQgX3RpbWVvdXRcclxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXHJcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXHJcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXHJcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcclxuICAgIH0sIGRlbGF5KVxyXG4gIH1cclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlXHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGxldCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXHJcbiAgY29uc3Qge19zdWJuczogc30gPSByb3V0ZS5fY2hpbGRuc1xyXG4gIGlmIChzICYmIG1pdG0ucm91dGVzW3NdKSB7XHJcbiAgICByb3V0ZT0gbWl0bS5yb3V0ZXNbc11cclxuICB9XHJcbiAgcmV0dXJuIHJvdXRlXHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBNdXRhdGlvbk9ic2VydmVyICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX3dzX3JvdXRlID0gcmVxdWlyZSgnLi9fd3Nfcm91dGUnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgaWYgKGxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBjb25zdCBzc2hvdCA9IHt9XHJcbiAgY29uc3Qgbm9kZXMgPSB7fVxyXG5cclxuICBsZXQgcm91dGUgPSBfd3Nfcm91dGUoKVxyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBvYikge1xyXG4gICAgICBsZXQgZWwgPSB7fVxyXG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGlmICh0eXBlb2Ygb2JbaWRdICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGVsID0ge1xyXG4gICAgICAgICAgdGl0bGU6ICdub2NhcHR1cmUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICAgIHJlbW92ZTogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gb2JbaWRdLnNwbGl0KCc6JylcclxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XHJcbiAgICAgICAgICBlbFtlXSA9IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWxcclxuICAgICAgbm9kZXNbaWRdID0ge1xyXG4gICAgICAgIGluc2VydDogZmFsc2UsXHJcbiAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBvYlxyXG4gIGxldCBmbmFtZVxyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcclxuICBjb25zdCBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIG9iID0gcm91dGUuc2NyZWVuc2hvdC5vYnNlcnZlclxyXG4gICAgfVxyXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBub2Rlcykge1xyXG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChpZClcclxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWVcclxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAob2IgJiYgdHlwZW9mIG9iW2lkXT09PSdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kID0gZWxbMF0gfHwgZWxcclxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ9PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBub2QuX3dzX2NvdW50ID0gMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZC5fd3NfY291bnQgKz0gMVxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudDwyKSB7XHJcbiAgICAgICAgICAgICAgb2JbaWRdKG5vZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBcclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgICAgICAgICBmbmFtZSA9IGAke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YFxyXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZVxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgXHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKF93c19kZWJvdW5jZShjYWxsYmFjaywgMTAwKSlcclxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWVcclxuICAgIH0pXHJcbiAgfSkgIFxyXG59XHJcbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJ1xyXG5cclxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XHJcbiAgbGV0IGlkID0gJydcclxuICB3aGlsZSAoc2l6ZS0tID4gMCkge1xyXG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXHJcbiAgfVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7IF93cyB9ID0gd2luZG93XHJcblxyXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19icm9hZGNhc3QgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XHJcbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4ID0gJycpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxyXG4gICAgX3dzLnNlbmQoYGVtaXRwYWdlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX3N0eWxlKHtcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn0pXHJcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBfc3R5bGUke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fcGluZygnSGkhJylcclxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19oZWxwKClcclxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XHJcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXHJcbiAgd2luZG93LndzX19vcGVuID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XHJcbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcclxuICAgIGNvbnN0IHsgX19mbGFnIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKVxyXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcclxuICAgIHdpbmRvdy5fd3NfcXVldWVba2V5XSA9IGhhbmRsZXIgfHwgKHcgPT4ge30pXHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2tleV0pIHtcclxuICAgICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtrZXldXHJcbiAgICAgICAgY29uc29sZS5sb2coJz4+PiB3cyB0aW1lb3V0IScsIGtleSlcclxuICAgICAgfVxyXG4gICAgfSwgNTAwMClcclxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXHJcbiAgICBpZiAoX19mbGFnWyd3cy1tZXNzYWdlJ10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ193cy5zZW5kJywgY21kKVxyXG4gICAgfVxyXG4gICAgX3dzLnNlbmQocGFyYW1zKVxyXG4gIH1cclxufVxyXG4vLyB3c19fc2VuZCgnX3BpbmcnLCAnTE9MJywgdz0+Y29uc29sZS5sb2coJz5yZXN1bHQnLHcpKTtcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuXHJcbmxldCBfdGltZW91dFxyXG5sZXQgX2NzcCA9IHt9XHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNzcEVycm9yID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXHJcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICAgIGNvbnN0IHBhdGggPSBsb2NhdGlvbi5wYXRobmFtZVxyXG4gICAgICAucmVwbGFjZSgvXlxcLy8sICcnKVxyXG4gICAgICAucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgIGNvbnN0IHtcclxuICAgICAgYmxvY2tlZFVSSSxcclxuICAgICAgZGlzcG9zaXRpb24sXHJcbiAgICAgIGRvY3VtZW50VVJJLFxyXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXHJcbiAgICAgIG9yaWdpbmFsUG9saWN5LFxyXG4gICAgICB0aW1lU3RhbXAsXHJcbiAgICAgIHR5cGUsXHJcbiAgICAgIHZpb2xhdGVkRGlyZWN0aXZlXHJcbiAgICB9ID0gZVxyXG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXHJcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xyXG4gICAgICBfY3NwW3R5cF0gPSB7fVxyXG4gICAgfVxyXG4gICAgaWYgKCFfY3NwW3R5cF0uX2dlbmVyYWxfKSB7XHJcbiAgICAgIF9jc3BbdHlwXS5fZ2VuZXJhbF8gPSB7XHJcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcclxuICAgICAgICBuYW1lc3BhY2UsXHJcbiAgICAgICAgaG9zdCxcclxuICAgICAgICBwYXRoXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF1cclxuICAgIGlmICghX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0pIHtcclxuICAgICAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0gPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IF9lcnIgPSBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXVxyXG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XHJcbiAgICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7fVxyXG4gICAgfVxyXG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApXHJcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmVcclxuICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7XHJcbiAgICAgIGRpcmVjdGl2ZSxcclxuICAgICAgdGltZVN0YW1wLFxyXG4gICAgICB0eXBlXHJcbiAgICB9XHJcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXHJcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IENTUDonLCBfY3NwKVxyXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcclxuICAgICAgLy8gICBuYW1lc3BhY2UsXHJcbiAgICAgIC8vICAgaG9zdCxcclxuICAgICAgLy8gICBwYXRoLFxyXG4gICAgICAvLyAgIF9jc3AsXHJcbiAgICAgIC8vIH0pO1xyXG4gICAgICBfY3NwID0ge31cclxuICAgIH0sIDQwMDApXHJcbiAgfVxyXG5cclxuICBpZiAod2luZG93Lm1pdG0uY2xpZW50LmNzcCkge1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcilcclxuICB9XHJcbn1cclxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcclxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxyXG4vLyB2aW9sYXRlZERpcmVjdGl2ZTogXCJpbWctc3JjXCJcclxuXHJcbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxyXG4vLyBlZmZlY3RpdmVEaXJlY3RpdmU6IFwiaW1nLXNyY1wiXHJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcclxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcclxuLy8gdHlwZTogXCJzZWN1cml0eXBvbGljeXZpb2xhdGlvblwiXHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXHJcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKVxyXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxyXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXHJcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJylcclxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcclxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgX3dzX3Bvc3RtZXNzYWdlKClcclxuICBfd3NfaW5pdFNvY2tldCgpXHJcbiAgX3dzX3NjcmVlbnNob3QoKVxyXG4gIF93c19sb2NhdGlvbigpXHJcbiAgX3dzX29ic2VydmVyKClcclxuICBfd3NfZ2VuZXJhbCgpXHJcbiAgX3dzX2NzcEVycigpXHJcbn1cclxuY29uc29sZS5sb2coJ3dzLWNsaWVudCBsb2FkZWQuLi4nKSJdLCJuYW1lcyI6WyJfd3NfZGVib3VuY2UiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQSxzQkFBaUIsTUFBTTtBQUN2QixFQUFFLFNBQVMsY0FBYyxFQUFFLEtBQUssRUFBRTtBQUNsQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0FBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUM7QUFDN0YsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBQztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDNUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFDOUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQzNDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU07QUFDMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQztBQUN2QixJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztBQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDM0MsSUFBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDNUMsSUFBSSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUk7QUFDbEMsSUFBSSxNQUFNLEVBQUUsR0FBRyxNQUFNLEdBQUU7QUFDdkIsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztBQUM5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
