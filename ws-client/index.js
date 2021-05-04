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
  const containerStyle3 = 'position: fixed;z-index: 9999;right: 3px; top: 20px; text-align: end;';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIl9zcmMvX3dzX3Bvc3RtZXNzYWdlLmpzIiwiX3NyYy9fd3NfY2xpZW50LmpzIiwiX3NyYy9fd3NfbXNnLXBhcnNlci5qcyIsIl9zcmMvX3dzX2luLWlmcmFtZS5qcyIsIl9zcmMvX3dzX2luaXQtc29ja2V0LmpzIiwiX3NyYy9fd3NfbmFtZXNwYWNlLmpzIiwiX3NyYy9fd3NfdmVuZG9yLmpzIiwiX3NyYy9fd3Nfc2NyZWVuc2hvdC5qcyIsIl9zcmMvX3dzX2xvY2F0aW9uLmpzIiwiX3NyYy9fd3NfZGVib3VuY2UuanMiLCJfc3JjL193c19yb3V0ZS5qcyIsIl9zcmMvX3dzX29ic2VydmVyLmpzIiwiX3NyYy9fd3NfZ2VuZXJhbC5qcyIsIl9zcmMvX3dzX2NzcC1lcnIuanMiLCJfc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcclxuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYD4+PiBQb3N0bWVzc2FnZTogJHtldmVudC5vcmlnaW59ID0+IGh0dHBzOi8vJHtsb2NhdGlvbi5ob3N0fWAsIGV2ZW50LmRhdGEpXHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxyXG5cclxuICAvLyBpZiAoIWNocm9tZS53aW5kb3dzKSB7XHJcbiAgLy8gICBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xyXG4gIC8vICAgICBjb25zdCB7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9ID0gd2luZG93O1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyh7aW5uZXJXaWR0aCwgaW5uZXJIZWlnaHR9KTtcclxuICAvLyAgIH1cclxuICAvLyAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xyXG4gIC8vIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgd2luZG93UmVmXHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGV4OiB3c19faGVscCgpXHJcbiAgICBfaGVscCAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX3BpbmcoXCJ0aGVyZVwiKVxyXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxyXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gJ2RpcmVjdG9yaWVzPTAsdGl0bGViYXI9MCx0b29sYmFyPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAsd2lkdGg9ODAwLGhlaWdodD02MDAnXHJcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcclxuICAgICAgd2luZG93UmVmLmJsdXIoKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcclxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgeyBxLCBjc3MgfSA9IGRhdGFcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxyXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcclxuICAgICAgKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfc2F2ZVRhZ3MgKHsgcm91dGVzIH0pIHtcclxuICAgICAgaWYgKCFsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xyXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xyXG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICBjb25zb2xlLndhcm4oYHJlY2VpdmUgYnJvZGNhc3QgJHt0eXB9YClcclxuICAgICAgLyoqXHJcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAgICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxyXG4gICAgICAgKi9cclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0gKyAnJylcclxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdfc2V0Q2xpZW50JywgZGF0YSlcclxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX2NsaWVudCA9IHJlcXVpcmUoJy4vX3dzX2NsaWVudCcpXHJcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZXZlbnQsIG1zZykgPT4ge1xyXG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnKSB7XHJcbiAgICBpZiAobXNnLmxlbmd0aCA+IDQwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzLi4uYCcsIG1zZy5zbGljZSgwLCA0MCkpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLylcclxuICBpZiAoYXJyKSB7XHJcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHR5cGVvZiAoanNvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2NtZF0pIHtcclxuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxyXG4gICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGhhbmRsZXIoanNvbi5kYXRhKVxyXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xyXG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBsZXQgaWZybVxyXG4gIHRyeSB7XHJcbiAgICBpZnJtID0gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3BcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZnJtID0gdHJ1ZVxyXG4gIH1cclxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcclxufVxyXG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXHJcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXHJcbiAgICAgICAgY29uc29sZS53YXJuKHdpbmRvdy5fd3NfY29ubmVjdFtrZXldICsgJycpXHJcbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0W2tleV0oZGF0YSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnd3M6IG9wZW4gY29ubmVjdGlvbicpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS50aW1lRW5kKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IHRydWVcclxuXHJcbiAgICBzZXRUaW1lb3V0KHdzX3NlbmQsIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignUkVUUlkuLi4uLi4uLi4uJylcclxuICAgICAgICB3c19zZW5kKClcclxuICAgICAgfVxyXG4gICAgfSwgMTApIC8vIG1pbmltaXplIGludGVybWl0dGVuICAgICBcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJ3dzOiBjbG9zZSBjb25uZWN0aW9uJylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgIC8vICAgY29uc29sZS5sb2coJ29uLW1lc3NhZ2U6JywgZS5kYXRhKVxyXG4gICAgLy8gfVxyXG4gICAgX3dzX21zZ1BhcnNlcihldmVudCwgZXZlbnQuZGF0YSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHVybCA9IGB3c3M6Ly9sb2NhbGhvc3Q6MzAwMS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKVxyXG4gIGNvbnNvbGUudGltZSgnd3MnKVxyXG4gIHdpbmRvdy5fd3MgPSB3c1xyXG5cclxuICB3cy5vbm9wZW4gPSBvbm9wZW5cclxuICB3cy5vbmNsb3NlID0gb25jbG9zZVxyXG4gIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3dzOiBpbml0IGNvbm5lY3Rpb24nKVxyXG4gIH1cclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vLCAnW14uXSonKSkpKSB7XHJcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbmFtZXNwYWNlXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyB2ZW5kb3IgfSA9IG5hdmlnYXRvclxyXG4gIGNvbnN0IGJyb3dzZXIgPSB7XHJcbiAgICAnJzogJ2ZpcmVmb3gnLFxyXG4gICAgJ0dvb2dsZSBJbmMuJzogJ2Nocm9taXVtJyxcclxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXHJcbiAgfVt2ZW5kb3JdXHJcbiAgcmV0dXJuIGJyb3dzZXJcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIG1pdG0gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxyXG4gICAgICBwYXJhbXMuZm5hbWUgPSBmbmFtZT09PSd+JyA/ICd+XycgOiBmbmFtZVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBwYXJhbXMpXHJcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICAgICAgLy8gZGVsYXkgYWN0aW9uIHRvIGZpbmlzaCBzY3JlZW5zaG90XHJcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcclxuICAgICAgICAgIGlmIChhY3QpIHtcclxuICAgICAgICAgICAgYWN0LmNsaWNrKClcclxuICAgICAgICAgICAgYWN0ID0gdW5kZWZpbmVkICBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkZWxheSBhY3Rpb24gdW5kZWZpbmVkJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZGVsYXkpXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY29udGFpbmVyU3R5bGUxID0gJ3Bvc2l0aW9uOiBmaXhlZDt6LWluZGV4OiA5OTk5O3JpZ2h0OiAzcHg7J1xyXG4gIGNvbnN0IGNvbnRhaW5lclN0eWxlMiA9ICdwb3NpdGlvbjogZml4ZWQ7ei1pbmRleDogOTk5OTtsZWZ0OiAgM3B4OydcclxuICBjb25zdCBjb250YWluZXJTdHlsZTMgPSAncG9zaXRpb246IGZpeGVkO3otaW5kZXg6IDk5OTk7cmlnaHQ6IDNweDsgdG9wOiAyMHB4OyB0ZXh0LWFsaWduOiBlbmQ7J1xyXG4gIGNvbnN0IGJ1dHRvblN0eWxlID0gJ2JvcmRlcjogbm9uZTtib3JkZXItcmFkaXVzOiAxNXB4O2ZvbnQtc2l6ZTogMTBweDtjdXJzb3I6IHBvaW50ZXI7J1xyXG4gIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJylcclxuICBsZXQgY29udGFpbmVyID0ge1xyXG4gICAgcmlnaHQzOiB7fSxcclxuICAgIHJpZ2h0OiB7fSxcclxuICAgIGxlZnQ6IHt9LFxyXG4gIH1cclxuICBsZXQgY3RybCA9IGZhbHNlXHJcbiAgbGV0IGJ1dHRvbiA9IHt9XHJcbiAgbGV0IGJncm91cCA9IHtcclxuICAgIHJpZ2h0Mzoge30sXHJcbiAgICByaWdodDoge30sXHJcbiAgICBsZWZ0OiB7fSxcclxuICB9XHJcbiAgbGV0IGludGVydklkXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHBhdGhNc2cpIHtcclxuICAgIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgICByZXR1cm4geyBwYXRoLCBtc2cgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvcykge1xyXG4gICAgbGV0IGJyXHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIGJ1dHRvbnMpIHtcclxuICAgICAgY29uc3QgW2NhcHRpb24sIGNvbG9yLCBrbGFzXSA9IGlkLnNwbGl0KCd8JylcclxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcclxuICAgICAgY29uc3QgZXYgID0gYnV0dG9uc1tpZF1cclxuICAgICAgYnRuLm9uY2xpY2sgPSBlID0+IHtcclxuICAgICAgICBjb25zdCBhcnIgPSBldihlKVxyXG4gICAgICAgIEFycmF5LmlzQXJyYXkoYXJyKSAmJiBwbGF5KGFycilcclxuICAgICAgfVxyXG4gICAgICBidG4uaW5uZXJUZXh0ID0gY2FwdGlvblxyXG4gICAgICBidG4uY2xhc3NMaXN0LmFkZCgnbWl0bS1idG4nKVxyXG4gICAgICBidG4uY2xhc3NMaXN0LmFkZChgJHtwb3N9YClcclxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoa2xhcyB8fCBjYXB0aW9uKVxyXG4gICAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXHJcbiAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJ0bilcclxuICAgICAgaWYgKHBvcz09PSdyaWdodCcpIHtcclxuICAgICAgICBiciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxyXG4gICAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKVxyXG4gICAgICAgIGJyLnN0eWxlID0gJ21hcmdpbjogMHB4OydcclxuICAgICAgfVxyXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChicilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNldEJ1dHRvbnMgKGJ1dHRvbnMsIHBvc2l0aW9uKSB7XHJcbiAgICBpZiAoYmdyb3VwW3Bvc2l0aW9uXSkge1xyXG4gICAgICBiZ3JvdXBbcG9zaXRpb25dLmlubmVySFRNTCA9ICcnXHJcbiAgICAgIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3NpdGlvbilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBkZWJ1bmtcclxuICBmdW5jdGlvbiB1cmxDaGFuZ2UgKGV2ZW50KSB7XHJcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0uYXV0b2ZpbGxcclxuICAgIH1cclxuICAgIGlmICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZJZClcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbFxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLmF1dG9idXR0b25zKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5hdXRvYnV0dG9uc1xyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5taXRtLnJpZ2h0YnV0dG9ucykge1xyXG4gICAgICBkZWxldGUgd2luZG93Lm1pdG0ucmlnaHRidXR0b25zXHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0ubGVmdGJ1dHRvbnMpIHtcclxuICAgICAgZGVsZXRlIHdpbmRvdy5taXRtLmxlZnRidXR0b25zXHJcbiAgICB9XHJcbiAgICBpZiAod2luZG93Lm1pdG0ubWFjcm9rZXlzKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5tYWNyb2tleXNcclxuICAgIH1cclxuICAgIGlmIChuYW1lc3BhY2UpIHtcclxuICAgICAgY29uc3Qge2hyZWYsIG9yaWdpbn0gPSBsb2NhdGlvblxyXG4gICAgICBjb25zdCBfaHJlZiA9IGhyZWYucmVwbGFjZShvcmlnaW4sICcnKVxyXG4gICAgICBjb25zdCB7X21hY3Jvc18sIG1hY3Jvc30gPSB3aW5kb3cubWl0bVxyXG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBtYWNyb3MpIHtcclxuICAgICAgICBjb25zdCB7IHBhdGgsIG1zZyB9ID0gdG9SZWdleChrZXkpXHJcbiAgICAgICAgaWYgKF9ocmVmLm1hdGNoKHBhdGgpKSB7XHJcbiAgICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbXNnIHx8ICdBdXRvZmlsbCdcclxuICAgICAgICAgIF9tYWNyb3NfICYmIF9tYWNyb3NfKClcclxuICAgICAgICAgIG1hY3Jvc1trZXldKClcclxuICAgICAgICAgIGlmIChkZWJ1bmspIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYnVuaylcclxuICAgICAgICAgICAgZGVidW5rID0gdW5kZWZpbmVkXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBkZWJ1bmsgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qge2F1dG9idXR0b25zLCByaWdodGJ1dHRvbnMsIGxlZnRidXR0b25zfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgICAgICAgIHJpZ2h0YnV0dG9ucyAmJiBzZXRCdXR0b25zKHJpZ2h0YnV0dG9ucywgJ3JpZ2h0MycpXHJcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICdyaWdodCcpXHJcbiAgICAgICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JykgIFxyXG4gICAgICAgICAgfSwgMClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRhaW5lci5yaWdodDMuc3R5bGUgPSBjb250YWluZXJTdHlsZTNcclxuICAgIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IGNvbnRhaW5lclN0eWxlMVxyXG4gICAgY29udGFpbmVyLmxlZnQuc3R5bGUgID0gY29udGFpbmVyU3R5bGUyXHJcbiAgICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxyXG4gICAgYnV0dG9uLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAodmlzaWJsZSA/ICdiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTsnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgIGlmICh0eXBlb2YgKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcclxuICAgIH1cclxuICAgIGN0cmwgPSBmYWxzZVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcGxheSAoYXV0b2ZpbGwpIHtcclxuICAgIGlmIChhdXRvZmlsbCkge1xyXG4gICAgICBpZiAodHlwZW9mIChhdXRvZmlsbCkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgICAgIGNvbnN0IGxlbnRoID0gYXV0b2ZpbGwubGVuZ3RoXHJcbiAgICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cclxuICAgICAgY29uc3QgX2ZyYW1lID0gd2luZG93Wyd4cGxheS1mcmFtZSddXHJcbiAgICAgIGNvbnNvbGUubG9nKGxlbnRoID09PSAxID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpKVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoJ2F1dG9maWxsJywgeyBhdXRvZmlsbCwgYnJvd3NlciwgX3BhZ2UsIF9mcmFtZSB9KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYnRuY2xpY2sgKGUpIHtcclxuICAgIGNvbnN0IHsgYXV0b2ZpbGwgfSA9IHdpbmRvdy5taXRtXHJcbiAgICBwbGF5KGF1dG9maWxsKVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24ga2V5YkN0cmwgKGUpIHtcclxuICAgIGNvbnN0IHsgbWFjcm9rZXlzIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgaWYgKGUuY3RybEtleSAmJiBlLmtleSA9PT0gJ1NoaWZ0Jykge1xyXG4gICAgICBjdHJsID0gIWN0cmxcclxuICAgICAgY29udGFpbmVyLnJpZ2h0My5zdHlsZSA9IGNvbnRhaW5lclN0eWxlMyArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgICAgY29udGFpbmVyLnJpZ2h0LnN0eWxlICA9IGNvbnRhaW5lclN0eWxlMSArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgICAgY29udGFpbmVyLmxlZnQuc3R5bGUgICA9IGNvbnRhaW5lclN0eWxlMiArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5ICYmIGUuYWx0S2V5KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKHsgbWFjcm86IGBjdHJsICsgYWx0ICsgJHtlLmNvZGV9YCB9KVxyXG4gICAgICBpZiAobWFjcm9rZXlzKSB7XHJcbiAgICAgICAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2UuY29kZV1cclxuICAgICAgICBpZiAobWFjcm8pIHtcclxuICAgICAgICAgIG1hY3JvID0gbWFjcm8oKVxyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobWFjcm8pKSB7XHJcbiAgICAgICAgICAgIGxldCBtYWNyb0luZGV4ID0gMFxyXG4gICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgc2VsZWN0b3IgPSBtYWNyb1ttYWNyb0luZGV4XVxyXG4gICAgICAgICAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXiAqWz0tXT4vKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9IGAke2FjdGl2ZUVsZW1lbnR9ICR7c2VsZWN0b3J9YFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBwbGF5KFtzZWxlY3Rvcl0pXHJcblxyXG4gICAgICAgICAgICAgIG1hY3JvSW5kZXggKz0gMVxyXG4gICAgICAgICAgICAgIGlmIChtYWNyb0luZGV4ID49IG1hY3JvLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDEwMClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgaWYgKCF3aW5kb3cuY2hyb21lKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgaWYgKCFjaHJvbWUudGFicykge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBodG1sID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpXHJcbiAgICAgIGNvbnN0IGh0bWxyZWYgPSBodG1sLmZpcnN0RWxlbWVudENoaWxkXHJcbiAgICAgIGNvbnN0IHN0eWxlQnRuTGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcclxuICAgICAgY29uc3QgZGl2VG9wUmlnaHQzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgY29uc3QgZGl2VG9wUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICBjb25zdCBkaXZUb3BMZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgY29uc3QgYXV0byA9ICc8YnV0dG9uIGNsYXNzPVwiYnRuLWF1dG9maWxsXCI+QXV0b2ZpbGw8L2J1dHRvbj4nXHJcblxyXG4gICAgICBzdHlsZUJ0bkxlZnQuaW5uZXJIVE1MID0gJ2J1dHRvbi5taXRtLWJ0bjpob3Zlcnt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO30nXHJcbiAgICAgIGRpdlRvcFJpZ2h0My5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtcmlnaHRcIj48L3NwYW4+YFxyXG4gICAgICBkaXZUb3BSaWdodC5pbm5lckhUTUwgID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXJpZ2h0XCI+PC9zcGFuPiR7YXV0b31gXHJcbiAgICAgIGRpdlRvcExlZnQuaW5uZXJIVE1MICAgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtbGVmdFwiPjwvc3Bhbj5gXHJcbiAgICAgIGRpdlRvcFJpZ2h0LmNsYXNzTmFtZSAgPSAnbWl0bSBhdXRvZmlsbC1jb250YWluZXInXHJcbiAgICAgIGRpdlRvcExlZnQuY2xhc3NOYW1lICAgPSAnbWl0bSBhdXRvZmlsbC1jb250YWluZXInXHJcbiAgICAgIGRpdlRvcFJpZ2h0My5zdHlsZSA9IGNvbnRhaW5lclN0eWxlM1xyXG4gICAgICBkaXZUb3BSaWdodC5zdHlsZSAgPSBjb250YWluZXJTdHlsZTFcclxuICAgICAgZGl2VG9wTGVmdC5zdHlsZSAgID0gY29udGFpbmVyU3R5bGUyXHJcblxyXG4gICAgICBodG1sLmluc2VydEJlZm9yZShzdHlsZUJ0bkxlZnQsIGh0bWxyZWYpXHJcbiAgICAgIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlRvcFJpZ2h0MywgaHRtbHJlZilcclxuICAgICAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2VG9wUmlnaHQsIGh0bWxyZWYpXHJcbiAgICAgIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlRvcExlZnQsIGh0bWxyZWYpXHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGNvbnRhaW5lci5yaWdodDMgPSBkaXZUb3BSaWdodDNcclxuICAgICAgICBjb250YWluZXIucmlnaHQgID0gZGl2VG9wUmlnaHRcclxuICAgICAgICBjb250YWluZXIubGVmdCAgID0gZGl2VG9wTGVmdFxyXG4gICAgICAgIGJ1dHRvbi5zdHlsZSAgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXHJcbiAgICAgICAgYmdyb3VwLnJpZ2h0MyA9IGRpdlRvcFJpZ2h0My5jaGlsZHJlblswXVxyXG4gICAgICAgIGJncm91cC5yaWdodCA9IGRpdlRvcFJpZ2h0LmNoaWxkcmVuWzBdXHJcbiAgICAgICAgYmdyb3VwLmxlZnQgID0gZGl2VG9wTGVmdC5jaGlsZHJlblswXVxyXG4gICAgICAgIGJ1dHRvbiA9IGRpdlRvcFJpZ2h0LmNoaWxkcmVuWzFdXHJcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBidG5jbGlja1xyXG4gICAgICAgIHVybENoYW5nZShldmVudClcclxuICAgICAgICBvYnNlcnZlZCgpXHJcbiAgICAgIH0sIDApXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgY29uc3Qge2xvY2F0aW9ufSA9IGRvY3VtZW50XHJcbiAgbGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXHJcblxyXG4gIGZ1bmN0aW9uIGNvbXBhcmVIcmVmKCkge1xyXG4gICAgLy8gY29uc29sZS5sb2coJ0RPTSBtdXRhdGVkIScpXHJcbiAgICBpZiAob2xkSHJlZiAhPSBsb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KVxyXG4gICAgICBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxyXG4gICAgY29tcGFyZUhyZWYoKVxyXG4gIH1cclxuXHJcbiAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XHJcbiAgZnVuY3Rpb24gb2JzZXJ2ZWQoKSB7XHJcbiAgICBvYnNlcnZlci5kaXNjb25uZWN0KClcclxuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiYm9keVwiKVxyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSlcclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xyXG4gIGxldCBfdGltZW91dFxyXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcclxuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHNcclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKVxyXG4gICAgfSwgZGVsYXkpXHJcbiAgfVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2VcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgbGV0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7X3N1Ym5zOiBzfSA9IHJvdXRlLl9jaGlsZG5zXHJcbiAgaWYgKHMgJiYgbWl0bS5yb3V0ZXNbc10pIHtcclxuICAgIHJvdXRlPSBtaXRtLnJvdXRlc1tzXVxyXG4gIH1cclxuICByZXR1cm4gcm91dGVcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIE11dGF0aW9uT2JzZXJ2ZXIgKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfd3Nfcm91dGUgPSByZXF1aXJlKCcuL193c19yb3V0ZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBpZiAobG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxyXG4gIGNvbnN0IHNzaG90ID0ge31cclxuICBjb25zdCBub2RlcyA9IHt9XHJcblxyXG4gIGxldCByb3V0ZSA9IF93c19yb3V0ZSgpXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIGNvbnN0IHsgb2JzZXJ2ZXI6IG9iIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG9iKSB7XHJcbiAgICAgIGxldCBlbCA9IHt9XHJcbiAgICAgIGlmIChvYltpZF0gPT09IHRydWUpIHtcclxuICAgICAgICBlbCA9IHtcclxuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IHRydWUsXHJcbiAgICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH0gaWYgKHR5cGVvZiBvYltpZF0gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vY2FwdHVyZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgcmVtb3ZlOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxyXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcclxuICAgICAgICAgIGVsW2VdID0gdHJ1ZVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF1cclxuICAgICAgfVxyXG4gICAgICBzc2hvdFtpZF0gPSBlbFxyXG4gICAgICBub2Rlc1tpZF0gPSB7XHJcbiAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IG9iXHJcbiAgbGV0IGZuYW1lXHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgICAgb2IgPSByb3V0ZS5zY3JlZW5zaG90Lm9ic2VydmVyXHJcbiAgICB9XHJcbiAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKVxyXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChvYiAmJiB0eXBlb2Ygb2JbaWRdPT09J2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjb25zdCBub2QgPSBlbFswXSB8fCBlbFxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudD09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG5vZC5fd3NfY291bnQgPSAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbm9kLl93c19jb3VudCArPSAxXHJcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PDIpIHtcclxuICAgICAgICAgICAgICBvYltpZF0obm9kKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IFxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYCR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgXHJcbiAgICAgICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgICAgICAgICAgZm5hbWUgPSBgJHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcclxuICAgICAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywgeyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoX3dzX2RlYm91bmNlKGNhbGxiYWNrLCAxMDApKVxyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZVxyXG4gICAgfSlcclxuICB9KSAgXHJcbn1cclxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXHJcblxyXG5jb25zdCBuYW5vaWQgPSAoc2l6ZSA9IDgpID0+IHtcclxuICBsZXQgaWQgPSAnJ1xyXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XHJcbiAgICBpZCArPSB0NjRbTWF0aC5yYW5kb20oKSAqIDY0IHwgMF1cclxuICB9XHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgX3dzIH0gPSB3aW5kb3dcclxuXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCByZWdleCB9XHJcbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcclxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxyXG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19waW5nKCdIaSEnKVxyXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxyXG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX2hlbHAoKVxyXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcclxuICAgIF93cy5zZW5kKCdfaGVscHt9JylcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcclxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfb3BlbiR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xyXG4gICAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXHJcbiAgICBjb25zdCBrZXkgPSBgJHtjbWR9OiR7aWR9YFxyXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSlcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xyXG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cclxuICAgICAgICBjb25zb2xlLmxvZygnPj4+IHdzIHRpbWVvdXQhJywga2V5KVxyXG4gICAgICB9XHJcbiAgICB9LCA1MDAwKVxyXG4gICAgY29uc3QgcGFyYW1zID0gYCR7a2V5fSR7SlNPTi5zdHJpbmdpZnkoeyBkYXRhIH0pfWBcclxuICAgIGlmIChfX2ZsYWdbJ3dzLW1lc3NhZ2UnXSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnX3dzLnNlbmQnLCBjbWQpXHJcbiAgICB9XHJcbiAgICBfd3Muc2VuZChwYXJhbXMpXHJcbiAgfVxyXG59XHJcbi8vIHdzX19zZW5kKCdfcGluZycsICdMT0wnLCB3PT5jb25zb2xlLmxvZygnPnJlc3VsdCcsdykpO1xyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubGV0IF90aW1lb3V0XHJcbmxldCBfY3NwID0ge31cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICAgIC5yZXBsYWNlKC9eXFwvLywgJycpXHJcbiAgICAgIC5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgY29uc3Qge1xyXG4gICAgICBibG9ja2VkVVJJLFxyXG4gICAgICBkaXNwb3NpdGlvbixcclxuICAgICAgZG9jdW1lbnRVUkksXHJcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcclxuICAgICAgb3JpZ2luYWxQb2xpY3ksXHJcbiAgICAgIHRpbWVTdGFtcCxcclxuICAgICAgdHlwZSxcclxuICAgICAgdmlvbGF0ZWREaXJlY3RpdmVcclxuICAgIH0gPSBlXHJcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcclxuICAgIGlmICghX2NzcFt0eXBdKSB7XHJcbiAgICAgIF9jc3BbdHlwXSA9IHt9XHJcbiAgICB9XHJcbiAgICBpZiAoIV9jc3BbdHlwXS5fZ2VuZXJhbF8pIHtcclxuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcclxuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxyXG4gICAgICAgIG5hbWVzcGFjZSxcclxuICAgICAgICBob3N0LFxyXG4gICAgICAgIHBhdGhcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXVxyXG4gICAgaWYgKCFfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSkge1xyXG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXHJcbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcclxuICAgICAgX2VycltibG9ja2VkVVJJXSA9IHt9XHJcbiAgICB9XHJcbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YClcclxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IF9tYXRjaCA/IF9tYXRjaFswXSA6IGVmZmVjdGl2ZURpcmVjdGl2ZVxyXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcclxuICAgICAgZGlyZWN0aXZlLFxyXG4gICAgICB0aW1lU3RhbXAsXHJcbiAgICAgIHR5cGVcclxuICAgIH1cclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gQ1NQOicsIF9jc3ApXHJcbiAgICAgIC8vIHdpbmRvdy53c19fc2VuZCgnY3NwX2Vycm9yJywge1xyXG4gICAgICAvLyAgIG5hbWVzcGFjZSxcclxuICAgICAgLy8gICBob3N0LFxyXG4gICAgICAvLyAgIHBhdGgsXHJcbiAgICAgIC8vICAgX2NzcCxcclxuICAgICAgLy8gfSk7XHJcbiAgICAgIF9jc3AgPSB7fVxyXG4gICAgfSwgNDAwMClcclxuICB9XHJcblxyXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKVxyXG4gIH1cclxufVxyXG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxyXG4vLyBkb2N1bWVudFVSSTogXCJodHRwczovL3doYXQvaHRtbC9jb250YWluL2NzcFwiXHJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxyXG5cclxuLy8gYmxvY2tlZFVSSTogXCJodHRwczovL3doYXQvdXJsL2dldHRpbmcvYmxvY2tlZFwiXHJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcclxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxyXG4vLyB0aW1lU3RhbXA6IDE5MzMuODIwMDAwMDA1NjUzMVxyXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcclxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19wb3N0bWVzc2FnZSA9IHJlcXVpcmUoJy4vX3dzX3Bvc3RtZXNzYWdlJylcclxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXHJcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpXHJcbmNvbnN0IF93c19sb2NhdGlvbiA9IHJlcXVpcmUoJy4vX3dzX2xvY2F0aW9uJylcclxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxyXG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKVxyXG5jb25zdCBfd3NfY3NwRXJyID0gcmVxdWlyZSgnLi9fd3NfY3NwLWVycicpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBfd3NfcG9zdG1lc3NhZ2UoKVxyXG4gIF93c19pbml0U29ja2V0KClcclxuICBfd3Nfc2NyZWVuc2hvdCgpXHJcbiAgX3dzX2xvY2F0aW9uKClcclxuICBfd3Nfb2JzZXJ2ZXIoKVxyXG4gIF93c19nZW5lcmFsKClcclxuICBfd3NfY3NwRXJyKClcclxufVxyXG5jb25zb2xlLmxvZygnd3MtY2xpZW50IGxvYWRlZC4uLicpIl0sIm5hbWVzIjpbIl93c19kZWJvdW5jZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLHNCQUFpQixNQUFNO0FBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0FBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztBQUM3RixLQUFLO0FBQ0wsR0FBRztBQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkEsaUJBQWlCLE1BQU07QUFDdkIsRUFBRSxJQUFJLFVBQVM7QUFDZixFQUFFLE9BQU87QUFDVDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0FBQ3ZCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtBQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxF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SUFBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQzdDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRTtBQUNyQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFDOUMsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztBQUM1QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQzVDLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0FBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0FBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUMzQyxJQUFHO0FBQ0g7QUFDQTtBQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNO0FBQzFCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUM7QUFDdkIsSUFBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7QUFDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7QUFD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
