var app = (function () {
  'use strict';

  /* global location */
  var _ws_postmessage = () => {
    function receiveMessage (event) {
      if (window.mitm.client.postmessage) {
        console.log(`>>> Postmessage: ${event.origin} => https://${location.host}`, event.data);
      }
    }
    window.addEventListener('message', receiveMessage, false);
  };

  const _c$7 = 'color: #bada55';

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
          console.log('%cWs: Update routes', _c$7);
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
        console.log('%cWs: _setClient', _c$7, data);
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

  var _ws_vendor = () => {
    const { vendor } = navigator;
    const browser = {
      '': 'firefox',
      'Google Inc.': 'chromium',
      'Apple Computer, Inc.': 'webkit'
    }[vendor];
    return browser
  };

  /* global WebSocket */

  /* eslint-disable camelcase */



  const _c$6 = 'color: #bada55';

  var _ws_initSocket = () => {
    window._ws_queue = {};
    window._ws_connected = false;
    const {__args, __flag} = window.mitm;

    if (window._ws_connect===undefined) {
      window._ws_connect = {};
    }

    const onopen = data => {
      function ws_send() {
        for (const key in window._ws_connect) {
          const fn = window._ws_connect[key];
          window._ws_connected_send = true;
          console.log(`%cWs: ${fn+''}`, _c$6);
          fn(data);
        }
      }

      if (__flag['ws-connect']) {
        console.log('%cWs: open connection', _c$6);
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
        console.log('%cWs: close connection', _c$6);
      }
    };

    const onmessage = function (e) {
      if (__flag['on-message']) {
        console.log('%cWs: on-message:', _c$6, e.data);
      }
      _ws_msgParser(e, e.data);
    };
    
    const connect = __args.nosocket===undefined;
    if (connect || (window.chrome && chrome.tabs)) {
      const vendor = ['firefox', 'webkit'].includes(_ws_vendor());
      const pre = vendor ? 'ws' : 'wss';
      const prt = vendor ? '3002' : '3001';
      const url = `${pre}://localhost:${prt}/ws?page=${_ws_inIframe()}&url=${document.URL.split('?')[0]}`;
      let ws;
      try {
        ws = new WebSocket(url);    
      } catch (error) {
        console.error(error);
      }
      console.time('ws');
      window._ws = ws;
    
      ws.onopen = onopen;
      ws.onclose = onclose;
      ws.onmessage = onmessage;  
    }
    if (__flag['ws-connect']) {
      console.log(`%cWs: ${connect ? 'init' : 'off'} connection`, _c$6);
    }
  };

  async function screnshot(json) {
    const {__args} = window.mitm;
    if ([true, 'off'].includes(__args.nosocket)) {
      return new Promise(function(resolve, reject) {
        try {
          const config = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json)
          };
          fetch('/mitm-play/screnshot.json', config)
          .then(function(response) { resolve(response.json());})
          .then(function(data    ) { resolve(data);           });
        } catch (error) {
          reject(error);
        }
      })
    } else {
      return new Promise(function(resolve, reject) {  
        try {
          window.ws__send('screenshot', json, resolve);
        } catch (error) {
          reject(error);
        }
      })  
    }
  }
  var _screenshot = screnshot;

  /* global location */
  var _ws_namespace = () => {
    const { hostname: host } = location;
    let namespace;

    function toRegex (str) {
      return str.replace(/\./g, '\\.').replace(/\?/g, '\\?')
    }

    for (const key in window.mitm.routes) {
      if (host.match(toRegex(key.replace(/~/g, '[^.]*')))) {
        namespace = key;
        break
      }
    }
    return namespace
  };

  /* global location, mitm */

  /* eslint-disable camelcase */



  const _c$5 = 'color: #bada55';

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
      while (el !== node && node !== null && node !== document.body) {
        node = node.parentNode;
      }
      if (node !== document.body) {
        const _page = window['xplay-page'];
        const params = { namespace, _page, host, browser };
        params.fname = fname==='~' ? '~_' : fname;
        _screenshot(params);
        if (mitm.argv.lazyclick) {
          // delay action to finish screenshot
          window.mitm.screenshot = e.target;
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          mitm.lastEvent = e;
          setTimeout(() => {
            act = window.mitm.screenshot;
            if (act) {
              act.click();
              act = undefined;
            } else {
              console.log('%cWs: delay action undefined', _c$5);
            }
          }, delay);
        } else {
          mitm.lastEvent = e;
        }
        return
      }
    }
  }

  function eventclick(e) {
    mitm.lastEvent = e;
  }

  var _ws_screenshot = () => {
    const route = window.mitm.routes[_ws_namespace()];
    window.addEventListener('DOMContentLoaded', () => {
      const body = document.querySelector('body');
      if (route && route.screenshot) {
        body.addEventListener('click', screenshot);
      } else {
        body.addEventListener('click', eventclick);
      }
    });
  };

  const kcode1 = {
    Backquote   : '`',
    BracketLeft : '[',
    BracketRight: ']',
    Backslash: '\\',
    Comma    : ',',
    Period   : '.',
    Quote    : "'",
    Semicolon: ';',
    Slash    : '/',
    Space    : ' ',
    Minus    : '-',
    Equal    : '=',
  };

  const kcode2 = {
    Backquote   : '~',
    BracketLeft : '{',
    BracketRight: '}',
    Backslash: '|',
    Comma    : '<',
    Period   : '>',
    Quote    : '"',
    Semicolon: ':',
    Slash    : '?',
    Space    : ' ',
    Minus    : '_',
    Equal    : '+',
  };

  const kcode3 = {
    1: '!',
    2: '@',
    3: '#',
    4: '$',
    5: '%',
    6: '^',
    7: '&',
    8: '*',
    9: '(',
    10: ')'
  };

  const kshow = {
    ...kcode1,
    Enter: 'Enter',
    CapsLock: 'Caps',
    Backspace: 'BS',
    Escape: 'Esc',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    Digit0: '0',
    Tab: 'Tab',
    KeyA: 'a',
    KeyB: 'b',
    KeyC: 'c',
    KeyD: 'd',
    KeyE: 'e',
    KeyF: 'f',
    KeyG: 'g',
    KeyH: 'h',
    KeyI: 'i',
    KeyJ: 'j',
    KeyK: 'k',
    KeyL: 'l',
    KeyM: 'm',
    KeyN: 'n',
    KeyO: 'o',
    KeyP: 'p',
    KeyQ: 'q',
    KeyR: 'r',
    KeyS: 's',
    KeyT: 't',
    KeyU: 'u',
    KeyV: 'v',
    KeyW: 'w',
    KeyX: 'x',
    KeyY: 'y',
    KeyZ: 'z',
    F1:  'F1',
    F2:  'F2',
    F3:  'F3',
    F4:  'F4',
    F5:  'F5',
    F6:  'F6',
    F7:  'F7',
    F8:  'F8',
    F9:  'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',
    End: 'End',
    Home: 'Home',
    ArrowUp:    '↑',
    ArrowDown:  '↓',
    ArrowLeft:  '←',
    ArrowRight: '→',
    Delete:   'Del',
    PageUp:   'PgUp',
    PageDown: 'PgDn',
  };

  function codeToChar(evn, opt={codeOnly:false}) {
    const {code, shiftKey} = evn;
    const {codeOnly} = opt;
    let match;
    let char = '';
    match = code.match(/Key(.)/);
    if (match) {
      char = match.pop();
      if (!codeOnly && !shiftKey) {
        char = char.toLowerCase();
      }
    } else {
      match = code.match(/(Digit|Numpad)(.)/);
      if (match) {
        char = match.pop();
        if (!codeOnly && shiftKey) {
          char = kcode3[char];
        }
      } else {
        if (!codeOnly && shiftKey) {
          char = kcode2[code];
        } else {
          char = kcode1[code];
        }
      }
    }
    return char
  }

  function codeToShow(codes) {
    return codes.split(':').map(x=>{
      return `${kshow[x]}`
    }).join('✧')
  }

  window.mitm.fn.codeToChar = codeToChar;
  window.mitm.fn.codeToShow = codeToShow;
  var _keyboard = {
    codeToChar,
    kcode1,
    kcode2,
    kcode3,
    kshow
  };

  const _c$4 = 'color: #bada55';

  function _post(json) {
    return new Promise(function(resolve, reject) {
      try {
        const config = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(json)
        };
        fetch('/mitm-play/play.json', config)
        .then(function(response) { resolve(response.json());})
        .then(function(data    ) { resolve(data);           });
      } catch (error) {
        reject(error);
      }
    })
  }

  function _play(json) {
    return new Promise(function(resolve, reject) {
      try {
        window.ws__send('autofill', json, resolve);
      } catch (error) {
        reject(error);
      }
    })
  }

  async function play (autofill) {
    const {__args} = window.mitm;
    if (autofill) {
      if (typeof (autofill) === 'function') {
        autofill = autofill();
      }
      const browser = _ws_vendor();
      const lenth = autofill.length;
      const _page = window['xplay-page'];
      const _frame = window['xplay-frame'];
      const _json = {autofill, browser, _page, _frame};
      const msg = lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2);
      console.log(`%cMacros: ${msg}`, _c$4);
      let result;
      if ([true, 'off'].includes(__args.nosocket)) {
        result = await _post(_json);
      } else {
        result = await _play(_json);
      }
      return result
    }
  }

  function sqlite$1() {
    const [cmd, q, tbl] = arguments;
    return new Promise(function(resolve, reject) {
      try {
        const data = {q};
        if (tbl) {
          data.tbl = tbl;
        }
        window.ws__send(cmd, data, resolve);
      } catch (error) {
        reject(error);
      }
    })
  }

  window.mitm.fn.sqlList = (q, tbl) => sqlite$1('sqlList', q, tbl);
  window.mitm.fn.sqlDel  = (q, tbl) => sqlite$1('sqlDel' , q, tbl);
  window.mitm.fn.sqlIns  = (q, tbl) => sqlite$1('sqlIns' , q, tbl);
  window.mitm.fn.sqlUpd  = (q, tbl) => sqlite$1('sqlUpd' , q, tbl);

  var _ws_play = play;

  /* global location, history, chrome, Event, CssSelectorGenerator */

  /* eslint-disable camelcase */
  const {codeToChar:_key} = _keyboard;



  const _c$3 = 'color: #bada55';
  const styleLeft  = 'top: -1px; left:  3px;';
  const styleTopR  = 'top: -8px; right: 3px;';
  const styleRight = 'top: 14px; right: 3px;';
  const buttonStyle= '';
  const style = `
.mitm-container {
  position: fixed;
  z-index: 99999;
}
.mitm-container.center {
  background: #fcffdcb0;
  position: fixed;
  /* center the element */
  right: 0;
  left: 0;
  top: 20px;
  margin-right: auto;
  margin-left: auto;
  /* give it dimensions */
  height: calc(100vh - 50px);
  padding: 5px 10px;
  overflow: auto;
  width: 90%;
  display: none;
}
.mitm-btn {
  color: black;
  border: none;
  font-size: 8px;
  cursor: pointer;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: monaco, Consolas, "Lucida Console", monospace;
}
.mitm-btn:hover{
  text-decoration:underline;
}
.mitm-btn.left,
.mitm-btn.right {
  display: block;
}
.mitm-btn.right {
  float: right;
  margin-top: 2px;
}
.bgroup-left,
.bgroup-right {
  display: table;
  margin-top: 4px;
}
.bgroup-left>div,
.bgroup-right>div {
  padding-bottom: 2px;
}
.bgroup-topr,
.bgroup-topr span {
  font-size: 14px;
}`;

  let container = {
    topr: {},
    left: {},
    right: {},
    target: {},
  };
  let bgroup = {
    right: {},
    topr: {},
    left: {},
  };

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  function toRegex (pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item => item.trim());
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?');
    return { path, msg }
  }

  function createButton(buttons, pos) {
    for (const id in buttons) {
      const [caption, color, klas] = id.split('|').map(x=>x.trim());
      const btn = document.createElement('button');
      const fn  = buttons[id];
      btn.onclick = async e => {
        let arr = fn(e);
        if (arr instanceof Promise) {
          arr = await arr;
        }
        if (Array.isArray(arr)) {
          await _ws_play(arr);
        }
      };
      btn.innerText = caption;
      btn.classList.add('mitm-btn');
      btn.classList.add(`${pos}`);
      btn.classList.add(klas || caption);
      btn.style = buttonStyle + (color ? `background: ${color};` : '');
      if (pos==='topr') {
        const br = document.createElement('span');
        br.innerHTML = '&nbsp;';
        bgroup[pos].appendChild(br);
        bgroup[pos].appendChild(btn);
      } else {
        const div = document.createElement('div');
        div.appendChild(btn);
        bgroup[pos].appendChild(div);
      }
    }
  }

  function setButtons (buttons, position) {
    if (bgroup[position]) {
      bgroup[position].innerHTML = '';
      createButton(buttons, position);
    }
  }

  function defaultHotKeys() {
    const {mitm: {svelte: {Cspheader, Sqlite}, fn}} = window;
    const keys = {
      'code:KeyC'(_e) {
        fn.svelte(Cspheader, 'LightPastelGreen');
      },
      'code:KeyQ'(_e) {
        fn.svelte(Sqlite, 'LightPastelGreen');
      },
    };
    keys['code:KeyC']._title = 'Show CSP Header';
    keys['code:KeyQ']._title = 'Show Sqlite';
    mitm.macrokeys = keys;
  }

  let debunk;
  let intervId;
  let onces = {}; // feat: onetime fn call

  async function urlChange (event) {
    const namespace = _ws_namespace();
    const {mitm} = window;

    clearInterval(intervId);
    if (mitm.autointerval) {delete mitm.autointerval;}
    if (mitm.autofill)     {delete mitm.autofill;    }
    if (mitm.autobuttons)  {delete mitm.autobuttons; }
    if (mitm.leftbuttons)  {delete mitm.leftbuttons; }
    if (mitm.rightbuttons) {delete mitm.rightbuttons;}
    if (mitm.macrokeys)    {defaultHotKeys();        }
    if (namespace) {
      const {href, origin} = location$1;
      const _href = href.replace(origin, '');
      observerfn = [];
      let none = true;
      for (const key in mitm.macros) {
        const { path, msg } = toRegex(key);
        if (_href.match(path)) {
          none = false;
          let fns = mitm.macros[key]();
          if (fns instanceof Promise) {
            fns = await fns;
          }
          if (typeof fns === 'function') {
            observerfn.push(fns);
          } else if (Array.isArray(fns)) {
            for (const fn2 of fns) {
              if (typeof fn2 === 'function') {
                observerfn.push(fn2);
              }
            }
          }
          debunk && clearTimeout(debunk);
          debunk = setTimeout(async () => {
            onces = {}; // feat: onetime fn call
            debunk = undefined;
            const {autobuttons, rightbuttons, leftbuttons} = window.mitm;
            if (window.mitm.autofill) {
              autobuttons && setButtons({
                ...autobuttons,
                'Entry'() {
                  let {autofill} = window.mitm;
                  if (typeof autofill === 'function') {
                    autofill = autofill();
                  }
                  _ws_play(autofill);
                }
              }, 'topr');
            } else {
              autobuttons && setButtons(autobuttons, 'topr');
            }
            rightbuttons && setButtons(rightbuttons, 'right');
            leftbuttons && setButtons(leftbuttons, 'left');
          }, 0);
        }
      }
      if (none) {
        setButtons({}, 'right');
        setButtons({}, 'left');
        setButtons({}, 'topr');
      }
    }
    container.right.style = styleRight;
    container.topr.style  = styleTopR;
    container.left.style  = styleLeft;
    (window.mitm.autofill);
    if (typeof (window.mitm.autointerval) === 'function') {
      intervId = setInterval(window.mitm.autointerval, 500);
    }
    ctrl = false;
  }

  const observer = new MutationObserver(compareHref);
  window.observer = observer;
  function observed() {
    observer.disconnect();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  const _urlChanged = new Event('urlchanged');
  function init$1() {
    const html = document.querySelector('html');
    const htmlref = html.firstElementChild;
    const styleBtn = document.createElement('style');
    const divRight = document.createElement('div');
    const divTopR  = document.createElement('div');
    const divLeft  = document.createElement('div');
    const divCenter= document.createElement('div');

    styleBtn.innerHTML = style;
    styleBtn.className = 'mitm-class';
    divRight.innerHTML = `<span class="bgroup-right"></span>`;
    divTopR.innerHTML  = `<span class="bgroup-topr"></span>`;
    divLeft.innerHTML  = `<span class="bgroup-left"></span>`;
    divLeft.className  = 'mitm-container left';
    divTopR.className  = 'mitm-container topr';
    divRight.className = 'mitm-container right';
    divCenter.className= 'mitm-container center';
    divRight.style = styleRight;
    divTopR.style  = styleTopR;
    divLeft.style  = styleLeft;

    html.insertBefore(styleBtn, htmlref);
    html.insertBefore(divRight, htmlref);
    html.insertBefore(divTopR, htmlref);
    html.insertBefore(divLeft, htmlref);
    html.insertBefore(divCenter, htmlref);
    const hotkey = new mitm.svelte.Hotkeys({target:divCenter});
    setTimeout(() => {
      container.topr = divTopR;
      container.left = divLeft;
      container.right= divRight;
      container.hotkey = hotkey;
      container.target = divCenter;
      container.nodekey= divCenter.children[0];
      bgroup.right = divRight.children[0];
      bgroup.topr  = divTopR.children[0];
      bgroup.left  = divLeft.children[0];
      urlChange();
      observed();
      document.addEventListener('click', function(event) {
        if (center && !divCenter.contains(event.target)) {
          divCenter.attributes.removeNamedItem('style');
          center = false;
        }
      });
    }, 0);
  }

  function macroAutomation(macro) {
    if (center) {
      container.target.attributes.removeNamedItem('style');
      center = false;
    }
    if (Array.isArray(macro)) {
      let macroIndex = 0;
      const interval = setInterval(() => {
        let selector = macro[macroIndex];
        if (selector.match(/^ *[=-]>/)) {
          const activeElement = CssSelectorGenerator.getCssSelector(document.activeElement);
          selector = `${activeElement} ${selector}`;
        }
        _ws_play([selector]);

        macroIndex += 1;
        if (macroIndex >= macro.length) {
          clearInterval(interval);
        }
      }, 100);
    }
  }

  let stdDbl = [];
  let hghDbl = [];
  let stdCtl = [];
  let hghCtl = [];
  let stdAlt = [];
  let hghAlt = [];
  let saveKey = '';
  const kdelay = 1000;

  let debounceDbl = undefined;
  function macroDbl() {
    const key1 = `key:${stdDbl.join('')}`;
    const key2 = `code:${hghDbl.join(':')}`;
    const { macrokeys, lastKey: e } = window.mitm;

    stdDbl = [];
    hghDbl = [];
    saveKey = '';
    debounceDbl = undefined;
    let macro = macrokeys[key1] || macrokeys[key2];
    console.log(`%cMacros: ctrl + alt  +  ${key1}  |  ${key2}`, _c$3);
    if (macro) {
      macro = macro(e);
      macroAutomation(macro);
      return true
    }
  }

  let debounceCtl = undefined;
  function macroCtl() {
    const key1 = `key:<${stdCtl.join('')}>`;
    const key2 = `code:<${hghCtl.join(':')}>`;
    const { macrokeys, lastKey: e } = window.mitm;

    stdCtl = [];
    hghCtl = [];
    saveKey = '';
    debounceCtl = undefined;
    let macro = macrokeys[key1] || macrokeys[key2];
    console.log(`%cMacros: .... + ctrl + ${key1} | ${key2}`, 'color: #baeaf1');
    if (macro) {
      macro = macro(e);
      macroAutomation(macro);
      return true
    }
  }

  let debounceAlt = undefined;
  function macroAlt() {
    const key1 = `key:{${stdAlt.join('')}}`;
    const key2 = `code:{${hghAlt.join(':')}}`;
    const { macrokeys, lastKey: e } = window.mitm;

    stdAlt = [];
    hghAlt = [];
    saveKey = '';
    debounceAlt = undefined;
    let macro = macrokeys[key1] || macrokeys[key2];
    console.log(`%cMacros: .... + alt  + ${key1} | ${key2}`, 'color: #badaf1');
    if (macro) {
      macro = macro(e);
      macroAutomation(macro);
      return true
    }
  }

  function keybUp (e) {
    if (!e.altKey) {
      if (debounceDbl || (debounceCtl && !e.ctrlKey) || debounceAlt) {
        clearTimeout(debounceDbl);
        clearTimeout(debounceCtl);
        clearTimeout(debounceAlt);
        if (debounceDbl) {
          macroDbl();
        } else 
        if (debounceCtl) {
          macroCtl();
        } else {
          macroAlt();
        }
        debounceDbl = undefined;
        debounceCtl = undefined;
        debounceAlt = undefined;
      }
    }
  }
  var ctrl = false;
  var center = false;
  function keybCtrl (e) {
    if (!e.code || ['Alt', 'Control', 'Meta'].includes(e.key)) {
      return
    } else {
      if (e.key==='Shift') {
        if (e.ctrlKey && !e.altKey) {
          const {nodekey, target, right, topr, left} = container;
          if (e.code==='ShiftRight') {
            ctrl = !ctrl;
            right.style = styleRight+ (!ctrl ? '' : 'display: none;');
            topr.style  = styleTopR + (!ctrl ? '' : 'display: none;');
            left.style  = styleLeft + (!ctrl ? '' : 'display: none;');  
          } else {
            if (target.children[0]!==nodekey) {
              target.replaceChildren(nodekey);
              target.style = 'display: block;';
              center = true;
            } else {
              center = !center;
              if (center) {
                target.style = 'display: block;';
              } else {
                target.attributes.removeNamedItem('style');
              }  
            }
          }
        }
      } else {
        let char = _key(e);
        if (e.ctrlKey && e.altKey) {
          if (e.shiftKey) {
            char = _key(e, {codeOnly: true});
            clearTimeout(debounceDbl);
            clearTimeout(debounceCtl);
            clearTimeout(debounceAlt);
            saveKey += char;
            return
          } 
          stdDbl.push(char);
          hghDbl.push(e.code);
          clearTimeout(debounceDbl);
          debounceDbl = setTimeout(macroDbl, kdelay);
        } else if (e.ctrlKey) {
          stdCtl.push(char);
          hghCtl.push(e.code);
          clearTimeout(debounceCtl);
          debounceCtl = setTimeout(macroCtl, kdelay);
        } else if (e.altKey) {
          stdAlt.push(char);
          hghAlt.push(e.code);
          clearTimeout(debounceAlt);
          debounceAlt = setTimeout(macroAlt, kdelay);
        }
        e._keys = saveKey;
        mitm.lastKey = e;        
      } 
    }
  }

  const {location: location$1} = document;
  let oldHref = location$1.href;
  let oDebunk = undefined;
  let observerfn = [];

  function compareHref(nodes) {
    // console.log(`%cMacros: DOM mutated!`, _c)
    if (oldHref != location$1.href) {
      window.dispatchEvent(_urlChanged);
      oldHref = location$1.href;
    } else {
      if (observerfn.length) {
        oDebunk && clearTimeout(oDebunk);
        oDebunk = setTimeout(()=> {
          oDebunk = undefined;
          for (const fn of observerfn) {
            const name = fn.name;
            if (name && name.match(/Once$/)) {
              if (onces[name]) { // feat: onetime fn call
                continue
              } else {
                onces[name] = true;
              }
            }
            fn(nodes);
          }
          const {autobuttons, rightbuttons, leftbuttons} = window.mitm;
          rightbuttons && setButtons(rightbuttons, 'right');
          leftbuttons && setButtons(leftbuttons, 'left');
          const { autofill } = window.mitm;
          if (autofill) {
            autobuttons && setButtons({
              ...autobuttons,
              'Entry'() {_ws_play(autofill);}
            }, 'topr');
          } else {
            autobuttons && setButtons(autobuttons, 'topr');
          }

        }, 100);
      }
    }
  }

  function wsLocation() {
    const vendor = _ws_vendor();
    if (['firefox', 'webkit'].includes(vendor) || (chrome && !chrome.tabs)) {
      document.querySelector('html').addEventListener('keydown', keybCtrl);
      document.querySelector('html').addEventListener('keyup', keybUp);
      window.addEventListener('urlchanged', urlChange);
      if(document.readyState !== 'loading') {
        init$1();
      } else {
        window.addEventListener('DOMContentLoaded', init$1);
      }    
    } else {
      return
    }

    const fn = history.pushState;
    history.pushState = function () {
      fn.apply(history, arguments);
      compareHref();
    };
  }

  const pastel = {
    PostIt:          '#fcffdcd6',
    PastelGreen:     '#77dd77d6',
    PastelBrown:     '#836953d6',
    BabyBlue:        '#89cff0d6',
    PastelTurquoise: '#99c5c4d6',
    BlueGreenPastel: '#9adedbd6',
    PersianPastel:   '#aa9499d6',
    MagicMint:       '#aaf0d1d6',
    LightPastelGreen:'#b2fba5d6',
    PastelPurple:    '#b39eb5d6',
    PastelLilac:     '#bdb0d0d6',
    PastelPea:       '#bee7a5d6',
    LightLime:       '#befd73d6',
    LightPeriwinkle: '#c1c6fcd6',
    PaleMauve:       '#c6a4a4d6',
    LightLightGreen: '#c8ffb0d6',
    PastelViolet:    '#cb99c9d6',
    PastelMint:      '#cef0ccd6',
    PastelGrey:      '#cfcfc4d6',
    PaleBlue:        '#d6fffed6',
    PastelLavender:  '#d8a1c4d6',
    PastelPink:      '#dea5a4d6',
    PastelSmirk:     '#deece1d6',
    PastelDay:       '#dfd8e1d6',
    PastelParchment: '#e5d9d3d6',
    PastelRoseTan:   '#e9d1bfd6',
    PastelMagenta:   '#f49ac2d6',
    ElectricLavender:'#f4bfffd6',
    PastelYellow:    '#fdfd96d6',
    PastelRed:       '#ff6961d6',
    PastelOrange:    '#ff964fd6',
    AmericanPink:    '#ff9899d6',
    BabyPink:        '#ffb7ced6',
    BabyPurple:      '#ca9bf7d6',
  };

  function svelte$1(Svelt, bg='PostIt') { // feat: svelte related
    const {target} = container;
    target.replaceChildren('');
    window.mitm.sapp = new Svelt({target});
    setTimeout(() => {
      const bcolor = pastel[bg];
      target.style = `display: block${bcolor ? ';background:'+bcolor : ''};`;
      center = true;
    }, 0);
  }

  function hotKeys(obj) {
    window.mitm.macrokeys = {
      ...window.mitm.macrokeys,
      ...obj
    };
  }

  window.mitm.fn.macroAutomation = macroAutomation;
  window.mitm.fn.hotKeys = hotKeys;
  window.mitm.fn.svelte = svelte$1;
  window.mitm.fn.play = _ws_play;
  window.mitm.fn.wait = wait;

  var _ws_location = wsLocation;

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
  var _ws_debounce = debounce;

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

  /* eslint-disable camelcase */






  var _ws_observer = () => {
    if (location.origin.match('chrome-extension')) {
      return
    }
    const host = location.origin.replace('://' ,'~~');
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
              fname = `~${fname}-${sshot[id].title}-insert`;
              const params = { namespace, _page, host, fname, browser };
              _screenshot(params);
            }
          }
        } else {
          if (!nodes[id].remove) {
            nodes[id].remove = true;
            nodes[id].insert = false;
            if (sshot[id].remove) {
              fname = location.pathname.replace(/^\//, '').replace(/\//g, '-');
              fname = `~${fname}-${sshot[id].title}-remove`;
              const params = { namespace, _page, host, fname, browser };
              _screenshot(params);
            }
          }
        }
      }
    };

    if (route && route.screenshot) {
      const {observer: ob} = route.screenshot;
      const options = {
        attributes: ob ? true : false,
        childList: true,
        subtree: true
      };
      document.addEventListener('DOMContentLoaded', () => {
        const observer = new MutationObserver(_ws_debounce(callback, 280));
        observer.observe(document.body, options);
      });
    }
  };

  const t64 = 'Wabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZh';
  const _c$2 = 'color: #bada55';

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
          console.log('%cWs: ws timeout!', _c$2, key);
        }
      }, 5000);
      
      const params = `${key}${JSON.stringify({ data })}`;
      const flag = window.mitm.__flag['ws-message'];
      if (flag > 1) {
        console.log(`_ws.send: ${params}`);
      }
      _ws.send(params);
    };
    const wsrun = {};
    const arr = window.mitm.wsrun;
    for (const k of arr) {
      const cmd  = k.replace('$', '');
      wsrun[cmd] = (data, handler) => window.ws__send(cmd, data, handler);
    }
    window.mitm.wsrun = wsrun;
  };

  /* global location */

  /* eslint-disable camelcase */


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

  var _ws_macros = function () {
    if (window._ws_connect===undefined) {
      window._ws_connect = {};
    }
    
    window.mitm.fn.autoclick = () => {
      setTimeout(() => {
        document.querySelector('.btn-autofill').click();
      }, 1000);
    };
    
    window.mitm.fn.getCookie = name => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const onMount = e => console.log('%cMacros: executed after ws open', 'color: #5ada55', e);
    window._ws_connect.macrosOnMount = onMount;
  };

  function noop() { }
  function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
          loc: { file, line, column, char }
      };
  }
  function run(fn) {
      return fn();
  }
  function blank_object() {
      return Object.create(null);
  }
  function run_all(fns) {
      fns.forEach(run);
  }
  function is_function(thing) {
      return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }
  function is_empty(obj) {
      return Object.keys(obj).length === 0;
  }
  function null_to_empty(value) {
      return value == null ? '' : value;
  }
  function append(target, node) {
      target.appendChild(node);
  }
  function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
  }
  function detach(node) {
      node.parentNode.removeChild(node);
  }
  function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
          if (iterations[i])
              iterations[i].d(detaching);
      }
  }
  function element(name) {
      return document.createElement(name);
  }
  function text(data) {
      return document.createTextNode(data);
  }
  function space() {
      return text(' ');
  }
  function empty() {
      return text('');
  }
  function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
  }
  function attr(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function children(element) {
      return Array.from(element.childNodes);
  }
  function custom_event(type, detail, bubbles = false) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, bubbles, false, detail);
      return e;
  }

  let current_component;
  function set_current_component(component) {
      current_component = component;
  }
  function get_current_component() {
      if (!current_component)
          throw new Error('Function called outside component initialization');
      return current_component;
  }
  function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
  }
  function onDestroy(fn) {
      get_current_component().$$.on_destroy.push(fn);
  }

  const dirty_components = [];
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
      if (!update_scheduled) {
          update_scheduled = true;
          resolved_promise.then(flush);
      }
  }
  function add_render_callback(fn) {
      render_callbacks.push(fn);
  }
  let flushing = false;
  const seen_callbacks = new Set();
  function flush() {
      if (flushing)
          return;
      flushing = true;
      do {
          // first, call beforeUpdate functions
          // and update components
          for (let i = 0; i < dirty_components.length; i += 1) {
              const component = dirty_components[i];
              set_current_component(component);
              update(component.$$);
          }
          set_current_component(null);
          dirty_components.length = 0;
          while (binding_callbacks.length)
              binding_callbacks.pop()();
          // then, once components are updated, call
          // afterUpdate functions. This may cause
          // subsequent updates...
          for (let i = 0; i < render_callbacks.length; i += 1) {
              const callback = render_callbacks[i];
              if (!seen_callbacks.has(callback)) {
                  // ...so guard against infinite loops
                  seen_callbacks.add(callback);
                  callback();
              }
          }
          render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
          flush_callbacks.pop()();
      }
      update_scheduled = false;
      flushing = false;
      seen_callbacks.clear();
  }
  function update($$) {
      if ($$.fragment !== null) {
          $$.update();
          run_all($$.before_update);
          const dirty = $$.dirty;
          $$.dirty = [-1];
          $$.fragment && $$.fragment.p($$.ctx, dirty);
          $$.after_update.forEach(add_render_callback);
      }
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
      outros = {
          r: 0,
          c: [],
          p: outros // parent group
      };
  }
  function check_outros() {
      if (!outros.r) {
          run_all(outros.c);
      }
      outros = outros.p;
  }
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }
  function transition_out(block, local, detach, callback) {
      if (block && block.o) {
          if (outroing.has(block))
              return;
          outroing.add(block);
          outros.c.push(() => {
              outroing.delete(block);
              if (callback) {
                  if (detach)
                      block.d(1);
                  callback();
              }
          });
          block.o(local);
      }
  }

  const globals = (typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
          ? globalThis
          : global);
  function create_component(block) {
      block && block.c();
  }
  function mount_component(component, target, anchor, customElement) {
      const { fragment, on_mount, on_destroy, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      if (!customElement) {
          // onMount happens before the initial afterUpdate
          add_render_callback(() => {
              const new_on_destroy = on_mount.map(run).filter(is_function);
              if (on_destroy) {
                  on_destroy.push(...new_on_destroy);
              }
              else {
                  // Edge case - component was destroyed immediately,
                  // most likely as a result of a binding initialising
                  run_all(new_on_destroy);
              }
              component.$$.on_mount = [];
          });
      }
      after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
          run_all($$.on_destroy);
          $$.fragment && $$.fragment.d(detaching);
          // TODO null out other refs, including component.$$ (but need to
          // preserve final state?)
          $$.on_destroy = $$.fragment = null;
          $$.ctx = [];
      }
  }
  function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
          dirty_components.push(component);
          schedule_update();
          component.$$.dirty.fill(0);
      }
      component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
  }
  function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const $$ = component.$$ = {
          fragment: null,
          ctx: null,
          // state
          props,
          update: noop,
          not_equal,
          bound: blank_object(),
          // lifecycle
          on_mount: [],
          on_destroy: [],
          on_disconnect: [],
          before_update: [],
          after_update: [],
          context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
          // everything else
          callbacks: blank_object(),
          dirty,
          skip_bound: false,
          root: options.target || parent_component.$$.root
      };
      append_styles && append_styles($$.root);
      let ready = false;
      $$.ctx = instance
          ? instance(component, options.props || {}, (i, ret, ...rest) => {
              const value = rest.length ? rest[0] : ret;
              if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                  if (!$$.skip_bound && $$.bound[i])
                      $$.bound[i](value);
                  if (ready)
                      make_dirty(component, i);
              }
              return ret;
          })
          : [];
      $$.update();
      ready = true;
      run_all($$.before_update);
      // `false` as a special case of no DOM component
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options.target) {
          if (options.hydrate) {
              const nodes = children(options.target);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.l(nodes);
              nodes.forEach(detach);
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.c();
          }
          if (options.intro)
              transition_in(component.$$.fragment);
          mount_component(component, options.target, options.anchor, options.customElement);
          flush();
      }
      set_current_component(parent_component);
  }
  /**
   * Base class for Svelte components. Used when dev=false.
   */
  class SvelteComponent {
      $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop;
      }
      $on(type, callback) {
          const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
          callbacks.push(callback);
          return () => {
              const index = callbacks.indexOf(callback);
              if (index !== -1)
                  callbacks.splice(index, 1);
          };
      }
      $set($$props) {
          if (this.$$set && !is_empty($$props)) {
              this.$$.skip_bound = true;
              this.$$set($$props);
              this.$$.skip_bound = false;
          }
      }
  }

  function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.0' }, detail), true));
  }
  function append_dev(target, node) {
      dispatch_dev('SvelteDOMInsert', { target, node });
      append(target, node);
  }
  function insert_dev(target, node, anchor) {
      dispatch_dev('SvelteDOMInsert', { target, node, anchor });
      insert(target, node, anchor);
  }
  function detach_dev(node) {
      dispatch_dev('SvelteDOMRemove', { node });
      detach(node);
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default)
          modifiers.push('preventDefault');
      if (has_stop_propagation)
          modifiers.push('stopPropagation');
      dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
      const dispose = listen(node, event, handler, options);
      return () => {
          dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
          dispose();
      };
  }
  function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null)
          dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
      else
          dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
  }
  function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data)
          return;
      dispatch_dev('SvelteDOMSetData', { node: text, data });
      text.data = data;
  }
  function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
          let msg = '{#each} only iterates over array-like objects.';
          if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
              msg += ' You can use a spread to convert this iterable into an array.';
          }
          throw new Error(msg);
      }
  }
  function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
          if (!~keys.indexOf(slot_key)) {
              console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
          }
      }
  }
  /**
   * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
   */
  class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
          if (!options || (!options.target && !options.$$inline)) {
              throw new Error("'target' is a required option");
          }
          super();
      }
      $destroy() {
          super.$destroy();
          this.$destroy = () => {
              console.warn('Component was already destroyed'); // eslint-disable-line no-console
          };
      }
      $capture_state() { }
      $inject_state() { }
  }

  const cspArr = [
    'default-src',
    'child-src',
    'connect-src',
    'font-src',
    'frame-src',
    'img-src',
    'manifest-src',
    'media-src',
    'object-src',
    'prefetch-src',
    'script-src',
    'script-src-elem',
    'script-src-attr',
    'style-src',
    'style-src-elem',
    'style-src-attr',
    'worker-src',
    'base-uri',
    'plugin-types',
    'sandbox',
    'navigate-to',
    'form-action',
    'frame-ancestors',
    'upgrade-insecure-requests',
    'report-uri',
    'report-to',
  ];
  const cspFetch = [
    'default-src',
    'child-src',
    'connect-src',
    'font-src',
    'frame-src',
    'img-src',
    'manifest-src',
    'media-src',
    'object-src',
    'prefetch-src',
    'script-src',
    'style-src',
    'worker-src',
  ];
  const cspEAttr = [
    'script-src-elem',
    'script-src-attr',
    'style-src-elem',
    'style-src-attr',
  ];
  const cspInfo = {
    'default-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src',
      note: 'is a fallback directive for the other fetch directives: <b>child-src</b>, <b>connect-src</b>, <b>font-src</b>, <b>img-src</b>, <b>manifest-src</b>, <b>media-src</b>, <b>prefetch-src</b>, <b>object-src</b>, <b>script-src(script-src-elem, script-src-attr)</b>, <b>style-src(style-src-elem, style-src-attr)</b>.'
    },
    'child-src': {
      level: 2,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/child-src',
      note: 'allows the developer to control nested browsing contexts and worker execution contexts.'
    },
    'connect-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src',
      note: 'provides control over fetch requests, XHR, eventsource, beacon and websockets connections.'
    },
    'font-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/font-src',
      note: 'specifies which URLs to load fonts from.'
    },
    'frame-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-src',
      note: 'specifies valid sources for nested browsing contexts loading using elements such as &lt;frame&gt; and &lt;iframe&gt;.'
    },
    'img-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/img-src',
      note: 'specifies the URLs that images can be loaded from.'
    },
    'manifest-src': {
      level: 3,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/manifest-src',
      note: 'specifies the URLs that application manifests may be loaded from.'
    },
    'media-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/media-src',
      note: 'specifies the URLs from which video, audio and text track resources can be loaded from.'
    },
    'object-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/object-src',
      note: 'specifies the URLs from which plugins can be loaded from.'
    },
    'prefetch-src': {
      level: 3,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/prefetch-src',
      note: 'specifies the URLs from which resources can be prefetched from.'
    },
    'script-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
      note: 'specifies the locations from which a script can be executed from. It is a fallback directive for other script-like directives: <b>script-src-elem</b>, <b>script-src-attr</b>'
    },
    'script-src-elem': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-elem',
      note: 'specifies valid sources for JavaScript &lt;script&gt; elements, but not inline script event handlers like onclick.'
    },
    'script-src-attr': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-attr',
      note: 'specifies valid sources for JavaScript inline event handlers. This includes only inline script event handlers like onclick, but not URLs loaded directly into &lt;script&gt; elements.'
    },
    'style-src': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
      note: 'controls from where styles get applied to a document. This includes <link> elements, @import rules, and requests originating from a Link HTTP response header field: <b>style-src-elem</b>, <b>style-src-attr</b>'
    },
    'style-src-elem': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
      note: 'specifies valid sources for stylesheets &lt;style&gt; elements and &lt;link&gt; elements with rel="stylesheet".'
    },
    'style-src-attr': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
      note: 'specifies valid sources for inline styles applied to individual DOM elements.'
    },
    'worker-src': {
      level: 3,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src',
      note: 'specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts.'
    },
    'base-uri': {
      level: 2,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/base-uri',
      note: 'specifies the possible URLs that the &lt;base&gt; element can use.'
    },
    'plugin-types': {
      level: 2,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/plugin-types',
      note: 'limits the types of resources that can be loaded into the document (e.g. application/pdf). 3 rules apply to the affected elements, &lt;embed&gt; and &lt;object&gt;',
      deprecated: true
    },
    'sandbox': {
      level: '1.1/2',
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox',
      note: 'specifies the possible URLs that the &lt;base&gt; element can use.'
    },
    'navigate-to': {
      level: 3,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/navigate-to',
      note: 'restricts the URLs which a document can navigate to by any mean (not yet supported by modern browsers in Jan 2021).'
    },
    'form-action': {
      level: 2,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/form-action',
      note: 'restricts the URLs which the forms can submit to.'
    },
    'frame-ancestors': {
      level: 2,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors',
      note: 'restricts the URLs that can embed the requested resource inside of &lt;frame&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, or &lt;applet&gt; elements.'
    },
    'upgrade-insecure-requests': {
      level: '?',
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests',
      note: 'instructs user agents to treat all of a site\'s insecure URLs (those served over HTTP) as though they have been replaced with secure URLs (those served over HTTPS). This directive is intended for web sites with large numbers of insecure legacy URLs that need to be rewritten.'
    },
    'report-uri': {
      level: 1,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri',
      note: 'directive is deprecated by report-to, which is a URI that the reports are sent to.',
      deprecated: true
    },
    'report-to': {
      level: 3,
      link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-to',
      note: 'which is a groupname defined in the header in a json formatted header value.'
    },
  };
  const policy = {
    'none'  : 'Won\'t allow loading of any resources.',
    'blob:' : 'Raw data that isn\'t necessarily in a JavaScript-native format.',
    'data:' : 'Only allow resources from the data scheme (ie: Base64 encoded images).',
    "'self'": 'Only allow resources from the current origin.',
    "'unsafe-inline'": '',
  };

  var Cspdirective = {
    cspArr,
    cspInfo,
    cspFetch,
    cspEAttr,
    policy,
  };

  /* ws-client\svelte\Cspheader.svelte generated by Svelte v3.43.0 */
  const file$3 = "ws-client\\svelte\\Cspheader.svelte";

  function get_each_context$3(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[2] = list[i];
  	child_ctx[4] = i;
  	return child_ctx;
  }

  function get_each_context_1$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[5] = list[i];
  	child_ctx[7] = i;
  	return child_ctx;
  }

  // (49:4) {#if csp[id]}
  function create_if_block$1(ctx) {
  	let details;
  	let summary;
  	let summary_class_value;
  	let t0;
  	let t1;

  	function select_block_type(ctx, dirty) {
  		if (Cspdirective.cspInfo[/*id*/ ctx[2]].link) return create_if_block_2;
  		return create_else_block$1;
  	}

  	let current_block_type = select_block_type(ctx);
  	let if_block0 = current_block_type(ctx);
  	let if_block1 = Cspdirective.cspInfo[/*id*/ ctx[2]].note && create_if_block_1$1(ctx);
  	let each_value_1 = /*csp*/ ctx[0][/*id*/ ctx[2]].policy;
  	validate_each_argument(each_value_1);
  	let each_blocks = [];

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
  	}

  	const block = {
  		c: function create() {
  			details = element("details");
  			summary = element("summary");
  			if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(summary, "class", summary_class_value = "" + (null_to_empty(/*csp*/ ctx[0][/*id*/ ctx[2]].fallback ? 'fallback' : '') + " svelte-ws3cmd"));
  			add_location(summary, file$3, 49, 15, 1432);
  			add_location(details, file$3, 49, 6, 1423);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, details, anchor);
  			append_dev(details, summary);
  			if_block0.m(summary, null);
  			append_dev(details, t0);
  			if (if_block1) if_block1.m(details, null);
  			append_dev(details, t1);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(details, null);
  			}
  		},
  		p: function update(ctx, dirty) {
  			if_block0.p(ctx, dirty);

  			if (dirty & /*csp*/ 1 && summary_class_value !== (summary_class_value = "" + (null_to_empty(/*csp*/ ctx[0][/*id*/ ctx[2]].fallback ? 'fallback' : '') + " svelte-ws3cmd"))) {
  				attr_dev(summary, "class", summary_class_value);
  			}

  			if (Cspdirective.cspInfo[/*id*/ ctx[2]].note) if_block1.p(ctx, dirty);

  			if (dirty & /*csp, cspArr*/ 1) {
  				each_value_1 = /*csp*/ ctx[0][/*id*/ ctx[2]].policy;
  				validate_each_argument(each_value_1);
  				let i;

  				for (i = 0; i < each_value_1.length; i += 1) {
  					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block_1$1(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(details, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value_1.length;
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(details);
  			if_block0.d();
  			if (if_block1) if_block1.d();
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$1.name,
  		type: "if",
  		source: "(49:4) {#if csp[id]}",
  		ctx
  	});

  	return block;
  }

  // (53:8) {:else}
  function create_else_block$1(ctx) {
  	let t0_value = /*i*/ ctx[4] + 1 + "";
  	let t0;
  	let t1;
  	let t2_value = /*id*/ ctx[2] + "";
  	let t2;
  	let t3;
  	let t4_value = /*csp*/ ctx[0][/*id*/ ctx[2]].policy.length + "";
  	let t4;
  	let t5;
  	let small;
  	let t6;
  	let t7_value = Cspdirective.cspInfo[/*id*/ ctx[2]].level + "";
  	let t7;

  	const block = {
  		c: function create() {
  			t0 = text(t0_value);
  			t1 = text(".");
  			t2 = text(t2_value);
  			t3 = text(":(");
  			t4 = text(t4_value);
  			t5 = text(")");
  			small = element("small");
  			t6 = text("v");
  			t7 = text(t7_value);
  			add_location(small, file$3, 53, 46, 1708);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t0, anchor);
  			insert_dev(target, t1, anchor);
  			insert_dev(target, t2, anchor);
  			insert_dev(target, t3, anchor);
  			insert_dev(target, t4, anchor);
  			insert_dev(target, t5, anchor);
  			insert_dev(target, small, anchor);
  			append_dev(small, t6);
  			append_dev(small, t7);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*csp*/ 1 && t4_value !== (t4_value = /*csp*/ ctx[0][/*id*/ ctx[2]].policy.length + "")) set_data_dev(t4, t4_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t0);
  			if (detaching) detach_dev(t1);
  			if (detaching) detach_dev(t2);
  			if (detaching) detach_dev(t3);
  			if (detaching) detach_dev(t4);
  			if (detaching) detach_dev(t5);
  			if (detaching) detach_dev(small);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$1.name,
  		type: "else",
  		source: "(53:8) {:else}",
  		ctx
  	});

  	return block;
  }

  // (51:8) {#if cspInfo[id].link}
  function create_if_block_2(ctx) {
  	let t0_value = /*i*/ ctx[4] + 1 + "";
  	let t0;
  	let t1;
  	let t2_value = /*id*/ ctx[2] + "";
  	let t2;
  	let t3;
  	let t4_value = /*csp*/ ctx[0][/*id*/ ctx[2]].policy.length + "";
  	let t4;
  	let t5;
  	let a;
  	let small;
  	let t6;
  	let t7_value = Cspdirective.cspInfo[/*id*/ ctx[2]].level + "";
  	let t7;

  	const block = {
  		c: function create() {
  			t0 = text(t0_value);
  			t1 = text(".");
  			t2 = text(t2_value);
  			t3 = text(":(");
  			t4 = text(t4_value);
  			t5 = text(")");
  			a = element("a");
  			small = element("small");
  			t6 = text("v");
  			t7 = text(t7_value);
  			add_location(small, file$3, 51, 86, 1604);
  			attr_dev(a, "target", "blank");
  			attr_dev(a, "href", Cspdirective.cspInfo[/*id*/ ctx[2]].link);
  			add_location(a, file$3, 51, 46, 1564);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t0, anchor);
  			insert_dev(target, t1, anchor);
  			insert_dev(target, t2, anchor);
  			insert_dev(target, t3, anchor);
  			insert_dev(target, t4, anchor);
  			insert_dev(target, t5, anchor);
  			insert_dev(target, a, anchor);
  			append_dev(a, small);
  			append_dev(small, t6);
  			append_dev(small, t7);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*csp*/ 1 && t4_value !== (t4_value = /*csp*/ ctx[0][/*id*/ ctx[2]].policy.length + "")) set_data_dev(t4, t4_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t0);
  			if (detaching) detach_dev(t1);
  			if (detaching) detach_dev(t2);
  			if (detaching) detach_dev(t3);
  			if (detaching) detach_dev(t4);
  			if (detaching) detach_dev(t5);
  			if (detaching) detach_dev(a);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2.name,
  		type: "if",
  		source: "(51:8) {#if cspInfo[id].link}",
  		ctx
  	});

  	return block;
  }

  // (57:8) {#if cspInfo[id].note}
  function create_if_block_1$1(ctx) {
  	let details;
  	let summary;
  	let t1;
  	let small;
  	let raw_value = Cspdirective.cspInfo[/*id*/ ctx[2]].note + "";

  	const block = {
  		c: function create() {
  			details = element("details");
  			summary = element("summary");
  			summary.textContent = "expand...";
  			t1 = space();
  			small = element("small");
  			attr_dev(summary, "class", "svelte-ws3cmd");
  			add_location(summary, file$3, 57, 32, 1842);
  			add_location(small, file$3, 58, 12, 1884);
  			attr_dev(details, "class", "note svelte-ws3cmd");
  			add_location(details, file$3, 57, 10, 1820);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, details, anchor);
  			append_dev(details, summary);
  			append_dev(details, t1);
  			append_dev(details, small);
  			small.innerHTML = raw_value;
  		},
  		p: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(details);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$1.name,
  		type: "if",
  		source: "(57:8) {#if cspInfo[id].note}",
  		ctx
  	});

  	return block;
  }

  // (62:8) {#each csp[id].policy as item, x}
  function create_each_block_1$1(ctx) {
  	let div;
  	let t0_value = /*x*/ ctx[7] + 1 + "";
  	let t0;
  	let t1;
  	let t2_value = /*item*/ ctx[5] + "";
  	let t2;

  	const block = {
  		c: function create() {
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = text(":");
  			t2 = text(t2_value);
  			attr_dev(div, "class", "item svelte-ws3cmd");
  			add_location(div, file$3, 62, 10, 2015);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, t0);
  			append_dev(div, t1);
  			append_dev(div, t2);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*csp*/ 1 && t2_value !== (t2_value = /*item*/ ctx[5] + "")) set_data_dev(t2, t2_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block_1$1.name,
  		type: "each",
  		source: "(62:8) {#each csp[id].policy as item, x}",
  		ctx
  	});

  	return block;
  }

  // (48:4) {#each cspArr as id, i}
  function create_each_block$3(ctx) {
  	let if_block_anchor;
  	let if_block = /*csp*/ ctx[0][/*id*/ ctx[2]] && create_if_block$1(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (/*csp*/ ctx[0][/*id*/ ctx[2]]) {
  				if (if_block) {
  					if_block.p(ctx, dirty);
  				} else {
  					if_block = create_if_block$1(ctx);
  					if_block.c();
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$3.name,
  		type: "each",
  		source: "(48:4) {#each cspArr as id, i}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$3(ctx) {
  	let div2;
  	let b0;
  	let t1;
  	let p;
  	let t2;
  	let a0;
  	let t4;
  	let a1;
  	let t6;
  	let a2;
  	let t8;
  	let div1;
  	let t9;
  	let hr;
  	let t10;
  	let details1;
  	let summary0;
  	let b1;
  	let t12;
  	let t13;
  	let details0;
  	let summary1;
  	let t15;
  	let small;
  	let raw_value = 'used to specify details about the different endpoints that a user-agent has available to it for delivering reports to. You can then retrieve reports by making a request to those URLs.' + "";
  	let t16;
  	let div0;
  	let t17;
  	let each_value = Cspdirective.cspArr;
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
  	}

  	const block = {
  		c: function create() {
  			div2 = element("div");
  			b0 = element("b");
  			b0.textContent = "Content Security Policy";
  			t1 = space();
  			p = element("p");
  			t2 = text("CSP on:\r\n    ");
  			a0 = element("a");
  			a0.textContent = "Mozilla";
  			t4 = text(", \r\n    ");
  			a1 = element("a");
  			a1.textContent = "content-security-policy.com";
  			t6 = text(",\r\n    ");
  			a2 = element("a");
  			a2.textContent = "OWASP-cheat-sheet";
  			t8 = space();
  			div1 = element("div");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			t9 = space();
  			hr = element("hr");
  			t10 = space();
  			details1 = element("details");
  			summary0 = element("summary");
  			b1 = element("b");
  			b1.textContent = "report-to";
  			t12 = text(":");
  			t13 = space();
  			details0 = element("details");
  			summary1 = element("summary");
  			summary1.textContent = "expand...";
  			t15 = space();
  			small = element("small");
  			t16 = space();
  			div0 = element("div");
  			t17 = text(/*reportTo*/ ctx[1]);
  			add_location(b0, file$3, 39, 2, 962);
  			attr_dev(a0, "target", "blank");
  			attr_dev(a0, "href", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP");
  			add_location(a0, file$3, 42, 4, 1018);
  			attr_dev(a1, "target", "blank");
  			attr_dev(a1, "href", "https://content-security-policy.com/");
  			add_location(a1, file$3, 43, 4, 1114);
  			attr_dev(a2, "target", "blank");
  			attr_dev(a2, "href", "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html");
  			add_location(a2, file$3, 44, 4, 1212);
  			add_location(p, file$3, 40, 2, 996);
  			add_location(hr, file$3, 67, 4, 2116);
  			add_location(b1, file$3, 68, 37, 2161);
  			attr_dev(summary0, "class", "report svelte-ws3cmd");
  			add_location(summary0, file$3, 68, 13, 2137);
  			attr_dev(summary1, "class", "svelte-ws3cmd");
  			add_location(summary1, file$3, 69, 28, 2218);
  			add_location(small, file$3, 70, 8, 2256);
  			attr_dev(details0, "class", "note svelte-ws3cmd");
  			add_location(details0, file$3, 69, 6, 2196);
  			attr_dev(div0, "class", "item svelte-ws3cmd");
  			add_location(div0, file$3, 72, 6, 2490);
  			add_location(details1, file$3, 68, 4, 2128);
  			add_location(div1, file$3, 46, 2, 1356);
  			attr_dev(div2, "class", "vbox");
  			add_location(div2, file$3, 38, 0, 940);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div2, anchor);
  			append_dev(div2, b0);
  			append_dev(div2, t1);
  			append_dev(div2, p);
  			append_dev(p, t2);
  			append_dev(p, a0);
  			append_dev(p, t4);
  			append_dev(p, a1);
  			append_dev(p, t6);
  			append_dev(p, a2);
  			append_dev(div2, t8);
  			append_dev(div2, div1);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div1, null);
  			}

  			append_dev(div1, t9);
  			append_dev(div1, hr);
  			append_dev(div1, t10);
  			append_dev(div1, details1);
  			append_dev(details1, summary0);
  			append_dev(summary0, b1);
  			append_dev(summary0, t12);
  			append_dev(details1, t13);
  			append_dev(details1, details0);
  			append_dev(details0, summary1);
  			append_dev(details0, t15);
  			append_dev(details0, small);
  			small.innerHTML = raw_value;
  			append_dev(details1, t16);
  			append_dev(details1, div0);
  			append_dev(div0, t17);
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*csp, cspArr, cspInfo*/ 1) {
  				each_value = Cspdirective.cspArr;
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$3(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block$3(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div1, t9);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value.length;
  			}

  			if (dirty & /*reportTo*/ 2) set_data_dev(t17, /*reportTo*/ ctx[1]);
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div2);
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$3.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$3($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Cspheader', slots, []);
  	let csp = window.mitm.info.csp;
  	let reportTo = csp.reportTo;

  	onMount(async () => {
  		const fallback = true;
  		const { policy } = csp['default-src'] || {};

  		if (policy && policy.length > 0) {
  			for (const id of Cspdirective.cspFetch) {
  				if (!csp[id]) {
  					$$invalidate(0, csp[id] = { policy, fallback }, csp);
  				}
  			}
  		}

  		for (const id of Cspdirective.cspEAttr) {
  			const par = id.replace(/-.{4}$/, '');
  			const { policy } = csp[par] || {};

  			if (!csp[id] && policy) {
  				$$invalidate(0, csp[id] = { policy, fallback }, csp);
  			}
  		}

  		if (reportTo !== 'JSON Error!' && reportTo?.length > 15) {
  			let cb = reportTo.replace(/\n/g, '').trim();

  			if (cb[0] === '{' && cb.slice(-1) === '}') {
  				cb = JSON.stringify(JSON.parse(`[${cb}]`), null, 2);
  				$$invalidate(1, reportTo = cb.replace(/\[|\]/g, '').replace(/\n  /g, '\n').trim());
  			}
  		}
  	});

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cspheader> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		onMount,
  		cspArr: Cspdirective.cspArr,
  		cspInfo: Cspdirective.cspInfo,
  		cspFetch: Cspdirective.cspFetch,
  		cspEAttr: Cspdirective.cspEAttr,
  		csp,
  		reportTo
  	});

  	$$self.$inject_state = $$props => {
  		if ('csp' in $$props) $$invalidate(0, csp = $$props.csp);
  		if ('reportTo' in $$props) $$invalidate(1, reportTo = $$props.reportTo);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [csp, reportTo];
  }

  class Cspheader$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Cspheader",
  			options,
  			id: create_fragment$3.name
  		});
  	}
  }

  var Cspheader$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': Cspheader$1
  });

  /* ws-client\svelte\Hotkeys.svelte generated by Svelte v3.43.0 */

  const { console: console_1$1 } = globals;
  const file$2 = "ws-client\\svelte\\Hotkeys.svelte";

  function get_each_context$2(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[4] = list[i];
  	child_ctx[6] = i;
  	return child_ctx;
  }

  // (115:4) {#each _keys as obj,i}
  function create_each_block$2(ctx) {
  	let tr;
  	let td0;
  	let t0_value = /*i*/ ctx[6] + 1 + "";
  	let t0;
  	let t1;
  	let td1;
  	let t2_value = kcode(/*obj*/ ctx[4]) + "";
  	let t2;
  	let td1_data_id_value;
  	let t3;
  	let td2;
  	let t4_value = /*obj*/ ctx[4].title + "";
  	let t4;
  	let t5;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			tr = element("tr");
  			td0 = element("td");
  			t0 = text(t0_value);
  			t1 = space();
  			td1 = element("td");
  			t2 = text(t2_value);
  			t3 = space();
  			td2 = element("td");
  			t4 = text(t4_value);
  			t5 = space();
  			attr_dev(td0, "class", "no svelte-zpccy4");
  			add_location(td0, file$2, 116, 8, 2981);
  			attr_dev(td1, "class", "kcode svelte-zpccy4");
  			attr_dev(td1, "data-id", td1_data_id_value = /*obj*/ ctx[4].id);
  			add_location(td1, file$2, 117, 8, 3016);
  			attr_dev(td2, "class", "title svelte-zpccy4");
  			add_location(td2, file$2, 120, 8, 3123);
  			attr_dev(tr, "class", "svelte-zpccy4");
  			add_location(tr, file$2, 115, 6, 2967);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, tr, anchor);
  			append_dev(tr, td0);
  			append_dev(td0, t0);
  			append_dev(tr, t1);
  			append_dev(tr, td1);
  			append_dev(td1, t2);
  			append_dev(tr, t3);
  			append_dev(tr, td2);
  			append_dev(td2, t4);
  			append_dev(tr, t5);

  			if (!mounted) {
  				dispose = listen_dev(td1, "click", handleClick, false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*_keys*/ 1 && t2_value !== (t2_value = kcode(/*obj*/ ctx[4]) + "")) set_data_dev(t2, t2_value);

  			if (dirty & /*_keys*/ 1 && td1_data_id_value !== (td1_data_id_value = /*obj*/ ctx[4].id)) {
  				attr_dev(td1, "data-id", td1_data_id_value);
  			}

  			if (dirty & /*_keys*/ 1 && t4_value !== (t4_value = /*obj*/ ctx[4].title + "")) set_data_dev(t4, t4_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(tr);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$2.name,
  		type: "each",
  		source: "(115:4) {#each _keys as obj,i}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$2(ctx) {
  	let div;
  	let b;
  	let t1;
  	let table;
  	let each_value = /*_keys*/ ctx[0];
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			b = element("b");
  			b.textContent = "Hot-keys:";
  			t1 = space();
  			table = element("table");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			add_location(b, file$2, 112, 2, 2904);
  			attr_dev(table, "class", "svelte-zpccy4");
  			add_location(table, file$2, 113, 2, 2924);
  			attr_dev(div, "class", "vbox svelte-zpccy4");
  			add_location(div, file$2, 111, 0, 2882);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, b);
  			append_dev(div, t1);
  			append_dev(div, table);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(table, null);
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*_keys, handleClick, kcode*/ 1) {
  				each_value = /*_keys*/ ctx[0];
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$2(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block$2(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(table, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value.length;
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$2.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  const _c$1 = 'color: blueviolet';

  function handleClick(e) {
  	const key = e.target.dataset.id;
  	const fn = mitm.macrokeys[key];
  	let [typ, ...arr] = key.split(':');
  	const opt = {};

  	if (typ === 'key') {
  		const qctl = key.match(/<([^>]+)>/);
  		const qalt = key.match(/{([^}]+)}/);
  		let k;

  		if (qctl) {
  			opt.altKey = true;
  			k = qctl[1].substr(-1);
  		} else if (qalt) {
  			k.ctrlKey = true;
  			k = qalt[1].substr(-1);
  		} else {
  			opt.altKey = true;
  			opt.ctrlKey = true;
  			k = arr.pop().substr(-1);
  		}

  		opt.shiftKey = e.shiftKey;
  		opt.code = `Key${k.toUpperCase()}`;
  		opt.key = mitm.fn.codeToChar(opt);
  	} else if (typ === 'code') {
  		const qctl = key.match(/<([^>]+)>/);
  		const qalt = key.match(/{([^}]+)}/);

  		if (qctl) {
  			opt.ctrlKey = true;
  			arr = qctl[1].split(':');
  		} else if (qalt) {
  			opt.altKey = true;
  			arr = qalt[1].split(':');
  		} else {
  			opt.ctrlKey = true;
  			opt.altKey = true;
  		}

  		opt.code = arr.pop();
  		opt.shiftKey = e.shiftKey;
  		opt.key = mitm.fn.codeToChar(opt);
  	}

  	if (fn) {
  		const macro = fn(new KeyboardEvent('keydown', opt));
  		mitm.fn.macroAutomation(macro);
  		return true;
  	}
  }

  function ktoShow(k) {
  	return k.split('').map(x => `${x}`).join('✧');
  }

  function kcode(obj) {
  	const key = obj.id;
  	mitm.fn;
  	let [typ, ...arr] = key.split(':');
  	let msg;

  	if (typ === 'key') {
  		const qctl = key.match(/<([^>]+)>/);
  		const qalt = key.match(/{([^}]+)}/);

  		if (qctl) {
  			msg = `ctl . ... ⇾ ${ktoShow(qctl[1])}`;
  		} else if (qalt) {
  			msg = `alt . ... ⇾ ${ktoShow(qalt[1])}`;
  		} else {
  			msg = `ctl + alt ⇾ ${ktoShow(arr.pop())}`;
  		}
  	} else if (typ === 'code') {
  		const qctl = key.match(/<([^>]+)>/);
  		const qalt = key.match(/{([^}]+)}/);

  		if (qctl) {
  			msg = 'ctl . ... ⇨ ' + mitm.fn.codeToShow(qctl[1]);
  		} else if (qalt) {
  			msg = 'alt . ... ⇨ ' + mitm.fn.codeToShow(qalt[1]);
  		} else {
  			msg = 'ctl + alt ⇨ ' + mitm.fn.codeToShow(arr.join(':'));
  		}
  	}

  	return msg;
  }

  function instance$2($$self, $$props, $$invalidate) {
  	let _keys;
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Hotkeys', slots, []);
  	let keys = [];

  	function reloadKeys() {
  		console.log('%cReload hotkeys.', _c$1);
  		const { macrokeys: mkey } = window.mitm;
  		$$invalidate(1, keys = []);

  		for (const id in mkey) {
  			keys.push({ id, title: mkey[id]._title });
  		}
  	}

  	let observer;

  	onMount(async () => {
  		const qry = '.mitm-container.center';
  		const node = document.querySelector(qry);

  		const nodeVisible = obs => {
  			if (node.attributes.style) {
  				reloadKeys();
  			}
  		};

  		observer = new MutationObserver(nodeVisible);
  		observer.observe(node, { attributes: true });
  		setTimeout(reloadKeys, 1000);
  	});

  	onDestroy(() => {
  		if (observer) {
  			observer.disconnect();
  			observer = undefined;
  		}
  	});

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Hotkeys> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		_c: _c$1,
  		keys,
  		reloadKeys,
  		observer,
  		handleClick,
  		ktoShow,
  		kcode,
  		_keys
  	});

  	$$self.$inject_state = $$props => {
  		if ('keys' in $$props) $$invalidate(1, keys = $$props.keys);
  		if ('observer' in $$props) observer = $$props.observer;
  		if ('_keys' in $$props) $$invalidate(0, _keys = $$props._keys);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*keys*/ 2) {
  			$$invalidate(0, _keys = keys);
  		}
  	};

  	return [_keys, keys];
  }

  class Hotkeys$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Hotkeys",
  			options,
  			id: create_fragment$2.name
  		});
  	}
  }

  var Hotkeys$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': Hotkeys$1
  });

  // Note: This regex matches even invalid JSON strings, but since we’re
  // working on the output of `JSON.stringify` we know that only valid strings
  // are present (unless the user supplied a weird `options.indent` but in
  // that case we don’t care since the output would be invalid anyway).
  var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;

  var jsonStringifyPrettyCompact = function stringify(passedObj, options) {
    var indent, maxLength, replacer;

    options = options || {};
    indent = JSON.stringify(
      [1],
      undefined,
      options.indent === undefined ? 2 : options.indent
    ).slice(2, -3);
    maxLength =
      indent === ""
        ? Infinity
        : options.maxLength === undefined
        ? 80
        : options.maxLength;
    replacer = options.replacer;

    return (function _stringify(obj, currentIndent, reserved) {
      // prettier-ignore
      var end, index, items, key, keyPart, keys, length, nextIndent, prettified, start, string, value;

      if (obj && typeof obj.toJSON === "function") {
        obj = obj.toJSON();
      }

      string = JSON.stringify(obj, replacer);

      if (string === undefined) {
        return string;
      }

      length = maxLength - currentIndent.length - reserved;

      if (string.length <= length) {
        prettified = string.replace(
          stringOrChar,
          function (match, stringLiteral) {
            return stringLiteral || match + " ";
          }
        );
        if (prettified.length <= length) {
          return prettified;
        }
      }

      if (replacer != null) {
        obj = JSON.parse(string);
        replacer = undefined;
      }

      if (typeof obj === "object" && obj !== null) {
        nextIndent = currentIndent + indent;
        items = [];
        index = 0;

        if (Array.isArray(obj)) {
          start = "[";
          end = "]";
          length = obj.length;
          for (; index < length; index++) {
            items.push(
              _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
                "null"
            );
          }
        } else {
          start = "{";
          end = "}";
          keys = Object.keys(obj);
          length = keys.length;
          for (; index < length; index++) {
            key = keys[index];
            keyPart = JSON.stringify(key) + ": ";
            value = _stringify(
              obj[key],
              nextIndent,
              keyPart.length + (index === length - 1 ? 0 : 1)
            );
            if (value !== undefined) {
              items.push(keyPart + value);
            }
          }
        }

        if (items.length > 0) {
          return [start, indent + items.join(",\n" + nextIndent), end].join(
            "\n" + currentIndent
          );
        }
      }

      return string;
    })(passedObj, "", 0);
  };

  /* ws-client\svelte\Json.svelte generated by Svelte v3.43.0 */

  const { Object: Object_1 } = globals;
  const file$1 = "ws-client\\svelte\\Json.svelte";

  function get_each_context$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[3] = list[i];
  	return child_ctx;
  }

  // (11:0) {#each keys as key}
  function create_each_block$1(ctx) {
  	let details;
  	let summary;
  	let t0_value = /*key*/ ctx[3] + "";
  	let t0;
  	let t1;
  	let pre;
  	let t2_value = jsonStringifyPrettyCompact(/*json*/ ctx[1][/*key*/ ctx[3]]) + "";
  	let t2;
  	let pre_class_value;
  	let t3;
  	let details_class_value;

  	const block = {
  		c: function create() {
  			details = element("details");
  			summary = element("summary");
  			t0 = text(t0_value);
  			t1 = space();
  			pre = element("pre");
  			t2 = text(t2_value);
  			t3 = space();
  			attr_dev(summary, "class", "sv-title svelte-1hx80ts");
  			add_location(summary, file$1, 12, 2, 277);
  			attr_dev(pre, "class", pre_class_value = "sv-" + /*general*/ ctx[0].ext + " svelte-1hx80ts");
  			add_location(pre, file$1, 13, 2, 320);
  			attr_dev(details, "class", details_class_value = "sv-data sv-" + /*key*/ ctx[3] + " st" + Math.trunc(/*general*/ ctx[0].status / 100) + "x" + " svelte-1hx80ts");
  			add_location(details, file$1, 11, 0, 203);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, details, anchor);
  			append_dev(details, summary);
  			append_dev(summary, t0);
  			append_dev(details, t1);
  			append_dev(details, pre);
  			append_dev(pre, t2);
  			append_dev(details, t3);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*json*/ 2 && t2_value !== (t2_value = jsonStringifyPrettyCompact(/*json*/ ctx[1][/*key*/ ctx[3]]) + "")) set_data_dev(t2, t2_value);

  			if (dirty & /*general*/ 1 && pre_class_value !== (pre_class_value = "sv-" + /*general*/ ctx[0].ext + " svelte-1hx80ts")) {
  				attr_dev(pre, "class", pre_class_value);
  			}

  			if (dirty & /*general*/ 1 && details_class_value !== (details_class_value = "sv-data sv-" + /*key*/ ctx[3] + " st" + Math.trunc(/*general*/ ctx[0].status / 100) + "x" + " svelte-1hx80ts")) {
  				attr_dev(details, "class", details_class_value);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(details);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$1.name,
  		type: "each",
  		source: "(11:0) {#each keys as key}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$1(ctx) {
  	let div;
  	let each_value = /*keys*/ ctx[2];
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  	}

  	const block = {
  		c: function create() {
  			div = element("div");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(div, "class", "sv-item svelte-1hx80ts");
  			add_location(div, file$1, 9, 0, 161);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div, null);
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*keys, Math, general, stringify, json*/ 7) {
  				each_value = /*keys*/ ctx[2];
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$1(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block$1(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value.length;
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$1.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$1($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Json', slots, []);
  	let { general = {} } = $$props;
  	let { json = {} } = $$props;
  	let keys = Object.keys(json);
  	const writable_props = ['general', 'json'];

  	Object_1.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Json> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('general' in $$props) $$invalidate(0, general = $$props.general);
  		if ('json' in $$props) $$invalidate(1, json = $$props.json);
  	};

  	$$self.$capture_state = () => ({ stringify: jsonStringifyPrettyCompact, general, json, keys });

  	$$self.$inject_state = $$props => {
  		if ('general' in $$props) $$invalidate(0, general = $$props.general);
  		if ('json' in $$props) $$invalidate(1, json = $$props.json);
  		if ('keys' in $$props) $$invalidate(2, keys = $$props.keys);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [general, json, keys];
  }

  class Json extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$1, safe_not_equal, { general: 0, json: 1 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Json",
  			options,
  			id: create_fragment$1.name
  		});
  	}

  	get general() {
  		throw new Error("<Json>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set general(value) {
  		throw new Error("<Json>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get json() {
  		throw new Error("<Json>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set json(value) {
  		throw new Error("<Json>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* ws-client\svelte\sqlite.svelte generated by Svelte v3.43.0 */

  const { console: console_1 } = globals;
  const file = "ws-client\\svelte\\sqlite.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[11] = list[i];
  	return child_ctx;
  }

  function get_each_context_1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[14] = list[i];
  	return child_ctx;
  }

  // (125:4) {:else}
  function create_else_block_1(ctx) {
  	let t;

  	const block = {
  		c: function create() {
  			t = text("loading-1...");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block_1.name,
  		type: "else",
  		source: "(125:4) {:else}",
  		ctx
  	});

  	return block;
  }

  // (99:4) {#if lst[item.session].length}
  function create_if_block(ctx) {
  	let each_1_anchor;
  	let current;
  	let each_value_1 = /*lst*/ ctx[0][/*item*/ ctx[11].session];
  	validate_each_argument(each_value_1);
  	let each_blocks = [];

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	const block = {
  		c: function create() {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			each_1_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(target, anchor);
  			}

  			insert_dev(target, each_1_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*err_method, lst, obj, Math, expClick, path, host, query*/ 207) {
  				each_value_1 = /*lst*/ ctx[0][/*item*/ ctx[11].session];
  				validate_each_argument(each_value_1);
  				let i;

  				for (i = 0; i < each_value_1.length; i += 1) {
  					const child_ctx = get_each_context_1(ctx, each_value_1, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block_1(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
  					}
  				}

  				group_outros();

  				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value_1.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_each(each_blocks, detaching);
  			if (detaching) detach_dev(each_1_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block.name,
  		type: "if",
  		source: "(99:4) {#if lst[item.session].length}",
  		ctx
  	});

  	return block;
  }

  // (119:12) {:else}
  function create_else_block(ctx) {
  	let pre;
  	let t_value = /*i2*/ ctx[14].data + "";
  	let t;
  	let pre_class_value;

  	const block = {
  		c: function create() {
  			pre = element("pre");
  			t = text(t_value);
  			attr_dev(pre, "class", pre_class_value = "sv-" + /*i2*/ ctx[14].meta.general.ext + " svelte-wtlyn9");
  			add_location(pre, file, 119, 14, 4229);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, pre, anchor);
  			append_dev(pre, t);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*lst, obj*/ 3 && t_value !== (t_value = /*i2*/ ctx[14].data + "")) set_data_dev(t, t_value);

  			if (dirty & /*lst, obj*/ 3 && pre_class_value !== (pre_class_value = "sv-" + /*i2*/ ctx[14].meta.general.ext + " svelte-wtlyn9")) {
  				attr_dev(pre, "class", pre_class_value);
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(pre);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block.name,
  		type: "else",
  		source: "(119:12) {:else}",
  		ctx
  	});

  	return block;
  }

  // (117:12) {#if i2.meta.general.ext==='json'}
  function create_if_block_1(ctx) {
  	let json;
  	let current;

  	json = new Json({
  			props: {
  				json: /*i2*/ ctx[14].data,
  				general: /*i2*/ ctx[14].meta.general
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(json.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(json, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const json_changes = {};
  			if (dirty & /*lst, obj*/ 3) json_changes.json = /*i2*/ ctx[14].data;
  			if (dirty & /*lst, obj*/ 3) json_changes.general = /*i2*/ ctx[14].meta.general;
  			json.$set(json_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(json.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(json.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(json, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1.name,
  		type: "if",
  		source: "(117:12) {#if i2.meta.general.ext==='json'}",
  		ctx
  	});

  	return block;
  }

  // (100:6) {#each lst[item.session] as i2}
  function create_each_block_1(ctx) {
  	let details2;
  	let summary0;
  	let span0;
  	let t0_value = /*i2*/ ctx[14].meta.general.status + "";
  	let t0;
  	let span0_class_value;
  	let t1;
  	let span1;
  	let t2_value = /*i2*/ ctx[14].meta.general.method.padEnd(4, '.') + "";
  	let t2;
  	let span1_class_value;
  	let t3;
  	let span2;
  	let t4_value = /*host*/ ctx[7](/*i2*/ ctx[14].url, /*path*/ ctx[3], /*query*/ ctx[2]) + "";
  	let t4;
  	let span2_class_value;
  	let summary0_data_id_value;
  	let summary0_data_ss_value;
  	let summary0_class_value;
  	let t5;
  	let details0;
  	let summary1;
  	let t7;
  	let json;
  	let t8;
  	let details1;
  	let summary2;
  	let t10;
  	let current_block_type_index;
  	let if_block;
  	let details1_class_value;
  	let t11;
  	let current;
  	let mounted;
  	let dispose;

  	json = new Json({
  			props: { json: /*i2*/ ctx[14].meta },
  			$$inline: true
  		});

  	const if_block_creators = [create_if_block_1, create_else_block];
  	const if_blocks = [];

  	function select_block_type_1(ctx, dirty) {
  		if (/*i2*/ ctx[14].meta.general.ext === 'json') return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type_1(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			details2 = element("details");
  			summary0 = element("summary");
  			span0 = element("span");
  			t0 = text(t0_value);
  			t1 = space();
  			span1 = element("span");
  			t2 = text(t2_value);
  			t3 = space();
  			span2 = element("span");
  			t4 = text(t4_value);
  			t5 = space();
  			details0 = element("details");
  			summary1 = element("summary");
  			summary1.textContent = "header";
  			t7 = space();
  			create_component(json.$$.fragment);
  			t8 = space();
  			details1 = element("details");
  			summary2 = element("summary");
  			summary2.textContent = "content";
  			t10 = space();
  			if_block.c();
  			t11 = space();
  			attr_dev(span0, "class", span0_class_value = "sv-" + /*i2*/ ctx[14].meta.general.status + " svelte-wtlyn9");
  			add_location(span0, file, 106, 12, 3487);
  			attr_dev(span1, "class", span1_class_value = "sv-" + /*i2*/ ctx[14].meta.general.method + " svelte-wtlyn9");
  			add_location(span1, file, 107, 12, 3572);
  			attr_dev(span2, "class", span2_class_value = "sv-" + (/*path*/ ctx[3] ? 'path' : 'fullpath') + " svelte-wtlyn9");
  			add_location(span2, file, 108, 12, 3671);
  			attr_dev(summary0, "data-id", summary0_data_id_value = /*i2*/ ctx[14].id);
  			attr_dev(summary0, "data-ss", summary0_data_ss_value = /*item*/ ctx[11].session);
  			attr_dev(summary0, "class", summary0_class_value = "sv-title st" + Math.trunc(/*i2*/ ctx[14].meta.general.status / 100) + "x" + " svelte-wtlyn9");
  			add_location(summary0, file, 101, 10, 3299);
  			attr_dev(summary1, "class", "sv-title sv-header svelte-wtlyn9");
  			add_location(summary1, file, 111, 12, 3832);
  			attr_dev(details0, "class", "sv-row-data sv-header svelte-wtlyn9");
  			add_location(details0, file, 110, 10, 3779);
  			attr_dev(summary2, "class", "sv-title sv-content svelte-wtlyn9");
  			add_location(summary2, file, 115, 12, 4025);
  			attr_dev(details1, "class", details1_class_value = "sv-row-data sv-content " + err_method(/*i2*/ ctx[14]) + " svelte-wtlyn9");
  			add_location(details1, file, 114, 10, 3954);
  			attr_dev(details2, "class", "sv-rows svelte-wtlyn9");
  			add_location(details2, file, 100, 8, 3262);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, details2, anchor);
  			append_dev(details2, summary0);
  			append_dev(summary0, span0);
  			append_dev(span0, t0);
  			append_dev(summary0, t1);
  			append_dev(summary0, span1);
  			append_dev(span1, t2);
  			append_dev(summary0, t3);
  			append_dev(summary0, span2);
  			append_dev(span2, t4);
  			append_dev(details2, t5);
  			append_dev(details2, details0);
  			append_dev(details0, summary1);
  			append_dev(details0, t7);
  			mount_component(json, details0, null);
  			append_dev(details2, t8);
  			append_dev(details2, details1);
  			append_dev(details1, summary2);
  			append_dev(details1, t10);
  			if_blocks[current_block_type_index].m(details1, null);
  			append_dev(details2, t11);
  			current = true;

  			if (!mounted) {
  				dispose = listen_dev(summary0, "click", /*expClick*/ ctx[6], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if ((!current || dirty & /*lst, obj*/ 3) && t0_value !== (t0_value = /*i2*/ ctx[14].meta.general.status + "")) set_data_dev(t0, t0_value);

  			if (!current || dirty & /*lst, obj*/ 3 && span0_class_value !== (span0_class_value = "sv-" + /*i2*/ ctx[14].meta.general.status + " svelte-wtlyn9")) {
  				attr_dev(span0, "class", span0_class_value);
  			}

  			if ((!current || dirty & /*lst, obj*/ 3) && t2_value !== (t2_value = /*i2*/ ctx[14].meta.general.method.padEnd(4, '.') + "")) set_data_dev(t2, t2_value);

  			if (!current || dirty & /*lst, obj*/ 3 && span1_class_value !== (span1_class_value = "sv-" + /*i2*/ ctx[14].meta.general.method + " svelte-wtlyn9")) {
  				attr_dev(span1, "class", span1_class_value);
  			}

  			if ((!current || dirty & /*lst, obj, path, query*/ 15) && t4_value !== (t4_value = /*host*/ ctx[7](/*i2*/ ctx[14].url, /*path*/ ctx[3], /*query*/ ctx[2]) + "")) set_data_dev(t4, t4_value);

  			if (!current || dirty & /*path*/ 8 && span2_class_value !== (span2_class_value = "sv-" + (/*path*/ ctx[3] ? 'path' : 'fullpath') + " svelte-wtlyn9")) {
  				attr_dev(span2, "class", span2_class_value);
  			}

  			if (!current || dirty & /*lst, obj*/ 3 && summary0_data_id_value !== (summary0_data_id_value = /*i2*/ ctx[14].id)) {
  				attr_dev(summary0, "data-id", summary0_data_id_value);
  			}

  			if (!current || dirty & /*obj*/ 2 && summary0_data_ss_value !== (summary0_data_ss_value = /*item*/ ctx[11].session)) {
  				attr_dev(summary0, "data-ss", summary0_data_ss_value);
  			}

  			if (!current || dirty & /*lst, obj*/ 3 && summary0_class_value !== (summary0_class_value = "sv-title st" + Math.trunc(/*i2*/ ctx[14].meta.general.status / 100) + "x" + " svelte-wtlyn9")) {
  				attr_dev(summary0, "class", summary0_class_value);
  			}

  			const json_changes = {};
  			if (dirty & /*lst, obj*/ 3) json_changes.json = /*i2*/ ctx[14].meta;
  			json.$set(json_changes);
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type_1(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(details1, null);
  			}

  			if (!current || dirty & /*lst, obj*/ 3 && details1_class_value !== (details1_class_value = "sv-row-data sv-content " + err_method(/*i2*/ ctx[14]) + " svelte-wtlyn9")) {
  				attr_dev(details1, "class", details1_class_value);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(json.$$.fragment, local);
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(json.$$.fragment, local);
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(details2);
  			destroy_component(json);
  			if_blocks[current_block_type_index].d();
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block_1.name,
  		type: "each",
  		source: "(100:6) {#each lst[item.session] as i2}",
  		ctx
  	});

  	return block;
  }

  // (94:0) {#each obj.rows as item}
  function create_each_block(ctx) {
  	let details;
  	let summary;
  	let t0_value = /*item*/ ctx[11].session + "";
  	let t0;
  	let span;
  	let t1;
  	let t2_value = /*item*/ ctx[11].total + "";
  	let t2;
  	let t3;
  	let t4;
  	let current_block_type_index;
  	let if_block;
  	let t5;
  	let details_data_ss_value;
  	let current;
  	let mounted;
  	let dispose;
  	const if_block_creators = [create_if_block, create_else_block_1];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*lst*/ ctx[0][/*item*/ ctx[11].session].length) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			details = element("details");
  			summary = element("summary");
  			t0 = text(t0_value);
  			span = element("span");
  			t1 = text("(");
  			t2 = text(t2_value);
  			t3 = text(")");
  			t4 = space();
  			if_block.c();
  			t5 = space();
  			attr_dev(span, "class", "sv-total svelte-wtlyn9");
  			add_location(span, file, 96, 20, 3119);
  			attr_dev(summary, "class", "sv-main svelte-wtlyn9");
  			add_location(summary, file, 95, 4, 3074);
  			attr_dev(details, "class", "sv-session svelte-wtlyn9");
  			attr_dev(details, "data-ss", details_data_ss_value = /*item*/ ctx[11].session);
  			add_location(details, file, 94, 2, 2996);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, details, anchor);
  			append_dev(details, summary);
  			append_dev(summary, t0);
  			append_dev(summary, span);
  			append_dev(span, t1);
  			append_dev(span, t2);
  			append_dev(span, t3);
  			append_dev(details, t4);
  			if_blocks[current_block_type_index].m(details, null);
  			append_dev(details, t5);
  			current = true;

  			if (!mounted) {
  				dispose = listen_dev(details, "click", /*detailClick*/ ctx[5], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if ((!current || dirty & /*obj*/ 2) && t0_value !== (t0_value = /*item*/ ctx[11].session + "")) set_data_dev(t0, t0_value);
  			if ((!current || dirty & /*obj*/ 2) && t2_value !== (t2_value = /*item*/ ctx[11].total + "")) set_data_dev(t2, t2_value);
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(details, t5);
  			}

  			if (!current || dirty & /*obj*/ 2 && details_data_ss_value !== (details_data_ss_value = /*item*/ ctx[11].session)) {
  				attr_dev(details, "data-ss", details_data_ss_value);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(details);
  			if_blocks[current_block_type_index].d();
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(94:0) {#each obj.rows as item}",
  		ctx
  	});

  	return block;
  }

  function create_fragment(ctx) {
  	let div;
  	let b;
  	let t1;
  	let label0;
  	let input0;
  	let t2;
  	let t3;
  	let label1;
  	let input1;
  	let t4;
  	let t5;
  	let label2;
  	let input2;
  	let t6;
  	let t7;
  	let current;
  	let mounted;
  	let dispose;
  	let each_value = /*obj*/ ctx[1].rows;
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	const block = {
  		c: function create() {
  			div = element("div");
  			b = element("b");
  			b.textContent = "Sqlite Logs!";
  			t1 = space();
  			label0 = element("label");
  			input0 = element("input");
  			t2 = text("exp-body");
  			t3 = space();
  			label1 = element("label");
  			input1 = element("input");
  			t4 = text("no-host");
  			t5 = space();
  			label2 = element("label");
  			input2 = element("input");
  			t6 = text("query");
  			t7 = space();

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			add_location(b, file, 83, 0, 2651);
  			attr_dev(input0, "type", "checkbox");
  			attr_dev(input0, "id", "sv-body");
  			attr_dev(input0, "class", "svelte-wtlyn9");
  			add_location(input0, file, 85, 2, 2695);
  			attr_dev(label0, "for", "sv-body");
  			add_location(label0, file, 84, 0, 2672);
  			attr_dev(input1, "type", "checkbox");
  			attr_dev(input1, "id", "sv-no-host");
  			attr_dev(input1, "class", "svelte-wtlyn9");
  			add_location(input1, file, 88, 2, 2795);
  			attr_dev(label1, "for", "sv-no-host");
  			add_location(label1, file, 87, 0, 2769);
  			attr_dev(input2, "type", "checkbox");
  			attr_dev(input2, "id", "sv-query");
  			attr_dev(input2, "class", "svelte-wtlyn9");
  			add_location(input2, file, 91, 2, 2895);
  			attr_dev(label2, "for", "sv-query");
  			add_location(label2, file, 90, 0, 2871);
  			add_location(div, file, 82, 0, 2644);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, b);
  			append_dev(div, t1);
  			append_dev(div, label0);
  			append_dev(label0, input0);
  			input0.checked = /*body*/ ctx[4];
  			append_dev(label0, t2);
  			append_dev(div, t3);
  			append_dev(div, label1);
  			append_dev(label1, input1);
  			input1.checked = /*path*/ ctx[3];
  			append_dev(label1, t4);
  			append_dev(div, t5);
  			append_dev(div, label2);
  			append_dev(label2, input2);
  			input2.checked = /*query*/ ctx[2];
  			append_dev(label2, t6);
  			append_dev(div, t7);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div, null);
  			}

  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(input0, "change", /*input0_change_handler*/ ctx[8]),
  					listen_dev(input1, "change", /*input1_change_handler*/ ctx[9]),
  					listen_dev(input2, "change", /*input2_change_handler*/ ctx[10])
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*body*/ 16) {
  				input0.checked = /*body*/ ctx[4];
  			}

  			if (dirty & /*path*/ 8) {
  				input1.checked = /*path*/ ctx[3];
  			}

  			if (dirty & /*query*/ 4) {
  				input2.checked = /*query*/ ctx[2];
  			}

  			if (dirty & /*obj, detailClick, lst, err_method, Math, expClick, path, host, query*/ 239) {
  				each_value = /*obj*/ ctx[1].rows;
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(div, null);
  					}
  				}

  				group_outros();

  				for (i = each_value.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			destroy_each(each_blocks, detaching);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function err_method(i2) {
  	const { method, status } = i2.meta.general;
  	const st = Math.trunc(status / 100);

  	if (st === 3) {
  		return 'mt-REDIRECT';
  	} else if (st > 3) {
  		return 'mt-ERROR';
  	}

  	return `mt-${method}`;
  }

  function instance($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Sqlite', slots, []);
  	let lst = {};
  	let obj = { rows: [] };
  	let query = false;
  	let path = true;
  	let body = true;

  	onMount(async () => {
  		const rows = (window.innerHeight - 100) / 17.5;
  		console.log({ rows });
  		const _limit_ = rows;
  		const _count_ = { total: 'id' };
  		const _distinct_ = ['session'];
  		const _where_ = 'id>0 orderby id:d';
  		$$invalidate(1, obj = await mitm.fn.sqlList({ _count_, _distinct_, _where_, _limit_ }, 'log'));

  		obj.rows.forEach(item => {
  			$$invalidate(0, lst[item.session] = [], lst);
  		});
  	});

  	async function detailClick(e) {
  		const ss = e.currentTarget.dataset.ss;

  		if (!lst[ss]?.length) {
  			const obj = await mitm.fn.sqlList({ _where_: `session=${ss} orderby id` }, 'log');

  			$$invalidate(
  				0,
  				lst[ss] = obj.rows.map(x => {
  					x.meta = JSON.parse(x.meta);

  					if (x.meta.general.ext === 'json') {
  						x.data = JSON.parse(x.data);
  						delete x.data.general;

  						if (x.meta.general.method === 'GET') {
  							delete x.data.reqsBody;
  						}
  					}

  					return x;
  				}),
  				lst
  			);

  			console.log(ss, obj.rows);
  		}
  	}

  	async function expClick(e) {
  		if (body) {
  			const details = e.currentTarget.parentNode;

  			setTimeout(
  				() => {
  					if (details.attributes.open) {
  						details.children[2].setAttribute('open', '');
  						const arr1 = details.querySelectorAll('.sv-content:is(.mt-GET,.mt-DELETE) details:is(.sv-respBody,.sv-respHeader)');
  						const arr2 = details.querySelectorAll('.sv-content:is(.mt-PUT,.mt-POST) details:is(.sv-reqsBody)');
  						const arr3 = details.querySelectorAll('.sv-content:is(.mt-REDIRECT) details:is(.sv-respHeader)');
  						const arr4 = details.querySelectorAll('.sv-content:is(.mt-ERROR) details:is(.sv-respBody)');

  						for (const node of arr1) {
  							node.setAttribute('open', '');
  						}

  						for (const node of arr2) {
  							node.setAttribute('open', '');
  						}

  						for (const node of arr3) {
  							node.setAttribute('open', '');
  						}

  						for (const node of arr4) {
  							node.setAttribute('open', '');
  						}
  					}
  				},
  				0
  			);
  		}
  	}

  	function host(url) {
  		const obj = new URL(url);
  		let msg = path ? obj.pathname : obj.origin + obj.pathname;

  		if (query) {
  			msg += obj.search;
  		}

  		return msg.length > 90 ? msg.slice(0, 90) + '...' : msg;
  	}

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Sqlite> was created with unknown prop '${key}'`);
  	});

  	function input0_change_handler() {
  		body = this.checked;
  		$$invalidate(4, body);
  	}

  	function input1_change_handler() {
  		path = this.checked;
  		$$invalidate(3, path);
  	}

  	function input2_change_handler() {
  		query = this.checked;
  		$$invalidate(2, query);
  	}

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		Json,
  		lst,
  		obj,
  		query,
  		path,
  		body,
  		detailClick,
  		expClick,
  		host,
  		err_method
  	});

  	$$self.$inject_state = $$props => {
  		if ('lst' in $$props) $$invalidate(0, lst = $$props.lst);
  		if ('obj' in $$props) $$invalidate(1, obj = $$props.obj);
  		if ('query' in $$props) $$invalidate(2, query = $$props.query);
  		if ('path' in $$props) $$invalidate(3, path = $$props.path);
  		if ('body' in $$props) $$invalidate(4, body = $$props.body);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [
  		lst,
  		obj,
  		query,
  		path,
  		body,
  		detailClick,
  		expClick,
  		host,
  		input0_change_handler,
  		input1_change_handler,
  		input2_change_handler
  	];
  }

  class Sqlite$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Sqlite",
  			options,
  			id: create_fragment.name
  		});
  	}
  }

  var sqlite = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': Sqlite$1
  });

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(Cspheader$2);

  var require$$1 = /*@__PURE__*/getAugmentedNamespace(Hotkeys$2);

  var require$$2 = /*@__PURE__*/getAugmentedNamespace(sqlite);

  // feat: svelte related
  const {default: Cspheader} = require$$0;
  const {default: Hotkeys}   = require$$1;
  const {default: Sqlite}    = require$$2;
  var svelte = {
    Cspheader,
    Hotkeys,
    Sqlite
  };

  /* eslint-disable camelcase */

  const _c = 'color: red';

  _ws_postmessage();
  _ws_initSocket();
  _ws_screenshot();
  _ws_location();
  _ws_observer();
  _ws_general();
  _ws_cspErr();
  _ws_macros();
  console.log('%cWs: ws-client loaded...', _c);
  window.mitm.svelte = svelte;

  var wsClient = {

  };

  return wsClient;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfc3JjL193c19wb3N0bWVzc2FnZS5qcyIsIl9zcmMvX3dzX2NsaWVudC5qcyIsIl9zcmMvX3dzX21zZy1wYXJzZXIuanMiLCJfc3JjL193c19pbi1pZnJhbWUuanMiLCJfc3JjL193c192ZW5kb3IuanMiLCJfc3JjL193c19pbml0LXNvY2tldC5qcyIsIl9zcmMvX3NjcmVlbnNob3QuanMiLCJfc3JjL193c19uYW1lc3BhY2UuanMiLCJfc3JjL193c19zY3JlZW5zaG90LmpzIiwiX3NyYy9fa2V5Ym9hcmQuanMiLCJfc3JjL193c19wbGF5LmpzIiwiX3NyYy9fd3NfbG9jYXRpb24uanMiLCJfc3JjL193c19kZWJvdW5jZS5qcyIsIl9zcmMvX3dzX3JvdXRlLmpzIiwiX3NyYy9fd3Nfb2JzZXJ2ZXIuanMiLCJfc3JjL193c19nZW5lcmFsLmpzIiwiX3NyYy9fd3NfY3NwLWVyci5qcyIsIl9zcmMvX3dzX21hY3Jvcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwic3ZlbHRlL0NzcGRpcmVjdGl2ZS5qcyIsInN2ZWx0ZS9Dc3BoZWFkZXIuc3ZlbHRlIiwic3ZlbHRlL0hvdGtleXMuc3ZlbHRlIiwiLi4vbm9kZV9tb2R1bGVzL2pzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0L2luZGV4LmpzIiwic3ZlbHRlL0pzb24uc3ZlbHRlIiwic3ZlbHRlL3NxbGl0ZS5zdmVsdGUiLCJzdmVsdGUvaW5kZXguanMiLCJfc3JjL3dzLWNsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UgKGV2ZW50KSB7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxyXG4gICAgfVxyXG4gIH1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcclxufVxyXG4iLCJjb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCB3aW5kb3dSZWZcclxuICByZXR1cm4ge1xyXG4gICAgLy8gZXg6IHdzX19oZWxwKClcclxuICAgIF9oZWxwICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fcGluZyhcInRoZXJlXCIpXHJcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXHJcbiAgICBfb3BlbiAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgZmVhdHVyZXMgPSAnZGlyZWN0b3JpZXM9MCx0aXRsZWJhcj0wLHRvb2xiYXI9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCx3aWR0aD04MDAsaGVpZ2h0PTYwMCdcclxuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxyXG4gICAgICB3aW5kb3dSZWYuYmx1cigpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxyXG4gICAgX3N0eWxlICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zdCB7IHEsIGNzcyB9ID0gZGF0YVxyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXHJcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxyXG4gICAgICApXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9zYXZlVGFncyAoeyByb3V0ZXMgfSkge1xyXG4gICAgICBpZiAoIWxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IFVwZGF0ZSByb3V0ZXMnLCBfYylcclxuICAgICAgICB3aW5kb3cubWl0bS5yb3V0ZXMgPSByb3V0ZXNcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfZmlsZXMgKHsgZGF0YSwgdHlwIH0pIHtcclxuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgY29uc29sZS53YXJuKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcclxuICAgICAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cclxuICAgICAgICovXHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldICsgJycpXHJcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfc2V0Q2xpZW50ICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxyXG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcclxuY29uc3QgX3dzX3djY21kID0gX3dzX2NsaWVudCgpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XHJcbiAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcclxuICAgIGlmIChtc2cubGVuZ3RoID4gNDApIHtcclxuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzYCcsIG1zZylcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3QgYXJyID0gbXNnLnJlcGxhY2UoL1xccyskLywgJycpLm1hdGNoKC9eICooW1xcdzpdKykgKihcXHsuKikvKVxyXG4gIGlmIChhcnIpIHtcclxuICAgIGxldCBbLCBjbWQsIGpzb25dID0gYXJyXHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGpzb24sIGVycm9yKVxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xyXG4gICAgICBjb25zdCBoYW5kbGVyID0gd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF1cclxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXHJcbiAgICB9IGVsc2UgaWYgKF93c193Y2NtZFtjbWRdKSB7XHJcbiAgICAgIF93c193Y2NtZFtjbWRdLmNhbGwoZXZlbnQsIGpzb24pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCBpZnJtXHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmcm0gPSB0cnVlXHJcbiAgfVxyXG4gIHJldHVybiBpZnJtID8gJ2lmcmFtZScgOiAnd2luZG93J1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgdmVuZG9yIH0gPSBuYXZpZ2F0b3JcclxuICBjb25zdCBicm93c2VyID0ge1xyXG4gICAgJyc6ICdmaXJlZm94JyxcclxuICAgICdHb29nbGUgSW5jLic6ICdjaHJvbWl1bScsXHJcbiAgICAnQXBwbGUgQ29tcHV0ZXIsIEluYy4nOiAnd2Via2l0J1xyXG4gIH1bdmVuZG9yXVxyXG4gIHJldHVybiBicm93c2VyXHJcbn1cclxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX21zZ1BhcnNlciA9IHJlcXVpcmUoJy4vX3dzX21zZy1wYXJzZXInKVxyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3Qge19fYXJncywgX19mbGFnfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZuID0gd2luZG93Ll93c19jb25uZWN0W2tleV1cclxuICAgICAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kID0gdHJ1ZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxyXG4gICAgICAgIGZuKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxyXG4gICAgd2luZG93Ll93c19jb25uZWN0ZWQgPSB0cnVlXHJcblxyXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGlmICghd2luZG93Ll93c19jb25uZWN0ZWRfc2VuZCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXHJcbiAgICAgICAgd3Nfc2VuZCgpXHJcbiAgICAgIH1cclxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXHJcbiAgfVxyXG5cclxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBjbG9zZSBjb25uZWN0aW9uJywgX2MpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKF9fZmxhZ1snb24tbWVzc2FnZSddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBvbi1tZXNzYWdlOicsIF9jLCBlLmRhdGEpXHJcbiAgICB9XHJcbiAgICBfd3NfbXNnUGFyc2VyKGUsIGUuZGF0YSlcclxuICB9XHJcbiAgXHJcbiAgY29uc3QgY29ubmVjdCA9IF9fYXJncy5ub3NvY2tldD09PXVuZGVmaW5lZFxyXG4gIGlmIChjb25uZWN0IHx8ICh3aW5kb3cuY2hyb21lICYmIGNocm9tZS50YWJzKSkge1xyXG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcclxuICAgIGNvbnN0IHByZSA9IHZlbmRvciA/ICd3cycgOiAnd3NzJ1xyXG4gICAgY29uc3QgcHJ0ID0gdmVuZG9yID8gJzMwMDInIDogJzMwMDEnXHJcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICAgIGxldCB3c1xyXG4gICAgdHJ5IHtcclxuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxyXG4gICAgfVxyXG4gICAgY29uc29sZS50aW1lKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzID0gd3NcclxuICBcclxuICAgIHdzLm9ub3BlbiA9IG9ub3BlblxyXG4gICAgd3Mub25jbG9zZSA9IG9uY2xvc2VcclxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXHJcbiAgfVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXHJcbiAgfVxyXG59XHJcbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XHJcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxyXG4gIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgICB9XHJcbiAgICAgICAgZmV0Y2goJy9taXRtLXBsYXkvc2NyZW5zaG90Lmpzb24nLCBjb25maWcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmVzb2x2ZShyZXNwb25zZS5qc29uKCkpfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHJlamVjdChlcnJvcilcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywganNvbiwgcmVzb2x2ZSlcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICByZWplY3QoZXJyb3IpXHJcbiAgICAgIH1cclxuICAgIH0pICBcclxuICB9XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vZywgJ1teLl0qJykpKSkge1xyXG4gICAgICBuYW1lc3BhY2UgPSBrZXlcclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5hbWVzcGFjZVxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgbWl0bSAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXHJcbiAgICB9XHJcbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgYnJvd3NlciB9XHJcbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXHJcbiAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcclxuICAgICAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXRcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgYWN0ID0gd2luZG93Lm1pdG0uc2NyZWVuc2hvdFxyXG4gICAgICAgICAgaWYgKGFjdCkge1xyXG4gICAgICAgICAgICBhY3QuY2xpY2soKVxyXG4gICAgICAgICAgICBhY3QgPSB1bmRlZmluZWRcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBkZWxheSBhY3Rpb24gdW5kZWZpbmVkJywgX2MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIGRlbGF5KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXZlbnRjbGljayhlKSB7XHJcbiAgbWl0bS5sYXN0RXZlbnQgPSBlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50Y2xpY2spXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG4iLCJjb25zdCBrY29kZTEgPSB7XHJcbiAgQmFja3F1b3RlICAgOiAnYCcsXHJcbiAgQnJhY2tldExlZnQgOiAnWycsXHJcbiAgQnJhY2tldFJpZ2h0OiAnXScsXHJcbiAgQmFja3NsYXNoOiAnXFxcXCcsXHJcbiAgQ29tbWEgICAgOiAnLCcsXHJcbiAgUGVyaW9kICAgOiAnLicsXHJcbiAgUXVvdGUgICAgOiBcIidcIixcclxuICBTZW1pY29sb246ICc7JyxcclxuICBTbGFzaCAgICA6ICcvJyxcclxuICBTcGFjZSAgICA6ICcgJyxcclxuICBNaW51cyAgICA6ICctJyxcclxuICBFcXVhbCAgICA6ICc9JyxcclxufVxyXG5cclxuY29uc3Qga2NvZGUyID0ge1xyXG4gIEJhY2txdW90ZSAgIDogJ34nLFxyXG4gIEJyYWNrZXRMZWZ0IDogJ3snLFxyXG4gIEJyYWNrZXRSaWdodDogJ30nLFxyXG4gIEJhY2tzbGFzaDogJ3wnLFxyXG4gIENvbW1hICAgIDogJzwnLFxyXG4gIFBlcmlvZCAgIDogJz4nLFxyXG4gIFF1b3RlICAgIDogJ1wiJyxcclxuICBTZW1pY29sb246ICc6JyxcclxuICBTbGFzaCAgICA6ICc/JyxcclxuICBTcGFjZSAgICA6ICcgJyxcclxuICBNaW51cyAgICA6ICdfJyxcclxuICBFcXVhbCAgICA6ICcrJyxcclxufVxyXG5cclxuY29uc3Qga2NvZGUzID0ge1xyXG4gIDE6ICchJyxcclxuICAyOiAnQCcsXHJcbiAgMzogJyMnLFxyXG4gIDQ6ICckJyxcclxuICA1OiAnJScsXHJcbiAgNjogJ14nLFxyXG4gIDc6ICcmJyxcclxuICA4OiAnKicsXHJcbiAgOTogJygnLFxyXG4gIDEwOiAnKSdcclxufVxyXG5cclxuY29uc3Qga3Nob3cgPSB7XHJcbiAgLi4ua2NvZGUxLFxyXG4gIEVudGVyOiAnRW50ZXInLFxyXG4gIENhcHNMb2NrOiAnQ2FwcycsXHJcbiAgQmFja3NwYWNlOiAnQlMnLFxyXG4gIEVzY2FwZTogJ0VzYycsXHJcbiAgRGlnaXQxOiAnMScsXHJcbiAgRGlnaXQyOiAnMicsXHJcbiAgRGlnaXQzOiAnMycsXHJcbiAgRGlnaXQ0OiAnNCcsXHJcbiAgRGlnaXQ1OiAnNScsXHJcbiAgRGlnaXQ2OiAnNicsXHJcbiAgRGlnaXQ3OiAnNycsXHJcbiAgRGlnaXQ4OiAnOCcsXHJcbiAgRGlnaXQ5OiAnOScsXHJcbiAgRGlnaXQwOiAnMCcsXHJcbiAgVGFiOiAnVGFiJyxcclxuICBLZXlBOiAnYScsXHJcbiAgS2V5QjogJ2InLFxyXG4gIEtleUM6ICdjJyxcclxuICBLZXlEOiAnZCcsXHJcbiAgS2V5RTogJ2UnLFxyXG4gIEtleUY6ICdmJyxcclxuICBLZXlHOiAnZycsXHJcbiAgS2V5SDogJ2gnLFxyXG4gIEtleUk6ICdpJyxcclxuICBLZXlKOiAnaicsXHJcbiAgS2V5SzogJ2snLFxyXG4gIEtleUw6ICdsJyxcclxuICBLZXlNOiAnbScsXHJcbiAgS2V5TjogJ24nLFxyXG4gIEtleU86ICdvJyxcclxuICBLZXlQOiAncCcsXHJcbiAgS2V5UTogJ3EnLFxyXG4gIEtleVI6ICdyJyxcclxuICBLZXlTOiAncycsXHJcbiAgS2V5VDogJ3QnLFxyXG4gIEtleVU6ICd1JyxcclxuICBLZXlWOiAndicsXHJcbiAgS2V5VzogJ3cnLFxyXG4gIEtleVg6ICd4JyxcclxuICBLZXlZOiAneScsXHJcbiAgS2V5WjogJ3onLFxyXG4gIEYxOiAgJ0YxJyxcclxuICBGMjogICdGMicsXHJcbiAgRjM6ICAnRjMnLFxyXG4gIEY0OiAgJ0Y0JyxcclxuICBGNTogICdGNScsXHJcbiAgRjY6ICAnRjYnLFxyXG4gIEY3OiAgJ0Y3JyxcclxuICBGODogICdGOCcsXHJcbiAgRjk6ICAnRjknLFxyXG4gIEYxMDogJ0YxMCcsXHJcbiAgRjExOiAnRjExJyxcclxuICBGMTI6ICdGMTInLFxyXG4gIEVuZDogJ0VuZCcsXHJcbiAgSG9tZTogJ0hvbWUnLFxyXG4gIEFycm93VXA6ICAgICfihpEnLFxyXG4gIEFycm93RG93bjogICfihpMnLFxyXG4gIEFycm93TGVmdDogICfihpAnLFxyXG4gIEFycm93UmlnaHQ6ICfihpInLFxyXG4gIERlbGV0ZTogICAnRGVsJyxcclxuICBQYWdlVXA6ICAgJ1BnVXAnLFxyXG4gIFBhZ2VEb3duOiAnUGdEbicsXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvZGVUb0NoYXIoZXZuLCBvcHQ9e2NvZGVPbmx5OmZhbHNlfSkge1xyXG4gIGNvbnN0IHtjb2RlLCBzaGlmdEtleX0gPSBldm5cclxuICBjb25zdCB7Y29kZU9ubHl9ID0gb3B0XHJcbiAgbGV0IG1hdGNoXHJcbiAgbGV0IGNoYXIgPSAnJ1xyXG4gIG1hdGNoID0gY29kZS5tYXRjaCgvS2V5KC4pLylcclxuICBpZiAobWF0Y2gpIHtcclxuICAgIGNoYXIgPSBtYXRjaC5wb3AoKVxyXG4gICAgaWYgKCFjb2RlT25seSAmJiAhc2hpZnRLZXkpIHtcclxuICAgICAgY2hhciA9IGNoYXIudG9Mb3dlckNhc2UoKVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBtYXRjaCA9IGNvZGUubWF0Y2goLyhEaWdpdHxOdW1wYWQpKC4pLylcclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICBjaGFyID0gbWF0Y2gucG9wKClcclxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xyXG4gICAgICAgIGNoYXIgPSBrY29kZTNbY2hhcl1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xyXG4gICAgICAgIGNoYXIgPSBrY29kZTJbY29kZV1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGFyID0ga2NvZGUxW2NvZGVdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNoYXJcclxufVxyXG5cclxuZnVuY3Rpb24gY29kZVRvU2hvdyhjb2Rlcykge1xyXG4gIHJldHVybiBjb2Rlcy5zcGxpdCgnOicpLm1hcCh4PT57XHJcbiAgICByZXR1cm4gYCR7a3Nob3dbeF19YFxyXG4gIH0pLmpvaW4oJ+KcpycpXHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZuLmNvZGVUb0NoYXIgPSBjb2RlVG9DaGFyXHJcbndpbmRvdy5taXRtLmZuLmNvZGVUb1Nob3cgPSBjb2RlVG9TaG93XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGNvZGVUb0NoYXIsXHJcbiAga2NvZGUxLFxyXG4gIGtjb2RlMixcclxuICBrY29kZTMsXHJcbiAga3Nob3dcclxufSIsImNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmZ1bmN0aW9uIF9wb3N0KGpzb24pIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgfVxyXG4gICAgICBmZXRjaCgnL21pdG0tcGxheS9wbGF5Lmpzb24nLCBjb25maWcpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEgICAgKSB7IHJlc29sdmUoZGF0YSkgICAgICAgICAgIH0pXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICByZWplY3QoZXJyb3IpXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gX3BsYXkoanNvbikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCBqc29uLCByZXNvbHZlKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XHJcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxyXG4gIGlmIChhdXRvZmlsbCkge1xyXG4gICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxyXG4gICAgfVxyXG4gICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gICAgY29uc3QgbGVudGggPSBhdXRvZmlsbC5sZW5ndGhcclxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cclxuICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxyXG4gICAgY29uc3QgX2pzb24gPSB7YXV0b2ZpbGwsIGJyb3dzZXIsIF9wYWdlLCBfZnJhbWV9XHJcbiAgICBjb25zdCBtc2cgPSBsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKVxyXG4gICAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAke21zZ31gLCBfYylcclxuICAgIGxldCByZXN1bHRcclxuICAgIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcclxuICAgICAgcmVzdWx0ID0gYXdhaXQgX3Bvc3QoX2pzb24pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXN1bHQgPSBhd2FpdCBfcGxheShfanNvbilcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNxbGl0ZSgpIHtcclxuICBjb25zdCBbY21kLCBxLCB0YmxdID0gYXJndW1lbnRzXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHtxfVxyXG4gICAgICBpZiAodGJsKSB7XHJcbiAgICAgICAgZGF0YS50YmwgPSB0YmxcclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoY21kLCBkYXRhLCByZXNvbHZlKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZuLnNxbExpc3QgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbExpc3QnLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbERlbCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbERlbCcgLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbElucyAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbElucycgLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbFVwZCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbFVwZCcgLCBxLCB0YmwpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXlcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3Qge2NvZGVUb0NoYXI6X2tleX0gPSByZXF1aXJlKCcuL19rZXlib2FyZCcpXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgcGxheSA9IHJlcXVpcmUoJy4vX3dzX3BsYXknKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuY29uc3Qgc3R5bGVMZWZ0ICA9ICd0b3A6IC0xcHg7IGxlZnQ6ICAzcHg7J1xyXG5jb25zdCBzdHlsZVRvcFIgID0gJ3RvcDogLThweDsgcmlnaHQ6IDNweDsnXHJcbmNvbnN0IHN0eWxlUmlnaHQgPSAndG9wOiAxNHB4OyByaWdodDogM3B4OydcclxuY29uc3QgYnV0dG9uU3R5bGU9ICcnXHJcbmNvbnN0IHN0eWxlID0gYFxyXG4ubWl0bS1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBmaXhlZDtcclxuICB6LWluZGV4OiA5OTk5OTtcclxufVxyXG4ubWl0bS1jb250YWluZXIuY2VudGVyIHtcclxuICBiYWNrZ3JvdW5kOiAjZmNmZmRjYjA7XHJcbiAgcG9zaXRpb246IGZpeGVkO1xyXG4gIC8qIGNlbnRlciB0aGUgZWxlbWVudCAqL1xyXG4gIHJpZ2h0OiAwO1xyXG4gIGxlZnQ6IDA7XHJcbiAgdG9wOiAyMHB4O1xyXG4gIG1hcmdpbi1yaWdodDogYXV0bztcclxuICBtYXJnaW4tbGVmdDogYXV0bztcclxuICAvKiBnaXZlIGl0IGRpbWVuc2lvbnMgKi9cclxuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA1MHB4KTtcclxuICBwYWRkaW5nOiA1cHggMTBweDtcclxuICBvdmVyZmxvdzogYXV0bztcclxuICB3aWR0aDogOTAlO1xyXG4gIGRpc3BsYXk6IG5vbmU7XHJcbn1cclxuLm1pdG0tYnRuIHtcclxuICBjb2xvcjogYmxhY2s7XHJcbiAgYm9yZGVyOiBub25lO1xyXG4gIGZvbnQtc2l6ZTogOHB4O1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAxcHggNnB4O1xyXG4gIGJvcmRlci1yYWRpdXM6IDNweDtcclxuICBmb250LWZhbWlseTogbW9uYWNvLCBDb25zb2xhcywgXCJMdWNpZGEgQ29uc29sZVwiLCBtb25vc3BhY2U7XHJcbn1cclxuLm1pdG0tYnRuOmhvdmVye1xyXG4gIHRleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7XHJcbn1cclxuLm1pdG0tYnRuLmxlZnQsXHJcbi5taXRtLWJ0bi5yaWdodCB7XHJcbiAgZGlzcGxheTogYmxvY2s7XHJcbn1cclxuLm1pdG0tYnRuLnJpZ2h0IHtcclxuICBmbG9hdDogcmlnaHQ7XHJcbiAgbWFyZ2luLXRvcDogMnB4O1xyXG59XHJcbi5iZ3JvdXAtbGVmdCxcclxuLmJncm91cC1yaWdodCB7XHJcbiAgZGlzcGxheTogdGFibGU7XHJcbiAgbWFyZ2luLXRvcDogNHB4O1xyXG59XHJcbi5iZ3JvdXAtbGVmdD5kaXYsXHJcbi5iZ3JvdXAtcmlnaHQ+ZGl2IHtcclxuICBwYWRkaW5nLWJvdHRvbTogMnB4O1xyXG59XHJcbi5iZ3JvdXAtdG9wcixcclxuLmJncm91cC10b3ByIHNwYW4ge1xyXG4gIGZvbnQtc2l6ZTogMTRweDtcclxufWBcclxuXHJcbmxldCBjb250YWluZXIgPSB7XHJcbiAgdG9wcjoge30sXHJcbiAgbGVmdDoge30sXHJcbiAgcmlnaHQ6IHt9LFxyXG4gIHRhcmdldDoge30sXHJcbn1cclxubGV0IGJ1dHRvbiA9IHt9XHJcbmxldCBiZ3JvdXAgPSB7XHJcbiAgcmlnaHQ6IHt9LFxyXG4gIHRvcHI6IHt9LFxyXG4gIGxlZnQ6IHt9LFxyXG59XHJcblxyXG5mdW5jdGlvbiB3YWl0KG1zKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXHJcbn07XHJcblxyXG5mdW5jdGlvbiB0b1JlZ2V4IChwYXRoTXNnKSB7XHJcbiAgbGV0IFtwYXRoLCBtc2ddID0gcGF0aE1zZy5zcGxpdCgnPT4nKS5tYXAoaXRlbSA9PiBpdGVtLnRyaW0oKSlcclxuICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgcmV0dXJuIHsgcGF0aCwgbXNnIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvcykge1xyXG4gIGZvciAoY29uc3QgaWQgaW4gYnV0dG9ucykge1xyXG4gICAgY29uc3QgW2NhcHRpb24sIGNvbG9yLCBrbGFzXSA9IGlkLnNwbGl0KCd8JykubWFwKHg9PngudHJpbSgpKVxyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcclxuICAgIGNvbnN0IGZuICA9IGJ1dHRvbnNbaWRdXHJcbiAgICBidG4ub25jbGljayA9IGFzeW5jIGUgPT4ge1xyXG4gICAgICBsZXQgYXJyID0gZm4oZSlcclxuICAgICAgaWYgKGFyciBpbnN0YW5jZW9mIFByb21pc2UpIHtcclxuICAgICAgICBhcnIgPSBhd2FpdCBhcnJcclxuICAgICAgfVxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XHJcbiAgICAgICAgYXdhaXQgcGxheShhcnIpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGJ0bi5pbm5lclRleHQgPSBjYXB0aW9uXHJcbiAgICBidG4uY2xhc3NMaXN0LmFkZCgnbWl0bS1idG4nKVxyXG4gICAgYnRuLmNsYXNzTGlzdC5hZGQoYCR7cG9zfWApXHJcbiAgICBidG4uY2xhc3NMaXN0LmFkZChrbGFzIHx8IGNhcHRpb24pXHJcbiAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXHJcbiAgICBpZiAocG9zPT09J3RvcHInKSB7XHJcbiAgICAgIGNvbnN0IGJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXHJcbiAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXHJcbiAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJyKVxyXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChidG4pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICBkaXYuYXBwZW5kQ2hpbGQoYnRuKVxyXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChkaXYpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRCdXR0b25zIChidXR0b25zLCBwb3NpdGlvbikge1xyXG4gIGlmIChiZ3JvdXBbcG9zaXRpb25dKSB7XHJcbiAgICBiZ3JvdXBbcG9zaXRpb25dLmlubmVySFRNTCA9ICcnXHJcbiAgICBjcmVhdGVCdXR0b24oYnV0dG9ucywgcG9zaXRpb24pXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkZWZhdWx0SG90S2V5cygpIHtcclxuICBjb25zdCB7bWl0bToge3N2ZWx0ZToge0NzcGhlYWRlciwgU3FsaXRlfSwgZm59fSA9IHdpbmRvd1xyXG4gIGNvbnN0IGtleXMgPSB7XHJcbiAgICAnY29kZTpLZXlDJyhfZSkge1xyXG4gICAgICBmbi5zdmVsdGUoQ3NwaGVhZGVyLCAnTGlnaHRQYXN0ZWxHcmVlbicpXHJcbiAgICB9LFxyXG4gICAgJ2NvZGU6S2V5UScoX2UpIHtcclxuICAgICAgZm4uc3ZlbHRlKFNxbGl0ZSwgJ0xpZ2h0UGFzdGVsR3JlZW4nKVxyXG4gICAgfSxcclxuICB9XHJcbiAga2V5c1snY29kZTpLZXlDJ10uX3RpdGxlID0gJ1Nob3cgQ1NQIEhlYWRlcidcclxuICBrZXlzWydjb2RlOktleVEnXS5fdGl0bGUgPSAnU2hvdyBTcWxpdGUnXHJcbiAgbWl0bS5tYWNyb2tleXMgPSBrZXlzXHJcbn1cclxuXHJcbmxldCBkZWJ1bmtcclxubGV0IGludGVydklkXHJcbmxldCBvbmNlcyA9IHt9IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdXJsQ2hhbmdlIChldmVudCkge1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGNvbnN0IHttaXRtfSA9IHdpbmRvd1xyXG5cclxuICBjbGVhckludGVydmFsKGludGVydklkKVxyXG4gIGlmIChtaXRtLmF1dG9pbnRlcnZhbCkge2RlbGV0ZSBtaXRtLmF1dG9pbnRlcnZhbH1cclxuICBpZiAobWl0bS5hdXRvZmlsbCkgICAgIHtkZWxldGUgbWl0bS5hdXRvZmlsbCAgICB9XHJcbiAgaWYgKG1pdG0uYXV0b2J1dHRvbnMpICB7ZGVsZXRlIG1pdG0uYXV0b2J1dHRvbnMgfVxyXG4gIGlmIChtaXRtLmxlZnRidXR0b25zKSAge2RlbGV0ZSBtaXRtLmxlZnRidXR0b25zIH1cclxuICBpZiAobWl0bS5yaWdodGJ1dHRvbnMpIHtkZWxldGUgbWl0bS5yaWdodGJ1dHRvbnN9XHJcbiAgaWYgKG1pdG0ubWFjcm9rZXlzKSAgICB7ZGVmYXVsdEhvdEtleXMoKSAgICAgICAgfVxyXG4gIGlmIChuYW1lc3BhY2UpIHtcclxuICAgIGNvbnN0IHtocmVmLCBvcmlnaW59ID0gbG9jYXRpb25cclxuICAgIGNvbnN0IF9ocmVmID0gaHJlZi5yZXBsYWNlKG9yaWdpbiwgJycpXHJcbiAgICBvYnNlcnZlcmZuID0gW11cclxuICAgIGxldCBub25lID0gdHJ1ZVxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gbWl0bS5tYWNyb3MpIHtcclxuICAgICAgY29uc3QgeyBwYXRoLCBtc2cgfSA9IHRvUmVnZXgoa2V5KVxyXG4gICAgICBpZiAoX2hyZWYubWF0Y2gocGF0aCkpIHtcclxuICAgICAgICBub25lID0gZmFsc2VcclxuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbXNnIHx8ICdFbnRyeSdcclxuICAgICAgICBsZXQgZm5zID0gbWl0bS5tYWNyb3Nba2V5XSgpXHJcbiAgICAgICAgaWYgKGZucyBpbnN0YW5jZW9mIFByb21pc2UpIHtcclxuICAgICAgICAgIGZucyA9IGF3YWl0IGZuc1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGZucyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZucylcclxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZm5zKSkge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBmbjIgb2YgZm5zKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4yID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZuMilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KGRlYnVuaylcclxuICAgICAgICBkZWJ1bmsgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXHJcbiAgICAgICAgICBkZWJ1bmsgPSB1bmRlZmluZWRcclxuICAgICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgICAgaWYgKHdpbmRvdy5taXRtLmF1dG9maWxsKSB7XHJcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xyXG4gICAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxyXG4gICAgICAgICAgICAgICdFbnRyeScoKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQge2F1dG9maWxsfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF1dG9maWxsID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcGxheShhdXRvZmlsbClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sICd0b3ByJylcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICd0b3ByJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJpZ2h0YnV0dG9ucyAmJiBzZXRCdXR0b25zKHJpZ2h0YnV0dG9ucywgJ3JpZ2h0JylcclxuICAgICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JylcclxuICAgICAgICB9LCAwKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobm9uZSkge1xyXG4gICAgICBzZXRCdXR0b25zKHt9LCAncmlnaHQnKVxyXG4gICAgICBzZXRCdXR0b25zKHt9LCAnbGVmdCcpXHJcbiAgICAgIHNldEJ1dHRvbnMoe30sICd0b3ByJylcclxuICAgIH1cclxuICB9XHJcbiAgY29udGFpbmVyLnJpZ2h0LnN0eWxlID0gc3R5bGVSaWdodFxyXG4gIGNvbnRhaW5lci50b3ByLnN0eWxlICA9IHN0eWxlVG9wUlxyXG4gIGNvbnRhaW5lci5sZWZ0LnN0eWxlICA9IHN0eWxlTGVmdFxyXG4gIGNvbnN0IHZpc2libGUgPSAod2luZG93Lm1pdG0uYXV0b2ZpbGwpXHJcbiAgYnV0dG9uLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAodmlzaWJsZSA/ICdiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTsnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBpbnRlcnZJZCA9IHNldEludGVydmFsKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCwgNTAwKVxyXG4gIH1cclxuICBjdHJsID0gZmFsc2VcclxufVxyXG5cclxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XHJcbndpbmRvdy5vYnNlcnZlciA9IG9ic2VydmVyXHJcbmZ1bmN0aW9uIG9ic2VydmVkKCkge1xyXG4gIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxyXG4gIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG4gICAgY2hpbGRMaXN0OiB0cnVlLFxyXG4gICAgc3VidHJlZTogdHJ1ZVxyXG4gIH0pXHJcbn1cclxuXHJcbmNvbnN0IF91cmxDaGFuZ2VkID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJylcclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICBjb25zdCBodG1sID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpXHJcbiAgY29uc3QgaHRtbHJlZiA9IGh0bWwuZmlyc3RFbGVtZW50Q2hpbGRcclxuICBjb25zdCBzdHlsZUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcclxuICBjb25zdCBkaXZSaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgY29uc3QgZGl2VG9wUiAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gIGNvbnN0IGRpdkxlZnQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICBjb25zdCBkaXZDZW50ZXI9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcblxyXG4gIHN0eWxlQnRuLmlubmVySFRNTCA9IHN0eWxlXHJcbiAgc3R5bGVCdG4uY2xhc3NOYW1lID0gJ21pdG0tY2xhc3MnXHJcbiAgZGl2UmlnaHQuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXJpZ2h0XCI+PC9zcGFuPmBcclxuICBkaXZUb3BSLmlubmVySFRNTCAgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtdG9wclwiPjwvc3Bhbj5gXHJcbiAgZGl2TGVmdC5pbm5lckhUTUwgID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLWxlZnRcIj48L3NwYW4+YFxyXG4gIGRpdkxlZnQuY2xhc3NOYW1lICA9ICdtaXRtLWNvbnRhaW5lciBsZWZ0J1xyXG4gIGRpdlRvcFIuY2xhc3NOYW1lICA9ICdtaXRtLWNvbnRhaW5lciB0b3ByJ1xyXG4gIGRpdlJpZ2h0LmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciByaWdodCdcclxuICBkaXZDZW50ZXIuY2xhc3NOYW1lPSAnbWl0bS1jb250YWluZXIgY2VudGVyJ1xyXG4gIGRpdlJpZ2h0LnN0eWxlID0gc3R5bGVSaWdodFxyXG4gIGRpdlRvcFIuc3R5bGUgID0gc3R5bGVUb3BSXHJcbiAgZGl2TGVmdC5zdHlsZSAgPSBzdHlsZUxlZnRcclxuXHJcbiAgaHRtbC5pbnNlcnRCZWZvcmUoc3R5bGVCdG4sIGh0bWxyZWYpXHJcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2UmlnaHQsIGh0bWxyZWYpXHJcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2VG9wUiwgaHRtbHJlZilcclxuICBodG1sLmluc2VydEJlZm9yZShkaXZMZWZ0LCBodG1scmVmKVxyXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdkNlbnRlciwgaHRtbHJlZilcclxuICBjb25zdCBob3RrZXkgPSBuZXcgbWl0bS5zdmVsdGUuSG90a2V5cyh7dGFyZ2V0OmRpdkNlbnRlcn0pXHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBjb250YWluZXIudG9wciA9IGRpdlRvcFJcclxuICAgIGNvbnRhaW5lci5sZWZ0ID0gZGl2TGVmdFxyXG4gICAgY29udGFpbmVyLnJpZ2h0PSBkaXZSaWdodFxyXG4gICAgY29udGFpbmVyLmhvdGtleSA9IGhvdGtleVxyXG4gICAgY29udGFpbmVyLnRhcmdldCA9IGRpdkNlbnRlclxyXG4gICAgY29udGFpbmVyLm5vZGVrZXk9IGRpdkNlbnRlci5jaGlsZHJlblswXVxyXG4gICAgYnV0dG9uLnN0eWxlID0gYCR7YnV0dG9uU3R5bGV9YmFja2dyb3VuZC1jb2xvcjogYXp1cmU7YFxyXG4gICAgYmdyb3VwLnJpZ2h0ID0gZGl2UmlnaHQuY2hpbGRyZW5bMF1cclxuICAgIGJncm91cC50b3ByICA9IGRpdlRvcFIuY2hpbGRyZW5bMF1cclxuICAgIGJncm91cC5sZWZ0ICA9IGRpdkxlZnQuY2hpbGRyZW5bMF1cclxuICAgIHVybENoYW5nZShfdXJsQ2hhbmdlZClcclxuICAgIG9ic2VydmVkKClcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGNlbnRlciAmJiAhZGl2Q2VudGVyLmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIHtcclxuICAgICAgICBkaXZDZW50ZXIuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcclxuICAgICAgICBjZW50ZXIgPSBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LCAwKVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYWNyb0F1dG9tYXRpb24obWFjcm8pIHtcclxuICBpZiAoY2VudGVyKSB7XHJcbiAgICBjb250YWluZXIudGFyZ2V0LmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXHJcbiAgICBjZW50ZXIgPSBmYWxzZVxyXG4gIH1cclxuICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcclxuICAgIGxldCBtYWNyb0luZGV4ID0gMFxyXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXHJcbiAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXiAqWz0tXT4vKSkge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBDc3NTZWxlY3RvckdlbmVyYXRvci5nZXRDc3NTZWxlY3Rvcihkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxyXG4gICAgICAgIHNlbGVjdG9yID0gYCR7YWN0aXZlRWxlbWVudH0gJHtzZWxlY3Rvcn1gXHJcbiAgICAgIH1cclxuICAgICAgcGxheShbc2VsZWN0b3JdKVxyXG5cclxuICAgICAgbWFjcm9JbmRleCArPSAxXHJcbiAgICAgIGlmIChtYWNyb0luZGV4ID49IG1hY3JvLmxlbmd0aCkge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXHJcbiAgICAgIH1cclxuICAgIH0sIDEwMClcclxuICB9XHJcbn1cclxuXHJcbmxldCBzdGREYmwgPSBbXVxyXG5sZXQgaGdoRGJsID0gW11cclxubGV0IHN0ZEN0bCA9IFtdXHJcbmxldCBoZ2hDdGwgPSBbXVxyXG5sZXQgc3RkQWx0ID0gW11cclxubGV0IGhnaEFsdCA9IFtdXHJcbmxldCBzYXZlS2V5ID0gJydcclxuY29uc3Qga2RlbGF5ID0gMTAwMFxyXG5cclxubGV0IGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXHJcbmZ1bmN0aW9uIG1hY3JvRGJsKCkge1xyXG4gIGNvbnN0IGtleTEgPSBga2V5OiR7c3RkRGJsLmpvaW4oJycpfWBcclxuICBjb25zdCBrZXkyID0gYGNvZGU6JHtoZ2hEYmwuam9pbignOicpfWBcclxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cclxuXHJcbiAgc3RkRGJsID0gW11cclxuICBoZ2hEYmwgPSBbXVxyXG4gIHNhdmVLZXkgPSAnJ1xyXG4gIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXHJcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxyXG4gIGNvbnNvbGUubG9nKGAlY01hY3JvczogY3RybCArIGFsdCAgKyAgJHtrZXkxfSAgfCAgJHtrZXkyfWAsIF9jKVxyXG4gIGlmIChtYWNybykge1xyXG4gICAgbWFjcm8gPSBtYWNybyhlKVxyXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbn1cclxuXHJcbmxldCBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxyXG5mdW5jdGlvbiBtYWNyb0N0bCgpIHtcclxuICBjb25zdCBrZXkxID0gYGtleTo8JHtzdGRDdGwuam9pbignJyl9PmBcclxuICBjb25zdCBrZXkyID0gYGNvZGU6PCR7aGdoQ3RsLmpvaW4oJzonKX0+YFxyXG4gIGNvbnN0IHsgbWFjcm9rZXlzLCBsYXN0S2V5OiBlIH0gPSB3aW5kb3cubWl0bVxyXG5cclxuICBzdGRDdGwgPSBbXVxyXG4gIGhnaEN0bCA9IFtdXHJcbiAgc2F2ZUtleSA9ICcnXHJcbiAgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcclxuICBsZXQgbWFjcm8gPSBtYWNyb2tleXNba2V5MV0gfHwgbWFjcm9rZXlzW2tleTJdXHJcbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAuLi4uICsgY3RybCArICR7a2V5MX0gfCAke2tleTJ9YCwgJ2NvbG9yOiAjYmFlYWYxJylcclxuICBpZiAobWFjcm8pIHtcclxuICAgIG1hY3JvID0gbWFjcm8oZSlcclxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG59XHJcblxyXG5sZXQgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcclxuZnVuY3Rpb24gbWFjcm9BbHQoKSB7XHJcbiAgY29uc3Qga2V5MSA9IGBrZXk6eyR7c3RkQWx0LmpvaW4oJycpfX1gXHJcbiAgY29uc3Qga2V5MiA9IGBjb2RlOnske2hnaEFsdC5qb2luKCc6Jyl9fWBcclxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cclxuXHJcbiAgc3RkQWx0ID0gW11cclxuICBoZ2hBbHQgPSBbXVxyXG4gIHNhdmVLZXkgPSAnJ1xyXG4gIGRlYm91bmNlQWx0ID0gdW5kZWZpbmVkXHJcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxyXG4gIGNvbnNvbGUubG9nKGAlY01hY3JvczogLi4uLiArIGFsdCAgKyAke2tleTF9IHwgJHtrZXkyfWAsICdjb2xvcjogI2JhZGFmMScpXHJcbiAgaWYgKG1hY3JvKSB7XHJcbiAgICBtYWNybyA9IG1hY3JvKGUpXHJcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24ga2V5YlVwIChlKSB7XHJcbiAgaWYgKCFlLmFsdEtleSkge1xyXG4gICAgaWYgKGRlYm91bmNlRGJsIHx8IChkZWJvdW5jZUN0bCAmJiAhZS5jdHJsS2V5KSB8fCBkZWJvdW5jZUFsdCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXHJcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcclxuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxyXG4gICAgICBpZiAoZGVib3VuY2VEYmwpIHtcclxuICAgICAgICBtYWNyb0RibCgpXHJcbiAgICAgIH0gZWxzZSBcclxuICAgICAgaWYgKGRlYm91bmNlQ3RsKSB7XHJcbiAgICAgICAgbWFjcm9DdGwoKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1hY3JvQWx0KClcclxuICAgICAgfVxyXG4gICAgICBkZWJvdW5jZURibCA9IHVuZGVmaW5lZFxyXG4gICAgICBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxyXG4gICAgICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG52YXIgY3RybCA9IGZhbHNlXHJcbnZhciBjZW50ZXIgPSBmYWxzZVxyXG5mdW5jdGlvbiBrZXliQ3RybCAoZSkge1xyXG4gIGlmICghZS5jb2RlIHx8IFsnQWx0JywgJ0NvbnRyb2wnLCAnTWV0YSddLmluY2x1ZGVzKGUua2V5KSkge1xyXG4gICAgcmV0dXJuXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChlLmtleT09PSdTaGlmdCcpIHtcclxuICAgICAgaWYgKGUuY3RybEtleSAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICBjb25zdCB7bm9kZWtleSwgdGFyZ2V0LCByaWdodCwgdG9wciwgbGVmdH0gPSBjb250YWluZXJcclxuICAgICAgICBpZiAoZS5jb2RlPT09J1NoaWZ0UmlnaHQnKSB7XHJcbiAgICAgICAgICBjdHJsID0gIWN0cmxcclxuICAgICAgICAgIHJpZ2h0LnN0eWxlID0gc3R5bGVSaWdodCsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKVxyXG4gICAgICAgICAgdG9wci5zdHlsZSAgPSBzdHlsZVRvcFIgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICAgICAgICBsZWZ0LnN0eWxlICA9IHN0eWxlTGVmdCArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JykgIFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodGFyZ2V0LmNoaWxkcmVuWzBdIT09bm9kZWtleSkge1xyXG4gICAgICAgICAgICB0YXJnZXQucmVwbGFjZUNoaWxkcmVuKG5vZGVrZXkpXHJcbiAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXHJcbiAgICAgICAgICAgIGNlbnRlciA9IHRydWVcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNlbnRlciA9ICFjZW50ZXJcclxuICAgICAgICAgICAgaWYgKGNlbnRlcikge1xyXG4gICAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXHJcbiAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IGNoYXIgPSBfa2V5KGUpXHJcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcclxuICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgY2hhciA9IF9rZXkoZSwge2NvZGVPbmx5OiB0cnVlfSlcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcclxuICAgICAgICAgIHNhdmVLZXkgKz0gY2hhclxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBcclxuICAgICAgICBzdGREYmwucHVzaChjaGFyKVxyXG4gICAgICAgIGhnaERibC5wdXNoKGUuY29kZSlcclxuICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXHJcbiAgICAgICAgZGVib3VuY2VEYmwgPSBzZXRUaW1lb3V0KG1hY3JvRGJsLCBrZGVsYXkpXHJcbiAgICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgc3RkQ3RsLnB1c2goY2hhcilcclxuICAgICAgICBoZ2hDdGwucHVzaChlLmNvZGUpXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQ3RsKVxyXG4gICAgICAgIGRlYm91bmNlQ3RsID0gc2V0VGltZW91dChtYWNyb0N0bCwga2RlbGF5KVxyXG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XHJcbiAgICAgICAgc3RkQWx0LnB1c2goY2hhcilcclxuICAgICAgICBoZ2hBbHQucHVzaChlLmNvZGUpXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxyXG4gICAgICAgIGRlYm91bmNlQWx0ID0gc2V0VGltZW91dChtYWNyb0FsdCwga2RlbGF5KVxyXG4gICAgICB9XHJcbiAgICAgIGUuX2tleXMgPSBzYXZlS2V5XHJcbiAgICAgIG1pdG0ubGFzdEtleSA9IGUgICAgICAgIFxyXG4gICAgfSBcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxyXG5sZXQgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxubGV0IG9EZWJ1bmsgPSB1bmRlZmluZWRcclxubGV0IG9ic2VydmVyZm4gPSBbXVxyXG5cclxuZnVuY3Rpb24gY29tcGFyZUhyZWYobm9kZXMpIHtcclxuICAvLyBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IERPTSBtdXRhdGVkIWAsIF9jKVxyXG4gIGlmIChvbGRIcmVmICE9IGxvY2F0aW9uLmhyZWYpIHtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KF91cmxDaGFuZ2VkKVxyXG4gICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKG9ic2VydmVyZm4ubGVuZ3RoKSB7XHJcbiAgICAgIG9EZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KG9EZWJ1bmspXHJcbiAgICAgIG9EZWJ1bmsgPSBzZXRUaW1lb3V0KCgpPT4ge1xyXG4gICAgICAgIG9EZWJ1bmsgPSB1bmRlZmluZWRcclxuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIG9ic2VydmVyZm4pIHtcclxuICAgICAgICAgIGNvbnN0IG5hbWUgPSBmbi5uYW1lXHJcbiAgICAgICAgICBpZiAobmFtZSAmJiBuYW1lLm1hdGNoKC9PbmNlJC8pKSB7XHJcbiAgICAgICAgICAgIGlmIChvbmNlc1tuYW1lXSkgeyAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcclxuICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG9uY2VzW25hbWVdID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBmbihub2RlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qge2F1dG9idXR0b25zLCByaWdodGJ1dHRvbnMsIGxlZnRidXR0b25zfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxyXG4gICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JylcclxuICAgICAgICBjb25zdCB7IGF1dG9maWxsIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgIGlmIChhdXRvZmlsbCkge1xyXG4gICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XHJcbiAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxyXG4gICAgICAgICAgICAnRW50cnknKCkge3BsYXkoYXV0b2ZpbGwpfVxyXG4gICAgICAgICAgfSwgJ3RvcHInKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSwgMTAwKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gd3NMb2NhdGlvbigpIHtcclxuICBjb25zdCB2ZW5kb3IgPSBfd3NfdmVuZG9yKClcclxuICBpZiAoWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKHZlbmRvcikgfHwgKGNocm9tZSAmJiAhY2hyb21lLnRhYnMpKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWJDdHJsKVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5YlVwKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpXHJcbiAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcclxuICAgICAgaW5pdCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0KVxyXG4gICAgfSAgICBcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG5cclxuICBjb25zdCBmbiA9IGhpc3RvcnkucHVzaFN0YXRlXHJcbiAgaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmbi5hcHBseShoaXN0b3J5LCBhcmd1bWVudHMpXHJcbiAgICBjb21wYXJlSHJlZigpXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBwYXN0ZWwgPSB7XHJcbiAgUG9zdEl0OiAgICAgICAgICAnI2ZjZmZkY2Q2JyxcclxuICBQYXN0ZWxHcmVlbjogICAgICcjNzdkZDc3ZDYnLFxyXG4gIFBhc3RlbEJyb3duOiAgICAgJyM4MzY5NTNkNicsXHJcbiAgQmFieUJsdWU6ICAgICAgICAnIzg5Y2ZmMGQ2JyxcclxuICBQYXN0ZWxUdXJxdW9pc2U6ICcjOTljNWM0ZDYnLFxyXG4gIEJsdWVHcmVlblBhc3RlbDogJyM5YWRlZGJkNicsXHJcbiAgUGVyc2lhblBhc3RlbDogICAnI2FhOTQ5OWQ2JyxcclxuICBNYWdpY01pbnQ6ICAgICAgICcjYWFmMGQxZDYnLFxyXG4gIExpZ2h0UGFzdGVsR3JlZW46JyNiMmZiYTVkNicsXHJcbiAgUGFzdGVsUHVycGxlOiAgICAnI2IzOWViNWQ2JyxcclxuICBQYXN0ZWxMaWxhYzogICAgICcjYmRiMGQwZDYnLFxyXG4gIFBhc3RlbFBlYTogICAgICAgJyNiZWU3YTVkNicsXHJcbiAgTGlnaHRMaW1lOiAgICAgICAnI2JlZmQ3M2Q2JyxcclxuICBMaWdodFBlcml3aW5rbGU6ICcjYzFjNmZjZDYnLFxyXG4gIFBhbGVNYXV2ZTogICAgICAgJyNjNmE0YTRkNicsXHJcbiAgTGlnaHRMaWdodEdyZWVuOiAnI2M4ZmZiMGQ2JyxcclxuICBQYXN0ZWxWaW9sZXQ6ICAgICcjY2I5OWM5ZDYnLFxyXG4gIFBhc3RlbE1pbnQ6ICAgICAgJyNjZWYwY2NkNicsXHJcbiAgUGFzdGVsR3JleTogICAgICAnI2NmY2ZjNGQ2JyxcclxuICBQYWxlQmx1ZTogICAgICAgICcjZDZmZmZlZDYnLFxyXG4gIFBhc3RlbExhdmVuZGVyOiAgJyNkOGExYzRkNicsXHJcbiAgUGFzdGVsUGluazogICAgICAnI2RlYTVhNGQ2JyxcclxuICBQYXN0ZWxTbWlyazogICAgICcjZGVlY2UxZDYnLFxyXG4gIFBhc3RlbERheTogICAgICAgJyNkZmQ4ZTFkNicsXHJcbiAgUGFzdGVsUGFyY2htZW50OiAnI2U1ZDlkM2Q2JyxcclxuICBQYXN0ZWxSb3NlVGFuOiAgICcjZTlkMWJmZDYnLFxyXG4gIFBhc3RlbE1hZ2VudGE6ICAgJyNmNDlhYzJkNicsXHJcbiAgRWxlY3RyaWNMYXZlbmRlcjonI2Y0YmZmZmQ2JyxcclxuICBQYXN0ZWxZZWxsb3c6ICAgICcjZmRmZDk2ZDYnLFxyXG4gIFBhc3RlbFJlZDogICAgICAgJyNmZjY5NjFkNicsXHJcbiAgUGFzdGVsT3JhbmdlOiAgICAnI2ZmOTY0ZmQ2JyxcclxuICBBbWVyaWNhblBpbms6ICAgICcjZmY5ODk5ZDYnLFxyXG4gIEJhYnlQaW5rOiAgICAgICAgJyNmZmI3Y2VkNicsXHJcbiAgQmFieVB1cnBsZTogICAgICAnI2NhOWJmN2Q2JyxcclxufVxyXG5cclxuZnVuY3Rpb24gc3ZlbHRlKFN2ZWx0LCBiZz0nUG9zdEl0JykgeyAvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxyXG4gIGNvbnN0IHt0YXJnZXR9ID0gY29udGFpbmVyXHJcbiAgdGFyZ2V0LnJlcGxhY2VDaGlsZHJlbignJylcclxuICB3aW5kb3cubWl0bS5zYXBwID0gbmV3IFN2ZWx0KHt0YXJnZXR9KVxyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgY29uc3QgYmNvbG9yID0gcGFzdGVsW2JnXVxyXG4gICAgdGFyZ2V0LnN0eWxlID0gYGRpc3BsYXk6IGJsb2NrJHtiY29sb3IgPyAnO2JhY2tncm91bmQ6JytiY29sb3IgOiAnJ307YFxyXG4gICAgY2VudGVyID0gdHJ1ZVxyXG4gIH0sIDApXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhvdEtleXMob2JqKSB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59XHJcblxyXG53aW5kb3cubWl0bS5mbi5tYWNyb0F1dG9tYXRpb24gPSBtYWNyb0F1dG9tYXRpb25cclxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IGhvdEtleXNcclxud2luZG93Lm1pdG0uZm4uc3ZlbHRlID0gc3ZlbHRlXHJcbndpbmRvdy5taXRtLmZuLnBsYXkgPSBwbGF5XHJcbndpbmRvdy5taXRtLmZuLndhaXQgPSB3YWl0XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdzTG9jYXRpb25cclxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xyXG4gIGxldCBfdGltZW91dFxyXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcclxuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHNcclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKVxyXG4gICAgfSwgZGVsYXkpXHJcbiAgfVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2VcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgbGV0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7X3N1Ym5zOiBzfSA9IHJvdXRlLl9jaGlsZG5zXHJcbiAgaWYgKHMgJiYgbWl0bS5yb3V0ZXNbc10pIHtcclxuICAgIHJvdXRlPSBtaXRtLnJvdXRlc1tzXVxyXG4gIH1cclxuICByZXR1cm4gcm91dGVcclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIE11dGF0aW9uT2JzZXJ2ZXIgKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF9zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fc2NyZWVuc2hvdCcpXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfd3Nfcm91dGUgPSByZXF1aXJlKCcuL193c19yb3V0ZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBpZiAobG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuICBjb25zdCBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoJzovLycgLCd+ficpXHJcbiAgY29uc3Qgc3Nob3QgPSB7fVxyXG4gIGNvbnN0IG5vZGVzID0ge31cclxuXHJcbiAgbGV0IHJvdXRlID0gX3dzX3JvdXRlKClcclxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgY29uc3QgeyBvYnNlcnZlcjogb2IgfSA9IHJvdXRlLnNjcmVlbnNob3RcclxuICAgIGZvciAoY29uc3QgaWQgaW4gb2IpIHtcclxuICAgICAgbGV0IGVsID0ge31cclxuICAgICAgaWYgKG9iW2lkXSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGVsID0ge1xyXG4gICAgICAgICAgdGl0bGU6ICdub3RpdGxlJyxcclxuICAgICAgICAgIGluc2VydDogdHJ1ZSxcclxuICAgICAgICAgIHJlbW92ZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSBpZiAodHlwZW9mIG9iW2lkXSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBlbCA9IHtcclxuICAgICAgICAgIHRpdGxlOiAnbm9jYXB0dXJlJyxcclxuICAgICAgICAgIGluc2VydDogZmFsc2UsXHJcbiAgICAgICAgICByZW1vdmU6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGFyciA9IG9iW2lkXS5zcGxpdCgnOicpXHJcbiAgICAgICAgYXJyWzFdLnNwbGl0KCcsJykubWFwKGUgPT4ge1xyXG4gICAgICAgICAgZWxbZV0gPSB0cnVlXHJcbiAgICAgICAgfSlcclxuICAgICAgICBlbC50aXRsZSA9IGFyclswXVxyXG4gICAgICB9XHJcbiAgICAgIHNzaG90W2lkXSA9IGVsXHJcbiAgICAgIG5vZGVzW2lkXSA9IHtcclxuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgIHJlbW92ZTogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgb2JcclxuICBsZXQgZm5hbWVcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgICBvYiA9IHJvdXRlLnNjcmVlbnNob3Qub2JzZXJ2ZXJcclxuICAgIH1cclxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cclxuICAgIGZvciAoY29uc3QgaWQgaW4gbm9kZXMpIHtcclxuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoaWQpXHJcbiAgICAgIGlmIChlbC5sZW5ndGgpIHtcclxuICAgICAgICBpZiAoIW5vZGVzW2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSB0cnVlXHJcbiAgICAgICAgICBpZiAobm9kZXNbaWRdLnJlbW92ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSBmYWxzZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG9iICYmIHR5cGVvZiBvYltpZF09PT0nZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZCA9IGVsWzBdIHx8IGVsXHJcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbm9kLl93c19jb3VudCA9IDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBub2QuX3dzX2NvdW50ICs9IDFcclxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ8Mikge1xyXG4gICAgICAgICAgICAgIG9iW2lkXShub2QpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gXHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgICAgICAgICAgZm5hbWUgPSBgfiR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgXHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxyXG4gICAgICAgICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcclxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZVxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYH4ke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0tcmVtb3ZlYFxyXG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH1cclxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIGNvbnN0IHtvYnNlcnZlcjogb2J9ID0gcm91dGUuc2NyZWVuc2hvdFxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgYXR0cmlidXRlczogb2IgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZVxyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihfd3NfZGVib3VuY2UoY2FsbGJhY2ssIDI4MCkpXHJcbiAgICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgb3B0aW9ucylcclxuICAgIH0pXHJcbiAgfVxyXG59XHJcbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJ1xyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmNvbnN0IG5hbm9pZCA9IChzaXplID0gOCkgPT4ge1xyXG4gIGxldCBpZCA9ICcnXHJcbiAgd2hpbGUgKHNpemUtLSA+IDApIHtcclxuICAgIGlkICs9IHQ2NFtNYXRoLnJhbmRvbSgpICogNjQgfCAwXVxyXG4gIH1cclxuICByZXR1cm4gaWRcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBfd3MgfSA9IHdpbmRvd1xyXG5cclxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxyXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfYnJvYWRjYXN0ID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxyXG4gICAgX3dzLnNlbmQoYGJyb2FkY2FzdCR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxyXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19lbWl0cGFnZSA9IChqc29uLCByZWdleCA9ICcnKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIHJlZ2V4IH1cclxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxyXG4gIHdpbmRvdy53c19fc3R5bGUgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XHJcbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX3BpbmcoJ0hpIScpXHJcbiAgd2luZG93LndzX19waW5nID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XHJcbiAgICBfd3Muc2VuZChgX3Bpbmcke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19faGVscCgpXHJcbiAgd2luZG93LndzX19oZWxwID0gKCkgPT4ge1xyXG4gICAgX3dzLnNlbmQoJ19oZWxwe30nKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19vcGVuKHt1cmw6J2h0dHBzOi8vZ29vZ2xlLmNvbSd9KVxyXG4gIHdpbmRvdy53c19fb3BlbiA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxyXG4gICAgX3dzLnNlbmQoYF9vcGVuJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICB3aW5kb3cud3NfX3NlbmQgPSAoY21kLCBkYXRhLCBoYW5kbGVyKSA9PiB7XHJcbiAgICBjb25zdCB7IF9fZmxhZyB9ID0gd2luZG93Lm1pdG1cclxuICAgIGNvbnN0IGlkID0gbmFub2lkKClcclxuICAgIGNvbnN0IGtleSA9IGAke2NtZH06JHtpZH1gXHJcbiAgICB3aW5kb3cuX3dzX3F1ZXVlW2tleV0gPSBoYW5kbGVyIHx8ICh3ID0+IHt9KVxyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAod2luZG93Ll93c19xdWV1ZVtrZXldKSB7XHJcbiAgICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVba2V5XVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiB3cyB0aW1lb3V0IScsIF9jLCBrZXkpXHJcbiAgICAgIH1cclxuICAgIH0sIDUwMDApXHJcbiAgICBcclxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXHJcbiAgICBjb25zdCBmbGFnID0gd2luZG93Lm1pdG0uX19mbGFnWyd3cy1tZXNzYWdlJ11cclxuICAgIGlmIChmbGFnID4gMSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgX3dzLnNlbmQ6ICR7cGFyYW1zfWApXHJcbiAgICB9XHJcbiAgICBfd3Muc2VuZChwYXJhbXMpXHJcbiAgfVxyXG4gIGNvbnN0IHdzcnVuID0ge31cclxuICBjb25zdCBhcnIgPSB3aW5kb3cubWl0bS53c3J1blxyXG4gIGZvciAoY29uc3QgayBvZiBhcnIpIHtcclxuICAgIGNvbnN0IGNtZCAgPSBrLnJlcGxhY2UoJyQnLCAnJylcclxuICAgIHdzcnVuW2NtZF0gPSAoZGF0YSwgaGFuZGxlcikgPT4gd2luZG93LndzX19zZW5kKGNtZCwgZGF0YSwgaGFuZGxlcilcclxuICB9XHJcbiAgd2luZG93Lm1pdG0ud3NydW4gPSB3c3J1blxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcblxyXG5sZXQgX3RpbWVvdXRcclxubGV0IF9jc3AgPSB7fVxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxyXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICAgLnJlcGxhY2UoL15cXC8vLCAnJylcclxuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGJsb2NrZWRVUkksXHJcbiAgICAgIGRpc3Bvc2l0aW9uLFxyXG4gICAgICBkb2N1bWVudFVSSSxcclxuICAgICAgZWZmZWN0aXZlRGlyZWN0aXZlLFxyXG4gICAgICBvcmlnaW5hbFBvbGljeSxcclxuICAgICAgdGltZVN0YW1wLFxyXG4gICAgICB0eXBlLFxyXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZVxyXG4gICAgfSA9IGVcclxuICAgIGNvbnN0IHR5cCA9IGBbJHtkaXNwb3NpdGlvbn1dICR7ZG9jdW1lbnRVUkl9YFxyXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcclxuICAgICAgX2NzcFt0eXBdID0ge31cclxuICAgIH1cclxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xyXG4gICAgICBfY3NwW3R5cF0uX2dlbmVyYWxfID0ge1xyXG4gICAgICAgIHBvbGljeTogb3JpZ2luYWxQb2xpY3ksXHJcbiAgICAgICAgbmFtZXNwYWNlLFxyXG4gICAgICAgIGhvc3QsXHJcbiAgICAgICAgcGF0aFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zdCBfZG9jID0gX2NzcFt0eXBdXHJcbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XHJcbiAgICAgIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdID0ge31cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBfZXJyID0gX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV1cclxuICAgIGlmICghX2VycltibG9ja2VkVVJJXSkge1xyXG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge31cclxuICAgIH1cclxuICAgIGNvbnN0IF9tYXRjaCA9IG9yaWdpbmFsUG9saWN5Lm1hdGNoKGAke3Zpb2xhdGVkRGlyZWN0aXZlfSBbXjtdKztgKVxyXG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlXHJcbiAgICBfZXJyW2Jsb2NrZWRVUkldID0ge1xyXG4gICAgICBkaXJlY3RpdmUsXHJcbiAgICAgIHRpbWVTdGFtcCxcclxuICAgICAgdHlwZVxyXG4gICAgfVxyXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxyXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBDU1A6JywgX2NzcClcclxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XHJcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxyXG4gICAgICAvLyAgIGhvc3QsXHJcbiAgICAgIC8vICAgcGF0aCxcclxuICAgICAgLy8gICBfY3NwLFxyXG4gICAgICAvLyB9KTtcclxuICAgICAgX2NzcCA9IHt9XHJcbiAgICB9LCA0MDAwKVxyXG4gIH1cclxuXHJcbiAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5jc3ApIHtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlY3VyaXR5cG9saWN5dmlvbGF0aW9uJywgY3NwRXJyb3IpXHJcbiAgfVxyXG59XHJcbi8vIGRpc3Bvc2l0aW9uOiBcInJlcG9ydFwiXHJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcclxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXHJcblxyXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcclxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxyXG4vLyBvcmlnaW5hbFBvbGljeTogXCJzY3JpcHQtc3JjIG51bGw7IGZyYW1lLXNyYyBudWxsOyBzdHlsZS1zcmMgbnVsbDsgc3R5bGUtc3JjLWVsZW0gbnVsbDsgaW1nLXNyYyBudWxsO1wiXHJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXHJcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcclxuICBpZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxyXG4gIH1cclxuICBcclxuICB3aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ0bi1hdXRvZmlsbCcpLmNsaWNrKClcclxuICAgIH0sIDEwMDApXHJcbiAgfVxyXG4gIFxyXG4gIHdpbmRvdy5taXRtLmZuLmdldENvb2tpZSA9IG5hbWUgPT4ge1xyXG4gICAgY29uc3QgdmFsdWUgPSBgOyAke2RvY3VtZW50LmNvb2tpZX1gO1xyXG4gICAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdChgOyAke25hbWV9PWApO1xyXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgcmV0dXJuIHBhcnRzLnBvcCgpLnNwbGl0KCc7Jykuc2hpZnQoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uTW91bnQgPSBlID0+IGNvbnNvbGUubG9nKCclY01hY3JvczogZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsICdjb2xvcjogIzVhZGE1NScsIGUpXHJcbiAgd2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBvbk1vdW50XHJcbn1cclxuIiwiZnVuY3Rpb24gbm9vcCgpIHsgfVxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5mdW5jdGlvbiBhc3NpZ24odGFyLCBzcmMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZm9yIChjb25zdCBrIGluIHNyYylcbiAgICAgICAgdGFyW2tdID0gc3JjW2tdO1xuICAgIHJldHVybiB0YXI7XG59XG5mdW5jdGlvbiBpc19wcm9taXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG4gICAgZWxlbWVudC5fX3N2ZWx0ZV9tZXRhID0ge1xuICAgICAgICBsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxubGV0IHNyY191cmxfZXF1YWxfYW5jaG9yO1xuZnVuY3Rpb24gc3JjX3VybF9lcXVhbChlbGVtZW50X3NyYywgdXJsKSB7XG4gICAgaWYgKCFzcmNfdXJsX2VxdWFsX2FuY2hvcikge1xuICAgICAgICBzcmNfdXJsX2VxdWFsX2FuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICB9XG4gICAgc3JjX3VybF9lcXVhbF9hbmNob3IuaHJlZiA9IHVybDtcbiAgICByZXR1cm4gZWxlbWVudF9zcmMgPT09IHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWY7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdF9iYXNlKHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBzbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBpZiAoc2xvdF9jaGFuZ2VzKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY29udGV4dCA9IGdldF9zbG90X2NvbnRleHQoc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGdldF9zbG90X2NvbnRleHRfZm4pO1xuICAgICAgICBzbG90LnAoc2xvdF9jb250ZXh0LCBzbG90X2NoYW5nZXMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90KHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbn1cbmZ1bmN0aW9uIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSgkJHNjb3BlKSB7XG4gICAgaWYgKCQkc2NvcGUuY3R4Lmxlbmd0aCA+IDMyKSB7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gW107XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9ICQkc2NvcGUuY3R4Lmxlbmd0aCAvIDMyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkaXJ0eVtpXSA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlKSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gVHJhY2sgd2hpY2ggbm9kZXMgYXJlIGNsYWltZWQgZHVyaW5nIGh5ZHJhdGlvbi4gVW5jbGFpbWVkIG5vZGVzIGNhbiB0aGVuIGJlIHJlbW92ZWQgZnJvbSB0aGUgRE9NXG4vLyBhdCB0aGUgZW5kIG9mIGh5ZHJhdGlvbiB3aXRob3V0IHRvdWNoaW5nIHRoZSByZW1haW5pbmcgbm9kZXMuXG5sZXQgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG5mdW5jdGlvbiBzdGFydF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGVuZF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG59XG5mdW5jdGlvbiB1cHBlcl9ib3VuZChsb3csIGhpZ2gsIGtleSwgdmFsdWUpIHtcbiAgICAvLyBSZXR1cm4gZmlyc3QgaW5kZXggb2YgdmFsdWUgbGFyZ2VyIHRoYW4gaW5wdXQgdmFsdWUgaW4gdGhlIHJhbmdlIFtsb3csIGhpZ2gpXG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgICAgY29uc3QgbWlkID0gbG93ICsgKChoaWdoIC0gbG93KSA+PiAxKTtcbiAgICAgICAgaWYgKGtleShtaWQpIDw9IHZhbHVlKSB7XG4gICAgICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGlnaCA9IG1pZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG93O1xufVxuZnVuY3Rpb24gaW5pdF9oeWRyYXRlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuaHlkcmF0ZV9pbml0KVxuICAgICAgICByZXR1cm47XG4gICAgdGFyZ2V0Lmh5ZHJhdGVfaW5pdCA9IHRydWU7XG4gICAgLy8gV2Uga25vdyB0aGF0IGFsbCBjaGlsZHJlbiBoYXZlIGNsYWltX29yZGVyIHZhbHVlcyBzaW5jZSB0aGUgdW5jbGFpbWVkIGhhdmUgYmVlbiBkZXRhY2hlZCBpZiB0YXJnZXQgaXMgbm90IDxoZWFkPlxuICAgIGxldCBjaGlsZHJlbiA9IHRhcmdldC5jaGlsZE5vZGVzO1xuICAgIC8vIElmIHRhcmdldCBpcyA8aGVhZD4sIHRoZXJlIG1heSBiZSBjaGlsZHJlbiB3aXRob3V0IGNsYWltX29yZGVyXG4gICAgaWYgKHRhcmdldC5ub2RlTmFtZSA9PT0gJ0hFQUQnKSB7XG4gICAgICAgIGNvbnN0IG15Q2hpbGRyZW4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG15Q2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjaGlsZHJlbiA9IG15Q2hpbGRyZW47XG4gICAgfVxuICAgIC8qXG4gICAgKiBSZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5LlxuICAgICogV2UgY2FuIHJlb3JkZXIgY2xhaW1lZCBjaGlsZHJlbiBvcHRpbWFsbHkgYnkgZmluZGluZyB0aGUgbG9uZ2VzdCBzdWJzZXF1ZW5jZSBvZlxuICAgICogbm9kZXMgdGhhdCBhcmUgYWxyZWFkeSBjbGFpbWVkIGluIG9yZGVyIGFuZCBvbmx5IG1vdmluZyB0aGUgcmVzdC4gVGhlIGxvbmdlc3RcbiAgICAqIHN1YnNlcXVlbmNlIHN1YnNlcXVlbmNlIG9mIG5vZGVzIHRoYXQgYXJlIGNsYWltZWQgaW4gb3JkZXIgY2FuIGJlIGZvdW5kIGJ5XG4gICAgKiBjb21wdXRpbmcgdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiAuY2xhaW1fb3JkZXIgdmFsdWVzLlxuICAgICpcbiAgICAqIFRoaXMgYWxnb3JpdGhtIGlzIG9wdGltYWwgaW4gZ2VuZXJhdGluZyB0aGUgbGVhc3QgYW1vdW50IG9mIHJlb3JkZXIgb3BlcmF0aW9uc1xuICAgICogcG9zc2libGUuXG4gICAgKlxuICAgICogUHJvb2Y6XG4gICAgKiBXZSBrbm93IHRoYXQsIGdpdmVuIGEgc2V0IG9mIHJlb3JkZXJpbmcgb3BlcmF0aW9ucywgdGhlIG5vZGVzIHRoYXQgZG8gbm90IG1vdmVcbiAgICAqIGFsd2F5cyBmb3JtIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2UsIHNpbmNlIHRoZXkgZG8gbm90IG1vdmUgYW1vbmcgZWFjaCBvdGhlclxuICAgICogbWVhbmluZyB0aGF0IHRoZXkgbXVzdCBiZSBhbHJlYWR5IG9yZGVyZWQgYW1vbmcgZWFjaCBvdGhlci4gVGh1cywgdGhlIG1heGltYWxcbiAgICAqIHNldCBvZiBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlIGZvcm0gYSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UuXG4gICAgKi9cbiAgICAvLyBDb21wdXRlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZVxuICAgIC8vIG06IHN1YnNlcXVlbmNlIGxlbmd0aCBqID0+IGluZGV4IGsgb2Ygc21hbGxlc3QgdmFsdWUgdGhhdCBlbmRzIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgbGVuZ3RoIGpcbiAgICBjb25zdCBtID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoICsgMSk7XG4gICAgLy8gUHJlZGVjZXNzb3IgaW5kaWNlcyArIDFcbiAgICBjb25zdCBwID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICBtWzBdID0gLTE7XG4gICAgbGV0IGxvbmdlc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGNoaWxkcmVuW2ldLmNsYWltX29yZGVyO1xuICAgICAgICAvLyBGaW5kIHRoZSBsYXJnZXN0IHN1YnNlcXVlbmNlIGxlbmd0aCBzdWNoIHRoYXQgaXQgZW5kcyBpbiBhIHZhbHVlIGxlc3MgdGhhbiBvdXIgY3VycmVudCB2YWx1ZVxuICAgICAgICAvLyB1cHBlcl9ib3VuZCByZXR1cm5zIGZpcnN0IGdyZWF0ZXIgdmFsdWUsIHNvIHdlIHN1YnRyYWN0IG9uZVxuICAgICAgICAvLyB3aXRoIGZhc3QgcGF0aCBmb3Igd2hlbiB3ZSBhcmUgb24gdGhlIGN1cnJlbnQgbG9uZ2VzdCBzdWJzZXF1ZW5jZVxuICAgICAgICBjb25zdCBzZXFMZW4gPSAoKGxvbmdlc3QgPiAwICYmIGNoaWxkcmVuW21bbG9uZ2VzdF1dLmNsYWltX29yZGVyIDw9IGN1cnJlbnQpID8gbG9uZ2VzdCArIDEgOiB1cHBlcl9ib3VuZCgxLCBsb25nZXN0LCBpZHggPT4gY2hpbGRyZW5bbVtpZHhdXS5jbGFpbV9vcmRlciwgY3VycmVudCkpIC0gMTtcbiAgICAgICAgcFtpXSA9IG1bc2VxTGVuXSArIDE7XG4gICAgICAgIGNvbnN0IG5ld0xlbiA9IHNlcUxlbiArIDE7XG4gICAgICAgIC8vIFdlIGNhbiBndWFyYW50ZWUgdGhhdCBjdXJyZW50IGlzIHRoZSBzbWFsbGVzdCB2YWx1ZS4gT3RoZXJ3aXNlLCB3ZSB3b3VsZCBoYXZlIGdlbmVyYXRlZCBhIGxvbmdlciBzZXF1ZW5jZS5cbiAgICAgICAgbVtuZXdMZW5dID0gaTtcbiAgICAgICAgbG9uZ2VzdCA9IE1hdGgubWF4KG5ld0xlbiwgbG9uZ2VzdCk7XG4gICAgfVxuICAgIC8vIFRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2Ygbm9kZXMgKGluaXRpYWxseSByZXZlcnNlZClcbiAgICBjb25zdCBsaXMgPSBbXTtcbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbm9kZXMsIG5vZGVzIHRoYXQgd2lsbCBiZSBtb3ZlZFxuICAgIGNvbnN0IHRvTW92ZSA9IFtdO1xuICAgIGxldCBsYXN0ID0gY2hpbGRyZW4ubGVuZ3RoIC0gMTtcbiAgICBmb3IgKGxldCBjdXIgPSBtW2xvbmdlc3RdICsgMTsgY3VyICE9IDA7IGN1ciA9IHBbY3VyIC0gMV0pIHtcbiAgICAgICAgbGlzLnB1c2goY2hpbGRyZW5bY3VyIC0gMV0pO1xuICAgICAgICBmb3IgKDsgbGFzdCA+PSBjdXI7IGxhc3QtLSkge1xuICAgICAgICAgICAgdG9Nb3ZlLnB1c2goY2hpbGRyZW5bbGFzdF0pO1xuICAgICAgICB9XG4gICAgICAgIGxhc3QtLTtcbiAgICB9XG4gICAgZm9yICg7IGxhc3QgPj0gMDsgbGFzdC0tKSB7XG4gICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICB9XG4gICAgbGlzLnJldmVyc2UoKTtcbiAgICAvLyBXZSBzb3J0IHRoZSBub2RlcyBiZWluZyBtb3ZlZCB0byBndWFyYW50ZWUgdGhhdCB0aGVpciBpbnNlcnRpb24gb3JkZXIgbWF0Y2hlcyB0aGUgY2xhaW0gb3JkZXJcbiAgICB0b01vdmUuc29ydCgoYSwgYikgPT4gYS5jbGFpbV9vcmRlciAtIGIuY2xhaW1fb3JkZXIpO1xuICAgIC8vIEZpbmFsbHksIHdlIG1vdmUgdGhlIG5vZGVzXG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgdG9Nb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdoaWxlIChqIDwgbGlzLmxlbmd0aCAmJiB0b01vdmVbaV0uY2xhaW1fb3JkZXIgPj0gbGlzW2pdLmNsYWltX29yZGVyKSB7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5jaG9yID0gaiA8IGxpcy5sZW5ndGggPyBsaXNbal0gOiBudWxsO1xuICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKHRvTW92ZVtpXSwgYW5jaG9yKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX3N0eWxlcyh0YXJnZXQsIHN0eWxlX3NoZWV0X2lkLCBzdHlsZXMpIHtcbiAgICBjb25zdCBhcHBlbmRfc3R5bGVzX3RvID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKHRhcmdldCk7XG4gICAgaWYgKCFhcHBlbmRfc3R5bGVzX3RvLmdldEVsZW1lbnRCeUlkKHN0eWxlX3NoZWV0X2lkKSkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gc3R5bGVfc2hlZXRfaWQ7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gc3R5bGVzO1xuICAgICAgICBhcHBlbmRfc3R5bGVzaGVldChhcHBlbmRfc3R5bGVzX3RvLCBzdHlsZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICBjb25zdCByb290ID0gbm9kZS5nZXRSb290Tm9kZSA/IG5vZGUuZ2V0Um9vdE5vZGUoKSA6IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBpZiAocm9vdCAmJiByb290Lmhvc3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfVxuICAgIHJldHVybiBub2RlLm93bmVyRG9jdW1lbnQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKSB7XG4gICAgY29uc3Qgc3R5bGVfZWxlbWVudCA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgYXBwZW5kX3N0eWxlc2hlZXQoZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpLCBzdHlsZV9lbGVtZW50KTtcbiAgICByZXR1cm4gc3R5bGVfZWxlbWVudDtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXNoZWV0KG5vZGUsIHN0eWxlKSB7XG4gICAgYXBwZW5kKG5vZGUuaGVhZCB8fCBub2RlLCBzdHlsZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSkge1xuICAgIGlmIChpc19oeWRyYXRpbmcpIHtcbiAgICAgICAgaW5pdF9oeWRyYXRlKHRhcmdldCk7XG4gICAgICAgIGlmICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPT09IHVuZGVmaW5lZCkgfHwgKCh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCAhPT0gbnVsbCkgJiYgKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkLnBhcmVudEVsZW1lbnQgIT09IHRhcmdldCkpKSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IHRhcmdldC5maXJzdENoaWxkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNraXAgbm9kZXMgb2YgdW5kZWZpbmVkIG9yZGVyaW5nXG4gICAgICAgIHdoaWxlICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5jbGFpbV9vcmRlciA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpIHtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgaW5zZXJ0IGlmIHRoZSBvcmRlcmluZyBvZiB0aGlzIG5vZGUgc2hvdWxkIGJlIG1vZGlmaWVkIG9yIHRoZSBwYXJlbnQgbm9kZSBpcyBub3QgdGFyZ2V0XG4gICAgICAgICAgICBpZiAobm9kZS5jbGFpbV9vcmRlciAhPT0gdW5kZWZpbmVkIHx8IG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgaWYgKGlzX2h5ZHJhdGluZyAmJiAhYW5jaG9yKSB7XG4gICAgICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPSBhbmNob3IpIHtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJ1c3RlZChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQuaXNUcnVzdGVkKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnX192YWx1ZScpIHtcbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB0eXBlb2Ygbm9kZVtwcm9wXSA9PT0gJ2Jvb2xlYW4nICYmIHZhbHVlID09PSAnJyA/IHRydWUgOiB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwLCBfX3ZhbHVlLCBjaGVja2VkKSB7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLmFkZChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgaWYgKCFjaGVja2VkKSB7XG4gICAgICAgIHZhbHVlLmRlbGV0ZShfX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20odmFsdWUpO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gaW5pdF9jbGFpbV9pbmZvKG5vZGVzKSB7XG4gICAgaWYgKG5vZGVzLmNsYWltX2luZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvID0geyBsYXN0X2luZGV4OiAwLCB0b3RhbF9jbGFpbWVkOiAwIH07XG4gICAgfVxufVxuZnVuY3Rpb24gY2xhaW1fbm9kZShub2RlcywgcHJlZGljYXRlLCBwcm9jZXNzTm9kZSwgY3JlYXRlTm9kZSwgZG9udFVwZGF0ZUxhc3RJbmRleCA9IGZhbHNlKSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgbm9kZXMgaW4gYW4gb3JkZXIgc3VjaCB0aGF0IHdlIGxlbmd0aGVuIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICBpbml0X2NsYWltX2luZm8obm9kZXMpO1xuICAgIGNvbnN0IHJlc3VsdE5vZGUgPSAoKCkgPT4ge1xuICAgICAgICAvLyBXZSBmaXJzdCB0cnkgdG8gZmluZCBhbiBlbGVtZW50IGFmdGVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSB0cnkgdG8gZmluZCBvbmUgYmVmb3JlXG4gICAgICAgIC8vIFdlIGl0ZXJhdGUgaW4gcmV2ZXJzZSBzbyB0aGF0IHdlIGRvbid0IGdvIHRvbyBmYXIgYmFja1xuICAgICAgICBmb3IgKGxldCBpID0gbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHByb2Nlc3NOb2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzW2ldID0gcmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZG9udFVwZGF0ZUxhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIHNwbGljZWQgYmVmb3JlIHRoZSBsYXN0X2luZGV4LCB3ZSBkZWNyZWFzZSBpdFxuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgd2UgY2FuJ3QgZmluZCBhbnkgbWF0Y2hpbmcgbm9kZSwgd2UgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gY3JlYXRlTm9kZSgpO1xuICAgIH0pKCk7XG4gICAgcmVzdWx0Tm9kZS5jbGFpbV9vcmRlciA9IG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZDtcbiAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICByZXR1cm4gcmVzdWx0Tm9kZTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgY3JlYXRlX2VsZW1lbnQpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZU5hbWUgPT09IG5hbWUsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZS5wdXNoKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW1vdmUuZm9yRWFjaCh2ID0+IG5vZGUucmVtb3ZlQXR0cmlidXRlKHYpKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LCAoKSA9PiBjcmVhdGVfZWxlbWVudChuYW1lKSk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV9zdmdfZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Z19lbGVtZW50KTtcbn1cbmZ1bmN0aW9uIGNsYWltX3RleHQobm9kZXMsIGRhdGEpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IDMsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGFTdHIgPSAnJyArIGRhdGE7XG4gICAgICAgIGlmIChub2RlLmRhdGEuc3RhcnRzV2l0aChkYXRhU3RyKSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuZGF0YS5sZW5ndGggIT09IGRhdGFTdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuc3BsaXRUZXh0KGRhdGFTdHIubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUuZGF0YSA9IGRhdGFTdHI7XG4gICAgICAgIH1cbiAgICB9LCAoKSA9PiB0ZXh0KGRhdGEpLCB0cnVlIC8vIFRleHQgbm9kZXMgc2hvdWxkIG5vdCB1cGRhdGUgbGFzdCBpbmRleCBzaW5jZSBpdCBpcyBsaWtlbHkgbm90IHdvcnRoIGl0IHRvIGVsaW1pbmF0ZSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGFjdHVhbCBlbGVtZW50c1xuICAgICk7XG59XG5mdW5jdGlvbiBjbGFpbV9zcGFjZShub2Rlcykge1xuICAgIHJldHVybiBjbGFpbV90ZXh0KG5vZGVzLCAnICcpO1xufVxuZnVuY3Rpb24gZmluZF9jb21tZW50KG5vZGVzLCB0ZXh0LCBzdGFydCkge1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDggLyogY29tbWVudCBub2RlICovICYmIG5vZGUudGV4dENvbnRlbnQudHJpbSgpID09PSB0ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZXMubGVuZ3RoO1xufVxuZnVuY3Rpb24gY2xhaW1faHRtbF90YWcobm9kZXMpIHtcbiAgICAvLyBmaW5kIGh0bWwgb3BlbmluZyB0YWdcbiAgICBjb25zdCBzdGFydF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX1NUQVJUJywgMCk7XG4gICAgY29uc3QgZW5kX2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfRU5EJywgc3RhcnRfaW5kZXgpO1xuICAgIGlmIChzdGFydF9pbmRleCA9PT0gZW5kX2luZGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgSHRtbFRhZ0h5ZHJhdGlvbigpO1xuICAgIH1cbiAgICBpbml0X2NsYWltX2luZm8obm9kZXMpO1xuICAgIGNvbnN0IGh0bWxfdGFnX25vZGVzID0gbm9kZXMuc3BsaWNlKHN0YXJ0X2luZGV4LCBlbmRfaW5kZXggKyAxKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbMF0pO1xuICAgIGRldGFjaChodG1sX3RhZ19ub2Rlc1todG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxXSk7XG4gICAgY29uc3QgY2xhaW1lZF9ub2RlcyA9IGh0bWxfdGFnX25vZGVzLnNsaWNlKDEsIGh0bWxfdGFnX25vZGVzLmxlbmd0aCAtIDEpO1xuICAgIGZvciAoY29uc3QgbiBvZiBjbGFpbWVkX25vZGVzKSB7XG4gICAgICAgIG4uY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgICAgIG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZCArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEh0bWxUYWdIeWRyYXRpb24oY2xhaW1lZF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VsZWN0LnNlbGVjdGVkSW5kZXggPSAtMTsgLy8gbm8gb3B0aW9uIHNob3VsZCBiZSBzZWxlY3RlZFxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG4vLyB1bmZvcnR1bmF0ZWx5IHRoaXMgY2FuJ3QgYmUgYSBjb25zdGFudCBhcyB0aGF0IHdvdWxkbid0IGJlIHRyZWUtc2hha2VhYmxlXG4vLyBzbyB3ZSBjYWNoZSB0aGUgcmVzdWx0IGluc3RlYWRcbmxldCBjcm9zc29yaWdpbjtcbmZ1bmN0aW9uIGlzX2Nyb3Nzb3JpZ2luKCkge1xuICAgIGlmIChjcm9zc29yaWdpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNyb3Nzb3JpZ2luID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHZvaWQgd2luZG93LnBhcmVudC5kb2N1bWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNyb3Nzb3JpZ2luID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY3Jvc3NvcmlnaW47XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKG5vZGUsIGZuKSB7XG4gICAgY29uc3QgY29tcHV0ZWRfc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChjb21wdXRlZF9zdHlsZS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuICAgIGNvbnN0IGlmcmFtZSA9IGVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgJyArXG4gICAgICAgICdvdmVyZmxvdzogaGlkZGVuOyBib3JkZXI6IDA7IG9wYWNpdHk6IDA7IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsLCBidWJibGVzID0gZmFsc2UpIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgYnViYmxlcywgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5mdW5jdGlvbiBxdWVyeV9zZWxlY3Rvcl9hbGwoc2VsZWN0b3IsIHBhcmVudCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgfVxuICAgIG0oaHRtbCwgdGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5lKSB7XG4gICAgICAgICAgICB0aGlzLmUgPSBlbGVtZW50KHRhcmdldC5ub2RlTmFtZSk7XG4gICAgICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pKGFuY2hvcik7XG4gICAgfVxuICAgIGgoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnQodGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgICAgIHRoaXMuaSh0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cbmNsYXNzIEh0bWxUYWdIeWRyYXRpb24gZXh0ZW5kcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihjbGFpbWVkX25vZGVzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgICAgIHRoaXMubCA9IGNsYWltZWRfbm9kZXM7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICBpZiAodGhpcy5sKSB7XG4gICAgICAgICAgICB0aGlzLm4gPSB0aGlzLmw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdXBlci5jKGh0bWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnRfaHlkcmF0aW9uKHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0cmlidXRlX3RvX29iamVjdChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICByZXN1bHRbYXR0cmlidXRlLm5hbWVdID0gYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cyhlbGVtZW50KSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgcmVzdWx0W25vZGUuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBhY3RpdmVfZG9jcyA9IG5ldyBTZXQoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpO1xuICAgIGFjdGl2ZV9kb2NzLmFkZChkb2MpO1xuICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBkb2MuX19zdmVsdGVfc3R5bGVzaGVldCB8fCAoZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgPSBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKS5zaGVldCk7XG4gICAgY29uc3QgY3VycmVudF9ydWxlcyA9IGRvYy5fX3N2ZWx0ZV9ydWxlcyB8fCAoZG9jLl9fc3ZlbHRlX3J1bGVzID0ge30pO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBhY3RpdmVfZG9jcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQ7XG4gICAgICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgICAgICBkb2MuX19zdmVsdGVfcnVsZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFjdGl2ZV9kb2NzLmNsZWFyKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbmZ1bmN0aW9uIGdldEFsbENvbnRleHRzKCkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0O1xufVxuZnVuY3Rpb24gaGFzQ29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5oYXMoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4uY2FsbCh0aGlzLCBldmVudCkpO1xuICAgIH1cbn1cblxuY29uc3QgZGlydHlfY29tcG9uZW50cyA9IFtdO1xuY29uc3QgaW50cm9zID0geyBlbmFibGVkOiBmYWxzZSB9O1xuY29uc3QgYmluZGluZ19jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHNjaGVkdWxlX3VwZGF0ZSgpIHtcbiAgICBpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcbiAgICAgICAgdXBkYXRlX3NjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHJlc29sdmVkX3Byb21pc2UudGhlbihmbHVzaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdGljaygpIHtcbiAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICByZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcbiAgICByZW5kZXJfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG4gICAgZmx1c2hfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxubGV0IGZsdXNoaW5nID0gZmFsc2U7XG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGlmIChmbHVzaGluZylcbiAgICAgICAgcmV0dXJuO1xuICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlydHlfY29tcG9uZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGlydHlfY29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHNlZW5fY2FsbGJhY2tzLmNsZWFyKCk7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSAocHJvZ3JhbS5iIC0gdCk7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5ibG9ja3NbaV0gPT09IGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2goaW5mbywgY3R4LCBkaXJ0eSkge1xuICAgIGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuICAgIGNvbnN0IHsgcmVzb2x2ZWQgfSA9IGluZm87XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby50aGVuKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLnZhbHVlXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLmNhdGNoKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLmVycm9yXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpbmZvLmJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBlc2NhcGUodmFsdWUpIDogdmFsdWU7XG59XG5mdW5jdGlvbiBlc2NhcGVfb2JqZWN0KG9iaikge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICByZXN1bHRba2V5XSA9IGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUob2JqW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cywgY29udGV4dCkge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAoY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIHsgJCRzbG90cyA9IHt9LCBjb250ZXh0ID0gbmV3IE1hcCgpIH0gPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCAkJHNsb3RzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogJyc7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yLCBjdXN0b21FbGVtZW50KSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIGlmICghY3VzdG9tRWxlbWVudCkge1xuICAgICAgICAvLyBvbk1vdW50IGhhcHBlbnMgYmVmb3JlIHRoZSBpbml0aWFsIGFmdGVyVXBkYXRlXG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgaWYgKG9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgICAgIHJ1bl9hbGwobmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGFwcGVuZF9zdHlsZXMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogbnVsbCxcbiAgICAgICAgLy8gc3RhdGVcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHVwZGF0ZTogbm9vcCxcbiAgICAgICAgbm90X2VxdWFsLFxuICAgICAgICBib3VuZDogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIC8vIGxpZmVjeWNsZVxuICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgIG9uX2Rlc3Ryb3k6IFtdLFxuICAgICAgICBvbl9kaXNjb25uZWN0OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAob3B0aW9ucy5jb250ZXh0IHx8IChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZSxcbiAgICAgICAgcm9vdDogb3B0aW9ucy50YXJnZXQgfHwgcGFyZW50X2NvbXBvbmVudC4kJC5yb290XG4gICAgfTtcbiAgICBhcHBlbmRfc3R5bGVzICYmIGFwcGVuZF9zdHlsZXMoJCQucm9vdCk7XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIG9wdGlvbnMucHJvcHMgfHwge30sIChpLCByZXQsIC4uLnJlc3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcmVzdC5sZW5ndGggPyByZXN0WzBdIDogcmV0O1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoISQkLnNraXBfYm91bmQgJiYgJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICBzdGFydF9oeWRyYXRpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50Lmwobm9kZXMpO1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChkZXRhY2gpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yLCBvcHRpb25zLmN1c3RvbUVsZW1lbnQpO1xuICAgICAgICBlbmRfaHlkcmF0aW5nKCk7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICBjb25zdCB7IG9uX21vdW50IH0gPSB0aGlzLiQkO1xuICAgICAgICAgICAgdGhpcy4kJC5vbl9kaXNjb25uZWN0ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLiQkLnNsb3R0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy4kJC5zbG90dGVkW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyLCBfb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzW2F0dHJdID0gbmV3VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICBydW5fYWxsKHRoaXMuJCQub25fZGlzY29ubmVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgJGRlc3Ryb3koKSB7XG4gICAgICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgICAgICB9XG4gICAgICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gVE9ETyBzaG91bGQgdGhpcyBkZWxlZ2F0ZSB0byBhZGRFdmVudExpc3RlbmVyP1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzLiBVc2VkIHdoZW4gZGV2PWZhbHNlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaF9kZXYodHlwZSwgZGV0YWlsKSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQodHlwZSwgT2JqZWN0LmFzc2lnbih7IHZlcnNpb246ICczLjQzLjAnIH0sIGRldGFpbCksIHRydWUpKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9oeWRyYXRpb25fZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbl9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZScsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFsnY2FwdHVyZSddIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUgfSk7XG4gICAgZWxzZVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldEF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRQcm9wZXJ0eScsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YXNldCcsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YScsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9hcmd1bWVudChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycgJiYgIShhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJnKSkge1xuICAgICAgICBsZXQgbXNnID0gJ3sjZWFjaH0gb25seSBpdGVyYXRlcyBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cy4nO1xuICAgICAgICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBhcmcgJiYgU3ltYm9sLml0ZXJhdG9yIGluIGFyZykge1xuICAgICAgICAgICAgbXNnICs9ICcgWW91IGNhbiB1c2UgYSBzcHJlYWQgdG8gY29udmVydCB0aGlzIGl0ZXJhYmxlIGludG8gYW4gYXJyYXkuJztcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zbG90cyhuYW1lLCBzbG90LCBrZXlzKSB7XG4gICAgZm9yIChjb25zdCBzbG90X2tleSBvZiBPYmplY3Qua2V5cyhzbG90KSkge1xuICAgICAgICBpZiAoIX5rZXlzLmluZGV4T2Yoc2xvdF9rZXkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYDwke25hbWV9PiByZWNlaXZlZCBhbiB1bmV4cGVjdGVkIHNsb3QgXCIke3Nsb3Rfa2V5fVwiLmApO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cyB3aXRoIHNvbWUgbWlub3IgZGV2LWVuaGFuY2VtZW50cy4gVXNlZCB3aGVuIGRldj10cnVlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJGNhcHR1cmVfc3RhdGUoKSB7IH1cbiAgICAkaW5qZWN0X3N0YXRlKCkgeyB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgdG8gY3JlYXRlIHN0cm9uZ2x5IHR5cGVkIFN2ZWx0ZSBjb21wb25lbnRzLlxuICogVGhpcyBvbmx5IGV4aXN0cyBmb3IgdHlwaW5nIHB1cnBvc2VzIGFuZCBzaG91bGQgYmUgdXNlZCBpbiBgLmQudHNgIGZpbGVzLlxuICpcbiAqICMjIyBFeGFtcGxlOlxuICpcbiAqIFlvdSBoYXZlIGNvbXBvbmVudCBsaWJyYXJ5IG9uIG5wbSBjYWxsZWQgYGNvbXBvbmVudC1saWJyYXJ5YCwgZnJvbSB3aGljaFxuICogeW91IGV4cG9ydCBhIGNvbXBvbmVudCBjYWxsZWQgYE15Q29tcG9uZW50YC4gRm9yIFN2ZWx0ZStUeXBlU2NyaXB0IHVzZXJzLFxuICogeW91IHdhbnQgdG8gcHJvdmlkZSB0eXBpbmdzLiBUaGVyZWZvcmUgeW91IGNyZWF0ZSBhIGBpbmRleC5kLnRzYDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBTdmVsdGVDb21wb25lbnRUeXBlZCB9IGZyb20gXCJzdmVsdGVcIjtcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkPHtmb286IHN0cmluZ30+IHt9XG4gKiBgYGBcbiAqIFR5cGluZyB0aGlzIG1ha2VzIGl0IHBvc3NpYmxlIGZvciBJREVzIGxpa2UgVlMgQ29kZSB3aXRoIHRoZSBTdmVsdGUgZXh0ZW5zaW9uXG4gKiB0byBwcm92aWRlIGludGVsbGlzZW5zZSBhbmQgdG8gdXNlIHRoZSBjb21wb25lbnQgbGlrZSB0aGlzIGluIGEgU3ZlbHRlIGZpbGVcbiAqIHdpdGggVHlwZVNjcmlwdDpcbiAqIGBgYHN2ZWx0ZVxuICogPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAqIFx0aW1wb3J0IHsgTXlDb21wb25lbnQgfSBmcm9tIFwiY29tcG9uZW50LWxpYnJhcnlcIjtcbiAqIDwvc2NyaXB0PlxuICogPE15Q29tcG9uZW50IGZvbz17J2Jhcid9IC8+XG4gKiBgYGBcbiAqXG4gKiAjIyMjIFdoeSBub3QgbWFrZSB0aGlzIHBhcnQgb2YgYFN2ZWx0ZUNvbXBvbmVudChEZXYpYD9cbiAqIEJlY2F1c2VcbiAqIGBgYHRzXG4gKiBjbGFzcyBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogY29uc3QgY29tcG9uZW50OiB0eXBlb2YgU3ZlbHRlQ29tcG9uZW50ID0gQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQ7XG4gKiBgYGBcbiAqIHdpbGwgdGhyb3cgYSB0eXBlIGVycm9yLCBzbyB3ZSBuZWVkIHRvIHNlcGFyYXRlIHRoZSBtb3JlIHN0cmljdGx5IHR5cGVkIGNsYXNzLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnRUeXBlZCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudERldiB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgbG9vcCBkZXRlY3RlZCcpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgSHRtbFRhZ0h5ZHJhdGlvbiwgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUNvbXBvbmVudFR5cGVkLCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0LCBhcHBlbmRfaHlkcmF0aW9uLCBhcHBlbmRfaHlkcmF0aW9uX2RldiwgYXBwZW5kX3N0eWxlcywgYXNzaWduLCBhdHRyLCBhdHRyX2RldiwgYXR0cmlidXRlX3RvX29iamVjdCwgYmVmb3JlVXBkYXRlLCBiaW5kLCBiaW5kaW5nX2NhbGxiYWNrcywgYmxhbmtfb2JqZWN0LCBidWJibGUsIGNoZWNrX291dHJvcywgY2hpbGRyZW4sIGNsYWltX2NvbXBvbmVudCwgY2xhaW1fZWxlbWVudCwgY2xhaW1faHRtbF90YWcsIGNsYWltX3NwYWNlLCBjbGFpbV9zdmdfZWxlbWVudCwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNvbXB1dGVfcmVzdF9wcm9wcywgY29tcHV0ZV9zbG90cywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlbmRfaHlkcmF0aW5nLCBlc2NhcGUsIGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUsIGVzY2FwZV9vYmplY3QsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0QWxsQ29udGV4dHMsIGdldENvbnRleHQsIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Jvb3RfZm9yX3N0eWxlLCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzQ29udGV4dCwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGluc2VydF9oeWRyYXRpb24sIGluc2VydF9oeWRyYXRpb25fZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHNyY191cmxfZXF1YWwsIHN0YXJ0X2h5ZHJhdGluZywgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdHJ1c3RlZCwgdXBkYXRlX2F3YWl0X2Jsb2NrX2JyYW5jaCwgdXBkYXRlX2tleWVkX2VhY2gsIHVwZGF0ZV9zbG90LCB1cGRhdGVfc2xvdF9iYXNlLCB2YWxpZGF0ZV9jb21wb25lbnQsIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQsIHZhbGlkYXRlX2VhY2hfa2V5cywgdmFsaWRhdGVfc2xvdHMsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCJjb25zdCBjc3BBcnIgPSBbXHJcbiAgJ2RlZmF1bHQtc3JjJyxcclxuICAnY2hpbGQtc3JjJyxcclxuICAnY29ubmVjdC1zcmMnLFxyXG4gICdmb250LXNyYycsXHJcbiAgJ2ZyYW1lLXNyYycsXHJcbiAgJ2ltZy1zcmMnLFxyXG4gICdtYW5pZmVzdC1zcmMnLFxyXG4gICdtZWRpYS1zcmMnLFxyXG4gICdvYmplY3Qtc3JjJyxcclxuICAncHJlZmV0Y2gtc3JjJyxcclxuICAnc2NyaXB0LXNyYycsXHJcbiAgJ3NjcmlwdC1zcmMtZWxlbScsXHJcbiAgJ3NjcmlwdC1zcmMtYXR0cicsXHJcbiAgJ3N0eWxlLXNyYycsXHJcbiAgJ3N0eWxlLXNyYy1lbGVtJyxcclxuICAnc3R5bGUtc3JjLWF0dHInLFxyXG4gICd3b3JrZXItc3JjJyxcclxuICAnYmFzZS11cmknLFxyXG4gICdwbHVnaW4tdHlwZXMnLFxyXG4gICdzYW5kYm94JyxcclxuICAnbmF2aWdhdGUtdG8nLFxyXG4gICdmb3JtLWFjdGlvbicsXHJcbiAgJ2ZyYW1lLWFuY2VzdG9ycycsXHJcbiAgJ3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnLFxyXG4gICdyZXBvcnQtdXJpJyxcclxuICAncmVwb3J0LXRvJyxcclxuXVxyXG5jb25zdCBjc3BGZXRjaCA9IFtcclxuICAnZGVmYXVsdC1zcmMnLFxyXG4gICdjaGlsZC1zcmMnLFxyXG4gICdjb25uZWN0LXNyYycsXHJcbiAgJ2ZvbnQtc3JjJyxcclxuICAnZnJhbWUtc3JjJyxcclxuICAnaW1nLXNyYycsXHJcbiAgJ21hbmlmZXN0LXNyYycsXHJcbiAgJ21lZGlhLXNyYycsXHJcbiAgJ29iamVjdC1zcmMnLFxyXG4gICdwcmVmZXRjaC1zcmMnLFxyXG4gICdzY3JpcHQtc3JjJyxcclxuICAnc3R5bGUtc3JjJyxcclxuICAnd29ya2VyLXNyYycsXHJcbl1cclxuY29uc3QgY3NwRUF0dHIgPSBbXHJcbiAgJ3NjcmlwdC1zcmMtZWxlbScsXHJcbiAgJ3NjcmlwdC1zcmMtYXR0cicsXHJcbiAgJ3N0eWxlLXNyYy1lbGVtJyxcclxuICAnc3R5bGUtc3JjLWF0dHInLFxyXG5dXHJcbmNvbnN0IGNzcEluZm8gPSB7XHJcbiAgJ2RlZmF1bHQtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2RlZmF1bHQtc3JjJyxcclxuICAgIG5vdGU6ICdpcyBhIGZhbGxiYWNrIGRpcmVjdGl2ZSBmb3IgdGhlIG90aGVyIGZldGNoIGRpcmVjdGl2ZXM6IDxiPmNoaWxkLXNyYzwvYj4sIDxiPmNvbm5lY3Qtc3JjPC9iPiwgPGI+Zm9udC1zcmM8L2I+LCA8Yj5pbWctc3JjPC9iPiwgPGI+bWFuaWZlc3Qtc3JjPC9iPiwgPGI+bWVkaWEtc3JjPC9iPiwgPGI+cHJlZmV0Y2gtc3JjPC9iPiwgPGI+b2JqZWN0LXNyYzwvYj4sIDxiPnNjcmlwdC1zcmMoc2NyaXB0LXNyYy1lbGVtLCBzY3JpcHQtc3JjLWF0dHIpPC9iPiwgPGI+c3R5bGUtc3JjKHN0eWxlLXNyYy1lbGVtLCBzdHlsZS1zcmMtYXR0cik8L2I+LidcclxuICB9LFxyXG4gICdjaGlsZC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMixcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvY2hpbGQtc3JjJyxcclxuICAgIG5vdGU6ICdhbGxvd3MgdGhlIGRldmVsb3BlciB0byBjb250cm9sIG5lc3RlZCBicm93c2luZyBjb250ZXh0cyBhbmQgd29ya2VyIGV4ZWN1dGlvbiBjb250ZXh0cy4nXHJcbiAgfSxcclxuICAnY29ubmVjdC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvY29ubmVjdC1zcmMnLFxyXG4gICAgbm90ZTogJ3Byb3ZpZGVzIGNvbnRyb2wgb3ZlciBmZXRjaCByZXF1ZXN0cywgWEhSLCBldmVudHNvdXJjZSwgYmVhY29uIGFuZCB3ZWJzb2NrZXRzIGNvbm5lY3Rpb25zLidcclxuICB9LFxyXG4gICdmb250LXNyYyc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mb250LXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHdoaWNoIFVSTHMgdG8gbG9hZCBmb250cyBmcm9tLidcclxuICB9LFxyXG4gICdmcmFtZS1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZnJhbWUtc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgbmVzdGVkIGJyb3dzaW5nIGNvbnRleHRzIGxvYWRpbmcgdXNpbmcgZWxlbWVudHMgc3VjaCBhcyAmbHQ7ZnJhbWUmZ3Q7IGFuZCAmbHQ7aWZyYW1lJmd0Oy4nXHJcbiAgfSxcclxuICAnaW1nLXNyYyc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9pbWctc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgdGhhdCBpbWFnZXMgY2FuIGJlIGxvYWRlZCBmcm9tLidcclxuICB9LFxyXG4gICdtYW5pZmVzdC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMyxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvbWFuaWZlc3Qtc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgdGhhdCBhcHBsaWNhdGlvbiBtYW5pZmVzdHMgbWF5IGJlIGxvYWRlZCBmcm9tLidcclxuICB9LFxyXG4gICdtZWRpYS1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvbWVkaWEtc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgZnJvbSB3aGljaCB2aWRlbywgYXVkaW8gYW5kIHRleHQgdHJhY2sgcmVzb3VyY2VzIGNhbiBiZSBsb2FkZWQgZnJvbS4nXHJcbiAgfSxcclxuICAnb2JqZWN0LXNyYyc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9vYmplY3Qtc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgZnJvbSB3aGljaCBwbHVnaW5zIGNhbiBiZSBsb2FkZWQgZnJvbS4nXHJcbiAgfSxcclxuICAncHJlZmV0Y2gtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDMsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3ByZWZldGNoLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcmVzb3VyY2VzIGNhbiBiZSBwcmVmZXRjaGVkIGZyb20uJ1xyXG4gIH0sXHJcbiAgJ3NjcmlwdC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2NyaXB0LXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBsb2NhdGlvbnMgZnJvbSB3aGljaCBhIHNjcmlwdCBjYW4gYmUgZXhlY3V0ZWQgZnJvbS4gSXQgaXMgYSBmYWxsYmFjayBkaXJlY3RpdmUgZm9yIG90aGVyIHNjcmlwdC1saWtlIGRpcmVjdGl2ZXM6IDxiPnNjcmlwdC1zcmMtZWxlbTwvYj4sIDxiPnNjcmlwdC1zcmMtYXR0cjwvYj4nXHJcbiAgfSxcclxuICAnc2NyaXB0LXNyYy1lbGVtJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMtZWxlbScsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIEphdmFTY3JpcHQgJmx0O3NjcmlwdCZndDsgZWxlbWVudHMsIGJ1dCBub3QgaW5saW5lIHNjcmlwdCBldmVudCBoYW5kbGVycyBsaWtlIG9uY2xpY2suJ1xyXG4gIH0sXHJcbiAgJ3NjcmlwdC1zcmMtYXR0cic6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zY3JpcHQtc3JjLWF0dHInLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0IGlubGluZSBldmVudCBoYW5kbGVycy4gVGhpcyBpbmNsdWRlcyBvbmx5IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLCBidXQgbm90IFVSTHMgbG9hZGVkIGRpcmVjdGx5IGludG8gJmx0O3NjcmlwdCZndDsgZWxlbWVudHMuJ1xyXG4gIH0sXHJcbiAgJ3N0eWxlLXNyYyc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxyXG4gICAgbm90ZTogJ2NvbnRyb2xzIGZyb20gd2hlcmUgc3R5bGVzIGdldCBhcHBsaWVkIHRvIGEgZG9jdW1lbnQuIFRoaXMgaW5jbHVkZXMgPGxpbms+IGVsZW1lbnRzLCBAaW1wb3J0IHJ1bGVzLCBhbmQgcmVxdWVzdHMgb3JpZ2luYXRpbmcgZnJvbSBhIExpbmsgSFRUUCByZXNwb25zZSBoZWFkZXIgZmllbGQ6IDxiPnN0eWxlLXNyYy1lbGVtPC9iPiwgPGI+c3R5bGUtc3JjLWF0dHI8L2I+J1xyXG4gIH0sXHJcbiAgJ3N0eWxlLXNyYy1lbGVtJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIHN0eWxlc2hlZXRzICZsdDtzdHlsZSZndDsgZWxlbWVudHMgYW5kICZsdDtsaW5rJmd0OyBlbGVtZW50cyB3aXRoIHJlbD1cInN0eWxlc2hlZXRcIi4nXHJcbiAgfSxcclxuICAnc3R5bGUtc3JjLWF0dHInOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgaW5saW5lIHN0eWxlcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgRE9NIGVsZW1lbnRzLidcclxuICB9LFxyXG4gICd3b3JrZXItc3JjJzoge1xyXG4gICAgbGV2ZWw6IDMsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3dvcmtlci1zcmMnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBXb3JrZXIsIFNoYXJlZFdvcmtlciwgb3IgU2VydmljZVdvcmtlciBzY3JpcHRzLidcclxuICB9LFxyXG4gICdiYXNlLXVyaSc6IHtcclxuICAgIGxldmVsOiAyLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9iYXNlLXVyaScsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBwb3NzaWJsZSBVUkxzIHRoYXQgdGhlICZsdDtiYXNlJmd0OyBlbGVtZW50IGNhbiB1c2UuJ1xyXG4gIH0sXHJcbiAgJ3BsdWdpbi10eXBlcyc6IHtcclxuICAgIGxldmVsOiAyLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9wbHVnaW4tdHlwZXMnLFxyXG4gICAgbm90ZTogJ2xpbWl0cyB0aGUgdHlwZXMgb2YgcmVzb3VyY2VzIHRoYXQgY2FuIGJlIGxvYWRlZCBpbnRvIHRoZSBkb2N1bWVudCAoZS5nLiBhcHBsaWNhdGlvbi9wZGYpLiAzIHJ1bGVzIGFwcGx5IHRvIHRoZSBhZmZlY3RlZCBlbGVtZW50cywgJmx0O2VtYmVkJmd0OyBhbmQgJmx0O29iamVjdCZndDsnLFxyXG4gICAgZGVwcmVjYXRlZDogdHJ1ZVxyXG4gIH0sXHJcbiAgJ3NhbmRib3gnOiB7XHJcbiAgICBsZXZlbDogJzEuMS8yJyxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2FuZGJveCcsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBwb3NzaWJsZSBVUkxzIHRoYXQgdGhlICZsdDtiYXNlJmd0OyBlbGVtZW50IGNhbiB1c2UuJ1xyXG4gIH0sXHJcbiAgJ25hdmlnYXRlLXRvJzoge1xyXG4gICAgbGV2ZWw6IDMsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L25hdmlnYXRlLXRvJyxcclxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgd2hpY2ggYSBkb2N1bWVudCBjYW4gbmF2aWdhdGUgdG8gYnkgYW55IG1lYW4gKG5vdCB5ZXQgc3VwcG9ydGVkIGJ5IG1vZGVybiBicm93c2VycyBpbiBKYW4gMjAyMSkuJ1xyXG4gIH0sXHJcbiAgJ2Zvcm0tYWN0aW9uJzoge1xyXG4gICAgbGV2ZWw6IDIsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Zvcm0tYWN0aW9uJyxcclxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgd2hpY2ggdGhlIGZvcm1zIGNhbiBzdWJtaXQgdG8uJ1xyXG4gIH0sXHJcbiAgJ2ZyYW1lLWFuY2VzdG9ycyc6IHtcclxuICAgIGxldmVsOiAyLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mcmFtZS1hbmNlc3RvcnMnLFxyXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB0aGF0IGNhbiBlbWJlZCB0aGUgcmVxdWVzdGVkIHJlc291cmNlIGluc2lkZSBvZiAmbHQ7ZnJhbWUmZ3Q7LCAmbHQ7aWZyYW1lJmd0OywgJmx0O29iamVjdCZndDssICZsdDtlbWJlZCZndDssIG9yICZsdDthcHBsZXQmZ3Q7IGVsZW1lbnRzLidcclxuICB9LFxyXG4gICd1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJzoge1xyXG4gICAgbGV2ZWw6ICc/JyxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvdXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cycsXHJcbiAgICBub3RlOiAnaW5zdHJ1Y3RzIHVzZXIgYWdlbnRzIHRvIHRyZWF0IGFsbCBvZiBhIHNpdGVcXCdzIGluc2VjdXJlIFVSTHMgKHRob3NlIHNlcnZlZCBvdmVyIEhUVFApIGFzIHRob3VnaCB0aGV5IGhhdmUgYmVlbiByZXBsYWNlZCB3aXRoIHNlY3VyZSBVUkxzICh0aG9zZSBzZXJ2ZWQgb3ZlciBIVFRQUykuIFRoaXMgZGlyZWN0aXZlIGlzIGludGVuZGVkIGZvciB3ZWIgc2l0ZXMgd2l0aCBsYXJnZSBudW1iZXJzIG9mIGluc2VjdXJlIGxlZ2FjeSBVUkxzIHRoYXQgbmVlZCB0byBiZSByZXdyaXR0ZW4uJ1xyXG4gIH0sXHJcbiAgJ3JlcG9ydC11cmknOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcmVwb3J0LXVyaScsXHJcbiAgICBub3RlOiAnZGlyZWN0aXZlIGlzIGRlcHJlY2F0ZWQgYnkgcmVwb3J0LXRvLCB3aGljaCBpcyBhIFVSSSB0aGF0IHRoZSByZXBvcnRzIGFyZSBzZW50IHRvLicsXHJcbiAgICBkZXByZWNhdGVkOiB0cnVlXHJcbiAgfSxcclxuICAncmVwb3J0LXRvJzoge1xyXG4gICAgbGV2ZWw6IDMsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3JlcG9ydC10bycsXHJcbiAgICBub3RlOiAnd2hpY2ggaXMgYSBncm91cG5hbWUgZGVmaW5lZCBpbiB0aGUgaGVhZGVyIGluIGEganNvbiBmb3JtYXR0ZWQgaGVhZGVyIHZhbHVlLidcclxuICB9LFxyXG59XHJcbmNvbnN0IHBvbGljeSA9IHtcclxuICAnbm9uZScgIDogJ1dvblxcJ3QgYWxsb3cgbG9hZGluZyBvZiBhbnkgcmVzb3VyY2VzLicsXHJcbiAgJ2Jsb2I6JyA6ICdSYXcgZGF0YSB0aGF0IGlzblxcJ3QgbmVjZXNzYXJpbHkgaW4gYSBKYXZhU2NyaXB0LW5hdGl2ZSBmb3JtYXQuJyxcclxuICAnZGF0YTonIDogJ09ubHkgYWxsb3cgcmVzb3VyY2VzIGZyb20gdGhlIGRhdGEgc2NoZW1lIChpZTogQmFzZTY0IGVuY29kZWQgaW1hZ2VzKS4nLFxyXG4gIFwiJ3NlbGYnXCI6ICdPbmx5IGFsbG93IHJlc291cmNlcyBmcm9tIHRoZSBjdXJyZW50IG9yaWdpbi4nLFxyXG4gIFwiJ3Vuc2FmZS1pbmxpbmUnXCI6ICcnLFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBjc3BBcnIsXHJcbiAgY3NwSW5mbyxcclxuICBjc3BGZXRjaCxcclxuICBjc3BFQXR0cixcclxuICBwb2xpY3ksXHJcbn0iLCI8c2NyaXB0PlxyXG5pbXBvcnQge29uTW91bnR9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7XHJcbiAgY3NwQXJyLFxyXG4gIGNzcEluZm8sXHJcbiAgY3NwRmV0Y2gsXHJcbiAgY3NwRUF0dHIsXHJcbn0gZnJvbSAnLi9Dc3BkaXJlY3RpdmUnXHJcbmxldCBjc3AgPSB3aW5kb3cubWl0bS5pbmZvLmNzcFxyXG5sZXQgcmVwb3J0VG8gPSBjc3AucmVwb3J0VG9cclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGZhbGxiYWNrID0gdHJ1ZVxyXG4gIGNvbnN0IHtwb2xpY3l9ID0gY3NwWydkZWZhdWx0LXNyYyddIHx8IHt9XHJcbiAgaWYgKHBvbGljeSAmJiBwb2xpY3kubGVuZ3RoPjApIHtcclxuICAgIGZvciAoY29uc3QgaWQgb2YgY3NwRmV0Y2gpIHtcclxuICAgICAgaWYgKCFjc3BbaWRdKSB7XHJcbiAgICAgICAgY3NwW2lkXSA9IHtwb2xpY3ksIGZhbGxiYWNrfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGZvciAoY29uc3QgaWQgb2YgY3NwRUF0dHIpIHtcclxuICAgIGNvbnN0IHBhciA9IGlkLnJlcGxhY2UoLy0uezR9JC8sICcnKVxyXG4gICAgY29uc3Qge3BvbGljeX0gPSBjc3BbcGFyXSB8fCB7fVxyXG4gICAgaWYgKCFjc3BbaWRdICYmIHBvbGljeSkge1xyXG4gICAgICBjc3BbaWRdID0ge3BvbGljeSwgZmFsbGJhY2t9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChyZXBvcnRUbyE9PSdKU09OIEVycm9yIScgJiYgcmVwb3J0VG8/Lmxlbmd0aCA+IDE1KSB7XHJcbiAgICBsZXQgY2IgPSByZXBvcnRUby5yZXBsYWNlKC9cXG4vZywnJykudHJpbSgpXHJcbiAgICBpZiAoY2JbMF09PT0neycgJiYgY2Iuc2xpY2UoLTEpPT09J30nKSB7XHJcbiAgICAgIGNiID0gSlNPTi5zdHJpbmdpZnkoSlNPTi5wYXJzZShgWyR7Y2J9XWApLCBudWxsLCAyKVxyXG4gICAgICByZXBvcnRUbyA9IGNiLnJlcGxhY2UoL1xcW3xcXF0vZywgJycpLnJlcGxhY2UoL1xcbiAgL2csICdcXG4nKS50cmltKClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3hcIj5cclxuICA8Yj5Db250ZW50IFNlY3VyaXR5IFBvbGljeTwvYj5cclxuICA8cD5cclxuICAgIENTUCBvbjpcclxuICAgIDxhIHRhcmdldD1ibGFuayBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9DU1BcIj5Nb3ppbGxhPC9hPiwgXHJcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vY29udGVudC1zZWN1cml0eS1wb2xpY3kuY29tL1wiPmNvbnRlbnQtc2VjdXJpdHktcG9saWN5LmNvbTwvYT4sXHJcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vY2hlYXRzaGVldHNlcmllcy5vd2FzcC5vcmcvY2hlYXRzaGVldHMvQ29udGVudF9TZWN1cml0eV9Qb2xpY3lfQ2hlYXRfU2hlZXQuaHRtbFwiPk9XQVNQLWNoZWF0LXNoZWV0PC9hPlxyXG4gIDwvcD5cclxuICA8ZGl2PlxyXG4gICAgeyNlYWNoIGNzcEFyciBhcyBpZCwgaX1cclxuICAgIHsjaWYgY3NwW2lkXX0gICAgICBcclxuICAgICAgPGRldGFpbHM+PHN1bW1hcnkgY2xhc3M9e2NzcFtpZF0uZmFsbGJhY2sgPyAnZmFsbGJhY2snIDogJyd9PlxyXG4gICAgICAgIHsjaWYgY3NwSW5mb1tpZF0ubGlua31cclxuICAgICAgICAgIHtpKzF9LntpZH06KHtjc3BbaWRdLnBvbGljeS5sZW5ndGh9KTxhIHRhcmdldD1ibGFuayBocmVmPXtjc3BJbmZvW2lkXS5saW5rfT48c21hbGw+dntjc3BJbmZvW2lkXS5sZXZlbH08L3NtYWxsPjwvYT5cclxuICAgICAgICB7OmVsc2V9XHJcbiAgICAgICAgICB7aSsxfS57aWR9Oih7Y3NwW2lkXS5wb2xpY3kubGVuZ3RofSk8c21hbGw+dntjc3BJbmZvW2lkXS5sZXZlbH08L3NtYWxsPlxyXG4gICAgICAgIHsvaWZ9XHJcbiAgICAgIDwvc3VtbWFyeT5cclxuICAgICAgICB7I2lmIGNzcEluZm9baWRdLm5vdGV9XHJcbiAgICAgICAgICA8ZGV0YWlscyBjbGFzcz1cIm5vdGVcIj48c3VtbWFyeT5leHBhbmQuLi48L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIDxzbWFsbD57QGh0bWwgY3NwSW5mb1tpZF0ubm90ZX08L3NtYWxsPlxyXG4gICAgICAgICAgPC9kZXRhaWxzPlxyXG4gICAgICAgIHsvaWZ9XHJcbiAgICAgICAgeyNlYWNoIGNzcFtpZF0ucG9saWN5IGFzIGl0ZW0sIHh9XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbVwiPnt4KzF9OntpdGVtfTwvZGl2PlxyXG4gICAgICAgIHsvZWFjaH1cclxuICAgICAgPC9kZXRhaWxzPlxyXG4gICAgey9pZn1cclxuICAgIHsvZWFjaH1cclxuICAgIDxociAvPlxyXG4gICAgPGRldGFpbHM+PHN1bW1hcnkgY2xhc3M9XCJyZXBvcnRcIj48Yj5yZXBvcnQtdG88L2I+Ojwvc3VtbWFyeT5cclxuICAgICAgPGRldGFpbHMgY2xhc3M9XCJub3RlXCI+PHN1bW1hcnk+ZXhwYW5kLi4uPC9zdW1tYXJ5PlxyXG4gICAgICAgIDxzbWFsbD57QGh0bWwgJ3VzZWQgdG8gc3BlY2lmeSBkZXRhaWxzIGFib3V0IHRoZSBkaWZmZXJlbnQgZW5kcG9pbnRzIHRoYXQgYSB1c2VyLWFnZW50IGhhcyBhdmFpbGFibGUgdG8gaXQgZm9yIGRlbGl2ZXJpbmcgcmVwb3J0cyB0by4gWW91IGNhbiB0aGVuIHJldHJpZXZlIHJlcG9ydHMgYnkgbWFraW5nIGEgcmVxdWVzdCB0byB0aG9zZSBVUkxzLid9PC9zbWFsbD5cclxuICAgICAgPC9kZXRhaWxzPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbVwiPntyZXBvcnRUb308L2Rpdj5cclxuICAgIDwvZGV0YWlscz5cclxuICA8L2Rpdj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPlxyXG5kZXRhaWxzLm5vdGUge1xyXG4gIHBhZGRpbmctbGVmdDogMTRweDtcclxuICBwYWRkaW5nLWJvdHRvbTogM3B4O1xyXG4gIHN1bW1hcnkge1xyXG4gICAgY29sb3I6IHJlZDtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcclxuICAgIG1hcmdpbi1sZWZ0OiAtMTRweDtcclxuICAgIHBhZGRpbmctbGVmdDogMTRweDtcclxuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XHJcbiAgICAmOjotd2Via2l0LWRldGFpbHMtbWFya2VyIHtcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgIH1cclxuICAgICY6aG92ZXIge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcclxuICAgIH1cclxuICB9XHJcbn0gXHJcbnN1bW1hcnksLml0ZW0ge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gIGZvbnQtc2l6ZTogc21hbGw7XHJcbiAgJjpob3ZlciB7XHJcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGJsdWU7XHJcbiAgfVxyXG59XHJcbnN1bW1hcnkuZmFsbGJhY2sge1xyXG4gIGNvbG9yOiBkYXJrcmVkO1xyXG59XHJcbi5pdGVtIHtcclxuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XHJcbiAgZm9udC1zaXplOiBzbWFsbGVyO1xyXG4gIGNvbG9yOiAjOTEwMGNkO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCwgb25EZXN0cm95IH0gZnJvbSAnc3ZlbHRlJztcclxuY29uc3QgX2MgPSAnY29sb3I6IGJsdWV2aW9sZXQnXHJcblxyXG5sZXQga2V5cyA9IFtdXHJcbiQ6IF9rZXlzID0ga2V5c1xyXG5cclxuZnVuY3Rpb24gcmVsb2FkS2V5cygpIHtcclxuICBjb25zb2xlLmxvZygnJWNSZWxvYWQgaG90a2V5cy4nLCBfYyk7XHJcbiAgY29uc3Qge21hY3Jva2V5czogbWtleX0gPSB3aW5kb3cubWl0bVxyXG4gIGtleXMgPSBbXVxyXG4gIGZvciAoY29uc3QgaWQgaW4gbWtleSkge1xyXG4gICAga2V5cy5wdXNoKHtpZCwgdGl0bGU6IG1rZXlbaWRdLl90aXRsZX0pXHJcbiAgfVxyXG59XHJcblxyXG5sZXQgb2JzZXJ2ZXJcclxub25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgcXJ5ID0gJy5taXRtLWNvbnRhaW5lci5jZW50ZXInXHJcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXJ5KVxyXG4gIGNvbnN0IG5vZGVWaXNpYmxlID0gb2JzID0+IHtcclxuICAgIGlmIChub2RlLmF0dHJpYnV0ZXMuc3R5bGUpIHtcclxuICAgICAgcmVsb2FkS2V5cygpXHJcbiAgICB9XHJcbiAgfVxyXG4gIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobm9kZVZpc2libGUpO1xyXG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2F0dHJpYnV0ZXM6IHRydWV9KVxyXG4gIHNldFRpbWVvdXQocmVsb2FkS2V5cywgMTAwMClcclxufSk7XHJcblxyXG5vbkRlc3Ryb3koKCkgPT4ge1xyXG4gIGlmIChvYnNlcnZlcikge1xyXG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXHJcbiAgICBvYnNlcnZlciA9IHVuZGVmaW5lZFxyXG4gIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVDbGljayhlKSB7XHJcbiAgY29uc3Qga2V5ID0gZS50YXJnZXQuZGF0YXNldC5pZFxyXG4gIGNvbnN0IGZuID0gbWl0bS5tYWNyb2tleXNba2V5XVxyXG4gIGxldCBbdHlwLCAuLi5hcnJdID0ga2V5LnNwbGl0KCc6JylcclxuICBjb25zdCBvcHQgPSB7fVxyXG4gIGlmICh0eXA9PT0na2V5Jykge1xyXG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcclxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXHJcbiAgICBsZXQga1xyXG4gICAgaWYgKHFjdGwpIHtcclxuICAgICAgb3B0LmFsdEtleSA9IHRydWVcclxuICAgICAgayA9IHFjdGxbMV0uc3Vic3RyKC0xKVxyXG4gICAgfSBlbHNlIGlmIChxYWx0KSB7XHJcbiAgICAgIGsuY3RybEtleSA9IHRydWVcclxuICAgICAgayA9IHFhbHRbMV0uc3Vic3RyKC0xKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3B0LmFsdEtleSA9IHRydWVcclxuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXHJcbiAgICAgIGsgPSBhcnIucG9wKCkuc3Vic3RyKC0xKVxyXG4gICAgfVxyXG4gICAgb3B0LnNoaWZ0S2V5ID0gZS5zaGlmdEtleVxyXG4gICAgb3B0LmNvZGUgPSBgS2V5JHtrLnRvVXBwZXJDYXNlKCl9YFxyXG4gICAgb3B0LmtleSA9IG1pdG0uZm4uY29kZVRvQ2hhcihvcHQpXHJcbiAgfSBlbHNlIGlmICh0eXA9PT0nY29kZScpIHtcclxuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXHJcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxyXG4gICAgaWYgKHFjdGwpIHtcclxuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXHJcbiAgICAgIGFyciA9IHFjdGxbMV0uc3BsaXQoJzonKVxyXG4gICAgfSBlbHNlIGlmIChxYWx0KSB7XHJcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXHJcbiAgICAgIGFyciA9IHFhbHRbMV0uc3BsaXQoJzonKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXHJcbiAgICAgIG9wdC5hbHRLZXkgID0gdHJ1ZVxyXG4gICAgfVxyXG4gICAgb3B0LmNvZGUgPSBhcnIucG9wKClcclxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcclxuICAgIG9wdC5rZXkgPSBtaXRtLmZuLmNvZGVUb0NoYXIob3B0KVxyXG4gIH1cclxuICBpZiAoZm4pIHtcclxuICAgIGNvbnN0IG1hY3JvID0gZm4obmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBvcHQpKVxyXG4gICAgbWl0bS5mbi5tYWNyb0F1dG9tYXRpb24obWFjcm8pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24ga3RvU2hvdyhrKSB7XHJcbiAgcmV0dXJuIGsuc3BsaXQoJycpLm1hcCh4PT5gJHt4fWApLmpvaW4oJ+KcpycpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGtjb2RlKG9iaikge1xyXG4gIGNvbnN0IGtleSA9IG9iai5pZFxyXG4gIGNvbnN0IHtjb2RlVG9DaGFyOiBjaGFyfSA9IG1pdG0uZm5cclxuICBsZXQgW3R5cCwgLi4uYXJyXSA9IGtleS5zcGxpdCgnOicpXHJcbiAgY29uc3Qgb3B0ID0ge31cclxuICBsZXQgbXNnXHJcbiAgaWYgKHR5cD09PSdrZXknKSB7XHJcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxyXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcclxuICAgIGlmICAgICAgKHFjdGwpIHsgbXNnID0gYGN0bCAuIC4uLiDih74gJHtrdG9TaG93KHFjdGxbMV0pfWAgIH1cclxuICAgIGVsc2UgaWYgKHFhbHQpIHsgbXNnID0gYGFsdCAuIC4uLiDih74gJHtrdG9TaG93KHFhbHRbMV0pfWAgIH1cclxuICAgIGVsc2UgICAgICAgICAgIHsgbXNnID0gYGN0bCArIGFsdCDih74gJHtrdG9TaG93KGFyci5wb3AoKSl9YH1cclxuICB9IGVsc2UgaWYgKHR5cD09PSdjb2RlJykge1xyXG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcclxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXHJcbiAgICBpZiAgICAgIChxY3RsKSB7IG1zZyA9ICdjdGwgLiAuLi4g4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KHFjdGxbMV0pfVxyXG4gICAgZWxzZSBpZiAocWFsdCkgeyBtc2cgPSAnYWx0IC4gLi4uIOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhxYWx0WzFdKX1cclxuICAgIGVsc2UgICAgICAgICAgIHsgbXNnID0gJ2N0bCArIGFsdCDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3coYXJyLmpvaW4oJzonKSl9XHJcbiAgfVxyXG4gIHJldHVybiBtc2dcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XHJcbiAgPGI+SG90LWtleXM6PC9iPlxyXG4gIDx0YWJsZT5cclxuICAgIHsjZWFjaCBfa2V5cyBhcyBvYmosaX1cclxuICAgICAgPHRyPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cIm5vXCI+e2krMX08L3RkPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cImtjb2RlXCIgZGF0YS1pZD17b2JqLmlkfSBvbjpjbGljaz17aGFuZGxlQ2xpY2t9PlxyXG4gICAgICAgICAge2tjb2RlKG9iail9XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgICA8dGQgY2xhc3M9XCJ0aXRsZVwiPntvYmoudGl0bGV9PC90ZD5cclxuICAgICAgPC90cj5cclxuICAgIHsvZWFjaH1cclxuICA8L3RhYmxlPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+XHJcbiAgLnZib3gge1xyXG4gICAgY29sb3I6Ymx1ZTtcclxuICAgIGxlZnQ6IDA7XHJcbiAgICByaWdodDogMDtcclxuICB9XHJcbiAgdGFibGUge1xyXG4gICAgd2lkdGg6IDEwMCU7XHJcbiAgICBjb2xvcjogbWFyb29uO1xyXG4gICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcclxuICAgIHRyOmhvdmVyIHtcclxuICAgICAgYmFja2dyb3VuZDogcmdiYSgxOTksIDE2NiwgMTE2LCAwLjQ1Mik7XHJcbiAgICAgIC5rY29kZSB7XHJcbiAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XHJcbiAgICAgICAgJjpob3ZlciB7XHJcbiAgICAgICAgICBjb2xvcjogcmVkO1xyXG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGQge1xyXG4gICAgICBmb250LXNpemU6IHNtYWxsO1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xyXG4gICAgICBwYWRkaW5nLWxlZnQ6IDVweDtcclxuICAgIH1cclxuICAgIC5ubyB7XHJcbiAgICAgIHBhZGRpbmc6IDA7XHJcbiAgICAgIHdpZHRoOiAyNXB4O1xyXG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICB9XHJcbiAgICAua2NvZGUge1xyXG4gICAgICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlO1xyXG4gICAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIH1cclxuICAgIC50aXRsZSB7XHJcbiAgICAgIGZvbnQtZmFtaWx5OiAnR2lsbCBTYW5zJywgJ0dpbGwgU2FucyBNVCcsIENhbGlicmksICdUcmVidWNoZXQgTVMnLCBzYW5zLXNlcmlmO1xyXG4gICAgICB3aWR0aDogNTAlO1xyXG4gICAgfVxyXG4gIH1cclxuPC9zdHlsZT4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gTm90ZTogVGhpcyByZWdleCBtYXRjaGVzIGV2ZW4gaW52YWxpZCBKU09OIHN0cmluZ3MsIGJ1dCBzaW5jZSB3ZeKAmXJlXG4vLyB3b3JraW5nIG9uIHRoZSBvdXRwdXQgb2YgYEpTT04uc3RyaW5naWZ5YCB3ZSBrbm93IHRoYXQgb25seSB2YWxpZCBzdHJpbmdzXG4vLyBhcmUgcHJlc2VudCAodW5sZXNzIHRoZSB1c2VyIHN1cHBsaWVkIGEgd2VpcmQgYG9wdGlvbnMuaW5kZW50YCBidXQgaW5cbi8vIHRoYXQgY2FzZSB3ZSBkb27igJl0IGNhcmUgc2luY2UgdGhlIG91dHB1dCB3b3VsZCBiZSBpbnZhbGlkIGFueXdheSkuXG52YXIgc3RyaW5nT3JDaGFyID0gLyhcIig/OlteXFxcXFwiXXxcXFxcLikqXCIpfFs6LF0vZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdpZnkocGFzc2VkT2JqLCBvcHRpb25zKSB7XG4gIHZhciBpbmRlbnQsIG1heExlbmd0aCwgcmVwbGFjZXI7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGluZGVudCA9IEpTT04uc3RyaW5naWZ5KFxuICAgIFsxXSxcbiAgICB1bmRlZmluZWQsXG4gICAgb3B0aW9ucy5pbmRlbnQgPT09IHVuZGVmaW5lZCA/IDIgOiBvcHRpb25zLmluZGVudFxuICApLnNsaWNlKDIsIC0zKTtcbiAgbWF4TGVuZ3RoID1cbiAgICBpbmRlbnQgPT09IFwiXCJcbiAgICAgID8gSW5maW5pdHlcbiAgICAgIDogb3B0aW9ucy5tYXhMZW5ndGggPT09IHVuZGVmaW5lZFxuICAgICAgPyA4MFxuICAgICAgOiBvcHRpb25zLm1heExlbmd0aDtcbiAgcmVwbGFjZXIgPSBvcHRpb25zLnJlcGxhY2VyO1xuXG4gIHJldHVybiAoZnVuY3Rpb24gX3N0cmluZ2lmeShvYmosIGN1cnJlbnRJbmRlbnQsIHJlc2VydmVkKSB7XG4gICAgLy8gcHJldHRpZXItaWdub3JlXG4gICAgdmFyIGVuZCwgaW5kZXgsIGl0ZW1zLCBrZXksIGtleVBhcnQsIGtleXMsIGxlbmd0aCwgbmV4dEluZGVudCwgcHJldHRpZmllZCwgc3RhcnQsIHN0cmluZywgdmFsdWU7XG5cbiAgICBpZiAob2JqICYmIHR5cGVvZiBvYmoudG9KU09OID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIG9iaiA9IG9iai50b0pTT04oKTtcbiAgICB9XG5cbiAgICBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShvYmosIHJlcGxhY2VyKTtcblxuICAgIGlmIChzdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBsZW5ndGggPSBtYXhMZW5ndGggLSBjdXJyZW50SW5kZW50Lmxlbmd0aCAtIHJlc2VydmVkO1xuXG4gICAgaWYgKHN0cmluZy5sZW5ndGggPD0gbGVuZ3RoKSB7XG4gICAgICBwcmV0dGlmaWVkID0gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIHN0cmluZ09yQ2hhcixcbiAgICAgICAgZnVuY3Rpb24gKG1hdGNoLCBzdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cmluZ0xpdGVyYWwgfHwgbWF0Y2ggKyBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChwcmV0dGlmaWVkLmxlbmd0aCA8PSBsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHByZXR0aWZpZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlcGxhY2VyICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2Uoc3RyaW5nKTtcbiAgICAgIHJlcGxhY2VyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmIG9iaiAhPT0gbnVsbCkge1xuICAgICAgbmV4dEluZGVudCA9IGN1cnJlbnRJbmRlbnQgKyBpbmRlbnQ7XG4gICAgICBpdGVtcyA9IFtdO1xuICAgICAgaW5kZXggPSAwO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIHN0YXJ0ID0gXCJbXCI7XG4gICAgICAgIGVuZCA9IFwiXVwiO1xuICAgICAgICBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBpdGVtcy5wdXNoKFxuICAgICAgICAgICAgX3N0cmluZ2lmeShvYmpbaW5kZXhdLCBuZXh0SW5kZW50LCBpbmRleCA9PT0gbGVuZ3RoIC0gMSA/IDAgOiAxKSB8fFxuICAgICAgICAgICAgICBcIm51bGxcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gXCJ7XCI7XG4gICAgICAgIGVuZCA9IFwifVwiO1xuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGtleSA9IGtleXNbaW5kZXhdO1xuICAgICAgICAgIGtleVBhcnQgPSBKU09OLnN0cmluZ2lmeShrZXkpICsgXCI6IFwiO1xuICAgICAgICAgIHZhbHVlID0gX3N0cmluZ2lmeShcbiAgICAgICAgICAgIG9ialtrZXldLFxuICAgICAgICAgICAgbmV4dEluZGVudCxcbiAgICAgICAgICAgIGtleVBhcnQubGVuZ3RoICsgKGluZGV4ID09PSBsZW5ndGggLSAxID8gMCA6IDEpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaXRlbXMucHVzaChrZXlQYXJ0ICsgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gW3N0YXJ0LCBpbmRlbnQgKyBpdGVtcy5qb2luKFwiLFxcblwiICsgbmV4dEluZGVudCksIGVuZF0uam9pbihcbiAgICAgICAgICBcIlxcblwiICsgY3VycmVudEluZGVudFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG4gIH0pKHBhc3NlZE9iaiwgXCJcIiwgMCk7XG59O1xuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHN0cmluZ2lmeSBmcm9tIFwianNvbi1zdHJpbmdpZnktcHJldHR5LWNvbXBhY3RcIjtcclxuXHJcbmV4cG9ydCBsZXQgZ2VuZXJhbCA9IHt9XHJcbmV4cG9ydCBsZXQganNvbiA9IHt9XHJcblxyXG5sZXQga2V5cyA9IE9iamVjdC5rZXlzKGpzb24pIFxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9c3YtaXRlbT5cclxueyNlYWNoIGtleXMgYXMga2V5fVxyXG48ZGV0YWlscyBjbGFzcz0nc3YtZGF0YSBzdi17a2V5fSBzdHtNYXRoLnRydW5jKGdlbmVyYWwuc3RhdHVzLzEwMCl9eCc+XHJcbiAgPHN1bW1hcnkgY2xhc3M9c3YtdGl0bGU+e2tleX08L3N1bW1hcnk+XHJcbiAgPHByZSBjbGFzcz1zdi17Z2VuZXJhbC5leHR9PntzdHJpbmdpZnkoanNvbltrZXldKX08L3ByZT5cclxuPC9kZXRhaWxzPlxyXG57L2VhY2h9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XHJcbi5zdi1pdGVtIHtcclxuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XHJcbn1cclxuLnN2LXRpdGxlLCBwcmUge1xyXG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XHJcbiAgZm9udC1zaXplOiBzbWFsbDtcclxuICBtYXJnaW46IDA7XHJcbiAgJi5zdi1odG1sIHtcclxuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcclxuICB9XHJcbn1cclxuLnN2LXRpdGxlOmhvdmVyIHtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcclxufVxyXG4uc3YtcmVzcEJvZHkge1xyXG4gIGNvbG9yOiBibHVldmlvbGV0O1xyXG4gIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgJjppcyguc3Q0eCwuc3Q1eCkge1xyXG4gICAgY29sb3I6IHJlZDtcclxuICB9XHJcbn1cclxuLnN2LXJlcXNCb2R5IHtcclxuICBjb2xvcjogbWVkaXVtdmlvbGV0cmVkO1xyXG4gIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuICBpbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xyXG4gIGltcG9ydCBKc29uIGZyb20gJy4vSnNvbi5zdmVsdGUnO1xyXG5cclxuICBsZXQgbHN0ID0ge31cclxuICBsZXQgb2JqID0ge3Jvd3M6IFtdfVxyXG4gIGxldCBxdWVyeT0gZmFsc2U7XHJcbiAgbGV0IHBhdGggPSB0cnVlO1xyXG4gIGxldCBib2R5ID0gdHJ1ZTtcclxuICBcclxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHJvd3MgPSAod2luZG93LmlubmVySGVpZ2h0LTEwMCkvMTcuNVxyXG4gICAgY29uc29sZS5sb2coe3Jvd3N9KVxyXG4gICAgY29uc3QgX2xpbWl0XyA9IHJvd3NcclxuICAgIGNvbnN0IF9jb3VudF8gPSB7dG90YWw6J2lkJ31cclxuICAgIGNvbnN0IF9kaXN0aW5jdF8gPSBbJ3Nlc3Npb24nXVxyXG4gICAgY29uc3QgX3doZXJlXz0gJ2lkPjAgb3JkZXJieSBpZDpkJ1xyXG4gICAgb2JqID0gYXdhaXQgbWl0bS5mbi5zcWxMaXN0KHtfY291bnRfLCBfZGlzdGluY3RfLCBfd2hlcmVfLCBfbGltaXRffSwgJ2xvZycpXHJcbiAgICBvYmoucm93cy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICBsc3RbaXRlbS5zZXNzaW9uXSA9IFtdXHJcbiAgICB9KTtcclxuICB9KVxyXG5cclxuICBhc3luYyBmdW5jdGlvbiBkZXRhaWxDbGljayhlKSB7XHJcbiAgICBjb25zdCBzcyA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnNzXHJcbiAgICBpZiAoIWxzdFtzc10/Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBvYmogPSBhd2FpdCBtaXRtLmZuLnNxbExpc3Qoe193aGVyZV86IGBzZXNzaW9uPSR7c3N9IG9yZGVyYnkgaWRgfSwgJ2xvZycpXHJcbiAgICAgIGxzdFtzc10gPSBvYmoucm93cy5tYXAoeCA9PiB7XHJcbiAgICAgICAgeC5tZXRhID0gSlNPTi5wYXJzZSh4Lm1ldGEpXHJcbiAgICAgICAgaWYgKHgubWV0YS5nZW5lcmFsLmV4dD09PSdqc29uJykge1xyXG4gICAgICAgICAgeC5kYXRhID0gSlNPTi5wYXJzZSh4LmRhdGEpXHJcbiAgICAgICAgICBkZWxldGUgeC5kYXRhLmdlbmVyYWxcclxuICAgICAgICAgIGlmICh4Lm1ldGEuZ2VuZXJhbC5tZXRob2Q9PT0nR0VUJykge1xyXG4gICAgICAgICAgICBkZWxldGUgeC5kYXRhLnJlcXNCb2R5XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB4XHJcbiAgICAgIH0pXHJcbiAgICAgIGNvbnNvbGUubG9nKHNzLCBvYmoucm93cylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIGV4cENsaWNrKGUpIHtcclxuICAgIGlmIChib2R5KSB7XHJcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBlLmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBpZiAoZGV0YWlscy5hdHRyaWJ1dGVzLm9wZW4pIHtcclxuICAgICAgICAgIGRldGFpbHMuY2hpbGRyZW5bMl0uc2V0QXR0cmlidXRlKCdvcGVuJywnJylcclxuICAgICAgICAgIGNvbnN0IGFycjEgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1HRVQsLm10LURFTEVURSkgZGV0YWlsczppcyguc3YtcmVzcEJvZHksLnN2LXJlc3BIZWFkZXIpJylcclxuICAgICAgICAgIGNvbnN0IGFycjIgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1QVVQsLm10LVBPU1QpIGRldGFpbHM6aXMoLnN2LXJlcXNCb2R5KScpXHJcbiAgICAgICAgICBjb25zdCBhcnIzID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtUkVESVJFQ1QpIGRldGFpbHM6aXMoLnN2LXJlc3BIZWFkZXIpJylcclxuICAgICAgICAgIGNvbnN0IGFycjQgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1FUlJPUikgZGV0YWlsczppcyguc3YtcmVzcEJvZHkpJylcclxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIxKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cclxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIyKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cclxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIzKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cclxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnI0KSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaG9zdCh1cmwpIHtcclxuICAgIGNvbnN0IG9iaiA9IG5ldyBVUkwodXJsKVxyXG4gICAgbGV0IG1zZyA9IHBhdGggPyBvYmoucGF0aG5hbWUgOiBvYmoub3JpZ2luICsgb2JqLnBhdGhuYW1lXHJcbiAgICBpZiAocXVlcnkpIHtcclxuICAgICAgbXNnICs9IG9iai5zZWFyY2hcclxuICAgIH1cclxuICAgIHJldHVybiBtc2cubGVuZ3RoPjkwID8gbXNnLnNsaWNlKDAsIDkwKSsnLi4uJyA6IG1zZ1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZXJyX21ldGhvZChpMikge1xyXG4gICAgY29uc3Qge21ldGhvZCwgc3RhdHVzfSA9IGkyLm1ldGEuZ2VuZXJhbFxyXG4gICAgY29uc3Qgc3QgPSBNYXRoLnRydW5jKHN0YXR1cy8xMDApXHJcbiAgICBpZiAoc3Q9PT0zKSB7XHJcbiAgICAgIHJldHVybiAnbXQtUkVESVJFQ1QnXHJcbiAgICB9IGVsc2UgaWYgKHN0PjMpIHtcclxuICAgICAgcmV0dXJuICdtdC1FUlJPUidcclxuICAgIH1cclxuICAgIHJldHVybiBgbXQtJHttZXRob2R9YCBcclxuICB9XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdj5cclxuPGI+U3FsaXRlIExvZ3MhPC9iPlxyXG48bGFiZWwgZm9yPXN2LWJvZHk+XHJcbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3YtYm9keSBiaW5kOmNoZWNrZWQ9e2JvZHl9IC8+ZXhwLWJvZHlcclxuPC9sYWJlbD5cclxuPGxhYmVsIGZvcj1zdi1uby1ob3N0PlxyXG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LW5vLWhvc3QgYmluZDpjaGVja2VkPXtwYXRofSAvPm5vLWhvc3RcclxuPC9sYWJlbD5cclxuPGxhYmVsIGZvcj1zdi1xdWVyeT5cclxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1xdWVyeSBiaW5kOmNoZWNrZWQ9e3F1ZXJ5fSAvPnF1ZXJ5XHJcbjwvbGFiZWw+XHJcbnsjZWFjaCBvYmoucm93cyBhcyBpdGVtfVxyXG4gIDxkZXRhaWxzIGNsYXNzPXN2LXNlc3Npb24gZGF0YS1zcz17aXRlbS5zZXNzaW9ufSBvbjpjbGljaz17ZGV0YWlsQ2xpY2t9PlxyXG4gICAgPHN1bW1hcnkgY2xhc3M9c3YtbWFpbj5cclxuICAgICAge2l0ZW0uc2Vzc2lvbn08c3BhbiBjbGFzcz1zdi10b3RhbD4oe2l0ZW0udG90YWx9KTwvc3Bhbj5cclxuICAgIDwvc3VtbWFyeT5cclxuICAgIHsjaWYgbHN0W2l0ZW0uc2Vzc2lvbl0ubGVuZ3RofVxyXG4gICAgICB7I2VhY2ggbHN0W2l0ZW0uc2Vzc2lvbl0gYXMgaTJ9XHJcbiAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvd3MnPlxyXG4gICAgICAgICAgPHN1bW1hcnkgXHJcbiAgICAgICAgICBkYXRhLWlkPXtpMi5pZH1cclxuICAgICAgICAgIGRhdGEtc3M9e2l0ZW0uc2Vzc2lvbn1cclxuICAgICAgICAgIGNsYXNzPSdzdi10aXRsZSBzdHtNYXRoLnRydW5jKGkyLm1ldGEuZ2VuZXJhbC5zdGF0dXMvMTAwKX14J1xyXG4gICAgICAgICAgb246Y2xpY2s9e2V4cENsaWNrfT5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5zdGF0dXN9PntpMi5tZXRhLmdlbmVyYWwuc3RhdHVzfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5tZXRob2R9PntpMi5tZXRhLmdlbmVyYWwubWV0aG9kLnBhZEVuZCg0LCcuJyl9PC9zcGFuPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1zdi17cGF0aD8ncGF0aCc6J2Z1bGxwYXRoJ30+e2hvc3QoaTIudXJsLCBwYXRoLCBxdWVyeSl9PC9zcGFuPlxyXG4gICAgICAgICAgPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvdy1kYXRhIHN2LWhlYWRlcic+XHJcbiAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzPSdzdi10aXRsZSBzdi1oZWFkZXInPmhlYWRlcjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgPEpzb24ganNvbj17aTIubWV0YX0vPlxyXG4gICAgICAgICAgPC9kZXRhaWxzPlxyXG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvdy1kYXRhIHN2LWNvbnRlbnQge2Vycl9tZXRob2QoaTIpfSc+XHJcbiAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzPSdzdi10aXRsZSBzdi1jb250ZW50Jz5jb250ZW50PC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICB7I2lmIGkyLm1ldGEuZ2VuZXJhbC5leHQ9PT0nanNvbid9XHJcbiAgICAgICAgICAgICAgPEpzb24ganNvbj17aTIuZGF0YX0gZ2VuZXJhbD17aTIubWV0YS5nZW5lcmFsfSAvPlxyXG4gICAgICAgICAgICB7OmVsc2V9XHJcbiAgICAgICAgICAgICAgPHByZSBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLmV4dH0+e2kyLmRhdGF9PC9wcmU+XHJcbiAgICAgICAgICAgIHsvaWZ9XHJcbiAgICAgICAgICA8L2RldGFpbHM+XHJcbiAgICAgICAgPC9kZXRhaWxzPiAgICAgICAgXHJcbiAgICAgIHsvZWFjaH1cclxuICAgIHs6ZWxzZX1cclxuICAgICAgbG9hZGluZy0xLi4uICAgICAgICAgIFxyXG4gICAgey9pZn1cclxuICA8L2RldGFpbHM+XHJcbnsvZWFjaH1cclxuPC9kaXY+XHJcblxyXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cclxuW3R5cGU9Y2hlY2tib3hdIHtcclxuICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG59XHJcbi5zdi1zZXNzaW9uIHtcclxuICBzdW1tYXJ5IHtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgICYuc3YtbWFpbjpob3ZlciB7XHJcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4uc3Ytcm93cyB7XHJcbiAgcGFkZGluZy1sZWZ0OiAxNnB4O1xyXG59XHJcbi5zdi1yb3ctZGF0YSB7XHJcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xyXG59XHJcbi5zdi10b3RhbCB7XHJcbiAgZm9udC1zaXplOiB4LXNtYWxsO1xyXG4gIHZlcnRpY2FsLWFsaWduOiB0ZXh0LXRvcDtcclxuICBjb2xvcjogZGFya21hZ2VudGE7XHJcbn1cclxuLnN2LXRpdGxlLCAuc3Ytcm93LWRhdGEgcHJlIHtcclxuICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gIGZvbnQtc2l6ZTogc21hbGw7XHJcbiAgbWFyZ2luOiAwO1xyXG4gICYuc3YtaHRtbCB7XHJcbiAgICBmb250LXNpemU6IHgtc21hbGw7XHJcbiAgfVxyXG59XHJcbnN1bW1hcnk6aXMoLnN0MngpIHtcclxuICBjb2xvcjojMzAwNDdlO1xyXG59XHJcbnN1bW1hcnk6aXMoLnN0M3gsLnN0NHgsLnN0NXgpIHtcclxuICBjb2xvcjogI2I0MDAwMDtcclxufVxyXG4uc3YtUE9TVCwuc3YtUFVUIHtcclxuICBjb2xvcjogY3JpbXNvbjtcclxufVxyXG4uc3YtREVMRVRFIHtcclxuICBjb2xvcjogcmVkXHJcbn1cclxuLnN2LXBhdGgge1xyXG4gIGNvbG9yOiBkYXJrZ3JlZW47XHJcbn1cclxuLnN2LWZ1bGxwYXRoIHtcclxuICBjb2xvcjogZGFya21hZ2VudGE7XHJcbn1cclxuLnN2LXRpdGxlOmhvdmVyIHtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcclxufVxyXG48L3N0eWxlPlxyXG4iLCIvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxyXG5jb25zdCB7ZGVmYXVsdDogQ3NwaGVhZGVyfSA9IHJlcXVpcmUoJy4vQ3NwaGVhZGVyLnN2ZWx0ZScpXHJcbmNvbnN0IHtkZWZhdWx0OiBIb3RrZXlzfSAgID0gcmVxdWlyZSgnLi9Ib3RrZXlzLnN2ZWx0ZScpXHJcbmNvbnN0IHtkZWZhdWx0OiBTcWxpdGV9ICAgID0gcmVxdWlyZSgnLi9zcWxpdGUuc3ZlbHRlJylcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgQ3NwaGVhZGVyLFxyXG4gIEhvdGtleXMsXHJcbiAgU3FsaXRlXHJcbn1cclxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19wb3N0bWVzc2FnZSA9IHJlcXVpcmUoJy4vX3dzX3Bvc3RtZXNzYWdlJylcclxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXHJcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpXHJcbmNvbnN0IF93c19sb2NhdGlvbiA9IHJlcXVpcmUoJy4vX3dzX2xvY2F0aW9uJylcclxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxyXG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKVxyXG5jb25zdCBfd3NfY3NwRXJyID0gcmVxdWlyZSgnLi9fd3NfY3NwLWVycicpXHJcbmNvbnN0IF93c19tYWNyb3MgPSByZXF1aXJlKCcuL193c19tYWNyb3MnKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogcmVkJ1xyXG5cclxuX3dzX3Bvc3RtZXNzYWdlKClcclxuX3dzX2luaXRTb2NrZXQoKVxyXG5fd3Nfc2NyZWVuc2hvdCgpXHJcbl93c19sb2NhdGlvbigpXHJcbl93c19vYnNlcnZlcigpXHJcbl93c19nZW5lcmFsKClcclxuX3dzX2NzcEVycigpXHJcbl93c19tYWNyb3MoKVxyXG5jb25zb2xlLmxvZygnJWNXczogd3MtY2xpZW50IGxvYWRlZC4uLicsIF9jKVxyXG53aW5kb3cubWl0bS5zdmVsdGUgPSByZXF1aXJlKCcuLi9zdmVsdGUnKVxyXG4iXSwibmFtZXMiOlsiX2MiLCJzcWxpdGUiLCJyZXF1aXJlJCQwIiwicGxheSIsImxvY2F0aW9uIiwiaW5pdCIsInN2ZWx0ZSIsImNzcEluZm8iLCJjc3BBcnIiLCJjc3BGZXRjaCIsImNzcEVBdHRyIiwic3RyaW5naWZ5Il0sIm1hcHBpbmdzIjoiOzs7O0VBQ0EsbUJBQWMsR0FBRyxNQUFNO0VBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0VBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7RUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztFQUM3RixLQUFLO0VBQ0wsR0FBRztFQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDO0VBQzNEOztFQ1JBLE1BQU1BLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7RUFDQSxjQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLElBQUksVUFBUztFQUNmLEVBQUUsT0FBTztFQUNUO0VBQ0EsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO0VBQ3JCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUM7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aEIsRUFBRSxNQUFNLEtBQUssR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsU0FBUyxFQUFFLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFDO0FBQ0Q7RUFDQSxNQUFNLE1BQU0sR0FBRztFQUNmLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsRUFBRSxFQUFFLEdBQUc7RUFDVCxFQUFDO0FBQ0Q7RUFDQSxNQUFNLEtBQUssR0FBRztFQUNkLEVBQUUsR0FBRyxNQUFNO0VBQ1gsRUFBRSxLQUFLLEVBQUUsT0FBTztFQUNoQixFQUFFLFFBQVEsRUFBRSxNQUFNO0VBQ2xCLEVBQUUsU0FBUyxFQUFFLElBQUk7RUFDakIsRUFBRSxNQUFNLEVBQUUsS0FBSztFQUNmLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLEdBQUcsRUFBRSxLQUFLO0VBQ1osRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEdBQUcsRUFBRSxLQUFLO0VB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QyxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztFQUMvQyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7RUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQy9DLElBQUc7QUFDSDtFQUNBO0VBQ0E7RUFDQSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsS0FBSztFQUM3QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUU7RUFDckMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQzlDLElBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUs7RUFDNUMsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0VBQ3BDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztFQUM1QyxJQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztFQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtFQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDM0MsSUFBRztB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
