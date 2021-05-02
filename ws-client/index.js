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
  const containerStyle1 = 'position: fixed;z-index: 9999;right: 3px;';
  const containerStyle2 = 'position: fixed;z-index: 9999;left:  3px;';
  const containerStyle3 = 'position: fixed;z-index: 9999;right: 3px; top: 20px;';
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;cursor: pointer;';
  const event = new Event('urlchanged');
  let container = {
    right3: {},
    right: {},
    left: {},
  };
  let ctrl = false;
  let button = {};
  let bgroup = {
    right3: {},
    right: {},
    left: {},
  };
  let intervId;

  function toRegex (pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item => item.trim());
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?');
    return { path, msg }
  }

  function createButton(buttons, pos) {
    let br;
    for (const id in buttons) {
      const [caption, color, klas] = id.split('|');
      const btn = document.createElement('button');
      const ev  = buttons[id];
      btn.onclick = e => {
        const arr = ev(e);
        Array.isArray(arr) && play(arr);
      };
      btn.innerText = caption;
      btn.classList.add('mitm-btn');
      btn.classList.add(`${pos}`);
      btn.classList.add(klas || caption);
      btn.style = buttonStyle + (color ? `background: ${color};` : '');
      bgroup[pos].appendChild(btn);
      if (pos==='right') {
        br = document.createElement('span');
        br.innerHTML = '&nbsp;';
      } else {
        br = document.createElement('pre');
        br.style = 'margin: 0px;';
      }
      bgroup[pos].appendChild(br);
    }
  }

  function setButtons (buttons, position) {
    if (bgroup[position]) {
      bgroup[position].innerHTML = '';
      createButton(buttons, position);
    }
  }

  let debunk;
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
    if (window.mitm.rightbuttons) {
      delete window.mitm.rightbuttons;
    }
    if (window.mitm.leftbuttons) {
      delete window.mitm.leftbuttons;
    }
    if (window.mitm.macrokeys) {
      delete window.mitm.macrokeys;
    }
    if (namespace) {
      const {href, origin} = location;
      const _href = href.replace(origin, '');
      const {_macros_, macros} = window.mitm;
      for (const key in macros) {
        const { path, msg } = toRegex(key);
        if (_href.match(path)) {
          button.innerHTML = msg || 'Autofill';
          _macros_ && _macros_();
          macros[key]();
          if (debunk) {
            clearTimeout(debunk);
            debunk = undefined;
          }
          debunk = setTimeout(() => {
            const {autobuttons, rightbuttons, leftbuttons} = window.mitm;
            rightbuttons && setButtons(rightbuttons, 'right3');
            autobuttons && setButtons(autobuttons, 'right');
            leftbuttons && setButtons(leftbuttons, 'left');  
          }, 0);
        }
      }
    }
    container.right3.style = containerStyle3;
    container.right.style = containerStyle1;
    container.left.style  = containerStyle2;
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
      container.right3.style = containerStyle3 + (!ctrl ? '' : 'display: none;');
      container.right.style  = containerStyle1 + (!ctrl ? '' : 'display: none;');
      container.left.style   = containerStyle2 + (!ctrl ? '' : 'display: none;');
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
      const html = document.querySelector('html');
      const htmlref = html.firstElementChild;
      const styleBtnLeft = document.createElement('style');
      const divTopRight3 = document.createElement('div');
      const divTopRight = document.createElement('div');
      const divTopLeft = document.createElement('div');
      const auto = '<button class="btn-autofill">Autofill</button>';

      styleBtnLeft.innerHTML = 'button.mitm-btn:hover{text-decoration:underline;}';
      divTopRight3.innerHTML = `<span class="bgroup-right"></span>`;
      divTopRight.innerHTML  = `<span class="bgroup-right"></span>${auto}`;
      divTopLeft.innerHTML   = `<span class="bgroup-left"></span>`;
      divTopRight.className  = 'mitm autofill-container';
      divTopLeft.className   = 'mitm autofill-container';
      divTopRight3.style = containerStyle3;
      divTopRight.style  = containerStyle1;
      divTopLeft.style   = containerStyle2;

      html.insertBefore(styleBtnLeft, htmlref);
      html.insertBefore(divTopRight3, htmlref);
      html.insertBefore(divTopRight, htmlref);
      html.insertBefore(divTopLeft, htmlref);
      setTimeout(() => {
        container.right3 = divTopRight3;
        container.right  = divTopRight;
        container.left   = divTopLeft;
        button.style  = `${buttonStyle}background-color: azure;`;
        bgroup.right3 = divTopRight3.children[0];
        bgroup.right = divTopRight.children[0];
        bgroup.left  = divTopLeft.children[0];
        button = divTopRight.children[1];
        button.onclick = btnclick;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19yb3V0ZS5qcyIsIl9zcmMvX3dzX29ic2VydmVyLmpzIiwiX3NyYy9fd3NfZ2VuZXJhbC5qcyIsIl9zcmMvX3dzX2NzcC1lcnIuanMiLCJfc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYD4+PiBQb3N0bWVzc2FnZTogJHtldmVudC5vcmlnaW59ID0+IGh0dHBzOi8vJHtsb2NhdGlvbi5ob3N0fWAsIGV2ZW50LmRhdGEpXHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxyXG5cclxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XHJcbiAgLy8gICBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xyXG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcclxuICAvLyAgIH1cclxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xyXG4gIC8vIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgd2luZG93UmVmXHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGV4OiB3c19faGVscCgpXHJcbiAgICBfaGVscCAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX3BpbmcoXCJ0aGVyZVwiKVxyXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxyXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnXHJcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcclxuICAgICAgd2luZG93UmVmLmJsdXIoKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcclxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgeyBxLCBjc3MgfSA9IGRhdGFcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxyXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcclxuICAgICAgKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfc2F2ZVRhZ3MgKHsgcm91dGVzIH0pIHtcclxuICAgICAgaWYgKCFsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xyXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xyXG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICBjb25zb2xlLndhcm4oYHJlY2VpdmUgYnJvZGNhc3QgJHt0eXB9YClcclxuICAgICAgLyoqXHJcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxyXG4gICAgICAgKi9cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0gKyAnJylcclxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSlcclxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpXHJcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xyXG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XHJcbiAgICBpZiAobXNnLmxlbmd0aCA+IDQwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLCA0MCkpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLylcclxuICBpZiAoYXJyKSB7XHJcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHR5cGVvZiAoanNvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2NtZF0pIHtcclxuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxyXG4gICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKVxyXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xyXG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgaWZybVxyXG4gIHRyeSB7XHJcbiAgICBpZnJtID0gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3BcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZVxyXG4gIH1cclxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcclxufVxyXG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXHJcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXHJcbiAgICAgICAgY29uc29sZS53YXJuKHdpbmRvdy5fd3NfY29ubmVjdFtrZXldICsgJycpXHJcbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnd3M6IG9wZW4gY29ubmVjdGlvbicpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS50aW1lRW5kKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IHRydWVcclxuXHJcbiAgICBzZXRUaW1lb3V0KHdzX3NlbmQsIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignUkVUUlkuLi4uLi4uLi4uJylcclxuICAgICAgICB3c19zZW5kKClcclxuICAgICAgfVxyXG4gICAgfSwgMTApIC8vIG1pbmltaXplIGludGVybWl0dGVuICAgICBcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ3dzOiBjbG9zZSBjb25uZWN0aW9uJylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgIC8vICAgY29uc29sZS5sb2coJ29uLW1lc3NhZ2U6JywgZS5kYXRhKVxyXG4gICAgLy8gfVxyXG4gICAgX3dzX21zZ1BhcnNlcihldmVudCwgZXZlbnQuZGF0YSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHVybCA9IGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKVxyXG4gIGNvbnNvbGUudGltZSgnd3MnKVxyXG4gIHdpbmRvdy5fd3MgPSB3c1xyXG5cclxuICB3cy5vbm9wZW4gPSBvbm9wZW5cclxuICB3cy5vbmNsb3NlID0gb25jbG9zZVxyXG4gIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3dzOiBpbml0IGNvbm5lY3Rpb24nKVxyXG4gIH1cclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vLCAnW14uXSonKSkpKSB7XHJcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbmFtZXNwYWNlXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXHJcbiAgfVt2ZW5kb3JdXHJcbiAgcmV0dXJuIGJyb3dzZXJcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIG1pdG0gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxyXG4gICAgICBwYXJhbXMuZm5hbWUgPSBmbmFtZT09PSd+JyA/ICd+XycgOiBmbmFtZVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpXHJcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICAgICAgLy8gZGVsYXkgYWN0aW9uIHRvIGZpbmlzaCBzY3JlZW5zaG90XHJcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcclxuICAgICAgICAgIGlmIChhY3QpIHtcclxuICAgICAgICAgICAgYWN0LmNsaWNrKClcclxuICAgICAgICAgICAgYWN0ID0gdW5kZWZpbmVkICBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkZWxheSBhY3Rpb24gdW5kZWZpbmVkJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZGVsYXkpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY29udGFpbmVyU3R5bGUxID0gJ3Bvc2l0aW9uOiBmaXhlZDt6LWluZGV4OiA5OTk5O3JpZ2h0OiAzcHg7J1xyXG4gIGNvbnN0IGNvbnRhaW5lclN0eWxlMiA9ICdwb3NpdGlvbjogZml4ZWQ7ei1pbmRleDogOTk5OTtsZWZ0OiAgM3B4OydcclxuICBjb25zdCBjb250YWluZXJTdHlsZTMgPSAncG9zaXRpb246IGZpeGVkO3otaW5kZXg6IDk5OTk7cmlnaHQ6IDNweDsgdG9wOiAyMHB4OydcclxuICBjb25zdCBidXR0b25TdHlsZSA9ICdib3JkZXI6IG5vbmU7Ym9yZGVyLXJhZGl1czogMTVweDtmb250LXNpemU6IDEwcHg7Y3Vyc29yOiBwb2ludGVyOydcclxuICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXHJcbiAgbGV0IGNvbnRhaW5lciA9IHtcclxuICAgIHJpZ2h0Mzoge30sXHJcbiAgICByaWdodDoge30sXHJcbiAgICBsZWZ0OiB7fSxcclxuICB9XHJcbiAgbGV0IGN0cmwgPSBmYWxzZVxyXG4gIGxldCBidXR0b24gPSB7fVxyXG4gIGxldCBiZ3JvdXAgPSB7XHJcbiAgICByaWdodDM6IHt9LFxyXG4gICAgcmlnaHQ6IHt9LFxyXG4gICAgbGVmdDoge30sXHJcbiAgfVxyXG4gIGxldCBpbnRlcnZJZFxyXG5cclxuICBmdW5jdGlvbiB0b1JlZ2V4IChwYXRoTXNnKSB7XHJcbiAgICBsZXQgW3BhdGgsIG1zZ10gPSBwYXRoTXNnLnNwbGl0KCc9PicpLm1hcChpdGVtID0+IGl0ZW0udHJpbSgpKVxyXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKVxyXG4gICAgcmV0dXJuIHsgcGF0aCwgbXNnIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3MpIHtcclxuICAgIGxldCBiclxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBidXR0b25zKSB7XHJcbiAgICAgIGNvbnN0IFtjYXB0aW9uLCBjb2xvciwga2xhc10gPSBpZC5zcGxpdCgnfCcpXHJcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXHJcbiAgICAgIGNvbnN0IGV2ICA9IGJ1dHRvbnNbaWRdXHJcbiAgICAgIGJ0bi5vbmNsaWNrID0gZSA9PiB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gZXYoZSlcclxuICAgICAgICBBcnJheS5pc0FycmF5KGFycikgJiYgcGxheShhcnIpXHJcbiAgICAgIH1cclxuICAgICAgYnRuLmlubmVyVGV4dCA9IGNhcHRpb25cclxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoJ21pdG0tYnRuJylcclxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoYCR7cG9zfWApXHJcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGtsYXMgfHwgY2FwdGlvbilcclxuICAgICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKVxyXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChidG4pXHJcbiAgICAgIGlmIChwb3M9PT0ncmlnaHQnKSB7XHJcbiAgICAgICAgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcclxuICAgICAgICBici5pbm5lckhUTUwgPSAnJm5ic3A7J1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJylcclxuICAgICAgICBici5zdHlsZSA9ICdtYXJnaW46IDBweDsnXHJcbiAgICAgIH1cclxuICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoYnIpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzZXRCdXR0b25zIChidXR0b25zLCBwb3NpdGlvbikge1xyXG4gICAgaWYgKGJncm91cFtwb3NpdGlvbl0pIHtcclxuICAgICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xyXG4gICAgICBjcmVhdGVCdXR0b24oYnV0dG9ucywgcG9zaXRpb24pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgZGVidW5rXHJcbiAgZnVuY3Rpb24gdXJsQ2hhbmdlIChldmVudCkge1xyXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ZpbGwpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9maWxsXHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2SWQpXHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWxcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvYnV0dG9ucykge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2J1dHRvbnNcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5yaWdodGJ1dHRvbnMpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLnJpZ2h0YnV0dG9uc1xyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmxlZnRidXR0b25zKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5sZWZ0YnV0dG9uc1xyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLm1hY3Jva2V5cykge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0ubWFjcm9rZXlzXHJcbiAgICB9XHJcbiAgICBpZiAobmFtZXNwYWNlKSB7XHJcbiAgICAgIGNvbnN0IHtocmVmLCBvcmlnaW59ID0gbG9jYXRpb25cclxuICAgICAgY29uc3QgX2hyZWYgPSBocmVmLnJlcGxhY2Uob3JpZ2luLCAnJylcclxuICAgICAgY29uc3Qge19tYWNyb3NfLCBtYWNyb3N9ID0gd2luZG93Lm1pdG1cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWFjcm9zKSB7XHJcbiAgICAgICAgY29uc3QgeyBwYXRoLCBtc2cgfSA9IHRvUmVnZXgoa2V5KVxyXG4gICAgICAgIGlmIChfaHJlZi5tYXRjaChwYXRoKSkge1xyXG4gICAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IG1zZyB8fCAnQXV0b2ZpbGwnXHJcbiAgICAgICAgICBfbWFjcm9zXyAmJiBfbWFjcm9zXygpXHJcbiAgICAgICAgICBtYWNyb3Nba2V5XSgpXHJcbiAgICAgICAgICBpZiAoZGVidW5rKSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChkZWJ1bmspXHJcbiAgICAgICAgICAgIGRlYnVuayA9IHVuZGVmaW5lZFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZGVidW5rID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodDMnKVxyXG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAncmlnaHQnKVxyXG4gICAgICAgICAgICBsZWZ0YnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zLCAnbGVmdCcpICBcclxuICAgICAgICAgIH0sIDApXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb250YWluZXIucmlnaHQzLnN0eWxlID0gY29udGFpbmVyU3R5bGUzXHJcbiAgICBjb250YWluZXIucmlnaHQuc3R5bGUgPSBjb250YWluZXJTdHlsZTFcclxuICAgIGNvbnRhaW5lci5sZWZ0LnN0eWxlICA9IGNvbnRhaW5lclN0eWxlMlxyXG4gICAgY29uc3QgdmlzaWJsZSA9ICh3aW5kb3cubWl0bS5hdXRvZmlsbClcclxuICAgIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGludGVydklkID0gc2V0SW50ZXJ2YWwod2luZG93Lm1pdG0uYXV0b2ludGVydmFsLCA1MDApXHJcbiAgICB9XHJcbiAgICBjdHJsID0gZmFsc2VcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XHJcbiAgICBpZiAoYXV0b2ZpbGwpIHtcclxuICAgICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gICAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxyXG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxyXG4gICAgICBjb25zb2xlLmxvZyhsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKSlcclxuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIHsgYXV0b2ZpbGwsIGJyb3dzZXIsIF9wYWdlLCBfZnJhbWUgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJ0bmNsaWNrIChlKSB7XHJcbiAgICBjb25zdCB7IGF1dG9maWxsIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgcGxheShhdXRvZmlsbClcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGtleWJDdHJsIChlKSB7XHJcbiAgICBjb25zdCB7IG1hY3Jva2V5cyB9ID0gd2luZG93Lm1pdG1cclxuICAgIGlmIChlLmN0cmxLZXkgJiYgZS5rZXkgPT09ICdTaGlmdCcpIHtcclxuICAgICAgY3RybCA9ICFjdHJsXHJcbiAgICAgIGNvbnRhaW5lci5yaWdodDMuc3R5bGUgPSBjb250YWluZXJTdHlsZTMgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICAgIGNvbnRhaW5lci5yaWdodC5zdHlsZSAgPSBjb250YWluZXJTdHlsZTEgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICAgIGNvbnRhaW5lci5sZWZ0LnN0eWxlICAgPSBjb250YWluZXJTdHlsZTIgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICB9IGVsc2UgaWYgKGUuY3RybEtleSAmJiBlLmFsdEtleSkge1xyXG4gICAgICBjb25zb2xlLmxvZyh7IG1hY3JvOiBgY3RybCArIGFsdCArICR7ZS5jb2RlfWAgfSlcclxuICAgICAgaWYgKG1hY3Jva2V5cykge1xyXG4gICAgICAgIGxldCBtYWNybyA9IG1hY3Jva2V5c1tlLmNvZGVdXHJcbiAgICAgICAgaWYgKG1hY3JvKSB7XHJcbiAgICAgICAgICBtYWNybyA9IG1hY3JvKClcclxuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG1hY3JvKSkge1xyXG4gICAgICAgICAgICBsZXQgbWFjcm9JbmRleCA9IDBcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgbGV0IHNlbGVjdG9yID0gbWFjcm9bbWFjcm9JbmRleF1cclxuICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBDc3NTZWxlY3RvckdlbmVyYXRvci5nZXRDc3NTZWxlY3Rvcihkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPSBgJHthY3RpdmVFbGVtZW50fSAke3NlbGVjdG9yfWBcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcGxheShbc2VsZWN0b3JdKVxyXG5cclxuICAgICAgICAgICAgICBtYWNyb0luZGV4ICs9IDFcclxuICAgICAgICAgICAgICBpZiAobWFjcm9JbmRleCA+PSBtYWNyby5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAxMDApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmICghd2luZG93LmNocm9tZSkge1xyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG4gIGlmICghY2hyb21lLnRhYnMpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5YkN0cmwpXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndXJsY2hhbmdlZCcsIHVybENoYW5nZSlcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgICAgY29uc3QgaHRtbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKVxyXG4gICAgICBjb25zdCBodG1scmVmID0gaHRtbC5maXJzdEVsZW1lbnRDaGlsZFxyXG4gICAgICBjb25zdCBzdHlsZUJ0bkxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXHJcbiAgICAgIGNvbnN0IGRpdlRvcFJpZ2h0MyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgIGNvbnN0IGRpdlRvcFJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgY29uc3QgZGl2VG9wTGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgIGNvbnN0IGF1dG8gPSAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hdXRvZmlsbFwiPkF1dG9maWxsPC9idXR0b24+J1xyXG5cclxuICAgICAgc3R5bGVCdG5MZWZ0LmlubmVySFRNTCA9ICdidXR0b24ubWl0bS1idG46aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTt9J1xyXG4gICAgICBkaXZUb3BSaWdodDMuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXJpZ2h0XCI+PC9zcGFuPmBcclxuICAgICAgZGl2VG9wUmlnaHQuaW5uZXJIVE1MICA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1yaWdodFwiPjwvc3Bhbj4ke2F1dG99YFxyXG4gICAgICBkaXZUb3BMZWZ0LmlubmVySFRNTCAgID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLWxlZnRcIj48L3NwYW4+YFxyXG4gICAgICBkaXZUb3BSaWdodC5jbGFzc05hbWUgID0gJ21pdG0gYXV0b2ZpbGwtY29udGFpbmVyJ1xyXG4gICAgICBkaXZUb3BMZWZ0LmNsYXNzTmFtZSAgID0gJ21pdG0gYXV0b2ZpbGwtY29udGFpbmVyJ1xyXG4gICAgICBkaXZUb3BSaWdodDMuc3R5bGUgPSBjb250YWluZXJTdHlsZTNcclxuICAgICAgZGl2VG9wUmlnaHQuc3R5bGUgID0gY29udGFpbmVyU3R5bGUxXHJcbiAgICAgIGRpdlRvcExlZnQuc3R5bGUgICA9IGNvbnRhaW5lclN0eWxlMlxyXG5cclxuICAgICAgaHRtbC5pbnNlcnRCZWZvcmUoc3R5bGVCdG5MZWZ0LCBodG1scmVmKVxyXG4gICAgICBodG1sLmluc2VydEJlZm9yZShkaXZUb3BSaWdodDMsIGh0bWxyZWYpXHJcbiAgICAgIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlRvcFJpZ2h0LCBodG1scmVmKVxyXG4gICAgICBodG1sLmluc2VydEJlZm9yZShkaXZUb3BMZWZ0LCBodG1scmVmKVxyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBjb250YWluZXIucmlnaHQzID0gZGl2VG9wUmlnaHQzXHJcbiAgICAgICAgY29udGFpbmVyLnJpZ2h0ICA9IGRpdlRvcFJpZ2h0XHJcbiAgICAgICAgY29udGFpbmVyLmxlZnQgICA9IGRpdlRvcExlZnRcclxuICAgICAgICBidXR0b24uc3R5bGUgID0gYCR7YnV0dG9uU3R5bGV9YmFja2dyb3VuZC1jb2xvcjogYXp1cmU7YFxyXG4gICAgICAgIGJncm91cC5yaWdodDMgPSBkaXZUb3BSaWdodDMuY2hpbGRyZW5bMF1cclxuICAgICAgICBiZ3JvdXAucmlnaHQgPSBkaXZUb3BSaWdodC5jaGlsZHJlblswXVxyXG4gICAgICAgIGJncm91cC5sZWZ0ICA9IGRpdlRvcExlZnQuY2hpbGRyZW5bMF1cclxuICAgICAgICBidXR0b24gPSBkaXZUb3BSaWdodC5jaGlsZHJlblsxXVxyXG4gICAgICAgIGJ1dHRvbi5vbmNsaWNrID0gYnRuY2xpY2tcclxuICAgICAgICB1cmxDaGFuZ2UoZXZlbnQpXHJcbiAgICAgICAgb2JzZXJ2ZWQoKVxyXG4gICAgICB9LCAwKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxyXG4gIGxldCBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxyXG5cclxuICBmdW5jdGlvbiBjb21wYXJlSHJlZigpIHtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdET00gbXV0YXRlZCEnKVxyXG4gICAgaWYgKG9sZEhyZWYgIT0gbG9jYXRpb24uaHJlZikge1xyXG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudClcclxuICAgICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGVcclxuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZuLmFwcGx5KGhpc3RvcnksIGFyZ3VtZW50cylcclxuICAgIGNvbXBhcmVIcmVmKClcclxuICB9XHJcblxyXG4gIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY29tcGFyZUhyZWYpO1xyXG4gIGZ1bmN0aW9uIG9ic2VydmVkKCkge1xyXG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXHJcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImJvZHlcIilcclxuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge2NoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZX0pXHJcbiAgfVxyXG59XHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlIChmbiwgZGVsYXkgPSA1MDApIHtcclxuICBsZXQgX3RpbWVvdXRcclxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXHJcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXHJcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXHJcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcclxuICAgIH0sIGRlbGF5KVxyXG4gIH1cclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlXHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGxldCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXHJcbiAgY29uc3Qge19zdWJuczogc30gPSByb3V0ZS5fY2hpbGRuc1xyXG4gIGlmIChzICYmIG1pdG0ucm91dGVzW3NdKSB7XHJcbiAgICByb3V0ZT0gbWl0bS5yb3V0ZXNbc11cclxuICB9XHJcbiAgcmV0dXJuIHJvdXRlXHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBNdXRhdGlvbk9ic2VydmVyICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX3dzX3JvdXRlID0gcmVxdWlyZSgnLi9fd3Nfcm91dGUnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgaWYgKGxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBjb25zdCBzc2hvdCA9IHt9XHJcbiAgY29uc3Qgbm9kZXMgPSB7fVxyXG5cclxuICBsZXQgcm91dGUgPSBfd3Nfcm91dGUoKVxyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBvYikge1xyXG4gICAgICBsZXQgZWwgPSB7fVxyXG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGlmICh0eXBlb2Ygb2JbaWRdICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGVsID0ge1xyXG4gICAgICAgICAgdGl0bGU6ICdub2NhcHR1cmUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICAgIHJlbW92ZTogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gb2JbaWRdLnNwbGl0KCc6JylcclxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XHJcbiAgICAgICAgICBlbFtlXSA9IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWxcclxuICAgICAgbm9kZXNbaWRdID0ge1xyXG4gICAgICAgIGluc2VydDogZmFsc2UsXHJcbiAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBvYlxyXG4gIGxldCBmbmFtZVxyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcclxuICBjb25zdCBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIG9iID0gcm91dGUuc2NyZWVuc2hvdC5vYnNlcnZlclxyXG4gICAgfVxyXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBub2Rlcykge1xyXG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChpZClcclxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWVcclxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAob2IgJiYgdHlwZW9mIG9iW2lkXT09PSdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kID0gZWxbMF0gfHwgZWxcclxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ9PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBub2QuX3dzX2NvdW50ID0gMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZC5fd3NfY291bnQgKz0gMVxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudDwyKSB7XHJcbiAgICAgICAgICAgICAgb2JbaWRdKG5vZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBcclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgICAgICAgICBmbmFtZSA9IGAke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YFxyXG4gICAgICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZVxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgXHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKF93c19kZWJvdW5jZShjYWxsYmFjaywgMTAwKSlcclxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWVcclxuICAgIH0pXHJcbiAgfSkgIFxyXG59XHJcbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJ1xyXG5cclxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XHJcbiAgbGV0IGlkID0gJydcclxuICB3aGlsZSAoc2l6ZS0tID4gMCkge1xyXG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXHJcbiAgfVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7IF93cyB9ID0gd2luZG93XHJcblxyXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19icm9hZGNhc3QgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XHJcbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4ID0gJycpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxyXG4gICAgX3dzLnNlbmQoYGVtaXRwYWdlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX3N0eWxlKHtcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn0pXHJcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBfc3R5bGUke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fcGluZygnSGkhJylcclxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19oZWxwKClcclxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XHJcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXHJcbiAgd2luZG93LndzX19vcGVuID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XHJcbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcclxuICAgIGNvbnN0IHsgX19mbGFnIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKVxyXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcclxuICAgIHdpbmRvdy5fd3NfcXVldWVba2V5XSA9IGhhbmRsZXIgfHwgKHcgPT4ge30pXHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2tleV0pIHtcclxuICAgICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtrZXldXHJcbiAgICAgICAgY29uc29sZS5sb2coJz4+PiB3cyB0aW1lb3V0IScsIGtleSlcclxuICAgICAgfVxyXG4gICAgfSwgNTAwMClcclxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXHJcbiAgICBpZiAoX19mbGFnWyd3cy1tZXNzYWdlJ10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ193cy5zZW5kJywgY21kKVxyXG4gICAgfVxyXG4gICAgX3dzLnNlbmQocGFyYW1zKVxyXG4gIH1cclxufVxyXG4vLyB3c19fc2VuZCgnX3BpbmcnLCAnTE9MJywgdz0+Y29uc29sZS5sb2coJz5yZXN1bHQnLHcpKTtcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuXHJcbmxldCBfdGltZW91dFxyXG5sZXQgX2NzcCA9IHt9XHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNzcEVycm9yID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXHJcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICAgIGNvbnN0IHBhdGggPSBsb2NhdGlvbi5wYXRobmFtZVxyXG4gICAgICAucmVwbGFjZSgvXlxcLy8sICcnKVxyXG4gICAgICAucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgIGNvbnN0IHtcclxuICAgICAgYmxvY2tlZFVSSSxcclxuICAgICAgZGlzcG9zaXRpb24sXHJcbiAgICAgIGRvY3VtZW50VVJJLFxyXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXHJcbiAgICAgIG9yaWdpbmFsUG9saWN5LFxyXG4gICAgICB0aW1lU3RhbXAsXHJcbiAgICAgIHR5cGUsXHJcbiAgICAgIHZpb2xhdGVkRGlyZWN0aXZlXHJcbiAgICB9ID0gZVxyXG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXHJcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xyXG4gICAgICBfY3NwW3R5cF0gPSB7fVxyXG4gICAgfVxyXG4gICAgaWYgKCFfY3NwW3R5cF0uX2dlbmVyYWxfKSB7XHJcbiAgICAgIF9jc3BbdHlwXS5fZ2VuZXJhbF8gPSB7XHJcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcclxuICAgICAgICBuYW1lc3BhY2UsXHJcbiAgICAgICAgaG9zdCxcclxuICAgICAgICBwYXRoXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF1cclxuICAgIGlmICghX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0pIHtcclxuICAgICAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0gPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IF9lcnIgPSBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXVxyXG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XHJcbiAgICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7fVxyXG4gICAgfVxyXG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApXHJcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmVcclxuICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7XHJcbiAgICAgIGRpcmVjdGl2ZSxcclxuICAgICAgdGltZVN0YW1wLFxyXG4gICAgICB0eXBlXHJcbiAgICB9XHJcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXHJcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IENTUDonLCBfY3NwKVxyXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcclxuICAgICAgLy8gICBuYW1lc3BhY2UsXHJcbiAgICAgIC8vICAgaG9zdCxcclxuICAgICAgLy8gICBwYXRoLFxyXG4gICAgICAvLyAgIF9jc3AsXHJcbiAgICAgIC8vIH0pO1xyXG4gICAgICBfY3NwID0ge31cclxuICAgIH0sIDQwMDApXHJcbiAgfVxyXG5cclxuICBpZiAod2luZG93Lm1pdG0uY2xpZW50LmNzcCkge1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcilcclxuICB9XHJcbn1cclxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcclxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxyXG4vLyB2aW9sYXRlZERpcmVjdGl2ZTogXCJpbWctc3JjXCJcclxuXHJcbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxyXG4vLyBlZmZlY3RpdmVEaXJlY3RpdmU6IFwiaW1nLXNyY1wiXHJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcclxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcclxuLy8gdHlwZTogXCJzZWN1cml0eXBvbGljeXZpb2xhdGlvblwiXHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXHJcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKVxyXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxyXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXHJcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJylcclxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcclxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgX3dzX3Bvc3RtZXNzYWdlKClcclxuICBfd3NfaW5pdFNvY2tldCgpXHJcbiAgX3dzX3NjcmVlbnNob3QoKVxyXG4gIF93c19sb2NhdGlvbigpXHJcbiAgX3dzX29ic2VydmVyKClcclxuICBfd3NfZ2VuZXJhbCgpXHJcbiAgX3dzX2NzcEVycigpXHJcbn1cclxuY29uc29sZS5sb2coJ3dzLWNsaWVudCBsb2FkZWQuLi4nKSJdLCJuYW1lcyI6WyJfd3NfZGVib3VuY2UiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQSxzQkFBaUIsTUFBTTtBQUN2QixFQUFFLFNBQVMsY0FBYyxFQUFFLEtBQUssRUFBRTtBQUNsQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0FBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUM7QUFDN0YsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBQztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBLGlCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsSUFBSSxVQUFTO0FBQ2YsRUFBRSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQztBQUN2QixLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQztBQUN2QixLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDckIsTUFBTSxNQUFNLFFBQVEsR0FBRyx3RkFBdUY7QUFDOUcsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUM7QUFDMUQsTUFBTSxTQUFTLENBQUMsSUFBSSxHQUFFO0FBQ3RCLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUN0QixNQUFNLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSTtBQUM3QixNQUFNLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQzFDLFFBQVEsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUMxQyxRQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0EsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFO0FBQzNCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEVBQUU7QUFDdEQsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFNO0FBQ25DLE9BQU87QUFDUCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO0FBQzNCLE1BQU0sTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFJO0FBQ25DLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNLEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtBQUNoRCxRQUFRLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUM7QUFDdEQsUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBQztBQUN6QyxPQUFPO0FBQ1AsS0FBSztBQUNMLElBQUksVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUMxQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksRUFBQztBQUNyQyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUk7QUFDL0IsS0FBSztBQUNMLEdBQUc7QUFDSDs7QUNoREE7QUFFQSxNQUFNLFNBQVMsR0FBRyxVQUFVLEdBQUU7QUFDOUI7QUFDQSxvQkFBaUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLO0FBQ2pDLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDOUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFO0FBQ3pCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztBQUM5RCxLQUFLLE1BQU07QUFDWCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUs7QUFDTCxHQUFHO0FBQ0gsRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUM7QUFDbEUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNYLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFHO0FBQzNCLElBQUksSUFBSTtBQUNSLE1BQU0sSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUN0QyxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztBQUMvQixPQUFPO0FBQ1AsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0FBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ2hDLEtBQUs7QUFDTCxJQUFJLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMvQixNQUFNLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDO0FBQzNDLE1BQU0sT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQztBQUNsQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0FBQ3hCLEtBQUssTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMvQixNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBQztBQUN0QyxLQUFLO0FBQ0wsR0FBRztBQUNIOztBQzlCQSxtQkFBaUIsTUFBTTtBQUN2QixFQUFFLElBQUksS0FBSTtBQUNWLEVBQUUsSUFBSTtBQUNOLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUc7QUFDckMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2QsSUFBSSxJQUFJLEdBQUcsS0FBSTtBQUNmLEdBQUc7QUFDSCxFQUFFLE9BQU8sSUFBSSxHQUFHLFFBQVEsR0FBRyxRQUFRO0FBQ25DOztBQ1JBO0FBSUE7QUFDQSxxQkFBaUIsTUFBTTtBQUN2QixFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRTtBQUN2QixFQUFFLE1BQU0sQ0FBQyxhQUFhLEdBQUcsTUFBSztBQUM5QixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUNoQztBQUNBLEVBQUUsSUFBSSxNQUFNLENBQUMsV0FBVyxHQUFHLFNBQVMsRUFBRTtBQUN0QyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEdBQUcsR0FBRTtBQUMzQixHQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSTtBQUN6QixJQUFJLFNBQVMsT0FBTyxHQUFHO0FBQ3ZCLE1BQU0sS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO0FBQzVDLFFBQVEsTUFBTSxDQUFDLGtCQUFrQixHQUFHLEtBQUk7QUFDeEMsUUFBUSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFDO0FBQ2xELFFBQVEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFDckMsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDOUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFDO0FBQ3hDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUM7QUFDekIsSUFBSSxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUk7QUFDL0I7QUFDQSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFDO0FBQzFCLElBQUksVUFBVSxDQUFDLE1BQU07QUFDckIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFO0FBQ3RDLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBQztBQUN4QyxRQUFRLE9BQU8sR0FBRTtBQUNqQixPQUFPO0FBQ1AsS0FBSyxFQUFFLEVBQUUsRUFBQztBQUNWLElBQUc7QUFDSDtBQUNBLEVBQUUsTUFBTSxPQUFPLEdBQUcsWUFBWTtBQUM5QixJQUFJLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFO0FBQzlCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBQztBQUN6QyxLQUFLO0FBQ0wsSUFBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUNqQztBQUNBO0FBQ0E7QUFDQSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztBQUNwQyxJQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDaEcsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUM7QUFDL0IsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztBQUNwQixFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRTtBQUNqQjtBQUNBLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxPQUFNO0FBQ3BCLEVBQUUsRUFBRSxDQUFDLE9BQU8sR0FBRyxRQUFPO0FBQ3RCLEVBQUUsRUFBRSxDQUFDLFNBQVMsR0FBRyxVQUFTO0FBQzFCLEVBQUUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDNUIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFDO0FBQ3RDLEdBQUc7QUFDSDs7QUMvREE7QUFDQSxvQkFBaUIsTUFBTTtBQUN2QixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsU0FBUTtBQUNyQyxFQUFFLElBQUksVUFBUztBQUNmO0FBQ0EsRUFBRSxTQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUU7QUFDekIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQzFELEdBQUc7QUFDSDtBQUNBLEVBQUUsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUN4QyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3hELE1BQU0sU0FBUyxHQUFHLElBQUc7QUFDckIsTUFBTSxLQUFLO0FBQ1gsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLE9BQU8sU0FBUztBQUNsQjs7QUNoQkEsaUJBQWlCLE1BQU07QUFDdkIsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsVUFBUztBQUM5QixFQUFFLE1BQU0sT0FBTyxHQUFHO0FBQ2xCLElBQUksRUFBRSxFQUFFLFNBQVM7QUFDakIsSUFBSSxhQUFhLEVBQUUsVUFBVTtBQUM3QixJQUFJLHNCQUFzQixFQUFFLFFBQVE7QUFDcEMsR0FBRyxDQUFDLE1BQU0sRUFBQztBQUNYLEVBQUUsT0FBTyxPQUFPO0FBQ2hCOztBQ1JBO0FBSUE7QUFDQSxJQUFJLElBQUc7QUFDUCxTQUFTLFVBQVUsRUFBRSxDQUFDLEVBQUU7QUFDeEIsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQzNCLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ3pCLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBUztBQUN4QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUM7QUFDckMsTUFBTSxNQUFNO0FBQ1osS0FBSztBQUNMLElBQUksSUFBSSxHQUFHLEVBQUU7QUFDYixNQUFNLEdBQUcsR0FBRyxVQUFTO0FBQ3JCLE1BQU0sTUFBTTtBQUNaLEtBQUs7QUFDTCxHQUFHO0FBQ0gsRUFBRSxNQUFNLFNBQVMsR0FBRyxhQUFhLEdBQUU7QUFDbkMsRUFBRSxNQUFNLE9BQU8sR0FBRyxVQUFVLEdBQUU7QUFDOUIsRUFBRSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFDO0FBQ25ELEVBQUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFDO0FBQzdDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFVO0FBQ3ZDO0FBQ0EsRUFBRSxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBQztBQUN0RCxFQUFFLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUM7QUFDdEQsRUFBRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBUztBQUN4RSxFQUFFLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQ3hCLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU07QUFDdkIsSUFBSSxPQUFPLEVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUU7QUFDbEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVU7QUFDNUIsS0FBSztBQUNMLElBQUksSUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksRUFBRTtBQUNoQyxNQUFNLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUM7QUFDeEMsTUFBTSxNQUFNLE1BQU0sR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sR0FBRTtBQUN4RCxNQUFNLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsTUFBSztBQUMvQyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBQztBQUMzQyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDL0I7QUFDQSxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFNO0FBQ3pDLFFBQVEsQ0FBQyxDQUFDLHdCQUF3QixHQUFFO0FBQ3BDLFFBQVEsQ0FBQyxDQUFDLGVBQWUsR0FBRTtBQUMzQixRQUFRLENBQUMsQ0FBQyxjQUFjLEdBQUU7QUFDMUIsUUFBUSxVQUFVLENBQUMsTUFBTTtBQUN6QixVQUFVLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVU7QUFDdEMsVUFBVSxJQUFJLEdBQUcsRUFBRTtBQUNuQixZQUFZLEdBQUcsQ0FBQyxLQUFLLEdBQUU7QUFDdkIsWUFBWSxHQUFHLEdBQUcsVUFBUztBQUMzQixXQUFXLE1BQU07QUFDakIsWUFBWSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDbEQsV0FBVztBQUNYLFNBQVMsRUFBRSxLQUFLLEVBQUM7QUFDakIsT0FBTztBQUNQLE1BQU0sTUFBTTtBQUNaLEtBQUs7QUFDTCxHQUFHO0FBQ0gsQ0FBQztBQUNEO0FBQ0EscUJBQWlCLE1BQU07QUFDdkIsRUFBRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBQztBQUNuRCxFQUFFLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7QUFDakMsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsTUFBTTtBQUN0RCxNQUFNLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQztBQUMxRSxLQUFLLEVBQUM7QUFDTixHQUFHO0FBQ0g7O0FDakVBO0FBSUE7QUFDQSxtQkFBaUIsTUFBTTtBQUN2QixFQUFFLE1BQU0sZUFBZSxHQUFHLDRDQUEyQztBQUNyRSxFQUFFLE1BQU0sZUFBZSxHQUFHLDRDQUEyQztBQUNyRSxFQUFFLE1BQU0sZUFBZSxHQUFHLHVEQUFzRDtBQUNoRixFQUFFLE1BQU0sV0FBVyxHQUFHLG9FQUFtRTtBQUN6RixFQUFFLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLFlBQVksRUFBQztBQUN2QyxFQUFFLElBQUksU0FBUyxHQUFHO0FBQ2xCLElBQUksTUFBTSxFQUFFLEVBQUU7QUFDZCxJQUFJLEtBQUssRUFBRSxFQUFFO0FBQ2IsSUFBSSxJQUFJLEVBQUUsRUFBRTtBQUNaLElBQUc7QUFDSCxFQUFFLElBQUksSUFBSSxHQUFHLE1BQUs7QUFDbEIsRUFBRSxJQUFJLE1BQU0sR0FBRyxHQUFFO0FBQ2pCLEVBQUUsSUFBSSxNQUFNLEdBQUc7QUFDZixJQUFJLE1BQU0sRUFBRSxFQUFFO0FBQ2QsSUFBSSxLQUFLLEVBQUUsRUFBRTtBQUNiLElBQUksSUFBSSxFQUFFLEVBQUU7QUFDWixJQUFHO0FBQ0gsRUFBRSxJQUFJLFNBQVE7QUFDZDtBQUNBLEVBQUUsU0FBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQzdCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxFQUFDO0FBQ2xFLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFDO0FBQzNELElBQUksT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDeEIsR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLFlBQVksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO0FBQ3RDLElBQUksSUFBSSxHQUFFO0FBQ1YsSUFBSSxLQUFLLE1BQU0sRUFBRSxJQUFJLE9BQU8sRUFBRTtBQUM5QixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDO0FBQ2xELE1BQU0sTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUM7QUFDbEQsTUFBTSxNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFDO0FBQzdCLE1BQU0sR0FBRyxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUk7QUFDekIsUUFBUSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFDO0FBQ3pCLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFDO0FBQ3ZDLFFBQU87QUFDUCxNQUFNLEdBQUcsQ0FBQyxTQUFTLEdBQUcsUUFBTztBQUM3QixNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBQztBQUNuQyxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBQ2pDLE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBQztBQUN4QyxNQUFNLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxJQUFJLEtBQUssR0FBRyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFDO0FBQ3RFLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUM7QUFDbEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxPQUFPLEVBQUU7QUFDekIsUUFBUSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7QUFDM0MsUUFBUSxFQUFFLENBQUMsU0FBUyxHQUFHLFNBQVE7QUFDL0IsT0FBTyxNQUFNO0FBQ2IsUUFBUSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUM7QUFDMUMsUUFBUSxFQUFFLENBQUMsS0FBSyxHQUFHLGVBQWM7QUFDakMsT0FBTztBQUNQLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUM7QUFDakMsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsU0FBUyxVQUFVLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRTtBQUMxQyxJQUFJLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQzFCLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFFO0FBQ3JDLE1BQU0sWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUM7QUFDckMsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxPQUFNO0FBQ1osRUFBRSxTQUFTLFNBQVMsRUFBRSxLQUFLLEVBQUU7QUFDN0IsSUFBSSxNQUFNLFNBQVMsR0FBRyxhQUFhLEdBQUU7QUFDckMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQzlCLE1BQU0sT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVE7QUFDakMsS0FBSztBQUNMLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUNsQyxNQUFNLGFBQWEsQ0FBQyxRQUFRLEVBQUM7QUFDN0IsTUFBTSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBWTtBQUNyQyxLQUFLO0FBQ0wsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQ2pDLE1BQU0sT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVc7QUFDcEMsS0FBSztBQUNMLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUNsQyxNQUFNLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFZO0FBQ3JDLEtBQUs7QUFDTCxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDakMsTUFBTSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBVztBQUNwQyxLQUFLO0FBQ0wsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQy9CLE1BQU0sT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVM7QUFDbEMsS0FBSztBQUNMLElBQUksSUFBSSxTQUFTLEVBQUU7QUFDbkIsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLFNBQVE7QUFDckMsTUFBTSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUM7QUFDNUMsTUFBTSxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO0FBQzVDLE1BQU0sS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUU7QUFDaEMsUUFBUSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUM7QUFDMUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDL0IsVUFBVSxNQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxXQUFVO0FBQzlDLFVBQVUsUUFBUSxJQUFJLFFBQVEsR0FBRTtBQUNoQyxVQUFVLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRTtBQUN2QixVQUFVLElBQUksTUFBTSxFQUFFO0FBQ3RCLFlBQVksWUFBWSxDQUFDLE1BQU0sRUFBQztBQUNoQyxZQUFZLE1BQU0sR0FBRyxVQUFTO0FBQzlCLFdBQVc7QUFDWCxVQUFVLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTTtBQUNwQyxZQUFZLE1BQU0sQ0FBQyxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO0FBQ3hFLFlBQVksWUFBWSxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFDO0FBQzlELFlBQVksV0FBVyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFDO0FBQzNELFlBQVksV0FBVyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFDO0FBQzFELFdBQVcsRUFBRSxDQUFDLEVBQUM7QUFDZixTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTCxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLGdCQUFlO0FBQzVDLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsZ0JBQWU7QUFDM0MsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxnQkFBZTtBQUMzQyxJQUFJLE1BQU0sT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFDO0FBQzFDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxXQUFXLElBQUksT0FBTyxHQUFHLDBCQUEwQixHQUFHLGdCQUFnQixFQUFDO0FBQzFGLElBQUksSUFBSSxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssVUFBVSxFQUFFO0FBQzFELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUM7QUFDM0QsS0FBSztBQUNMLElBQUksSUFBSSxHQUFHLE1BQUs7QUFDaEIsR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDM0IsSUFBSSxJQUFJLFFBQVEsRUFBRTtBQUNsQixNQUFNLElBQUksUUFBUSxRQUFRLENBQUMsS0FBSyxVQUFVLEVBQUU7QUFDNUMsUUFBUSxRQUFRLEdBQUcsUUFBUSxHQUFFO0FBQzdCLE9BQU87QUFDUCxNQUFNLE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRTtBQUNsQyxNQUFNLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFNO0FBQ25DLE1BQU0sTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBQztBQUN4QyxNQUFNLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUM7QUFDMUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUM7QUFDcEYsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFDO0FBQ3ZFLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQSxFQUFFLFNBQVMsUUFBUSxFQUFFLENBQUMsRUFBRTtBQUN4QixJQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUM7QUFDbEIsR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLFFBQVEsRUFBRSxDQUFDLEVBQUU7QUFDeEIsSUFBSSxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUk7QUFDckMsSUFBSSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxPQUFPLEVBQUU7QUFDeEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFJO0FBQ2xCLE1BQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsZUFBZSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxnQkFBZ0IsRUFBQztBQUNoRixNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLGVBQWUsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUM7QUFDaEYsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxlQUFlLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixFQUFDO0FBQ2hGLEtBQUssTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUN0QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBQztBQUN0RCxNQUFNLElBQUksU0FBUyxFQUFFO0FBQ3JCLFFBQVEsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFDckMsUUFBUSxJQUFJLEtBQUssRUFBRTtBQUNuQixVQUFVLEtBQUssR0FBRyxLQUFLLEdBQUU7QUFDekIsVUFBVSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDcEMsWUFBWSxJQUFJLFVBQVUsR0FBRyxFQUFDO0FBQzlCLFlBQVksTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU07QUFDL0MsY0FBYyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFDO0FBQzlDLGNBQWMsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQzlDLGdCQUFnQixNQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBQztBQUNqRyxnQkFBZ0IsUUFBUSxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFDO0FBQ3pELGVBQWU7QUFDZixjQUFjLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQzlCO0FBQ0EsY0FBYyxVQUFVLElBQUksRUFBQztBQUM3QixjQUFjLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDOUMsZ0JBQWdCLGFBQWEsQ0FBQyxRQUFRLEVBQUM7QUFDdkMsZUFBZTtBQUNmLGFBQWEsRUFBRSxHQUFHLEVBQUM7QUFDbkIsV0FBVztBQUNYLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RCLElBQUksTUFBTTtBQUNWLEdBQUc7QUFDSCxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3BCLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFDO0FBQ3hFLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUM7QUFDcEQ7QUFDQSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNO0FBQ3RELE1BQU0sTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7QUFDakQsTUFBTSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWlCO0FBQzVDLE1BQU0sTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUM7QUFDMUQsTUFBTSxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBQztBQUN4RCxNQUFNLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFDO0FBQ3ZELE1BQU0sTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUM7QUFDdEQsTUFBTSxNQUFNLElBQUksR0FBRyxpREFBZ0Q7QUFDbkU7QUFDQSxNQUFNLFlBQVksQ0FBQyxTQUFTLEdBQUcsb0RBQW1EO0FBQ2xGLE1BQU0sWUFBWSxDQUFDLFNBQVMsR0FBRyxDQUFDLGtDQUFrQyxFQUFDO0FBQ25FLE1BQU0sV0FBVyxDQUFDLFNBQVMsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxFQUFDO0FBQzFFLE1BQU0sVUFBVSxDQUFDLFNBQVMsS0FBSyxDQUFDLGlDQUFpQyxFQUFDO0FBQ2xFLE1BQU0sV0FBVyxDQUFDLFNBQVMsSUFBSSwwQkFBeUI7QUFDeEQsTUFBTSxVQUFVLENBQUMsU0FBUyxLQUFLLDBCQUF5QjtBQUN4RCxNQUFNLFlBQVksQ0FBQyxLQUFLLEdBQUcsZ0JBQWU7QUFDMUMsTUFBTSxXQUFXLENBQUMsS0FBSyxJQUFJLGdCQUFlO0FBQzFDLE1BQU0sVUFBVSxDQUFDLEtBQUssS0FBSyxnQkFBZTtBQUMxQztBQUNBLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFDO0FBQzlDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFDO0FBQzlDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFDO0FBQzdDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFDO0FBQzVDLE1BQU0sVUFBVSxDQUFDLE1BQU07QUFDdkIsUUFBUSxTQUFTLENBQUMsTUFBTSxHQUFHLGFBQVk7QUFDdkMsUUFBUSxTQUFTLENBQUMsS0FBSyxJQUFJLFlBQVc7QUFDdEMsUUFBUSxTQUFTLENBQUMsSUFBSSxLQUFLLFdBQVU7QUFDckMsUUFBUSxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRSxXQUFXLENBQUMsd0JBQXdCLEVBQUM7QUFDaEUsUUFBUSxNQUFNLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0FBQ2hELFFBQVEsTUFBTSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQztBQUM5QyxRQUFRLE1BQU0sQ0FBQyxJQUFJLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7QUFDN0MsUUFBUSxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7QUFDeEMsUUFBUSxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVE7QUFDakMsUUFBUSxTQUFTLENBQU0sRUFBQztBQUN4QixRQUFRLFFBQVEsR0FBRTtBQUNsQixPQUFPLEVBQUUsQ0FBQyxFQUFDO0FBQ1gsS0FBSyxFQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsU0FBUTtBQUM3QixFQUFFLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFJO0FBQzdCO0FBQ0EsRUFBRSxTQUFTLFdBQVcsR0FBRztBQUN6QjtBQUNBLElBQUksSUFBSSxPQUFPLElBQUksUUFBUSxDQUFDLElBQUksRUFBRTtBQUNsQyxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFDO0FBQ2pDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFJO0FBQzdCLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFTO0FBQzlCLEVBQUUsT0FBTyxDQUFDLFNBQVMsR0FBRyxZQUFZO0FBQ2xDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFDO0FBQ2hDLElBQUksV0FBVyxHQUFFO0FBQ2pCLElBQUc7QUFDSDtBQUNBLEVBQUUsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNyRCxFQUFFLFNBQVMsUUFBUSxHQUFHO0FBQ3RCLElBQUksUUFBUSxDQUFDLFVBQVUsR0FBRTtBQUN6QixJQUFJLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO0FBQy9DLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBQztBQUM1RCxHQUFHO0FBQ0g7O0FDbFBBLFNBQVMsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEdBQUcsR0FBRyxFQUFFO0FBQ3BDLEVBQUUsSUFBSSxTQUFRO0FBQ2QsRUFBRSxPQUFPLFlBQVk7QUFDckIsSUFBSSxNQUFNLEtBQUssR0FBRyxLQUFJO0FBQ3RCLElBQUksTUFBTSxJQUFJLEdBQUcsVUFBUztBQUMxQixJQUFJLFFBQVEsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFDO0FBQ3RDLElBQUksUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNO0FBQ2hDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFDO0FBQzNCLEtBQUssRUFBRSxLQUFLLEVBQUM7QUFDYixHQUFHO0FBQ0g7O0FDVkE7QUFFQTtBQUNBLGdCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsTUFBTSxTQUFTLEdBQUcsYUFBYSxHQUFFO0FBQ25DLEVBQUUsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFDO0FBQzNDLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUTtBQUNwQyxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDM0IsSUFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUM7QUFDekIsR0FBRztBQUNILEVBQUUsT0FBTyxLQUFLO0FBQ2Q7O0FDWEE7QUFNQTtBQUNBLG1CQUFpQixNQUFNO0FBQ3ZCLEVBQUUsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO0FBQ2pELElBQUksTUFBTTtBQUNWLEdBQUc7QUFDSCxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsU0FBUTtBQUNyQyxFQUFFLE1BQU0sS0FBSyxHQUFHLEdBQUU7QUFDbEIsRUFBRSxNQUFNLEtBQUssR0FBRyxHQUFFO0FBQ2xCO0FBQ0EsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTLEdBQUU7QUFDekIsRUFBRSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO0FBQ2pDLElBQUksTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVTtBQUM3QyxJQUFJLEtBQUssTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO0FBQ3pCLE1BQU0sSUFBSSxFQUFFLEdBQUcsR0FBRTtBQUNqQixNQUFNLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRTtBQUMzQixRQUFRLEVBQUUsR0FBRztBQUNiLFVBQVUsS0FBSyxFQUFFLFNBQVM7QUFDMUIsVUFBVSxNQUFNLEVBQUUsSUFBSTtBQUN0QixVQUFVLE1BQU0sRUFBRSxJQUFJO0FBQ3RCLFVBQVM7QUFDVCxPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxRQUFRLEVBQUU7QUFDeEMsUUFBUSxFQUFFLEdBQUc7QUFDYixVQUFVLEtBQUssRUFBRSxXQUFXO0FBQzVCLFVBQVUsTUFBTSxFQUFFLEtBQUs7QUFDdkIsVUFBVSxNQUFNLEVBQUUsS0FBSztBQUN2QixVQUFTO0FBQ1QsT0FBTyxNQUFNO0FBQ2IsUUFBUSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQztBQUNyQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtBQUNuQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFJO0FBQ3RCLFNBQVMsRUFBQztBQUNWLFFBQVEsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBQ3pCLE9BQU87QUFDUCxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFFO0FBQ3BCLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHO0FBQ2xCLFFBQVEsTUFBTSxFQUFFLEtBQUs7QUFDckIsUUFBUSxNQUFNLEVBQUUsSUFBSTtBQUNwQixRQUFPO0FBQ1AsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxHQUFFO0FBQ1IsRUFBRSxJQUFJLE1BQUs7QUFDWCxFQUFFLE1BQU0sU0FBUyxHQUFHLGFBQWEsR0FBRTtBQUNuQyxFQUFFLE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRTtBQUM5QixFQUFFLE1BQU0sUUFBUSxHQUFHLFlBQVk7QUFDL0IsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO0FBQ25DLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUTtBQUNwQyxLQUFLO0FBQ0wsSUFBSSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFDO0FBQ3RDLElBQUksS0FBSyxNQUFNLEVBQUUsSUFBSSxLQUFLLEVBQUU7QUFDNUIsTUFBTSxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBQztBQUNuRCxNQUFNLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRTtBQUNyQixRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFO0FBQy9CLFVBQVUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxLQUFJO0FBQ2pDLFVBQVUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtBQUM5QyxZQUFZLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBSztBQUNwQyxXQUFXO0FBQ1gsVUFBVSxJQUFJLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUU7QUFDaEQsWUFBWSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRTtBQUNuQyxZQUFZLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxTQUFTLEVBQUU7QUFDM0MsY0FBYyxHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUM7QUFDL0IsYUFBYTtBQUNiLFlBQVksR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFDO0FBQzlCLFlBQVksSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRTtBQUNqQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUM7QUFDekIsYUFBYTtBQUNiLFdBQVc7QUFDWCxVQUFVLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUNoQyxZQUFZLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUM7QUFDNUUsWUFBWSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUM7QUFDeEQsWUFBWSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBQztBQUNyRixXQUFXO0FBQ1gsU0FBUztBQUNULE9BQU8sTUFBTTtBQUNiLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDL0IsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUk7QUFDakMsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQUs7QUFDbEMsVUFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDaEMsWUFBWSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDO0FBQzVFLFlBQVksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFDO0FBQ3hELFlBQVksTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUM7QUFDckYsV0FBVztBQUNYLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSztBQUNMLElBQUc7QUFDSDtBQUNBLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLE1BQU07QUFDdEQsSUFBSSxNQUFNLFFBQVEsR0FBRyxJQUFJLGdCQUFnQixDQUFDQSxRQUFZLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFDO0FBQ3RFLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3BDLE1BQU0sVUFBVSxFQUFFLElBQUk7QUFDdEIsTUFBTSxTQUFTLEVBQUUsSUFBSTtBQUNyQixNQUFNLE9BQU8sRUFBRSxJQUFJO0FBQ25CLEtBQUssRUFBQztBQUNOLEdBQUcsRUFBQztBQUNKOztBQ3RHQSxNQUFNLEdBQUcsR0FBRyxtRUFBa0U7QUFDOUU7QUFDQSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUs7QUFDN0IsRUFBRSxJQUFJLEVBQUUsR0FBRyxHQUFFO0FBQ2IsRUFBRSxPQUFPLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNyQixJQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUM7QUFDckMsR0FBRztBQUNILEVBQUUsT0FBTyxFQUFFO0FBQ1gsRUFBQztBQUNEO0FBQ0Esa0JBQWlCLE1BQU07QUFDdkIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTTtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztBQUMvQyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQy9DLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsS0FBSztBQUM3QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUU7QUFDckMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQzlDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUs7QUFDNUMsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQ3BDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUM1QyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztBQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtBQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDM0MsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDO0FBQ3ZCLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQzlCLElBQUksR0FBRyxDQUFD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
