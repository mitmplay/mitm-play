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
          act = window.mitm.screenshot;
          if (act) {
            act.click();
            act = undefined;  
          } else {
            console.log('delay action undefined');
          }
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
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;cursor: pointer;';
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

  let debunk;
  function setButtons () {
    if (window.mitm.autobuttons) {
      const { autobuttons } = window.mitm;
      buttons.innerHTML = '';
      if (debunk) {
        clearTimeout(debunk);
        debunk = undefined;
      }
      debunk = setTimeout(() => {
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
    }
    if (window.mitm.macrokeys) {
      delete window.mitm.macrokeys;
    }
    if (namespace) {
      const { href, origin } = location;
      const _href = href.replace(origin, '');
      const { _macros_, macros } = window.mitm;
      for (const key in macros) {
        const { path, msg } = toRegex(key);
        if (_href.match(path)) {
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
    // console.log('DOM mutated!')
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19yb3V0ZS5qcyIsIl9zcmMvX3dzX29ic2VydmVyLmpzIiwiX3NyYy9fd3NfZ2VuZXJhbC5qcyIsIl9zcmMvX3dzX2NzcC1lcnIuanMiLCJfc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYD4+PiBQb3N0bWVzc2FnZTogJHtldmVudC5vcmlnaW59ID0+IGh0dHBzOi8vJHtsb2NhdGlvbi5ob3N0fWAsIGV2ZW50LmRhdGEpXHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxyXG5cclxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XHJcbiAgLy8gICBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xyXG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcclxuICAvLyAgIH1cclxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xyXG4gIC8vIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgd2luZG93UmVmXHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGV4OiB3c19faGVscCgpXHJcbiAgICBfaGVscCAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX3BpbmcoXCJ0aGVyZVwiKVxyXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxyXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnXHJcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcclxuICAgICAgd2luZG93UmVmLmJsdXIoKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcclxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgeyBxLCBjc3MgfSA9IGRhdGFcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxyXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcclxuICAgICAgKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfc2F2ZVRhZ3MgKHsgcm91dGVzIH0pIHtcclxuICAgICAgaWYgKCFsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xyXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xyXG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICBjb25zb2xlLndhcm4oYHJlY2VpdmUgYnJvZGNhc3QgJHt0eXB9YClcclxuICAgICAgLyoqXHJcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxyXG4gICAgICAgKi9cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0gKyAnJylcclxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSlcclxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpXHJcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xyXG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XHJcbiAgICBpZiAobXNnLmxlbmd0aCA+IDQwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLCA0MCkpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLylcclxuICBpZiAoYXJyKSB7XHJcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHR5cGVvZiAoanNvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2NtZF0pIHtcclxuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxyXG4gICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKVxyXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xyXG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgaWZybVxyXG4gIHRyeSB7XHJcbiAgICBpZnJtID0gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3BcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZVxyXG4gIH1cclxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcclxufVxyXG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXHJcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXHJcbiAgICAgICAgY29uc29sZS53YXJuKHdpbmRvdy5fd3NfY29ubmVjdFtrZXldICsgJycpXHJcbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnd3M6IG9wZW4gY29ubmVjdGlvbicpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS50aW1lRW5kKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IHRydWVcclxuXHJcbiAgICBzZXRUaW1lb3V0KHdzX3NlbmQsIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignUkVUUlkuLi4uLi4uLi4uJylcclxuICAgICAgICB3c19zZW5kKClcclxuICAgICAgfVxyXG4gICAgfSwgMTApIC8vIG1pbmltaXplIGludGVybWl0dGVuICAgICBcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ3dzOiBjbG9zZSBjb25uZWN0aW9uJylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgIC8vICAgY29uc29sZS5sb2coJ29uLW1lc3NhZ2U6JywgZS5kYXRhKVxyXG4gICAgLy8gfVxyXG4gICAgX3dzX21zZ1BhcnNlcihldmVudCwgZXZlbnQuZGF0YSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHVybCA9IGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKVxyXG4gIGNvbnNvbGUudGltZSgnd3MnKVxyXG4gIHdpbmRvdy5fd3MgPSB3c1xyXG5cclxuICB3cy5vbm9wZW4gPSBvbm9wZW5cclxuICB3cy5vbmNsb3NlID0gb25jbG9zZVxyXG4gIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3dzOiBpbml0IGNvbm5lY3Rpb24nKVxyXG4gIH1cclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vLCAnW14uXSonKSkpKSB7XHJcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbmFtZXNwYWNlXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXHJcbiAgfVt2ZW5kb3JdXHJcbiAgcmV0dXJuIGJyb3dzZXJcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIG1pdG0gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxyXG4gICAgICBwYXJhbXMuZm5hbWUgPSBmbmFtZT09PSd+JyA/ICd+XycgOiBmbmFtZVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpXHJcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICAgICAgLy8gZGVsYXkgYWN0aW9uIHRvIGZpbmlzaCBzY3JlZW5zaG90XHJcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcclxuICAgICAgICAgIGlmIChhY3QpIHtcclxuICAgICAgICAgICAgYWN0LmNsaWNrKClcclxuICAgICAgICAgICAgYWN0ID0gdW5kZWZpbmVkICBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkZWxheSBhY3Rpb24gdW5kZWZpbmVkJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZGVsYXkpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY29udGFpbmVyU3R5bGUgPSAncG9zaXRpb246IGZpeGVkO3otaW5kZXg6IDk5OTk7dG9wOiA4cHg7cmlnaHQ6IDVweDsnXHJcbiAgY29uc3QgYnV0dG9uU3R5bGUgPSAnYm9yZGVyOiBub25lO2JvcmRlci1yYWRpdXM6IDE1cHg7Zm9udC1zaXplOiAxMHB4O2N1cnNvcjogcG9pbnRlcjsnXHJcbiAgY29uc3QgZXZlbnQgPSBuZXcgRXZlbnQoJ3VybGNoYW5nZWQnKVxyXG4gIGxldCBjb250YWluZXIgPSB7fVxyXG4gIGxldCBjdHJsID0gZmFsc2VcclxuICBsZXQgYnV0dG9uID0ge31cclxuICBsZXQgYnV0dG9uc1xyXG4gIGxldCBpbnRlcnZJZFxyXG5cclxuICBmdW5jdGlvbiB0b1JlZ2V4IChwYXRoTXNnKSB7XHJcbiAgICBsZXQgW3BhdGgsIG1zZ10gPSBwYXRoTXNnLnNwbGl0KCc9PicpLm1hcChpdGVtID0+IGl0ZW0udHJpbSgpKVxyXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKVxyXG4gICAgcmV0dXJuIHsgcGF0aCwgbXNnIH1cclxuICB9XHJcblxyXG4gIGxldCBkZWJ1bmtcclxuICBmdW5jdGlvbiBzZXRCdXR0b25zICgpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvYnV0dG9ucykge1xyXG4gICAgICBjb25zdCB7IGF1dG9idXR0b25zIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICBidXR0b25zLmlubmVySFRNTCA9ICcnXHJcbiAgICAgIGlmIChkZWJ1bmspIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQoZGVidW5rKVxyXG4gICAgICAgIGRlYnVuayA9IHVuZGVmaW5lZFxyXG4gICAgICB9XHJcbiAgICAgIGRlYnVuayA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGF1dG9idXR0b25zKSB7XHJcbiAgICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKVxyXG4gICAgICAgICAgY29uc3QgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcclxuICAgICAgICAgIGNvbnN0IFtjYXB0aW9uLCBjb2xvcl0gPSBrZXkuc3BsaXQoJ3wnKVxyXG4gICAgICAgICAgY29uc3QgZXYgPSBhdXRvYnV0dG9uc1trZXldXHJcbiAgICAgICAgICBidG4ub25jbGljayA9IGUgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBhcnIgPSBldihlKVxyXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KGFycikgJiYgcGxheShhcnIpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBidG4uaW5uZXJUZXh0ID0gY2FwdGlvblxyXG4gICAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidG4pXHJcbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJyKVxyXG4gICAgICAgICAgYnIuaW5uZXJIVE1MID0gJyZuYnNwOydcclxuICAgICAgICAgIGJ0bi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKGNvbG9yID8gYGJhY2tncm91bmQ6ICR7Y29sb3J9O2AgOiAnJylcclxuICAgICAgICB9XHJcbiAgICAgIH0sIDApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cmxDaGFuZ2UgKGV2ZW50KSB7XHJcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ZpbGxcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZJZClcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbFxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9idXR0b25zKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvYnV0dG9uc1xyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLm1hY3Jva2V5cykge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0ubWFjcm9rZXlzXHJcbiAgICB9XHJcbiAgICBpZiAobmFtZXNwYWNlKSB7XHJcbiAgICAgIGNvbnN0IHsgaHJlZiwgb3JpZ2luIH0gPSBsb2NhdGlvblxyXG4gICAgICBjb25zdCBfaHJlZiA9IGhyZWYucmVwbGFjZShvcmlnaW4sICcnKVxyXG4gICAgICBjb25zdCB7IF9tYWNyb3NfLCBtYWNyb3MgfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIG1hY3Jvcykge1xyXG4gICAgICAgIGNvbnN0IHsgcGF0aCwgbXNnIH0gPSB0b1JlZ2V4KGtleSlcclxuICAgICAgICBpZiAoX2hyZWYubWF0Y2gocGF0aCkpIHtcclxuICAgICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBtc2cgfHwgJ0F1dG9maWxsJ1xyXG4gICAgICAgICAgX21hY3Jvc18gJiYgX21hY3Jvc18oKVxyXG4gICAgICAgICAgbWFjcm9zW2tleV0oKVxyXG4gICAgICAgICAgc2V0QnV0dG9ucygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb250YWluZXIuc3R5bGUgPSBjb250YWluZXJTdHlsZVxyXG4gICAgY29uc3QgdmlzaWJsZSA9ICh3aW5kb3cubWl0bS5hdXRvZmlsbClcclxuICAgIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGludGVydklkID0gc2V0SW50ZXJ2YWwod2luZG93Lm1pdG0uYXV0b2ludGVydmFsLCA1MDApXHJcbiAgICB9XHJcbiAgICBjdHJsID0gZmFsc2VcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XHJcbiAgICBpZiAoYXV0b2ZpbGwpIHtcclxuICAgICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gICAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxyXG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxyXG4gICAgICBjb25zb2xlLmxvZyhsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKSlcclxuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIHsgYXV0b2ZpbGwsIGJyb3dzZXIsIF9wYWdlLCBfZnJhbWUgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJ0bmNsaWNrIChlKSB7XHJcbiAgICBjb25zdCB7IGF1dG9maWxsIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgcGxheShhdXRvZmlsbClcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGtleWJDdHJsIChlKSB7XHJcbiAgICBjb25zdCB7IG1hY3Jva2V5cyB9ID0gd2luZG93Lm1pdG1cclxuICAgIGlmIChlLmN0cmxLZXkgJiYgZS5rZXkgPT09ICdTaGlmdCcpIHtcclxuICAgICAgY3RybCA9ICFjdHJsXHJcbiAgICAgIGNvbnRhaW5lci5zdHlsZSA9IGNvbnRhaW5lclN0eWxlICsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKVxyXG4gICAgfSBlbHNlIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcclxuICAgICAgY29uc29sZS5sb2coeyBtYWNybzogYGN0cmwgKyBhbHQgKyAke2UuY29kZX1gIH0pXHJcbiAgICAgIGlmIChtYWNyb2tleXMpIHtcclxuICAgICAgICBsZXQgbWFjcm8gPSBtYWNyb2tleXNbZS5jb2RlXVxyXG4gICAgICAgIGlmIChtYWNybykge1xyXG4gICAgICAgICAgbWFjcm8gPSBtYWNybygpXHJcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcclxuICAgICAgICAgICAgbGV0IG1hY3JvSW5kZXggPSAwXHJcbiAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXHJcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yLm1hdGNoKC9eICpbPS1dPi8pKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gQ3NzU2VsZWN0b3JHZW5lcmF0b3IuZ2V0Q3NzU2VsZWN0b3IoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yID0gYCR7YWN0aXZlRWxlbWVudH0gJHtzZWxlY3Rvcn1gXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHBsYXkoW3NlbGVjdG9yXSlcclxuXHJcbiAgICAgICAgICAgICAgbWFjcm9JbmRleCArPSAxXHJcbiAgICAgICAgICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgMTAwKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoIXdpbmRvdy5jaHJvbWUpIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuICBpZiAoIWNocm9tZS50YWJzKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWJDdHJsKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpXHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJylcclxuICAgICAgY29uc3Qgbm9kZXJlZiA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGRcclxuICAgICAgY29uc3QgbmV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgIGNvbnN0IGh0bWwgPSAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hdXRvZmlsbFwiPkF1dG9maWxsPC9idXR0b24+J1xyXG5cclxuICAgICAgbmV3Tm9kZS5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJhdXRvZmlsbC1idXR0b25zXCI+PC9zcGFuPiR7aHRtbH1gXHJcbiAgICAgIG5ld05vZGUuY2xhc3NOYW1lID0gJ21pdG0gYXV0b2ZpbGwtY29udGFpbmVyJ1xyXG4gICAgICBuZXdOb2RlLnN0eWxlID0gY29udGFpbmVyU3R5bGVcclxuXHJcbiAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIG5vZGVyZWYpXHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGNvbnRhaW5lciA9IG5ld05vZGVcclxuICAgICAgICBidXR0b25zID0gbmV3Tm9kZS5jaGlsZHJlblswXVxyXG4gICAgICAgIGJ1dHRvbiA9IG5ld05vZGUuY2hpbGRyZW5bMV1cclxuICAgICAgICBidXR0b24ub25jbGljayA9IGJ0bmNsaWNrXHJcbiAgICAgICAgYnV0dG9uLnN0eWxlID0gYCR7YnV0dG9uU3R5bGV9YmFja2dyb3VuZC1jb2xvcjogYXp1cmU7YFxyXG4gICAgICAgIHVybENoYW5nZShldmVudClcclxuICAgICAgICBvYnNlcnZlZCgpXHJcbiAgICAgIH0sIDApXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgY29uc3Qge2xvY2F0aW9ufSA9IGRvY3VtZW50XHJcbiAgbGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXHJcblxyXG4gIGZ1bmN0aW9uIGNvbXBhcmVIcmVmKCkge1xyXG4gICAgLy8gY29uc29sZS5sb2coJ0RPTSBtdXRhdGVkIScpXHJcbiAgICBpZiAob2xkSHJlZiAhPSBsb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KVxyXG4gICAgICBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxyXG4gICAgY29tcGFyZUhyZWYoKVxyXG4gIH1cclxuXHJcbiAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XHJcbiAgZnVuY3Rpb24gb2JzZXJ2ZWQoKSB7XHJcbiAgICBvYnNlcnZlci5kaXNjb25uZWN0KClcclxuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiYm9keVwiKVxyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSlcclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xyXG4gIGxldCBfdGltZW91dFxyXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcclxuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHNcclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKVxyXG4gICAgfSwgZGVsYXkpXHJcbiAgfVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2VcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgbGV0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7X3N1Ym5zOiBzfSA9IHJvdXRlLl9jaGlsZG5zXHJcbiAgaWYgKHMgJiYgbWl0bS5yb3V0ZXNbc10pIHtcclxuICAgIHJvdXRlPSBtaXRtLnJvdXRlc1tzXVxyXG4gIH1cclxuICByZXR1cm4gcm91dGVcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIE11dGF0aW9uT2JzZXJ2ZXIgKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfd3Nfcm91dGUgPSByZXF1aXJlKCcuL193c19yb3V0ZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBpZiAobG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxyXG4gIGNvbnN0IHNzaG90ID0ge31cclxuICBjb25zdCBub2RlcyA9IHt9XHJcblxyXG4gIGxldCByb3V0ZSA9IF93c19yb3V0ZSgpXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIGNvbnN0IHsgb2JzZXJ2ZXI6IG9iIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG9iKSB7XHJcbiAgICAgIGxldCBlbCA9IHt9XHJcbiAgICAgIGlmIChvYltpZF0gPT09IHRydWUpIHtcclxuICAgICAgICBlbCA9IHtcclxuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IHRydWUsXHJcbiAgICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH0gaWYgKHR5cGVvZiBvYltpZF0gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vY2FwdHVyZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgcmVtb3ZlOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxyXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcclxuICAgICAgICAgIGVsW2VdID0gdHJ1ZVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF1cclxuICAgICAgfVxyXG4gICAgICBzc2hvdFtpZF0gPSBlbFxyXG4gICAgICBub2Rlc1tpZF0gPSB7XHJcbiAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IG9iXHJcbiAgbGV0IGZuYW1lXHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgICAgb2IgPSByb3V0ZS5zY3JlZW5zaG90Lm9ic2VydmVyXHJcbiAgICB9XHJcbiAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKVxyXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChvYiAmJiB0eXBlb2Ygb2JbaWRdPT09J2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjb25zdCBub2QgPSBlbFswXSB8fCBlbFxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudD09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG5vZC5fd3NfY291bnQgPSAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbm9kLl93c19jb3VudCArPSAxXHJcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PDIpIHtcclxuICAgICAgICAgICAgICBvYltpZF0obm9kKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IFxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgXHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcclxuICAgICAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywgeyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoX3dzX2RlYm91bmNlKGNhbGxiYWNrLCAxMDApKVxyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZVxyXG4gICAgfSlcclxuICB9KSAgXHJcbn1cclxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXHJcblxyXG5jb25zdCBuYW5vaWQgPSAoc2l6ZSA9IDgpID0+IHtcclxuICBsZXQgaWQgPSAnJ1xyXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XHJcbiAgICBpZCArPSB0NjRbTWF0aC5yYW5kb20oKSAqIDY0IHwgMF1cclxuICB9XHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgX3dzIH0gPSB3aW5kb3dcclxuXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCByZWdleCB9XHJcbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcclxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxyXG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19waW5nKCdIaSEnKVxyXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxyXG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX2hlbHAoKVxyXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcclxuICAgIF93cy5zZW5kKCdfaGVscHt9JylcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcclxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfb3BlbiR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xyXG4gICAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXHJcbiAgICBjb25zdCBrZXkgPSBgJHtjbWR9OiR7aWR9YFxyXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSlcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xyXG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cclxuICAgICAgICBjb25zb2xlLmxvZygnPj4+IHdzIHRpbWVvdXQhJywga2V5KVxyXG4gICAgICB9XHJcbiAgICB9LCA1MDAwKVxyXG4gICAgY29uc3QgcGFyYW1zID0gYCR7a2V5fSR7SlNPTi5zdHJpbmdpZnkoeyBkYXRhIH0pfWBcclxuICAgIGlmIChfX2ZsYWdbJ3dzLW1lc3NhZ2UnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnX3dzLnNlbmQnLCBjbWQpXHJcbiAgICB9XHJcbiAgICBfd3Muc2VuZChwYXJhbXMpXHJcbiAgfVxyXG59XHJcbi8vIHdzX19zZW5kKCdfcGluZycsICdMT0wnLCB3PT5jb25zb2xlLmxvZygnPnJlc3VsdCcsdykpO1xyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubGV0IF90aW1lb3V0XHJcbmxldCBfY3NwID0ge31cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICAgIC5yZXBsYWNlKC9eXFwvLywgJycpXHJcbiAgICAgIC5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgY29uc3Qge1xyXG4gICAgICBibG9ja2VkVVJJLFxyXG4gICAgICBkaXNwb3NpdGlvbixcclxuICAgICAgZG9jdW1lbnRVUkksXHJcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcclxuICAgICAgb3JpZ2luYWxQb2xpY3ksXHJcbiAgICAgIHRpbWVTdGFtcCxcclxuICAgICAgdHlwZSxcclxuICAgICAgdmlvbGF0ZWREaXJlY3RpdmVcclxuICAgIH0gPSBlXHJcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcclxuICAgIGlmICghX2NzcFt0eXBdKSB7XHJcbiAgICAgIF9jc3BbdHlwXSA9IHt9XHJcbiAgICB9XHJcbiAgICBpZiAoIV9jc3BbdHlwXS5fZ2VuZXJhbF8pIHtcclxuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcclxuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxyXG4gICAgICAgIG5hbWVzcGFjZSxcclxuICAgICAgICBob3N0LFxyXG4gICAgICAgIHBhdGhcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXVxyXG4gICAgaWYgKCFfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSkge1xyXG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXHJcbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcclxuICAgICAgX2VycltibG9ja2VkVVJJXSA9IHt9XHJcbiAgICB9XHJcbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YClcclxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IF9tYXRjaCA/IF9tYXRjaFswXSA6IGVmZmVjdGl2ZURpcmVjdGl2ZVxyXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcclxuICAgICAgZGlyZWN0aXZlLFxyXG4gICAgICB0aW1lU3RhbXAsXHJcbiAgICAgIHR5cGVcclxuICAgIH1cclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gQ1NQOicsIF9jc3ApXHJcbiAgICAgIC8vIHdpbmRvdy53c19fc2VuZCgnY3NwX2Vycm9yJywge1xyXG4gICAgICAvLyAgIG5hbWVzcGFjZSxcclxuICAgICAgLy8gICBob3N0LFxyXG4gICAgICAvLyAgIHBhdGgsXHJcbiAgICAgIC8vICAgX2NzcCxcclxuICAgICAgLy8gfSk7XHJcbiAgICAgIF9jc3AgPSB7fVxyXG4gICAgfSwgNDAwMClcclxuICB9XHJcblxyXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKVxyXG4gIH1cclxufVxyXG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxyXG4vLyBkb2N1bWVudFVSSTogXCJodHRwczovL3doYXQvaHRtbC9jb250YWluL2NzcFwiXHJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxyXG5cclxuLy8gYmxvY2tlZFVSSTogXCJodHRwczovL3doYXQvdXJsL2dldHRpbmcvYmxvY2tlZFwiXHJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcclxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxyXG4vLyB0aW1lU3RhbXA6IDE5MzMuODIwMDAwMDA1NjUzMVxyXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcclxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19wb3N0bWVzc2FnZSA9IHJlcXVpcmUoJy4vX3dzX3Bvc3RtZXNzYWdlJylcclxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXHJcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpXHJcbmNvbnN0IF93c19sb2NhdGlvbiA9IHJlcXVpcmUoJy4vX3dzX2xvY2F0aW9uJylcclxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxyXG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKVxyXG5jb25zdCBfd3NfY3NwRXJyID0gcmVxdWlyZSgnLi9fd3NfY3NwLWVycicpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBfd3NfcG9zdG1lc3NhZ2UoKVxyXG4gIF93c19pbml0U29ja2V0KClcclxuICBfd3Nfc2NyZWVuc2hvdCgpXHJcbiAgX3dzX2xvY2F0aW9uKClcclxuICBfd3Nfb2JzZXJ2ZXIoKVxyXG4gIF93c19nZW5lcmFsKClcclxuICBfd3NfY3NwRXJyKClcclxufVxyXG5jb25zb2xlLmxvZygnd3MtY2xpZW50IGxvYWRlZC4uLicpIl0sIm5hbWVzIjpbIl93c19kZWJvdW5jZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLHNCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0FBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMs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LElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUMvQyxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLEtBQUs7QUFDN0MsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxHQUFFO0FBQ3JDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUM5QyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0FBQzVDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDNUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFDOUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQzNDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU07QUFDMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQztBQUN2QixJQUFHO0FBQ0g7QUFDQTtBQUNBLEVB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
