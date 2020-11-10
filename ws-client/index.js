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
  window._ws_connect = {};
  window._ws_connected = false;

  const onopen = data => {
    console.timeEnd('ws: onopen');
    window._ws_connected = true;
    for (const key in window._ws_connect) {
      console.warn(window._ws_connect[key] + '');
      window._ws_connect[key](data);
    }
  };

  const onclose = function () {
    console.log('ws: Connection is closed');
  };

  const onmessage = function (event) {
    _ws_msgParser(event, event.data);
  };

  const url = `wss://localhost:3001/ws?page=${_ws_inIframe()}&url=${document.URL.split('?')[0]}`;
  const ws = new WebSocket(url);
  console.time('ws: onopen');
  window._ws = ws;

  setTimeout(() => {
    ws.onopen = onopen;
    ws.onclose = onclose;
    ws.onmessage = onmessage;
  }, 1); // minimize intermitten
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
  const { hostname: host } = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const route = window.mitm.routes[namespace];
  const { selector } = route.screenshot;

  const arr = document.body.querySelectorAll(selector);
  const fname = location.pathname.replace(/^\//, '').replace(/\//g, '-');
  const delay = mitm.argv.lazyclick === true ? 700 : mitm.argv.lazyclick;
  for (const el of arr) {
    let node = e.target;
    while (el !== node && node !== document.body) {
      node = node.parentNode;
    }
    if (node !== document.body) {
      const _page = window['xplay-page'];
      const params = { namespace, _page, host, fname, browser };
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
          btn.onclick = autobuttons[key];
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

/* global location, MutationObserver */

var _ws_observer = () => {
  const { hostname: host } = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  const sshot = {}; const nodes = {};

  const route = window.mitm.routes[namespace];
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
    const _page = window['xplay-page'];
    for (const id in nodes) {
      const el = document.body.querySelectorAll(id);
      if (el.length) {
        if (!nodes[id].insert) {
          nodes[id].insert = true;
          if (nodes[id].remove !== undefined) {
            nodes[id].remove = false;
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
    if (window.mitm.argv.debug) {
      console.log('_ws.send', params);
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

index();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19vYnNlcnZlci5qcyIsIl9zcmMvX3dzX2dlbmVyYWwuanMiLCJfc3JjL193c19jc3AtZXJyLmpzIiwiX3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgPj4+IFBvc3RtZXNzYWdlOiAke2V2ZW50Lm9yaWdpbn0gPT4gaHR0cHM6Ly8ke2xvY2F0aW9uLmhvc3R9YCwgZXZlbnQuZGF0YSlcbiAgICB9XG4gIH1cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpXG5cbiAgLy8gaWYgKCFjaHJvbWUud2luZG93cykge1xuICAvLyAgIGZ1bmN0aW9uIHJlcG9ydFdpbmRvd1NpemUoKSB7XG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xuICAvLyAgICAgY29uc29sZS5sb2coe2lubmVyV2lkdGgsIGlubmVySGVpZ2h0fSk7XG4gIC8vICAgfVxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xuICAvLyB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgbGV0IHdpbmRvd1JlZlxuICByZXR1cm4ge1xuICAgIC8vIGV4OiB3c19faGVscCgpXG4gICAgX2hlbHAgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19waW5nKFwidGhlcmVcIilcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgfSxcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9ICdkaXJlY3Rvcmllcz0wLHRpdGxlYmFyPTAsdG9vbGJhcj0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wLHdpZHRoPTgwMCxoZWlnaHQ9NjAwJ1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxuICAgICAgd2luZG93UmVmLmJsdXIoKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnN0IHsgcSwgY3NzIH0gPSBkYXRhXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcbiAgICAgIClcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fXG4gICAgX2ZpbGVzICh7IHR5cCwgZGF0YSB9KSB7XG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxuICAgICAgY29uc29sZS53YXJuKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApXG4gICAgICAvKipcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxuICAgICAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cbiAgICAgICAqL1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldICsgJycpXG4gICAgICAgIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF1ba2V5XShkYXRhKVxuICAgICAgfVxuICAgIH0sXG4gICAgX3NldENsaWVudCAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSlcbiAgICAgIHdpbmRvdy5taXRtLmNsaWVudCA9IGRhdGFcbiAgICB9XG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpXG5jb25zdCBfd3Nfd2NjbWQgPSBfd3NfY2xpZW50KClcblxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xuICBpZiAod2luZG93Lm1pdG0uYXJndi5kZWJ1Zykge1xuICAgIGlmIChtc2cubGVuZ3RoID4gNDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLCA0MCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzYCcsIG1zZylcbiAgICB9XG4gIH1cbiAgY29uc3QgYXJyID0gbXNnLnJlcGxhY2UoL1xccyskLywgJycpLm1hdGNoKC9eICooW1xcdzpdKykgKihcXHsuKikvKVxuICBpZiAoYXJyKSB7XG4gICAgbGV0IFssIGNtZCwganNvbl0gPSBhcnJcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiAoanNvbikgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKGpzb24pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoanNvbiwgZXJyb3IpXG4gICAgfVxuICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2NtZF0pIHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF1cbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF1cbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKVxuICAgIH0gZWxzZSBpZiAoX3dzX3djY21kW2NtZF0pIHtcbiAgICAgIF93c193Y2NtZFtjbWRdLmNhbGwoZXZlbnQsIGpzb24pXG4gICAgfVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgbGV0IGlmcm1cbiAgdHJ5IHtcbiAgICBpZnJtID0gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3BcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmcm0gPSB0cnVlXG4gIH1cbiAgcmV0dXJuIGlmcm0gPyAnaWZyYW1lJyA6ICd3aW5kb3cnXG59XG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19tc2dQYXJzZXIgPSByZXF1aXJlKCcuL193c19tc2ctcGFyc2VyJylcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbiAgd2luZG93Ll93c19jb25uZWN0ZWQgPSBmYWxzZVxuXG4gIGNvbnN0IG9ub3BlbiA9IGRhdGEgPT4ge1xuICAgIGNvbnNvbGUudGltZUVuZCgnd3M6IG9ub3BlbicpXG4gICAgd2luZG93Ll93c19jb25uZWN0ZWQgPSB0cnVlXG4gICAgZm9yIChjb25zdCBrZXkgaW4gd2luZG93Ll93c19jb25uZWN0KSB7XG4gICAgICBjb25zb2xlLndhcm4od2luZG93Ll93c19jb25uZWN0W2tleV0gKyAnJylcbiAgICAgIHdpbmRvdy5fd3NfY29ubmVjdFtrZXldKGRhdGEpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnd3M6IENvbm5lY3Rpb24gaXMgY2xvc2VkJylcbiAgfVxuXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIF93c19tc2dQYXJzZXIoZXZlbnQsIGV2ZW50LmRhdGEpXG4gIH1cblxuICBjb25zdCB1cmwgPSBgd3NzOi8vbG9jYWxob3N0OjMwMDEvd3M/cGFnZT0ke193c19pbklmcmFtZSgpfSZ1cmw9JHtkb2N1bWVudC5VUkwuc3BsaXQoJz8nKVswXX1gXG4gIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldCh1cmwpXG4gIGNvbnNvbGUudGltZSgnd3M6IG9ub3BlbicpXG4gIHdpbmRvdy5fd3MgPSB3c1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHdzLm9ub3BlbiA9IG9ub3BlblxuICAgIHdzLm9uY2xvc2UgPSBvbmNsb3NlXG4gICAgd3Mub25tZXNzYWdlID0gb25tZXNzYWdlXG4gIH0sIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICBsZXQgbmFtZXNwYWNlXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcbiAgICBpZiAoaG9zdC5tYXRjaCh0b1JlZ2V4KGtleS5yZXBsYWNlKC9+LywgJ1teLl0qJykpKSkge1xuICAgICAgbmFtZXNwYWNlID0ga2V5XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxuICBjb25zdCBicm93c2VyID0ge1xuICAgICcnOiAnZmlyZWZveCcsXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcbiAgICAnQXBwbGUgQ29tcHV0ZXIsIEluYy4nOiAnd2Via2l0J1xuICB9W3ZlbmRvcl1cbiAgcmV0dXJuIGJyb3dzZXJcbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgbWl0bSAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuXG5sZXQgYWN0XG5mdW5jdGlvbiBzY3JlZW5zaG90IChlKSB7XG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XG4gICAgaWYgKG1pdG0uc2NyZWVuc2hvdCkge1xuICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IHVuZGVmaW5lZFxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChhY3QpIHtcbiAgICAgIGFjdCA9IHVuZGVmaW5lZFxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG4gIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cbiAgY29uc3QgeyBzZWxlY3RvciB9ID0gcm91dGUuc2NyZWVuc2hvdFxuXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgY29uc3QgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcbiAgZm9yIChjb25zdCBlbCBvZiBhcnIpIHtcbiAgICBsZXQgbm9kZSA9IGUudGFyZ2V0XG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcbiAgICB9XG4gICAgaWYgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxuICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywgcGFyYW1zKVxuICAgICAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcbiAgICAgICAgLy8gZGVsYXkgYWN0aW9uIHRvIGZpbmlzaCBzY3JlZW5zaG90XG4gICAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSBlLnRhcmdldFxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCc+Pj4gY2xpY2tlZCcpO1xuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcbiAgICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90Lm5vZGUgPSB1bmRlZmluZWRcbiAgICAgICAgICBhY3QuY2xpY2soKVxuICAgICAgICAgIGFjdCA9IHVuZGVmaW5lZFxuICAgICAgICB9LCBkZWxheSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbX3dzX25hbWVzcGFjZSgpXVxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2NyZWVuc2hvdClcbiAgICB9KVxuICB9XG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIGhpc3RvcnksIGNocm9tZSwgRXZlbnQsIENzc1NlbGVjdG9yR2VuZXJhdG9yICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBjb250YWluZXJTdHlsZSA9ICdwb3NpdGlvbjogZml4ZWQ7ei1pbmRleDogOTk5OTt0b3A6IDhweDtyaWdodDogNXB4OydcbiAgY29uc3QgYnV0dG9uU3R5bGUgPSAnYm9yZGVyOiBub25lO2JvcmRlci1yYWRpdXM6IDE1cHg7Zm9udC1zaXplOiAxMHB4OydcbiAgY29uc3QgZXZlbnQgPSBuZXcgRXZlbnQoJ3VybGNoYW5nZWQnKVxuICBsZXQgY29udGFpbmVyID0ge31cbiAgbGV0IGN0cmwgPSBmYWxzZVxuICBsZXQgYnV0dG9uID0ge31cbiAgbGV0IGJ1dHRvbnNcbiAgbGV0IGludGVydklkXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAocGF0aE1zZykge1xuICAgIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKVxuICAgIHJldHVybiB7IHBhdGgsIG1zZyB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRCdXR0b25zICgpIHtcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2J1dHRvbnMpIHtcbiAgICAgIGNvbnN0IHsgYXV0b2J1dHRvbnMgfSA9IHdpbmRvdy5taXRtXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gYXV0b2J1dHRvbnMpIHtcbiAgICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKVxuICAgICAgICAgIGNvbnN0IGJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgICAgICAgY29uc3QgW2NhcHRpb24sIGNvbG9yXSA9IGtleS5zcGxpdCgnfCcpXG4gICAgICAgICAgYnRuLm9uY2xpY2sgPSBhdXRvYnV0dG9uc1trZXldXG4gICAgICAgICAgYnRuLmlubmVyVGV4dCA9IGNhcHRpb25cbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJ0bilcbiAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJyKVxuICAgICAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICAgICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKVxuICAgICAgICB9XG4gICAgICB9LCAwKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVybENoYW5nZSAoZXZlbnQpIHtcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ZpbGwpIHtcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvZmlsbFxuICAgIH1cbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSB7XG4gICAgICBjbGVhckludGVydmFsKGludGVydklkKVxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbFxuICAgIH1cbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2J1dHRvbnMpIHtcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvYnV0dG9uc1xuICAgICAgYnV0dG9ucy5pbm5lckhUTUwgPSAnJ1xuICAgIH1cbiAgICBpZiAod2luZG93Lm1pdG0ubWFjcm9rZXlzKSB7XG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0ubWFjcm9rZXlzXG4gICAgfVxuICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgIGNvbnN0IHsgcGF0aG5hbWUgfSA9IGxvY2F0aW9uXG4gICAgICBjb25zdCB7IF9tYWNyb3NfLCBtYWNyb3MgfSA9IHdpbmRvdy5taXRtXG4gICAgICAvLyBjb25zb2xlLmxvZyhuYW1lc3BhY2UsIGxvY2F0aW9uKTtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIG1hY3Jvcykge1xuICAgICAgICBjb25zdCB7IHBhdGgsIG1zZyB9ID0gdG9SZWdleChrZXkpXG4gICAgICAgIGlmIChwYXRobmFtZS5tYXRjaChwYXRoKSkge1xuICAgICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBtc2cgfHwgJ0F1dG9maWxsJ1xuICAgICAgICAgIF9tYWNyb3NfICYmIF9tYWNyb3NfKClcbiAgICAgICAgICBtYWNyb3Nba2V5XSgpXG4gICAgICAgICAgc2V0QnV0dG9ucygpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29udGFpbmVyLnN0eWxlID0gY29udGFpbmVyU3R5bGVcbiAgICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxuICAgIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXG4gICAgaWYgKHR5cGVvZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcbiAgICB9XG4gICAgY3RybCA9IGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBwbGF5IChhdXRvZmlsbCkge1xuICAgIGlmIChhdXRvZmlsbCkge1xuICAgICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxuICAgICAgfVxuICAgICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxuICAgICAgY29uc3QgbGVudGggPSBhdXRvZmlsbC5sZW5ndGhcbiAgICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICAgIGNvbnNvbGUubG9nKGxlbnRoID09PSAxID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpKVxuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIHsgYXV0b2ZpbGwsIGJyb3dzZXIsIF9wYWdlIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYnRuY2xpY2sgKGUpIHtcbiAgICBjb25zdCB7IGF1dG9maWxsIH0gPSB3aW5kb3cubWl0bVxuICAgIHBsYXkoYXV0b2ZpbGwpXG4gIH1cblxuICBmdW5jdGlvbiBrZXliQ3RybCAoZSkge1xuICAgIGNvbnN0IHsgbWFjcm9rZXlzIH0gPSB3aW5kb3cubWl0bVxuICAgIGlmIChlLmN0cmxLZXkgJiYgZS5rZXkgPT09ICdTaGlmdCcpIHtcbiAgICAgIGN0cmwgPSAhY3RybFxuICAgICAgY29udGFpbmVyLnN0eWxlID0gY29udGFpbmVyU3R5bGUgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXG4gICAgfSBlbHNlIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcbiAgICAgIGNvbnNvbGUubG9nKHsgbWFjcm86IGBjdHJsICsgYWx0ICsgJHtlLmNvZGV9YCB9KVxuICAgICAgaWYgKG1hY3Jva2V5cykge1xuICAgICAgICBsZXQgbWFjcm8gPSBtYWNyb2tleXNbZS5jb2RlXVxuICAgICAgICBpZiAobWFjcm8pIHtcbiAgICAgICAgICBtYWNybyA9IG1hY3JvKClcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcbiAgICAgICAgICAgIGxldCBtYWNyb0luZGV4ID0gMFxuICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXG4gICAgICAgICAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXiAqWz0tXT4vKSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yID0gYCR7Q3NzU2VsZWN0b3JHZW5lcmF0b3IuZ2V0Q3NzU2VsZWN0b3IoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCl9ICR7c2VsZWN0b3J9YFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHBsYXkoW3NlbGVjdG9yXSlcblxuICAgICAgICAgICAgICBtYWNyb0luZGV4ICs9IDFcbiAgICAgICAgICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoIXdpbmRvdy5jaHJvbWUpIHtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAoIWNocm9tZS50YWJzKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndXJsY2hhbmdlZCcsIHVybENoYW5nZSlcbiAgICBjb25zdCBmbiA9IGhpc3RvcnkucHVzaFN0YXRlXG4gICAgaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmbi5hcHBseShoaXN0b3J5LCBhcmd1bWVudHMpXG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudClcbiAgICB9XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJylcbiAgICAgIGNvbnN0IG5vZGVyZWYgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkXG4gICAgICBjb25zdCBuZXdOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGNvbnN0IGh0bWwgPSAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hdXRvZmlsbFwiPkF1dG9maWxsPC9idXR0b24+J1xuXG4gICAgICBuZXdOb2RlLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImF1dG9maWxsLWJ1dHRvbnNcIj48L3NwYW4+JHtodG1sfWBcbiAgICAgIG5ld05vZGUuY2xhc3NOYW1lID0gJ21pdG0gYXV0b2ZpbGwtY29udGFpbmVyJ1xuICAgICAgbmV3Tm9kZS5zdHlsZSA9IGNvbnRhaW5lclN0eWxlXG5cbiAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIG5vZGVyZWYpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29udGFpbmVyID0gbmV3Tm9kZVxuICAgICAgICBidXR0b25zID0gbmV3Tm9kZS5jaGlsZHJlblswXVxuICAgICAgICBidXR0b24gPSBuZXdOb2RlLmNoaWxkcmVuWzFdXG4gICAgICAgIGJ1dHRvbi5vbmNsaWNrID0gYnRuY2xpY2tcbiAgICAgICAgYnV0dG9uLnN0eWxlID0gYCR7YnV0dG9uU3R5bGV9YmFja2dyb3VuZC1jb2xvcjogYXp1cmU7YFxuICAgICAgICB1cmxDaGFuZ2UoZXZlbnQpXG4gICAgICB9LCAxKVxuICAgIH0pXG4gIH1cbn1cbiIsImZ1bmN0aW9uIGRlYm91bmNlIChmbiwgZGVsYXkgPSA1MDApIHtcbiAgbGV0IF90aW1lb3V0XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG4gICAgY29uc3QgYXJncyA9IGFyZ3VtZW50c1xuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZm4uYXBwbHkoX3RoaXMsIGFyZ3MpXG4gICAgfSwgZGVsYXkpXG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2VcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgTXV0YXRpb25PYnNlcnZlciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c19kZWJvdW5jZSA9IHJlcXVpcmUoJy4vX3dzX2RlYm91bmNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3Qgc3Nob3QgPSB7fTsgY29uc3Qgbm9kZXMgPSB7fVxuXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxuICAgIGZvciAoY29uc3QgaWQgaW4gb2IpIHtcbiAgICAgIGxldCBlbCA9IHt9XG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XG4gICAgICAgIGVsID0ge1xuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxuICAgICAgICAgIHJlbW92ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XG4gICAgICAgICAgZWxbZV0gPSB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXG4gICAgICB9XG4gICAgICBzc2hvdFtpZF0gPSBlbFxuICAgICAgbm9kZXNbaWRdID0ge1xuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxuICAgICAgICByZW1vdmU6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgZm5hbWVcbiAgY29uc3QgY2FsbGJhY2sgPSBfd3NfZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICBmb3IgKGNvbnN0IGlkIGluIG5vZGVzKSB7XG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChpZClcbiAgICAgIGlmIChlbC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWVcbiAgICAgICAgICBpZiAobm9kZXNbaWRdLnJlbW92ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LWluc2VydGBcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xuICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSB0cnVlXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIDEwMClcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH0pXG4gIH0pXG59XG4iLCJjb25zdCB0NjQgPSAnV2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaaCdcblxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XG4gIGxldCBpZCA9ICcnXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXG4gIH1cbiAgcmV0dXJuIGlkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IF93cyB9ID0gd2luZG93XG5cbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfYnJvYWRjYXN0ID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX3BpbmcoJ0hpIScpXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX3Bpbmcke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19faGVscCgpXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXG4gIH1cblxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXG4gIHdpbmRvdy53c19fb3BlbiA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcbiAgICB3aW5kb3cuX3dzX3F1ZXVlW2tleV0gPSBoYW5kbGVyIHx8ICh3ID0+IHt9KVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAod2luZG93Ll93c19xdWV1ZVtrZXldKSB7XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cbiAgICAgICAgY29uc29sZS5sb2coJz4+PiB3cyB0aW1lb3V0IScsIGtleSlcbiAgICAgIH1cbiAgICB9LCA1MDAwKVxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXG4gICAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdfd3Muc2VuZCcsIHBhcmFtcylcbiAgICB9XG4gICAgX3dzLnNlbmQocGFyYW1zKVxuICB9XG59XG4vLyB3c19fc2VuZCgnX3BpbmcnLCAnTE9MJywgdz0+Y29uc29sZS5sb2coJz5yZXN1bHQnLHcpKTtcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubGV0IF90aW1lb3V0XG5sZXQgX2NzcCA9IHt9XG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXG4gICAgICAucmVwbGFjZSgvXlxcLy8sICcnKVxuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgY29uc3Qge1xuICAgICAgYmxvY2tlZFVSSSxcbiAgICAgIGRpc3Bvc2l0aW9uLFxuICAgICAgZG9jdW1lbnRVUkksXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXG4gICAgICBvcmlnaW5hbFBvbGljeSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZVxuICAgIH0gPSBlXG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcbiAgICAgIF9jc3BbdHlwXSA9IHt9XG4gICAgfVxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBob3N0LFxuICAgICAgICBwYXRoXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF1cbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XG4gICAgfVxuXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge31cbiAgICB9XG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApXG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcbiAgICAgIGRpcmVjdGl2ZSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGVcbiAgICB9XG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IENTUDonLCBfY3NwKVxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XG4gICAgICAvLyAgIG5hbWVzcGFjZSxcbiAgICAgIC8vICAgaG9zdCxcbiAgICAgIC8vICAgcGF0aCxcbiAgICAgIC8vICAgX2NzcCxcbiAgICAgIC8vIH0pO1xuICAgICAgX2NzcCA9IHt9XG4gICAgfSwgNDAwMClcbiAgfVxuXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcilcbiAgfVxufVxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX3Bvc3RtZXNzYWdlID0gcmVxdWlyZSgnLi9fd3NfcG9zdG1lc3NhZ2UnKVxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxuY29uc3QgX3dzX2xvY2F0aW9uID0gcmVxdWlyZSgnLi9fd3NfbG9jYXRpb24nKVxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcbmNvbnN0IF93c19jc3BFcnIgPSByZXF1aXJlKCcuL193c19jc3AtZXJyJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIF93c19wb3N0bWVzc2FnZSgpXG4gIF93c19pbml0U29ja2V0KClcbiAgX3dzX3NjcmVlbnNob3QoKVxuICBfd3NfbG9jYXRpb24oKVxuICBfd3Nfb2JzZXJ2ZXIoKVxuICBfd3NfZ2VuZXJhbCgpXG4gIF93c19jc3BFcnIoKVxufVxuIl0sIm5hbWVzIjpbIl93c19kZWJvdW5jZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLHNCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0FBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztBQUM3RixLQUFLO0FBQ0wsR0FBRztBQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkEsaUJBQWlCLE1BQU07QUFDdkIsRUFBRSxJQUFJLFVBQVM7QUFDZixFQUFFLE9BQU87QUFDVDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0FBQ3ZCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0FBQ3ZCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUNyQixNQUFNLE1BQU0sUUFBUSxHQUFHLHdGQUF1RjtBQUM5RyxNQUFN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RyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0FBQy9DLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDL0MsSUFBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQzdDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRTtBQUNyQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDOUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztBQUM1QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQzVDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUMzQyxJQUFHO0FBQ0g7QUFDQTtB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
