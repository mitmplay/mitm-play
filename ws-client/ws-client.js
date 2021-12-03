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
  const styleLeft  = 'top: -2px; left:  3px;';
  const styleTopR  = 'top:  0px; right: 3px;';
  const styleRight = 'top: 14px; right: 3px;';
  const buttonStyle= '';
  const style = `
.mitm-container {
  z-index: 99999;
  position: fixed;
  font-size: 12px;
  line-height: 14px;
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
  			attr_dev(td0, "class", "no svelte-1e9gn7l");
  			add_location(td0, file$2, 116, 8, 2981);
  			attr_dev(td1, "class", "kcode svelte-1e9gn7l");
  			attr_dev(td1, "data-id", td1_data_id_value = /*obj*/ ctx[4].id);
  			add_location(td1, file$2, 117, 8, 3016);
  			attr_dev(td2, "class", "title svelte-1e9gn7l");
  			add_location(td2, file$2, 120, 8, 3123);
  			attr_dev(tr, "class", "svelte-1e9gn7l");
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
  			attr_dev(table, "class", "svelte-1e9gn7l");
  			add_location(table, file$2, 113, 2, 2924);
  			attr_dev(div, "class", "vbox svelte-1e9gn7l");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfc3JjL193c19wb3N0bWVzc2FnZS5qcyIsIl9zcmMvX3dzX2NsaWVudC5qcyIsIl9zcmMvX3dzX21zZy1wYXJzZXIuanMiLCJfc3JjL193c19pbi1pZnJhbWUuanMiLCJfc3JjL193c192ZW5kb3IuanMiLCJfc3JjL193c19pbml0LXNvY2tldC5qcyIsIl9zcmMvX3NjcmVlbnNob3QuanMiLCJfc3JjL193c19uYW1lc3BhY2UuanMiLCJfc3JjL193c19zY3JlZW5zaG90LmpzIiwiX3NyYy9fa2V5Ym9hcmQuanMiLCJfc3JjL193c19wbGF5LmpzIiwiX3NyYy9fd3NfbG9jYXRpb24uanMiLCJfc3JjL193c19kZWJvdW5jZS5qcyIsIl9zcmMvX3dzX3JvdXRlLmpzIiwiX3NyYy9fd3Nfb2JzZXJ2ZXIuanMiLCJfc3JjL193c19nZW5lcmFsLmpzIiwiX3NyYy9fd3NfY3NwLWVyci5qcyIsIl9zcmMvX3dzX21hY3Jvcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwic3ZlbHRlL0NzcGRpcmVjdGl2ZS5qcyIsInN2ZWx0ZS9Dc3BoZWFkZXIuc3ZlbHRlIiwic3ZlbHRlL0hvdGtleXMuc3ZlbHRlIiwiLi4vbm9kZV9tb2R1bGVzL2pzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0L2luZGV4LmpzIiwic3ZlbHRlL0pzb24uc3ZlbHRlIiwic3ZlbHRlL3NxbGl0ZS5zdmVsdGUiLCJzdmVsdGUvaW5kZXguanMiLCJfc3JjL3dzLWNsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UgKGV2ZW50KSB7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxyXG4gICAgfVxyXG4gIH1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcclxufVxyXG4iLCJjb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCB3aW5kb3dSZWZcclxuICByZXR1cm4ge1xyXG4gICAgLy8gZXg6IHdzX19oZWxwKClcclxuICAgIF9oZWxwICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fcGluZyhcInRoZXJlXCIpXHJcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXHJcbiAgICBfb3BlbiAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgZmVhdHVyZXMgPSAnZGlyZWN0b3JpZXM9MCx0aXRsZWJhcj0wLHRvb2xiYXI9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCx3aWR0aD04MDAsaGVpZ2h0PTYwMCdcclxuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxyXG4gICAgICB3aW5kb3dSZWYuYmx1cigpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxyXG4gICAgX3N0eWxlICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zdCB7IHEsIGNzcyB9ID0gZGF0YVxyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXHJcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxyXG4gICAgICApXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9zYXZlVGFncyAoeyByb3V0ZXMgfSkge1xyXG4gICAgICBpZiAoIWxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IFVwZGF0ZSByb3V0ZXMnLCBfYylcclxuICAgICAgICB3aW5kb3cubWl0bS5yb3V0ZXMgPSByb3V0ZXNcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfZmlsZXMgKHsgZGF0YSwgdHlwIH0pIHtcclxuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgY29uc29sZS53YXJuKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcclxuICAgICAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cclxuICAgICAgICovXHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldICsgJycpXHJcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfc2V0Q2xpZW50ICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxyXG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcclxuY29uc3QgX3dzX3djY21kID0gX3dzX2NsaWVudCgpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XHJcbiAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcclxuICAgIGlmIChtc2cubGVuZ3RoID4gNDApIHtcclxuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzYCcsIG1zZylcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3QgYXJyID0gbXNnLnJlcGxhY2UoL1xccyskLywgJycpLm1hdGNoKC9eICooW1xcdzpdKykgKihcXHsuKikvKVxyXG4gIGlmIChhcnIpIHtcclxuICAgIGxldCBbLCBjbWQsIGpzb25dID0gYXJyXHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGpzb24sIGVycm9yKVxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xyXG4gICAgICBjb25zdCBoYW5kbGVyID0gd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF1cclxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXHJcbiAgICB9IGVsc2UgaWYgKF93c193Y2NtZFtjbWRdKSB7XHJcbiAgICAgIF93c193Y2NtZFtjbWRdLmNhbGwoZXZlbnQsIGpzb24pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCBpZnJtXHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmcm0gPSB0cnVlXHJcbiAgfVxyXG4gIHJldHVybiBpZnJtID8gJ2lmcmFtZScgOiAnd2luZG93J1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgdmVuZG9yIH0gPSBuYXZpZ2F0b3JcclxuICBjb25zdCBicm93c2VyID0ge1xyXG4gICAgJyc6ICdmaXJlZm94JyxcclxuICAgICdHb29nbGUgSW5jLic6ICdjaHJvbWl1bScsXHJcbiAgICAnQXBwbGUgQ29tcHV0ZXIsIEluYy4nOiAnd2Via2l0J1xyXG4gIH1bdmVuZG9yXVxyXG4gIHJldHVybiBicm93c2VyXHJcbn1cclxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX21zZ1BhcnNlciA9IHJlcXVpcmUoJy4vX3dzX21zZy1wYXJzZXInKVxyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3Qge19fYXJncywgX19mbGFnfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZuID0gd2luZG93Ll93c19jb25uZWN0W2tleV1cclxuICAgICAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kID0gdHJ1ZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxyXG4gICAgICAgIGZuKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxyXG4gICAgd2luZG93Ll93c19jb25uZWN0ZWQgPSB0cnVlXHJcblxyXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGlmICghd2luZG93Ll93c19jb25uZWN0ZWRfc2VuZCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXHJcbiAgICAgICAgd3Nfc2VuZCgpXHJcbiAgICAgIH1cclxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXHJcbiAgfVxyXG5cclxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBjbG9zZSBjb25uZWN0aW9uJywgX2MpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKF9fZmxhZ1snb24tbWVzc2FnZSddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBvbi1tZXNzYWdlOicsIF9jLCBlLmRhdGEpXHJcbiAgICB9XHJcbiAgICBfd3NfbXNnUGFyc2VyKGUsIGUuZGF0YSlcclxuICB9XHJcbiAgXHJcbiAgY29uc3QgY29ubmVjdCA9IF9fYXJncy5ub3NvY2tldD09PXVuZGVmaW5lZFxyXG4gIGlmIChjb25uZWN0IHx8ICh3aW5kb3cuY2hyb21lICYmIGNocm9tZS50YWJzKSkge1xyXG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcclxuICAgIGNvbnN0IHByZSA9IHZlbmRvciA/ICd3cycgOiAnd3NzJ1xyXG4gICAgY29uc3QgcHJ0ID0gdmVuZG9yID8gJzMwMDInIDogJzMwMDEnXHJcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICAgIGxldCB3c1xyXG4gICAgdHJ5IHtcclxuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxyXG4gICAgfVxyXG4gICAgY29uc29sZS50aW1lKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzID0gd3NcclxuICBcclxuICAgIHdzLm9ub3BlbiA9IG9ub3BlblxyXG4gICAgd3Mub25jbG9zZSA9IG9uY2xvc2VcclxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXHJcbiAgfVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXHJcbiAgfVxyXG59XHJcbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XHJcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxyXG4gIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgICB9XHJcbiAgICAgICAgZmV0Y2goJy9taXRtLXBsYXkvc2NyZW5zaG90Lmpzb24nLCBjb25maWcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmVzb2x2ZShyZXNwb25zZS5qc29uKCkpfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHJlamVjdChlcnJvcilcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywganNvbiwgcmVzb2x2ZSlcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICByZWplY3QoZXJyb3IpXHJcbiAgICAgIH1cclxuICAgIH0pICBcclxuICB9XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vZywgJ1teLl0qJykpKSkge1xyXG4gICAgICBuYW1lc3BhY2UgPSBrZXlcclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5hbWVzcGFjZVxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgbWl0bSAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXHJcbiAgICB9XHJcbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgYnJvd3NlciB9XHJcbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXHJcbiAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcclxuICAgICAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXRcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgYWN0ID0gd2luZG93Lm1pdG0uc2NyZWVuc2hvdFxyXG4gICAgICAgICAgaWYgKGFjdCkge1xyXG4gICAgICAgICAgICBhY3QuY2xpY2soKVxyXG4gICAgICAgICAgICBhY3QgPSB1bmRlZmluZWRcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBkZWxheSBhY3Rpb24gdW5kZWZpbmVkJywgX2MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIGRlbGF5KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXZlbnRjbGljayhlKSB7XHJcbiAgbWl0bS5sYXN0RXZlbnQgPSBlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50Y2xpY2spXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG4iLCJjb25zdCBrY29kZTEgPSB7XHJcbiAgQmFja3F1b3RlICAgOiAnYCcsXHJcbiAgQnJhY2tldExlZnQgOiAnWycsXHJcbiAgQnJhY2tldFJpZ2h0OiAnXScsXHJcbiAgQmFja3NsYXNoOiAnXFxcXCcsXHJcbiAgQ29tbWEgICAgOiAnLCcsXHJcbiAgUGVyaW9kICAgOiAnLicsXHJcbiAgUXVvdGUgICAgOiBcIidcIixcclxuICBTZW1pY29sb246ICc7JyxcclxuICBTbGFzaCAgICA6ICcvJyxcclxuICBTcGFjZSAgICA6ICcgJyxcclxuICBNaW51cyAgICA6ICctJyxcclxuICBFcXVhbCAgICA6ICc9JyxcclxufVxyXG5cclxuY29uc3Qga2NvZGUyID0ge1xyXG4gIEJhY2txdW90ZSAgIDogJ34nLFxyXG4gIEJyYWNrZXRMZWZ0IDogJ3snLFxyXG4gIEJyYWNrZXRSaWdodDogJ30nLFxyXG4gIEJhY2tzbGFzaDogJ3wnLFxyXG4gIENvbW1hICAgIDogJzwnLFxyXG4gIFBlcmlvZCAgIDogJz4nLFxyXG4gIFF1b3RlICAgIDogJ1wiJyxcclxuICBTZW1pY29sb246ICc6JyxcclxuICBTbGFzaCAgICA6ICc/JyxcclxuICBTcGFjZSAgICA6ICcgJyxcclxuICBNaW51cyAgICA6ICdfJyxcclxuICBFcXVhbCAgICA6ICcrJyxcclxufVxyXG5cclxuY29uc3Qga2NvZGUzID0ge1xyXG4gIDE6ICchJyxcclxuICAyOiAnQCcsXHJcbiAgMzogJyMnLFxyXG4gIDQ6ICckJyxcclxuICA1OiAnJScsXHJcbiAgNjogJ14nLFxyXG4gIDc6ICcmJyxcclxuICA4OiAnKicsXHJcbiAgOTogJygnLFxyXG4gIDEwOiAnKSdcclxufVxyXG5cclxuY29uc3Qga3Nob3cgPSB7XHJcbiAgLi4ua2NvZGUxLFxyXG4gIEVudGVyOiAnRW50ZXInLFxyXG4gIENhcHNMb2NrOiAnQ2FwcycsXHJcbiAgQmFja3NwYWNlOiAnQlMnLFxyXG4gIEVzY2FwZTogJ0VzYycsXHJcbiAgRGlnaXQxOiAnMScsXHJcbiAgRGlnaXQyOiAnMicsXHJcbiAgRGlnaXQzOiAnMycsXHJcbiAgRGlnaXQ0OiAnNCcsXHJcbiAgRGlnaXQ1OiAnNScsXHJcbiAgRGlnaXQ2OiAnNicsXHJcbiAgRGlnaXQ3OiAnNycsXHJcbiAgRGlnaXQ4OiAnOCcsXHJcbiAgRGlnaXQ5OiAnOScsXHJcbiAgRGlnaXQwOiAnMCcsXHJcbiAgVGFiOiAnVGFiJyxcclxuICBLZXlBOiAnYScsXHJcbiAgS2V5QjogJ2InLFxyXG4gIEtleUM6ICdjJyxcclxuICBLZXlEOiAnZCcsXHJcbiAgS2V5RTogJ2UnLFxyXG4gIEtleUY6ICdmJyxcclxuICBLZXlHOiAnZycsXHJcbiAgS2V5SDogJ2gnLFxyXG4gIEtleUk6ICdpJyxcclxuICBLZXlKOiAnaicsXHJcbiAgS2V5SzogJ2snLFxyXG4gIEtleUw6ICdsJyxcclxuICBLZXlNOiAnbScsXHJcbiAgS2V5TjogJ24nLFxyXG4gIEtleU86ICdvJyxcclxuICBLZXlQOiAncCcsXHJcbiAgS2V5UTogJ3EnLFxyXG4gIEtleVI6ICdyJyxcclxuICBLZXlTOiAncycsXHJcbiAgS2V5VDogJ3QnLFxyXG4gIEtleVU6ICd1JyxcclxuICBLZXlWOiAndicsXHJcbiAgS2V5VzogJ3cnLFxyXG4gIEtleVg6ICd4JyxcclxuICBLZXlZOiAneScsXHJcbiAgS2V5WjogJ3onLFxyXG4gIEYxOiAgJ0YxJyxcclxuICBGMjogICdGMicsXHJcbiAgRjM6ICAnRjMnLFxyXG4gIEY0OiAgJ0Y0JyxcclxuICBGNTogICdGNScsXHJcbiAgRjY6ICAnRjYnLFxyXG4gIEY3OiAgJ0Y3JyxcclxuICBGODogICdGOCcsXHJcbiAgRjk6ICAnRjknLFxyXG4gIEYxMDogJ0YxMCcsXHJcbiAgRjExOiAnRjExJyxcclxuICBGMTI6ICdGMTInLFxyXG4gIEVuZDogJ0VuZCcsXHJcbiAgSG9tZTogJ0hvbWUnLFxyXG4gIEFycm93VXA6ICAgICfihpEnLFxyXG4gIEFycm93RG93bjogICfihpMnLFxyXG4gIEFycm93TGVmdDogICfihpAnLFxyXG4gIEFycm93UmlnaHQ6ICfihpInLFxyXG4gIERlbGV0ZTogICAnRGVsJyxcclxuICBQYWdlVXA6ICAgJ1BnVXAnLFxyXG4gIFBhZ2VEb3duOiAnUGdEbicsXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvZGVUb0NoYXIoZXZuLCBvcHQ9e2NvZGVPbmx5OmZhbHNlfSkge1xyXG4gIGNvbnN0IHtjb2RlLCBzaGlmdEtleX0gPSBldm5cclxuICBjb25zdCB7Y29kZU9ubHl9ID0gb3B0XHJcbiAgbGV0IG1hdGNoXHJcbiAgbGV0IGNoYXIgPSAnJ1xyXG4gIG1hdGNoID0gY29kZS5tYXRjaCgvS2V5KC4pLylcclxuICBpZiAobWF0Y2gpIHtcclxuICAgIGNoYXIgPSBtYXRjaC5wb3AoKVxyXG4gICAgaWYgKCFjb2RlT25seSAmJiAhc2hpZnRLZXkpIHtcclxuICAgICAgY2hhciA9IGNoYXIudG9Mb3dlckNhc2UoKVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBtYXRjaCA9IGNvZGUubWF0Y2goLyhEaWdpdHxOdW1wYWQpKC4pLylcclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICBjaGFyID0gbWF0Y2gucG9wKClcclxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xyXG4gICAgICAgIGNoYXIgPSBrY29kZTNbY2hhcl1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xyXG4gICAgICAgIGNoYXIgPSBrY29kZTJbY29kZV1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGFyID0ga2NvZGUxW2NvZGVdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNoYXJcclxufVxyXG5cclxuZnVuY3Rpb24gY29kZVRvU2hvdyhjb2Rlcykge1xyXG4gIHJldHVybiBjb2Rlcy5zcGxpdCgnOicpLm1hcCh4PT57XHJcbiAgICByZXR1cm4gYCR7a3Nob3dbeF19YFxyXG4gIH0pLmpvaW4oJ+KcpycpXHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZuLmNvZGVUb0NoYXIgPSBjb2RlVG9DaGFyXHJcbndpbmRvdy5taXRtLmZuLmNvZGVUb1Nob3cgPSBjb2RlVG9TaG93XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGNvZGVUb0NoYXIsXHJcbiAga2NvZGUxLFxyXG4gIGtjb2RlMixcclxuICBrY29kZTMsXHJcbiAga3Nob3dcclxufSIsImNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmZ1bmN0aW9uIF9wb3N0KGpzb24pIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgfVxyXG4gICAgICBmZXRjaCgnL21pdG0tcGxheS9wbGF5Lmpzb24nLCBjb25maWcpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEgICAgKSB7IHJlc29sdmUoZGF0YSkgICAgICAgICAgIH0pXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICByZWplY3QoZXJyb3IpXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gX3BsYXkoanNvbikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCBqc29uLCByZXNvbHZlKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XHJcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxyXG4gIGlmIChhdXRvZmlsbCkge1xyXG4gICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxyXG4gICAgfVxyXG4gICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gICAgY29uc3QgbGVudGggPSBhdXRvZmlsbC5sZW5ndGhcclxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cclxuICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxyXG4gICAgY29uc3QgX2pzb24gPSB7YXV0b2ZpbGwsIGJyb3dzZXIsIF9wYWdlLCBfZnJhbWV9XHJcbiAgICBjb25zdCBtc2cgPSBsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKVxyXG4gICAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAke21zZ31gLCBfYylcclxuICAgIGxldCByZXN1bHRcclxuICAgIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcclxuICAgICAgcmVzdWx0ID0gYXdhaXQgX3Bvc3QoX2pzb24pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXN1bHQgPSBhd2FpdCBfcGxheShfanNvbilcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNxbGl0ZSgpIHtcclxuICBjb25zdCBbY21kLCBxLCB0YmxdID0gYXJndW1lbnRzXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHtxfVxyXG4gICAgICBpZiAodGJsKSB7XHJcbiAgICAgICAgZGF0YS50YmwgPSB0YmxcclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cud3NfX3NlbmQoY21kLCBkYXRhLCByZXNvbHZlKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZuLnNxbExpc3QgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbExpc3QnLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbERlbCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbERlbCcgLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbElucyAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbElucycgLCBxLCB0YmwpXHJcbndpbmRvdy5taXRtLmZuLnNxbFVwZCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbFVwZCcgLCBxLCB0YmwpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXlcclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3Qge2NvZGVUb0NoYXI6X2tleX0gPSByZXF1aXJlKCcuL19rZXlib2FyZCcpXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgcGxheSA9IHJlcXVpcmUoJy4vX3dzX3BsYXknKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuY29uc3Qgc3R5bGVMZWZ0ICA9ICd0b3A6IC0ycHg7IGxlZnQ6ICAzcHg7J1xyXG5jb25zdCBzdHlsZVRvcFIgID0gJ3RvcDogIDBweDsgcmlnaHQ6IDNweDsnXHJcbmNvbnN0IHN0eWxlUmlnaHQgPSAndG9wOiAxNHB4OyByaWdodDogM3B4OydcclxuY29uc3QgYnV0dG9uU3R5bGU9ICcnXHJcbmNvbnN0IHN0eWxlID0gYFxyXG4ubWl0bS1jb250YWluZXIge1xyXG4gIHotaW5kZXg6IDk5OTk5O1xyXG4gIHBvc2l0aW9uOiBmaXhlZDtcclxuICBmb250LXNpemU6IDEycHg7XHJcbiAgbGluZS1oZWlnaHQ6IDE0cHg7XHJcbn1cclxuLm1pdG0tY29udGFpbmVyLmNlbnRlciB7XHJcbiAgYmFja2dyb3VuZDogI2ZjZmZkY2IwO1xyXG4gIHBvc2l0aW9uOiBmaXhlZDtcclxuICAvKiBjZW50ZXIgdGhlIGVsZW1lbnQgKi9cclxuICByaWdodDogMDtcclxuICBsZWZ0OiAwO1xyXG4gIHRvcDogMjBweDtcclxuICBtYXJnaW4tcmlnaHQ6IGF1dG87XHJcbiAgbWFyZ2luLWxlZnQ6IGF1dG87XHJcbiAgLyogZ2l2ZSBpdCBkaW1lbnNpb25zICovXHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XHJcbiAgcGFkZGluZzogNXB4IDEwcHg7XHJcbiAgb3ZlcmZsb3c6IGF1dG87XHJcbiAgd2lkdGg6IDkwJTtcclxuICBkaXNwbGF5OiBub25lO1xyXG59XHJcbi5taXRtLWJ0biB7XHJcbiAgY29sb3I6IGJsYWNrO1xyXG4gIGJvcmRlcjogbm9uZTtcclxuICBmb250LXNpemU6IDhweDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMXB4IDZweDtcclxuICBib3JkZXItcmFkaXVzOiAzcHg7XHJcbiAgZm9udC1mYW1pbHk6IG1vbmFjbywgQ29uc29sYXMsIFwiTHVjaWRhIENvbnNvbGVcIiwgbW9ub3NwYWNlO1xyXG59XHJcbi5taXRtLWJ0bjpob3ZlcntcclxuICB0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO1xyXG59XHJcbi5taXRtLWJ0bi5sZWZ0LFxyXG4ubWl0bS1idG4ucmlnaHQge1xyXG4gIGRpc3BsYXk6IGJsb2NrO1xyXG59XHJcbi5taXRtLWJ0bi5yaWdodCB7XHJcbiAgZmxvYXQ6IHJpZ2h0O1xyXG4gIG1hcmdpbi10b3A6IDJweDtcclxufVxyXG4uYmdyb3VwLWxlZnQsXHJcbi5iZ3JvdXAtcmlnaHQge1xyXG4gIGRpc3BsYXk6IHRhYmxlO1xyXG4gIG1hcmdpbi10b3A6IDRweDtcclxufVxyXG4uYmdyb3VwLWxlZnQ+ZGl2LFxyXG4uYmdyb3VwLXJpZ2h0PmRpdiB7XHJcbiAgcGFkZGluZy1ib3R0b206IDJweDtcclxufVxyXG4uYmdyb3VwLXRvcHIsXHJcbi5iZ3JvdXAtdG9wciBzcGFuIHtcclxuICBmb250LXNpemU6IDE0cHg7XHJcbn1gXHJcblxyXG5sZXQgY29udGFpbmVyID0ge1xyXG4gIHRvcHI6IHt9LFxyXG4gIGxlZnQ6IHt9LFxyXG4gIHJpZ2h0OiB7fSxcclxuICB0YXJnZXQ6IHt9LFxyXG59XHJcbmxldCBidXR0b24gPSB7fVxyXG5sZXQgYmdyb3VwID0ge1xyXG4gIHJpZ2h0OiB7fSxcclxuICB0b3ByOiB7fSxcclxuICBsZWZ0OiB7fSxcclxufVxyXG5cclxuZnVuY3Rpb24gd2FpdChtcykge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKVxyXG59O1xyXG5cclxuZnVuY3Rpb24gdG9SZWdleCAocGF0aE1zZykge1xyXG4gIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXHJcbiAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKVxyXG4gIHJldHVybiB7IHBhdGgsIG1zZyB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3MpIHtcclxuICBmb3IgKGNvbnN0IGlkIGluIGJ1dHRvbnMpIHtcclxuICAgIGNvbnN0IFtjYXB0aW9uLCBjb2xvciwga2xhc10gPSBpZC5zcGxpdCgnfCcpLm1hcCh4PT54LnRyaW0oKSlcclxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXHJcbiAgICBjb25zdCBmbiAgPSBidXR0b25zW2lkXVxyXG4gICAgYnRuLm9uY2xpY2sgPSBhc3luYyBlID0+IHtcclxuICAgICAgbGV0IGFyciA9IGZuKGUpXHJcbiAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBQcm9taXNlKSB7XHJcbiAgICAgICAgYXJyID0gYXdhaXQgYXJyXHJcbiAgICAgIH1cclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkge1xyXG4gICAgICAgIGF3YWl0IHBsYXkoYXJyKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBidG4uaW5uZXJUZXh0ID0gY2FwdGlvblxyXG4gICAgYnRuLmNsYXNzTGlzdC5hZGQoJ21pdG0tYnRuJylcclxuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGAke3Bvc31gKVxyXG4gICAgYnRuLmNsYXNzTGlzdC5hZGQoa2xhcyB8fCBjYXB0aW9uKVxyXG4gICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKVxyXG4gICAgaWYgKHBvcz09PSd0b3ByJykge1xyXG4gICAgICBjb25zdCBiciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxyXG4gICAgICBici5pbm5lckhUTUwgPSAnJm5ic3A7J1xyXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChicilcclxuICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoYnRuKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgZGl2LmFwcGVuZENoaWxkKGJ0bilcclxuICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoZGl2KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0QnV0dG9ucyAoYnV0dG9ucywgcG9zaXRpb24pIHtcclxuICBpZiAoYmdyb3VwW3Bvc2l0aW9uXSkge1xyXG4gICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xyXG4gICAgY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvc2l0aW9uKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGVmYXVsdEhvdEtleXMoKSB7XHJcbiAgY29uc3Qge21pdG06IHtzdmVsdGU6IHtDc3BoZWFkZXIsIFNxbGl0ZX0sIGZufX0gPSB3aW5kb3dcclxuICBjb25zdCBrZXlzID0ge1xyXG4gICAgJ2NvZGU6S2V5QycoX2UpIHtcclxuICAgICAgZm4uc3ZlbHRlKENzcGhlYWRlciwgJ0xpZ2h0UGFzdGVsR3JlZW4nKVxyXG4gICAgfSxcclxuICAgICdjb2RlOktleVEnKF9lKSB7XHJcbiAgICAgIGZuLnN2ZWx0ZShTcWxpdGUsICdMaWdodFBhc3RlbEdyZWVuJylcclxuICAgIH0sXHJcbiAgfVxyXG4gIGtleXNbJ2NvZGU6S2V5QyddLl90aXRsZSA9ICdTaG93IENTUCBIZWFkZXInXHJcbiAga2V5c1snY29kZTpLZXlRJ10uX3RpdGxlID0gJ1Nob3cgU3FsaXRlJ1xyXG4gIG1pdG0ubWFjcm9rZXlzID0ga2V5c1xyXG59XHJcblxyXG5sZXQgZGVidW5rXHJcbmxldCBpbnRlcnZJZFxyXG5sZXQgb25jZXMgPSB7fSAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHVybENoYW5nZSAoZXZlbnQpIHtcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCB7bWl0bX0gPSB3aW5kb3dcclxuXHJcbiAgY2xlYXJJbnRlcnZhbChpbnRlcnZJZClcclxuICBpZiAobWl0bS5hdXRvaW50ZXJ2YWwpIHtkZWxldGUgbWl0bS5hdXRvaW50ZXJ2YWx9XHJcbiAgaWYgKG1pdG0uYXV0b2ZpbGwpICAgICB7ZGVsZXRlIG1pdG0uYXV0b2ZpbGwgICAgfVxyXG4gIGlmIChtaXRtLmF1dG9idXR0b25zKSAge2RlbGV0ZSBtaXRtLmF1dG9idXR0b25zIH1cclxuICBpZiAobWl0bS5sZWZ0YnV0dG9ucykgIHtkZWxldGUgbWl0bS5sZWZ0YnV0dG9ucyB9XHJcbiAgaWYgKG1pdG0ucmlnaHRidXR0b25zKSB7ZGVsZXRlIG1pdG0ucmlnaHRidXR0b25zfVxyXG4gIGlmIChtaXRtLm1hY3Jva2V5cykgICAge2RlZmF1bHRIb3RLZXlzKCkgICAgICAgIH1cclxuICBpZiAobmFtZXNwYWNlKSB7XHJcbiAgICBjb25zdCB7aHJlZiwgb3JpZ2lufSA9IGxvY2F0aW9uXHJcbiAgICBjb25zdCBfaHJlZiA9IGhyZWYucmVwbGFjZShvcmlnaW4sICcnKVxyXG4gICAgb2JzZXJ2ZXJmbiA9IFtdXHJcbiAgICBsZXQgbm9uZSA9IHRydWVcclxuICAgIGZvciAoY29uc3Qga2V5IGluIG1pdG0ubWFjcm9zKSB7XHJcbiAgICAgIGNvbnN0IHsgcGF0aCwgbXNnIH0gPSB0b1JlZ2V4KGtleSlcclxuICAgICAgaWYgKF9ocmVmLm1hdGNoKHBhdGgpKSB7XHJcbiAgICAgICAgbm9uZSA9IGZhbHNlXHJcbiAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IG1zZyB8fCAnRW50cnknXHJcbiAgICAgICAgbGV0IGZucyA9IG1pdG0ubWFjcm9zW2tleV0oKVxyXG4gICAgICAgIGlmIChmbnMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XHJcbiAgICAgICAgICBmbnMgPSBhd2FpdCBmbnNcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmbnMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIG9ic2VydmVyZm4ucHVzaChmbnMpXHJcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGZucykpIHtcclxuICAgICAgICAgIGZvciAoY29uc3QgZm4yIG9mIGZucykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuMiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgIG9ic2VydmVyZm4ucHVzaChmbjIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGVidW5rICYmIGNsZWFyVGltZW91dChkZWJ1bmspXHJcbiAgICAgICAgZGVidW5rID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICBvbmNlcyA9IHt9IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxyXG4gICAgICAgICAgZGVidW5rID0gdW5kZWZpbmVkXHJcbiAgICAgICAgICBjb25zdCB7YXV0b2J1dHRvbnMsIHJpZ2h0YnV0dG9ucywgbGVmdGJ1dHRvbnN9ID0gd2luZG93Lm1pdG1cclxuICAgICAgICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xyXG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKHtcclxuICAgICAgICAgICAgICAuLi5hdXRvYnV0dG9ucyxcclxuICAgICAgICAgICAgICAnRW50cnknKCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHthdXRvZmlsbH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdXRvZmlsbCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBsYXkoYXV0b2ZpbGwpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAndG9wcicpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodCcpXHJcbiAgICAgICAgICBsZWZ0YnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zLCAnbGVmdCcpXHJcbiAgICAgICAgfSwgMClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG5vbmUpIHtcclxuICAgICAgc2V0QnV0dG9ucyh7fSwgJ3JpZ2h0JylcclxuICAgICAgc2V0QnV0dG9ucyh7fSwgJ2xlZnQnKVxyXG4gICAgICBzZXRCdXR0b25zKHt9LCAndG9wcicpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcclxuICBjb250YWluZXIudG9wci5zdHlsZSAgPSBzdHlsZVRvcFJcclxuICBjb250YWluZXIubGVmdC5zdHlsZSAgPSBzdHlsZUxlZnRcclxuICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxyXG4gIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgaWYgKHR5cGVvZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcclxuICB9XHJcbiAgY3RybCA9IGZhbHNlXHJcbn1cclxuXHJcbmNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY29tcGFyZUhyZWYpO1xyXG53aW5kb3cub2JzZXJ2ZXIgPSBvYnNlcnZlclxyXG5mdW5jdGlvbiBvYnNlcnZlZCgpIHtcclxuICBvYnNlcnZlci5kaXNjb25uZWN0KClcclxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgIHN1YnRyZWU6IHRydWVcclxuICB9KVxyXG59XHJcblxyXG5jb25zdCBfdXJsQ2hhbmdlZCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgY29uc3QgaHRtbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKVxyXG4gIGNvbnN0IGh0bWxyZWYgPSBodG1sLmZpcnN0RWxlbWVudENoaWxkXHJcbiAgY29uc3Qgc3R5bGVCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXHJcbiAgY29uc3QgZGl2UmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gIGNvbnN0IGRpdlRvcFIgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICBjb25zdCBkaXZMZWZ0ICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgY29uc3QgZGl2Q2VudGVyPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG5cclxuICBzdHlsZUJ0bi5pbm5lckhUTUwgPSBzdHlsZVxyXG4gIHN0eWxlQnRuLmNsYXNzTmFtZSA9ICdtaXRtLWNsYXNzJ1xyXG4gIGRpdlJpZ2h0LmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1yaWdodFwiPjwvc3Bhbj5gXHJcbiAgZGl2VG9wUi5pbm5lckhUTUwgID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXRvcHJcIj48L3NwYW4+YFxyXG4gIGRpdkxlZnQuaW5uZXJIVE1MICA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1sZWZ0XCI+PC9zcGFuPmBcclxuICBkaXZMZWZ0LmNsYXNzTmFtZSAgPSAnbWl0bS1jb250YWluZXIgbGVmdCdcclxuICBkaXZUb3BSLmNsYXNzTmFtZSAgPSAnbWl0bS1jb250YWluZXIgdG9wcidcclxuICBkaXZSaWdodC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcmlnaHQnXHJcbiAgZGl2Q2VudGVyLmNsYXNzTmFtZT0gJ21pdG0tY29udGFpbmVyIGNlbnRlcidcclxuICBkaXZSaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcclxuICBkaXZUb3BSLnN0eWxlICA9IHN0eWxlVG9wUlxyXG4gIGRpdkxlZnQuc3R5bGUgID0gc3R5bGVMZWZ0XHJcblxyXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKHN0eWxlQnRuLCBodG1scmVmKVxyXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlJpZ2h0LCBodG1scmVmKVxyXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlRvcFIsIGh0bWxyZWYpXHJcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2TGVmdCwgaHRtbHJlZilcclxuICBodG1sLmluc2VydEJlZm9yZShkaXZDZW50ZXIsIGh0bWxyZWYpXHJcbiAgY29uc3QgaG90a2V5ID0gbmV3IG1pdG0uc3ZlbHRlLkhvdGtleXMoe3RhcmdldDpkaXZDZW50ZXJ9KVxyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgY29udGFpbmVyLnRvcHIgPSBkaXZUb3BSXHJcbiAgICBjb250YWluZXIubGVmdCA9IGRpdkxlZnRcclxuICAgIGNvbnRhaW5lci5yaWdodD0gZGl2UmlnaHRcclxuICAgIGNvbnRhaW5lci5ob3RrZXkgPSBob3RrZXlcclxuICAgIGNvbnRhaW5lci50YXJnZXQgPSBkaXZDZW50ZXJcclxuICAgIGNvbnRhaW5lci5ub2Rla2V5PSBkaXZDZW50ZXIuY2hpbGRyZW5bMF1cclxuICAgIGJ1dHRvbi5zdHlsZSA9IGAke2J1dHRvblN0eWxlfWJhY2tncm91bmQtY29sb3I6IGF6dXJlO2BcclxuICAgIGJncm91cC5yaWdodCA9IGRpdlJpZ2h0LmNoaWxkcmVuWzBdXHJcbiAgICBiZ3JvdXAudG9wciAgPSBkaXZUb3BSLmNoaWxkcmVuWzBdXHJcbiAgICBiZ3JvdXAubGVmdCAgPSBkaXZMZWZ0LmNoaWxkcmVuWzBdXHJcbiAgICB1cmxDaGFuZ2UoX3VybENoYW5nZWQpXHJcbiAgICBvYnNlcnZlZCgpXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGlmIChjZW50ZXIgJiYgIWRpdkNlbnRlci5jb250YWlucyhldmVudC50YXJnZXQpKSB7XHJcbiAgICAgICAgZGl2Q2VudGVyLmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXHJcbiAgICAgICAgY2VudGVyID0gZmFsc2VcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSwgMClcclxufVxyXG5cclxuZnVuY3Rpb24gbWFjcm9BdXRvbWF0aW9uKG1hY3JvKSB7XHJcbiAgaWYgKGNlbnRlcikge1xyXG4gICAgY29udGFpbmVyLnRhcmdldC5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxyXG4gICAgY2VudGVyID0gZmFsc2VcclxuICB9XHJcbiAgaWYgKEFycmF5LmlzQXJyYXkobWFjcm8pKSB7XHJcbiAgICBsZXQgbWFjcm9JbmRleCA9IDBcclxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBsZXQgc2VsZWN0b3IgPSBtYWNyb1ttYWNyb0luZGV4XVxyXG4gICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcclxuICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gQ3NzU2VsZWN0b3JHZW5lcmF0b3IuZ2V0Q3NzU2VsZWN0b3IoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcclxuICAgICAgICBzZWxlY3RvciA9IGAke2FjdGl2ZUVsZW1lbnR9ICR7c2VsZWN0b3J9YFxyXG4gICAgICB9XHJcbiAgICAgIHBsYXkoW3NlbGVjdG9yXSlcclxuXHJcbiAgICAgIG1hY3JvSW5kZXggKz0gMVxyXG4gICAgICBpZiAobWFjcm9JbmRleCA+PSBtYWNyby5sZW5ndGgpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKVxyXG4gICAgICB9XHJcbiAgICB9LCAxMDApXHJcbiAgfVxyXG59XHJcblxyXG5sZXQgc3RkRGJsID0gW11cclxubGV0IGhnaERibCA9IFtdXHJcbmxldCBzdGRDdGwgPSBbXVxyXG5sZXQgaGdoQ3RsID0gW11cclxubGV0IHN0ZEFsdCA9IFtdXHJcbmxldCBoZ2hBbHQgPSBbXVxyXG5sZXQgc2F2ZUtleSA9ICcnXHJcbmNvbnN0IGtkZWxheSA9IDEwMDBcclxuXHJcbmxldCBkZWJvdW5jZURibCA9IHVuZGVmaW5lZFxyXG5mdW5jdGlvbiBtYWNyb0RibCgpIHtcclxuICBjb25zdCBrZXkxID0gYGtleToke3N0ZERibC5qb2luKCcnKX1gXHJcbiAgY29uc3Qga2V5MiA9IGBjb2RlOiR7aGdoRGJsLmpvaW4oJzonKX1gXHJcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIHN0ZERibCA9IFtdXHJcbiAgaGdoRGJsID0gW11cclxuICBzYXZlS2V5ID0gJydcclxuICBkZWJvdW5jZURibCA9IHVuZGVmaW5lZFxyXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cclxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IGN0cmwgKyBhbHQgICsgICR7a2V5MX0gIHwgICR7a2V5Mn1gLCBfYylcclxuICBpZiAobWFjcm8pIHtcclxuICAgIG1hY3JvID0gbWFjcm8oZSlcclxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG59XHJcblxyXG5sZXQgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcclxuZnVuY3Rpb24gbWFjcm9DdGwoKSB7XHJcbiAgY29uc3Qga2V5MSA9IGBrZXk6PCR7c3RkQ3RsLmpvaW4oJycpfT5gXHJcbiAgY29uc3Qga2V5MiA9IGBjb2RlOjwke2hnaEN0bC5qb2luKCc6Jyl9PmBcclxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cclxuXHJcbiAgc3RkQ3RsID0gW11cclxuICBoZ2hDdGwgPSBbXVxyXG4gIHNhdmVLZXkgPSAnJ1xyXG4gIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXHJcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxyXG4gIGNvbnNvbGUubG9nKGAlY01hY3JvczogLi4uLiArIGN0cmwgKyAke2tleTF9IHwgJHtrZXkyfWAsICdjb2xvcjogI2JhZWFmMScpXHJcbiAgaWYgKG1hY3JvKSB7XHJcbiAgICBtYWNybyA9IG1hY3JvKGUpXHJcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxufVxyXG5cclxubGV0IGRlYm91bmNlQWx0ID0gdW5kZWZpbmVkXHJcbmZ1bmN0aW9uIG1hY3JvQWx0KCkge1xyXG4gIGNvbnN0IGtleTEgPSBga2V5Onske3N0ZEFsdC5qb2luKCcnKX19YFxyXG4gIGNvbnN0IGtleTIgPSBgY29kZTp7JHtoZ2hBbHQuam9pbignOicpfX1gXHJcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIHN0ZEFsdCA9IFtdXHJcbiAgaGdoQWx0ID0gW11cclxuICBzYXZlS2V5ID0gJydcclxuICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxyXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cclxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBhbHQgICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWRhZjEnKVxyXG4gIGlmIChtYWNybykge1xyXG4gICAgbWFjcm8gPSBtYWNybyhlKVxyXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGtleWJVcCAoZSkge1xyXG4gIGlmICghZS5hbHRLZXkpIHtcclxuICAgIGlmIChkZWJvdW5jZURibCB8fCAoZGVib3VuY2VDdGwgJiYgIWUuY3RybEtleSkgfHwgZGVib3VuY2VBbHQpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlRGJsKVxyXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXHJcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcclxuICAgICAgaWYgKGRlYm91bmNlRGJsKSB7XHJcbiAgICAgICAgbWFjcm9EYmwoKVxyXG4gICAgICB9IGVsc2UgXHJcbiAgICAgIGlmIChkZWJvdW5jZUN0bCkge1xyXG4gICAgICAgIG1hY3JvQ3RsKClcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtYWNyb0FsdCgpXHJcbiAgICAgIH1cclxuICAgICAgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcclxuICAgICAgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcclxuICAgICAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcclxuICAgIH1cclxuICB9XHJcbn1cclxudmFyIGN0cmwgPSBmYWxzZVxyXG52YXIgY2VudGVyID0gZmFsc2VcclxuZnVuY3Rpb24ga2V5YkN0cmwgKGUpIHtcclxuICBpZiAoIWUuY29kZSB8fCBbJ0FsdCcsICdDb250cm9sJywgJ01ldGEnXS5pbmNsdWRlcyhlLmtleSkpIHtcclxuICAgIHJldHVyblxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoZS5rZXk9PT0nU2hpZnQnKSB7XHJcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgY29uc3Qge25vZGVrZXksIHRhcmdldCwgcmlnaHQsIHRvcHIsIGxlZnR9ID0gY29udGFpbmVyXHJcbiAgICAgICAgaWYgKGUuY29kZT09PSdTaGlmdFJpZ2h0Jykge1xyXG4gICAgICAgICAgY3RybCA9ICFjdHJsXHJcbiAgICAgICAgICByaWdodC5zdHlsZSA9IHN0eWxlUmlnaHQrICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcclxuICAgICAgICAgIHRvcHIuc3R5bGUgID0gc3R5bGVUb3BSICsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKVxyXG4gICAgICAgICAgbGVmdC5zdHlsZSAgPSBzdHlsZUxlZnQgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHRhcmdldC5jaGlsZHJlblswXSE9PW5vZGVrZXkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0LnJlcGxhY2VDaGlsZHJlbihub2Rla2V5KVxyXG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUgPSAnZGlzcGxheTogYmxvY2s7J1xyXG4gICAgICAgICAgICBjZW50ZXIgPSB0cnVlXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjZW50ZXIgPSAhY2VudGVyXHJcbiAgICAgICAgICAgIGlmIChjZW50ZXIpIHtcclxuICAgICAgICAgICAgICB0YXJnZXQuc3R5bGUgPSAnZGlzcGxheTogYmxvY2s7J1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRhcmdldC5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCBjaGFyID0gX2tleShlKVxyXG4gICAgICBpZiAoZS5jdHJsS2V5ICYmIGUuYWx0S2V5KSB7XHJcbiAgICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgIGNoYXIgPSBfa2V5KGUsIHtjb2RlT25seTogdHJ1ZX0pXHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXHJcbiAgICAgICAgICBzYXZlS2V5ICs9IGNoYXJcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgc3RkRGJsLnB1c2goY2hhcilcclxuICAgICAgICBoZ2hEYmwucHVzaChlLmNvZGUpXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlRGJsKVxyXG4gICAgICAgIGRlYm91bmNlRGJsID0gc2V0VGltZW91dChtYWNyb0RibCwga2RlbGF5KVxyXG4gICAgICB9IGVsc2UgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgIHN0ZEN0bC5wdXNoKGNoYXIpXHJcbiAgICAgICAgaGdoQ3RsLnB1c2goZS5jb2RlKVxyXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcclxuICAgICAgICBkZWJvdW5jZUN0bCA9IHNldFRpbWVvdXQobWFjcm9DdGwsIGtkZWxheSlcclxuICAgICAgfSBlbHNlIGlmIChlLmFsdEtleSkge1xyXG4gICAgICAgIHN0ZEFsdC5wdXNoKGNoYXIpXHJcbiAgICAgICAgaGdoQWx0LnB1c2goZS5jb2RlKVxyXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcclxuICAgICAgICBkZWJvdW5jZUFsdCA9IHNldFRpbWVvdXQobWFjcm9BbHQsIGtkZWxheSlcclxuICAgICAgfVxyXG4gICAgICBlLl9rZXlzID0gc2F2ZUtleVxyXG4gICAgICBtaXRtLmxhc3RLZXkgPSBlICAgICAgICBcclxuICAgIH0gXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCB7bG9jYXRpb259ID0gZG9jdW1lbnRcclxubGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXHJcbmxldCBvRGVidW5rID0gdW5kZWZpbmVkXHJcbmxldCBvYnNlcnZlcmZuID0gW11cclxuXHJcbmZ1bmN0aW9uIGNvbXBhcmVIcmVmKG5vZGVzKSB7XHJcbiAgLy8gY29uc29sZS5sb2coYCVjTWFjcm9zOiBET00gbXV0YXRlZCFgLCBfYylcclxuICBpZiAob2xkSHJlZiAhPSBsb2NhdGlvbi5ocmVmKSB7XHJcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChfdXJsQ2hhbmdlZClcclxuICAgIG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChvYnNlcnZlcmZuLmxlbmd0aCkge1xyXG4gICAgICBvRGVidW5rICYmIGNsZWFyVGltZW91dChvRGVidW5rKVxyXG4gICAgICBvRGVidW5rID0gc2V0VGltZW91dCgoKT0+IHtcclxuICAgICAgICBvRGVidW5rID0gdW5kZWZpbmVkXHJcbiAgICAgICAgZm9yIChjb25zdCBmbiBvZiBvYnNlcnZlcmZuKSB7XHJcbiAgICAgICAgICBjb25zdCBuYW1lID0gZm4ubmFtZVxyXG4gICAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5tYXRjaCgvT25jZSQvKSkge1xyXG4gICAgICAgICAgICBpZiAob25jZXNbbmFtZV0pIHsgLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXHJcbiAgICAgICAgICAgICAgY29udGludWVcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBvbmNlc1tuYW1lXSA9IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZm4obm9kZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgIHJpZ2h0YnV0dG9ucyAmJiBzZXRCdXR0b25zKHJpZ2h0YnV0dG9ucywgJ3JpZ2h0JylcclxuICAgICAgICBsZWZ0YnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zLCAnbGVmdCcpXHJcbiAgICAgICAgY29uc3QgeyBhdXRvZmlsbCB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgICBpZiAoYXV0b2ZpbGwpIHtcclxuICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xyXG4gICAgICAgICAgICAuLi5hdXRvYnV0dG9ucyxcclxuICAgICAgICAgICAgJ0VudHJ5JygpIHtwbGF5KGF1dG9maWxsKX1cclxuICAgICAgICAgIH0sICd0b3ByJylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyhhdXRvYnV0dG9ucywgJ3RvcHInKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sIDEwMClcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdzTG9jYXRpb24oKSB7XHJcbiAgY29uc3QgdmVuZG9yID0gX3dzX3ZlbmRvcigpXHJcbiAgaWYgKFsnZmlyZWZveCcsICd3ZWJraXQnXS5pbmNsdWRlcyh2ZW5kb3IpIHx8IChjaHJvbWUgJiYgIWNocm9tZS50YWJzKSkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGtleWJVcClcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxyXG4gICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XHJcbiAgICAgIGluaXQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdClcclxuICAgIH0gICAgXHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxyXG4gICAgY29tcGFyZUhyZWYoKVxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgcGFzdGVsID0ge1xyXG4gIFBvc3RJdDogICAgICAgICAgJyNmY2ZmZGNkNicsXHJcbiAgUGFzdGVsR3JlZW46ICAgICAnIzc3ZGQ3N2Q2JyxcclxuICBQYXN0ZWxCcm93bjogICAgICcjODM2OTUzZDYnLFxyXG4gIEJhYnlCbHVlOiAgICAgICAgJyM4OWNmZjBkNicsXHJcbiAgUGFzdGVsVHVycXVvaXNlOiAnIzk5YzVjNGQ2JyxcclxuICBCbHVlR3JlZW5QYXN0ZWw6ICcjOWFkZWRiZDYnLFxyXG4gIFBlcnNpYW5QYXN0ZWw6ICAgJyNhYTk0OTlkNicsXHJcbiAgTWFnaWNNaW50OiAgICAgICAnI2FhZjBkMWQ2JyxcclxuICBMaWdodFBhc3RlbEdyZWVuOicjYjJmYmE1ZDYnLFxyXG4gIFBhc3RlbFB1cnBsZTogICAgJyNiMzllYjVkNicsXHJcbiAgUGFzdGVsTGlsYWM6ICAgICAnI2JkYjBkMGQ2JyxcclxuICBQYXN0ZWxQZWE6ICAgICAgICcjYmVlN2E1ZDYnLFxyXG4gIExpZ2h0TGltZTogICAgICAgJyNiZWZkNzNkNicsXHJcbiAgTGlnaHRQZXJpd2lua2xlOiAnI2MxYzZmY2Q2JyxcclxuICBQYWxlTWF1dmU6ICAgICAgICcjYzZhNGE0ZDYnLFxyXG4gIExpZ2h0TGlnaHRHcmVlbjogJyNjOGZmYjBkNicsXHJcbiAgUGFzdGVsVmlvbGV0OiAgICAnI2NiOTljOWQ2JyxcclxuICBQYXN0ZWxNaW50OiAgICAgICcjY2VmMGNjZDYnLFxyXG4gIFBhc3RlbEdyZXk6ICAgICAgJyNjZmNmYzRkNicsXHJcbiAgUGFsZUJsdWU6ICAgICAgICAnI2Q2ZmZmZWQ2JyxcclxuICBQYXN0ZWxMYXZlbmRlcjogICcjZDhhMWM0ZDYnLFxyXG4gIFBhc3RlbFBpbms6ICAgICAgJyNkZWE1YTRkNicsXHJcbiAgUGFzdGVsU21pcms6ICAgICAnI2RlZWNlMWQ2JyxcclxuICBQYXN0ZWxEYXk6ICAgICAgICcjZGZkOGUxZDYnLFxyXG4gIFBhc3RlbFBhcmNobWVudDogJyNlNWQ5ZDNkNicsXHJcbiAgUGFzdGVsUm9zZVRhbjogICAnI2U5ZDFiZmQ2JyxcclxuICBQYXN0ZWxNYWdlbnRhOiAgICcjZjQ5YWMyZDYnLFxyXG4gIEVsZWN0cmljTGF2ZW5kZXI6JyNmNGJmZmZkNicsXHJcbiAgUGFzdGVsWWVsbG93OiAgICAnI2ZkZmQ5NmQ2JyxcclxuICBQYXN0ZWxSZWQ6ICAgICAgICcjZmY2OTYxZDYnLFxyXG4gIFBhc3RlbE9yYW5nZTogICAgJyNmZjk2NGZkNicsXHJcbiAgQW1lcmljYW5QaW5rOiAgICAnI2ZmOTg5OWQ2JyxcclxuICBCYWJ5UGluazogICAgICAgICcjZmZiN2NlZDYnLFxyXG4gIEJhYnlQdXJwbGU6ICAgICAgJyNjYTliZjdkNicsXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN2ZWx0ZShTdmVsdCwgYmc9J1Bvc3RJdCcpIHsgLy8gZmVhdDogc3ZlbHRlIHJlbGF0ZWRcclxuICBjb25zdCB7dGFyZ2V0fSA9IGNvbnRhaW5lclxyXG4gIHRhcmdldC5yZXBsYWNlQ2hpbGRyZW4oJycpXHJcbiAgd2luZG93Lm1pdG0uc2FwcCA9IG5ldyBTdmVsdCh7dGFyZ2V0fSlcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGNvbnN0IGJjb2xvciA9IHBhc3RlbFtiZ11cclxuICAgIHRhcmdldC5zdHlsZSA9IGBkaXNwbGF5OiBibG9jayR7YmNvbG9yID8gJztiYWNrZ3JvdW5kOicrYmNvbG9yIDogJyd9O2BcclxuICAgIGNlbnRlciA9IHRydWVcclxuICB9LCAwKVxyXG59XHJcblxyXG5mdW5jdGlvbiBob3RLZXlzKG9iaikge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufVxyXG5cclxud2luZG93Lm1pdG0uZm4ubWFjcm9BdXRvbWF0aW9uID0gbWFjcm9BdXRvbWF0aW9uXHJcbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBob3RLZXlzXHJcbndpbmRvdy5taXRtLmZuLnN2ZWx0ZSA9IHN2ZWx0ZVxyXG53aW5kb3cubWl0bS5mbi5wbGF5ID0gcGxheVxyXG53aW5kb3cubWl0bS5mbi53YWl0ID0gd2FpdFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3c0xvY2F0aW9uXHJcbiIsImZ1bmN0aW9uIGRlYm91bmNlIChmbiwgZGVsYXkgPSA1MDApIHtcclxuICBsZXQgX3RpbWVvdXRcclxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXHJcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXHJcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXHJcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcclxuICAgIH0sIGRlbGF5KVxyXG4gIH1cclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlXHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGxldCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXHJcbiAgY29uc3Qge19zdWJuczogc30gPSByb3V0ZS5fY2hpbGRuc1xyXG4gIGlmIChzICYmIG1pdG0ucm91dGVzW3NdKSB7XHJcbiAgICByb3V0ZT0gbWl0bS5yb3V0ZXNbc11cclxuICB9XHJcbiAgcmV0dXJuIHJvdXRlXHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBNdXRhdGlvbk9ic2VydmVyICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3NjcmVlbnNob3QnKVxyXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcclxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX3dzX3JvdXRlID0gcmVxdWlyZSgnLi9fd3Nfcm91dGUnKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgaWYgKGxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHNzaG90ID0ge31cclxuICBjb25zdCBub2RlcyA9IHt9XHJcblxyXG4gIGxldCByb3V0ZSA9IF93c19yb3V0ZSgpXHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgIGNvbnN0IHsgb2JzZXJ2ZXI6IG9iIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG9iKSB7XHJcbiAgICAgIGxldCBlbCA9IHt9XHJcbiAgICAgIGlmIChvYltpZF0gPT09IHRydWUpIHtcclxuICAgICAgICBlbCA9IHtcclxuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IHRydWUsXHJcbiAgICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH0gaWYgKHR5cGVvZiBvYltpZF0gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vY2FwdHVyZScsXHJcbiAgICAgICAgICBpbnNlcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgcmVtb3ZlOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxyXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcclxuICAgICAgICAgIGVsW2VdID0gdHJ1ZVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF1cclxuICAgICAgfVxyXG4gICAgICBzc2hvdFtpZF0gPSBlbFxyXG4gICAgICBub2Rlc1tpZF0gPSB7XHJcbiAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICByZW1vdmU6IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IG9iXHJcbiAgbGV0IGZuYW1lXHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxyXG4gIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcclxuICAgICAgb2IgPSByb3V0ZS5zY3JlZW5zaG90Lm9ic2VydmVyXHJcbiAgICB9XHJcbiAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIG5vZGVzKSB7XHJcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKVxyXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChvYiAmJiB0eXBlb2Ygb2JbaWRdPT09J2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjb25zdCBub2QgPSBlbFswXSB8fCBlbFxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudD09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG5vZC5fd3NfY291bnQgPSAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbm9kLl93c19jb3VudCArPSAxXHJcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PDIpIHtcclxuICAgICAgICAgICAgICBvYltpZF0obm9kKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IFxyXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcclxuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICAgICAgICAgIGZuYW1lID0gYH4ke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YFxyXG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH1cclxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoIW5vZGVzW2lkXS5yZW1vdmUpIHtcclxuICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSB0cnVlXHJcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gZmFsc2VcclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcclxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9XHJcbiAgICAgICAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBjb25zdCB7b2JzZXJ2ZXI6IG9ifSA9IHJvdXRlLnNjcmVlbnNob3RcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIGF0dHJpYnV0ZXM6IG9iID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWVcclxuICAgIH1cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoX3dzX2RlYm91bmNlKGNhbGxiYWNrLCAyODApKVxyXG4gICAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIG9wdGlvbnMpXHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG4iLCJjb25zdCB0NjQgPSAnV2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaaCdcclxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXHJcblxyXG5jb25zdCBuYW5vaWQgPSAoc2l6ZSA9IDgpID0+IHtcclxuICBsZXQgaWQgPSAnJ1xyXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XHJcbiAgICBpZCArPSB0NjRbTWF0aC5yYW5kb20oKSAqIDY0IHwgMF1cclxuICB9XHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgX3dzIH0gPSB3aW5kb3dcclxuXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcclxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCByZWdleCB9XHJcbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcclxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxyXG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19waW5nKCdIaSEnKVxyXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XHJcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxyXG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX2hlbHAoKVxyXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcclxuICAgIF93cy5zZW5kKCdfaGVscHt9JylcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcclxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfb3BlbiR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xyXG4gICAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXHJcbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXHJcbiAgICBjb25zdCBrZXkgPSBgJHtjbWR9OiR7aWR9YFxyXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSlcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xyXG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cclxuICAgICAgICBjb25zb2xlLmxvZygnJWNXczogd3MgdGltZW91dCEnLCBfYywga2V5KVxyXG4gICAgICB9XHJcbiAgICB9LCA1MDAwKVxyXG4gICAgXHJcbiAgICBjb25zdCBwYXJhbXMgPSBgJHtrZXl9JHtKU09OLnN0cmluZ2lmeSh7IGRhdGEgfSl9YFxyXG4gICAgY29uc3QgZmxhZyA9IHdpbmRvdy5taXRtLl9fZmxhZ1snd3MtbWVzc2FnZSddXHJcbiAgICBpZiAoZmxhZyA+IDEpIHtcclxuICAgICAgY29uc29sZS5sb2coYF93cy5zZW5kOiAke3BhcmFtc31gKVxyXG4gICAgfVxyXG4gICAgX3dzLnNlbmQocGFyYW1zKVxyXG4gIH1cclxuICBjb25zdCB3c3J1biA9IHt9XHJcbiAgY29uc3QgYXJyID0gd2luZG93Lm1pdG0ud3NydW5cclxuICBmb3IgKGNvbnN0IGsgb2YgYXJyKSB7XHJcbiAgICBjb25zdCBjbWQgID0gay5yZXBsYWNlKCckJywgJycpXHJcbiAgICB3c3J1bltjbWRdID0gKGRhdGEsIGhhbmRsZXIpID0+IHdpbmRvdy53c19fc2VuZChjbWQsIGRhdGEsIGhhbmRsZXIpXHJcbiAgfVxyXG4gIHdpbmRvdy5taXRtLndzcnVuID0gd3NydW5cclxufVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXHJcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxyXG5cclxubGV0IF90aW1lb3V0XHJcbmxldCBfY3NwID0ge31cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICAgIC5yZXBsYWNlKC9eXFwvLywgJycpXHJcbiAgICAgIC5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgY29uc3Qge1xyXG4gICAgICBibG9ja2VkVVJJLFxyXG4gICAgICBkaXNwb3NpdGlvbixcclxuICAgICAgZG9jdW1lbnRVUkksXHJcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcclxuICAgICAgb3JpZ2luYWxQb2xpY3ksXHJcbiAgICAgIHRpbWVTdGFtcCxcclxuICAgICAgdHlwZSxcclxuICAgICAgdmlvbGF0ZWREaXJlY3RpdmVcclxuICAgIH0gPSBlXHJcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcclxuICAgIGlmICghX2NzcFt0eXBdKSB7XHJcbiAgICAgIF9jc3BbdHlwXSA9IHt9XHJcbiAgICB9XHJcbiAgICBpZiAoIV9jc3BbdHlwXS5fZ2VuZXJhbF8pIHtcclxuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcclxuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxyXG4gICAgICAgIG5hbWVzcGFjZSxcclxuICAgICAgICBob3N0LFxyXG4gICAgICAgIHBhdGhcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXVxyXG4gICAgaWYgKCFfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSkge1xyXG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXHJcbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcclxuICAgICAgX2VycltibG9ja2VkVVJJXSA9IHt9XHJcbiAgICB9XHJcbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YClcclxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IF9tYXRjaCA/IF9tYXRjaFswXSA6IGVmZmVjdGl2ZURpcmVjdGl2ZVxyXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcclxuICAgICAgZGlyZWN0aXZlLFxyXG4gICAgICB0aW1lU3RhbXAsXHJcbiAgICAgIHR5cGVcclxuICAgIH1cclxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcclxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gQ1NQOicsIF9jc3ApXHJcbiAgICAgIC8vIHdpbmRvdy53c19fc2VuZCgnY3NwX2Vycm9yJywge1xyXG4gICAgICAvLyAgIG5hbWVzcGFjZSxcclxuICAgICAgLy8gICBob3N0LFxyXG4gICAgICAvLyAgIHBhdGgsXHJcbiAgICAgIC8vICAgX2NzcCxcclxuICAgICAgLy8gfSk7XHJcbiAgICAgIF9jc3AgPSB7fVxyXG4gICAgfSwgNDAwMClcclxuICB9XHJcblxyXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKVxyXG4gIH1cclxufVxyXG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxyXG4vLyBkb2N1bWVudFVSSTogXCJodHRwczovL3doYXQvaHRtbC9jb250YWluL2NzcFwiXHJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxyXG5cclxuLy8gYmxvY2tlZFVSSTogXCJodHRwczovL3doYXQvdXJsL2dldHRpbmcvYmxvY2tlZFwiXHJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcclxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxyXG4vLyB0aW1lU3RhbXA6IDE5MzMuODIwMDAwMDA1NjUzMVxyXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgaWYgKHdpbmRvdy5fd3NfY29ubmVjdD09PXVuZGVmaW5lZCkge1xyXG4gICAgd2luZG93Ll93c19jb25uZWN0ID0ge31cclxuICB9XHJcbiAgXHJcbiAgd2luZG93Lm1pdG0uZm4uYXV0b2NsaWNrID0gKCkgPT4ge1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgICB9LCAxMDAwKVxyXG4gIH1cclxuICBcclxuICB3aW5kb3cubWl0bS5mbi5nZXRDb29raWUgPSBuYW1lID0+IHtcclxuICAgIGNvbnN0IHZhbHVlID0gYDsgJHtkb2N1bWVudC5jb29raWV9YDtcclxuICAgIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQoYDsgJHtuYW1lfT1gKTtcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHJldHVybiBwYXJ0cy5wb3AoKS5zcGxpdCgnOycpLnNoaWZ0KCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbk1vdW50ID0gZSA9PiBjb25zb2xlLmxvZygnJWNNYWNyb3M6IGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCAnY29sb3I6ICM1YWRhNTUnLCBlKVxyXG4gIHdpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gb25Nb3VudFxyXG59XHJcbiIsImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmxldCBzcmNfdXJsX2VxdWFsX2FuY2hvcjtcbmZ1bmN0aW9uIHNyY191cmxfZXF1YWwoZWxlbWVudF9zcmMsIHVybCkge1xuICAgIGlmICghc3JjX3VybF9lcXVhbF9hbmNob3IpIHtcbiAgICAgICAgc3JjX3VybF9lcXVhbF9hbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgfVxuICAgIHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWYgPSB1cmw7XG4gICAgcmV0dXJuIGVsZW1lbnRfc3JjID09PSBzcmNfdXJsX2VxdWFsX2FuY2hvci5ocmVmO1xufVxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cbmZ1bmN0aW9uIGlzX2VtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG4gICAgaWYgKHN0b3JlICE9IG51bGwgJiYgdHlwZW9mIHN0b3JlLnN1YnNjcmliZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke25hbWV9JyBpcyBub3QgYSBzdG9yZSB3aXRoIGEgJ3N1YnNjcmliZScgbWV0aG9kYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3Vic2NyaWJlKHN0b3JlLCAuLi5jYWxsYmFja3MpIHtcbiAgICBpZiAoc3RvcmUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoLi4uY2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdW5zdWIudW5zdWJzY3JpYmUgPyAoKSA9PiB1bnN1Yi51bnN1YnNjcmliZSgpIDogdW5zdWI7XG59XG5mdW5jdGlvbiBnZXRfc3RvcmVfdmFsdWUoc3RvcmUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgc3Vic2NyaWJlKHN0b3JlLCBfID0+IHZhbHVlID0gXykoKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiBjb21wb25lbnRfc3Vic2NyaWJlKGNvbXBvbmVudCwgc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kucHVzaChzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBjcmVhdGVfc2xvdChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jdHggPSBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pO1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvblswXShzbG90X2N0eCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgcmV0dXJuIGRlZmluaXRpb25bMV0gJiYgZm5cbiAgICAgICAgPyBhc3NpZ24oJCRzY29wZS5jdHguc2xpY2UoKSwgZGVmaW5pdGlvblsxXShmbihjdHgpKSlcbiAgICAgICAgOiAkJHNjb3BlLmN0eDtcbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NoYW5nZXMoZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb25bMl0gJiYgZm4pIHtcbiAgICAgICAgY29uc3QgbGV0cyA9IGRlZmluaXRpb25bMl0oZm4oZGlydHkpKTtcbiAgICAgICAgaWYgKCQkc2NvcGUuZGlydHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGxldHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsZXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gW107XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1heCgkJHNjb3BlLmRpcnR5Lmxlbmd0aCwgbGV0cy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZFtpXSA9ICQkc2NvcGUuZGlydHlbaV0gfCBsZXRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJCRzY29wZS5kaXJ0eSB8IGxldHM7XG4gICAgfVxuICAgIHJldHVybiAkJHNjb3BlLmRpcnR5O1xufVxuZnVuY3Rpb24gdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKSB7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIHVwZGF0ZV9zbG90X2Jhc2Uoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIHNsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG59XG5mdW5jdGlvbiBnZXRfYWxsX2RpcnR5X2Zyb21fc2NvcGUoJCRzY29wZSkge1xuICAgIGlmICgkJHNjb3BlLmN0eC5sZW5ndGggPiAzMikge1xuICAgICAgICBjb25zdCBkaXJ0eSA9IFtdO1xuICAgICAgICBjb25zdCBsZW5ndGggPSAkJHNjb3BlLmN0eC5sZW5ndGggLyAzMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGlydHlbaV0gPSAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9yZXN0X3Byb3BzKHByb3BzLCBrZXlzKSB7XG4gICAgY29uc3QgcmVzdCA9IHt9O1xuICAgIGtleXMgPSBuZXcgU2V0KGtleXMpO1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKCFrZXlzLmhhcyhrKSAmJiBrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3Q7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Nsb3RzKHNsb3RzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gc2xvdHMpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIFRyYWNrIHdoaWNoIG5vZGVzIGFyZSBjbGFpbWVkIGR1cmluZyBoeWRyYXRpb24uIFVuY2xhaW1lZCBub2RlcyBjYW4gdGhlbiBiZSByZW1vdmVkIGZyb20gdGhlIERPTVxuLy8gYXQgdGhlIGVuZCBvZiBoeWRyYXRpb24gd2l0aG91dCB0b3VjaGluZyB0aGUgcmVtYWluaW5nIG5vZGVzLlxubGV0IGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xuZnVuY3Rpb24gc3RhcnRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IHRydWU7XG59XG5mdW5jdGlvbiBlbmRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xufVxuZnVuY3Rpb24gdXBwZXJfYm91bmQobG93LCBoaWdoLCBrZXksIHZhbHVlKSB7XG4gICAgLy8gUmV0dXJuIGZpcnN0IGluZGV4IG9mIHZhbHVlIGxhcmdlciB0aGFuIGlucHV0IHZhbHVlIGluIHRoZSByYW5nZSBbbG93LCBoaWdoKVxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICAgIGNvbnN0IG1pZCA9IGxvdyArICgoaGlnaCAtIGxvdykgPj4gMSk7XG4gICAgICAgIGlmIChrZXkobWlkKSA8PSB2YWx1ZSkge1xuICAgICAgICAgICAgbG93ID0gbWlkICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhpZ2ggPSBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbn1cbmZ1bmN0aW9uIGluaXRfaHlkcmF0ZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0Lmh5ZHJhdGVfaW5pdClcbiAgICAgICAgcmV0dXJuO1xuICAgIHRhcmdldC5oeWRyYXRlX2luaXQgPSB0cnVlO1xuICAgIC8vIFdlIGtub3cgdGhhdCBhbGwgY2hpbGRyZW4gaGF2ZSBjbGFpbV9vcmRlciB2YWx1ZXMgc2luY2UgdGhlIHVuY2xhaW1lZCBoYXZlIGJlZW4gZGV0YWNoZWQgaWYgdGFyZ2V0IGlzIG5vdCA8aGVhZD5cbiAgICBsZXQgY2hpbGRyZW4gPSB0YXJnZXQuY2hpbGROb2RlcztcbiAgICAvLyBJZiB0YXJnZXQgaXMgPGhlYWQ+LCB0aGVyZSBtYXkgYmUgY2hpbGRyZW4gd2l0aG91dCBjbGFpbV9vcmRlclxuICAgIGlmICh0YXJnZXQubm9kZU5hbWUgPT09ICdIRUFEJykge1xuICAgICAgICBjb25zdCBteUNoaWxkcmVuID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChub2RlLmNsYWltX29yZGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBteUNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW4gPSBteUNoaWxkcmVuO1xuICAgIH1cbiAgICAvKlxuICAgICogUmVvcmRlciBjbGFpbWVkIGNoaWxkcmVuIG9wdGltYWxseS5cbiAgICAqIFdlIGNhbiByZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5IGJ5IGZpbmRpbmcgdGhlIGxvbmdlc3Qgc3Vic2VxdWVuY2Ugb2ZcbiAgICAqIG5vZGVzIHRoYXQgYXJlIGFscmVhZHkgY2xhaW1lZCBpbiBvcmRlciBhbmQgb25seSBtb3ZpbmcgdGhlIHJlc3QuIFRoZSBsb25nZXN0XG4gICAgKiBzdWJzZXF1ZW5jZSBzdWJzZXF1ZW5jZSBvZiBub2RlcyB0aGF0IGFyZSBjbGFpbWVkIGluIG9yZGVyIGNhbiBiZSBmb3VuZCBieVxuICAgICogY29tcHV0aW5nIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgLmNsYWltX29yZGVyIHZhbHVlcy5cbiAgICAqXG4gICAgKiBUaGlzIGFsZ29yaXRobSBpcyBvcHRpbWFsIGluIGdlbmVyYXRpbmcgdGhlIGxlYXN0IGFtb3VudCBvZiByZW9yZGVyIG9wZXJhdGlvbnNcbiAgICAqIHBvc3NpYmxlLlxuICAgICpcbiAgICAqIFByb29mOlxuICAgICogV2Uga25vdyB0aGF0LCBnaXZlbiBhIHNldCBvZiByZW9yZGVyaW5nIG9wZXJhdGlvbnMsIHRoZSBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlXG4gICAgKiBhbHdheXMgZm9ybSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLCBzaW5jZSB0aGV5IGRvIG5vdCBtb3ZlIGFtb25nIGVhY2ggb3RoZXJcbiAgICAqIG1lYW5pbmcgdGhhdCB0aGV5IG11c3QgYmUgYWxyZWFkeSBvcmRlcmVkIGFtb25nIGVhY2ggb3RoZXIuIFRodXMsIHRoZSBtYXhpbWFsXG4gICAgKiBzZXQgb2Ygbm9kZXMgdGhhdCBkbyBub3QgbW92ZSBmb3JtIGEgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLlxuICAgICovXG4gICAgLy8gQ29tcHV0ZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICAvLyBtOiBzdWJzZXF1ZW5jZSBsZW5ndGggaiA9PiBpbmRleCBrIG9mIHNtYWxsZXN0IHZhbHVlIHRoYXQgZW5kcyBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGxlbmd0aCBqXG4gICAgY29uc3QgbSA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCArIDEpO1xuICAgIC8vIFByZWRlY2Vzc29yIGluZGljZXMgKyAxXG4gICAgY29uc3QgcCA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgbVswXSA9IC0xO1xuICAgIGxldCBsb25nZXN0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBjaGlsZHJlbltpXS5jbGFpbV9vcmRlcjtcbiAgICAgICAgLy8gRmluZCB0aGUgbGFyZ2VzdCBzdWJzZXF1ZW5jZSBsZW5ndGggc3VjaCB0aGF0IGl0IGVuZHMgaW4gYSB2YWx1ZSBsZXNzIHRoYW4gb3VyIGN1cnJlbnQgdmFsdWVcbiAgICAgICAgLy8gdXBwZXJfYm91bmQgcmV0dXJucyBmaXJzdCBncmVhdGVyIHZhbHVlLCBzbyB3ZSBzdWJ0cmFjdCBvbmVcbiAgICAgICAgLy8gd2l0aCBmYXN0IHBhdGggZm9yIHdoZW4gd2UgYXJlIG9uIHRoZSBjdXJyZW50IGxvbmdlc3Qgc3Vic2VxdWVuY2VcbiAgICAgICAgY29uc3Qgc2VxTGVuID0gKChsb25nZXN0ID4gMCAmJiBjaGlsZHJlblttW2xvbmdlc3RdXS5jbGFpbV9vcmRlciA8PSBjdXJyZW50KSA/IGxvbmdlc3QgKyAxIDogdXBwZXJfYm91bmQoMSwgbG9uZ2VzdCwgaWR4ID0+IGNoaWxkcmVuW21baWR4XV0uY2xhaW1fb3JkZXIsIGN1cnJlbnQpKSAtIDE7XG4gICAgICAgIHBbaV0gPSBtW3NlcUxlbl0gKyAxO1xuICAgICAgICBjb25zdCBuZXdMZW4gPSBzZXFMZW4gKyAxO1xuICAgICAgICAvLyBXZSBjYW4gZ3VhcmFudGVlIHRoYXQgY3VycmVudCBpcyB0aGUgc21hbGxlc3QgdmFsdWUuIE90aGVyd2lzZSwgd2Ugd291bGQgaGF2ZSBnZW5lcmF0ZWQgYSBsb25nZXIgc2VxdWVuY2UuXG4gICAgICAgIG1bbmV3TGVuXSA9IGk7XG4gICAgICAgIGxvbmdlc3QgPSBNYXRoLm1heChuZXdMZW4sIGxvbmdlc3QpO1xuICAgIH1cbiAgICAvLyBUaGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIG5vZGVzIChpbml0aWFsbHkgcmV2ZXJzZWQpXG4gICAgY29uc3QgbGlzID0gW107XG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIG5vZGVzLCBub2RlcyB0aGF0IHdpbGwgYmUgbW92ZWRcbiAgICBjb25zdCB0b01vdmUgPSBbXTtcbiAgICBsZXQgbGFzdCA9IGNoaWxkcmVuLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgY3VyID0gbVtsb25nZXN0XSArIDE7IGN1ciAhPSAwOyBjdXIgPSBwW2N1ciAtIDFdKSB7XG4gICAgICAgIGxpcy5wdXNoKGNoaWxkcmVuW2N1ciAtIDFdKTtcbiAgICAgICAgZm9yICg7IGxhc3QgPj0gY3VyOyBsYXN0LS0pIHtcbiAgICAgICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0LS07XG4gICAgfVxuICAgIGZvciAoOyBsYXN0ID49IDA7IGxhc3QtLSkge1xuICAgICAgICB0b01vdmUucHVzaChjaGlsZHJlbltsYXN0XSk7XG4gICAgfVxuICAgIGxpcy5yZXZlcnNlKCk7XG4gICAgLy8gV2Ugc29ydCB0aGUgbm9kZXMgYmVpbmcgbW92ZWQgdG8gZ3VhcmFudGVlIHRoYXQgdGhlaXIgaW5zZXJ0aW9uIG9yZGVyIG1hdGNoZXMgdGhlIGNsYWltIG9yZGVyXG4gICAgdG9Nb3ZlLnNvcnQoKGEsIGIpID0+IGEuY2xhaW1fb3JkZXIgLSBiLmNsYWltX29yZGVyKTtcbiAgICAvLyBGaW5hbGx5LCB3ZSBtb3ZlIHRoZSBub2Rlc1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHRvTW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB3aGlsZSAoaiA8IGxpcy5sZW5ndGggJiYgdG9Nb3ZlW2ldLmNsYWltX29yZGVyID49IGxpc1tqXS5jbGFpbV9vcmRlcikge1xuICAgICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuY2hvciA9IGogPCBsaXMubGVuZ3RoID8gbGlzW2pdIDogbnVsbDtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZSh0b01vdmVbaV0sIGFuY2hvcik7XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXModGFyZ2V0LCBzdHlsZV9zaGVldF9pZCwgc3R5bGVzKSB7XG4gICAgY29uc3QgYXBwZW5kX3N0eWxlc190byA9IGdldF9yb290X2Zvcl9zdHlsZSh0YXJnZXQpO1xuICAgIGlmICghYXBwZW5kX3N0eWxlc190by5nZXRFbGVtZW50QnlJZChzdHlsZV9zaGVldF9pZCkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9IHN0eWxlX3NoZWV0X2lkO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHN0eWxlcztcbiAgICAgICAgYXBwZW5kX3N0eWxlc2hlZXQoYXBwZW5kX3N0eWxlc190bywgc3R5bGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9yb290X2Zvcl9zdHlsZShub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgY29uc3Qgcm9vdCA9IG5vZGUuZ2V0Um9vdE5vZGUgPyBub2RlLmdldFJvb3ROb2RlKCkgOiBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgaWYgKHJvb3QgJiYgcm9vdC5ob3N0KSB7XG4gICAgICAgIHJldHVybiByb290O1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5vd25lckRvY3VtZW50O1xufVxuZnVuY3Rpb24gYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQobm9kZSkge1xuICAgIGNvbnN0IHN0eWxlX2VsZW1lbnQgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgIGFwcGVuZF9zdHlsZXNoZWV0KGdldF9yb290X2Zvcl9zdHlsZShub2RlKSwgc3R5bGVfZWxlbWVudCk7XG4gICAgcmV0dXJuIHN0eWxlX2VsZW1lbnQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfc3R5bGVzaGVldChub2RlLCBzdHlsZSkge1xuICAgIGFwcGVuZChub2RlLmhlYWQgfHwgbm9kZSwgc3R5bGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpIHtcbiAgICBpZiAoaXNfaHlkcmF0aW5nKSB7XG4gICAgICAgIGluaXRfaHlkcmF0ZSh0YXJnZXQpO1xuICAgICAgICBpZiAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID09PSB1bmRlZmluZWQpIHx8ICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5wYXJlbnRFbGVtZW50ICE9PSB0YXJnZXQpKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuZmlyc3RDaGlsZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBTa2lwIG5vZGVzIG9mIHVuZGVmaW5lZCBvcmRlcmluZ1xuICAgICAgICB3aGlsZSAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkICE9PSBudWxsKSAmJiAodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQuY2xhaW1fb3JkZXIgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkKSB7XG4gICAgICAgICAgICAvLyBXZSBvbmx5IGluc2VydCBpZiB0aGUgb3JkZXJpbmcgb2YgdGhpcyBub2RlIHNob3VsZCBiZSBtb2RpZmllZCBvciB0aGUgcGFyZW50IG5vZGUgaXMgbm90IHRhcmdldFxuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCB8fCBub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGlmIChpc19oeWRyYXRpbmcgJiYgIWFuY2hvcikge1xuICAgICAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT0gYW5jaG9yKSB7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRydXN0ZWQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LmlzVHJ1c3RlZClcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19fdmFsdWUnKSB7XG4gICAgICAgICAgICBub2RlLnZhbHVlID0gbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdHlwZW9mIG5vZGVbcHJvcF0gPT09ICdib29sZWFuJyAmJiB2YWx1ZSA9PT0gJycgPyB0cnVlIDogdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCwgX192YWx1ZSwgY2hlY2tlZCkge1xuICAgIGNvbnN0IHZhbHVlID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIGlmICghY2hlY2tlZCkge1xuICAgICAgICB2YWx1ZS5kZWxldGUoX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGluaXRfY2xhaW1faW5mbyhub2Rlcykge1xuICAgIGlmIChub2Rlcy5jbGFpbV9pbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZXMuY2xhaW1faW5mbyA9IHsgbGFzdF9pbmRleDogMCwgdG90YWxfY2xhaW1lZDogMCB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsYWltX25vZGUobm9kZXMsIHByZWRpY2F0ZSwgcHJvY2Vzc05vZGUsIGNyZWF0ZU5vZGUsIGRvbnRVcGRhdGVMYXN0SW5kZXggPSBmYWxzZSkge1xuICAgIC8vIFRyeSB0byBmaW5kIG5vZGVzIGluIGFuIG9yZGVyIHN1Y2ggdGhhdCB3ZSBsZW5ndGhlbiB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCByZXN1bHROb2RlID0gKCgpID0+IHtcbiAgICAgICAgLy8gV2UgZmlyc3QgdHJ5IHRvIGZpbmQgYW4gZWxlbWVudCBhZnRlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAgIGZvciAobGV0IGkgPSBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXg7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcHJvY2Vzc05vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNbaV0gPSByZXBsYWNlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkb250VXBkYXRlTGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgdHJ5IHRvIGZpbmQgb25lIGJlZm9yZVxuICAgICAgICAvLyBXZSBpdGVyYXRlIGluIHJldmVyc2Ugc28gdGhhdCB3ZSBkb24ndCBnbyB0b28gZmFyIGJhY2tcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBzcGxpY2VkIGJlZm9yZSB0aGUgbGFzdF9pbmRleCwgd2UgZGVjcmVhc2UgaXRcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4LS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGNhbid0IGZpbmQgYW55IG1hdGNoaW5nIG5vZGUsIHdlIGNyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoKTtcbiAgICB9KSgpO1xuICAgIHJlc3VsdE5vZGUuY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkICs9IDE7XG4gICAgcmV0dXJuIHJlc3VsdE5vZGU7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGNyZWF0ZV9lbGVtZW50KSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVOYW1lID09PSBuYW1lLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCByZW1vdmUgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlLmZvckVhY2godiA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSh2KSk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSwgKCkgPT4gY3JlYXRlX2VsZW1lbnQobmFtZSkpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3ZnX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmdfZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAzLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhU3RyID0gJycgKyBkYXRhO1xuICAgICAgICBpZiAobm9kZS5kYXRhLnN0YXJ0c1dpdGgoZGF0YVN0cikpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmRhdGEubGVuZ3RoICE9PSBkYXRhU3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnNwbGl0VGV4dChkYXRhU3RyLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSBkYXRhU3RyO1xuICAgICAgICB9XG4gICAgfSwgKCkgPT4gdGV4dChkYXRhKSwgdHJ1ZSAvLyBUZXh0IG5vZGVzIHNob3VsZCBub3QgdXBkYXRlIGxhc3QgaW5kZXggc2luY2UgaXQgaXMgbGlrZWx5IG5vdCB3b3J0aCBpdCB0byBlbGltaW5hdGUgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBhY3R1YWwgZWxlbWVudHNcbiAgICApO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIGZpbmRfY29tbWVudChub2RlcywgdGV4dCwgc3RhcnQpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIGNvbW1lbnQgbm9kZSAqLyAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGNsYWltX2h0bWxfdGFnKG5vZGVzKSB7XG4gICAgLy8gZmluZCBodG1sIG9wZW5pbmcgdGFnXG4gICAgY29uc3Qgc3RhcnRfaW5kZXggPSBmaW5kX2NvbW1lbnQobm9kZXMsICdIVE1MX1RBR19TVEFSVCcsIDApO1xuICAgIGNvbnN0IGVuZF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX0VORCcsIHN0YXJ0X2luZGV4KTtcbiAgICBpZiAoc3RhcnRfaW5kZXggPT09IGVuZF9pbmRleCkge1xuICAgICAgICByZXR1cm4gbmV3IEh0bWxUYWdIeWRyYXRpb24oKTtcbiAgICB9XG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCBodG1sX3RhZ19ub2RlcyA9IG5vZGVzLnNwbGljZShzdGFydF9pbmRleCwgZW5kX2luZGV4ICsgMSk7XG4gICAgZGV0YWNoKGh0bWxfdGFnX25vZGVzWzBdKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbaHRtbF90YWdfbm9kZXMubGVuZ3RoIC0gMV0pO1xuICAgIGNvbnN0IGNsYWltZWRfbm9kZXMgPSBodG1sX3RhZ19ub2Rlcy5zbGljZSgxLCBodG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBuLmNsYWltX29yZGVyID0gbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkO1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKGNsYWltZWRfbm9kZXMpO1xufVxuZnVuY3Rpb24gc2V0X2RhdGEodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ICE9PSBkYXRhKVxuICAgICAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gLTE7IC8vIG5vIG9wdGlvbiBzaG91bGQgYmUgc2VsZWN0ZWRcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuLy8gdW5mb3J0dW5hdGVseSB0aGlzIGNhbid0IGJlIGEgY29uc3RhbnQgYXMgdGhhdCB3b3VsZG4ndCBiZSB0cmVlLXNoYWtlYWJsZVxuLy8gc28gd2UgY2FjaGUgdGhlIHJlc3VsdCBpbnN0ZWFkXG5sZXQgY3Jvc3NvcmlnaW47XG5mdW5jdGlvbiBpc19jcm9zc29yaWdpbigpIHtcbiAgICBpZiAoY3Jvc3NvcmlnaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjcm9zc29yaWdpbiA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjcm9zc29yaWdpbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNyb3Nzb3JpZ2luO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihub2RlLCBmbikge1xuICAgIGNvbnN0IGNvbXB1dGVkX3N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICAnb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGlmcmFtZS50YWJJbmRleCA9IC0xO1xuICAgIGNvbnN0IGNyb3Nzb3JpZ2luID0gaXNfY3Jvc3NvcmlnaW4oKTtcbiAgICBsZXQgdW5zdWJzY3JpYmU7XG4gICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSBcImRhdGE6dGV4dC9odG1sLDxzY3JpcHQ+b25yZXNpemU9ZnVuY3Rpb24oKXtwYXJlbnQucG9zdE1lc3NhZ2UoMCwnKicpfTwvc2NyaXB0PlwiO1xuICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3Rlbih3aW5kb3csICdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBpZnJhbWUuY29udGVudFdpbmRvdylcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBpZnJhbWUub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4oaWZyYW1lLmNvbnRlbnRXaW5kb3csICdyZXNpemUnLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFwcGVuZChub2RlLCBpZnJhbWUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bnN1YnNjcmliZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXRhY2goaWZyYW1lKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgYnViYmxlcyA9IGZhbHNlKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGJ1YmJsZXMsIGZhbHNlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuZnVuY3Rpb24gcXVlcnlfc2VsZWN0b3JfYWxsKHNlbGVjdG9yLCBwYXJlbnQgPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgIH1cbiAgICBtKGh0bWwsIHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBpZiAoIXRoaXMuZSkge1xuICAgICAgICAgICAgdGhpcy5lID0gZWxlbWVudCh0YXJnZXQubm9kZU5hbWUpO1xuICAgICAgICAgICAgdGhpcy50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5jKGh0bWwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaShhbmNob3IpO1xuICAgIH1cbiAgICBoKGh0bWwpIHtcbiAgICAgICAgdGhpcy5lLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMubiA9IEFycmF5LmZyb20odGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB0aGlzLmkodGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5jbGFzcyBIdG1sVGFnSHlkcmF0aW9uIGV4dGVuZHMgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgICAgICB0aGlzLmwgPSBjbGFpbWVkX25vZGVzO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgaWYgKHRoaXMubCkge1xuICAgICAgICAgICAgdGhpcy5uID0gdGhpcy5sO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3VwZXIuYyhodG1sKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0X2h5ZHJhdGlvbih0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGF0dHJpYnV0ZV90b19vYmplY3QoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmVzdWx0W2F0dHJpYnV0ZS5uYW1lXSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMoZWxlbWVudCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIHJlc3VsdFtub2RlLnNsb3QgfHwgJ2RlZmF1bHQnXSA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgYWN0aXZlX2RvY3MgPSBuZXcgU2V0KCk7XG5sZXQgYWN0aXZlID0gMDtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGNvbnN0IGRvYyA9IGdldF9yb290X2Zvcl9zdHlsZShub2RlKTtcbiAgICBhY3RpdmVfZG9jcy5hZGQoZG9jKTtcbiAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgfHwgKGRvYy5fX3N2ZWx0ZV9zdHlsZXNoZWV0ID0gYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQobm9kZSkuc2hlZXQpO1xuICAgIGNvbnN0IGN1cnJlbnRfcnVsZXMgPSBkb2MuX19zdmVsdGVfcnVsZXMgfHwgKGRvYy5fX3N2ZWx0ZV9ydWxlcyA9IHt9KTtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgY3VycmVudF9ydWxlc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIHN0eWxlc2hlZXQuaW5zZXJ0UnVsZShgQGtleWZyYW1lcyAke25hbWV9ICR7cnVsZX1gLCBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnO1xuICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gYCR7YW5pbWF0aW9uID8gYCR7YW5pbWF0aW9ufSwgYCA6ICcnfSR7bmFtZX0gJHtkdXJhdGlvbn1tcyBsaW5lYXIgJHtkZWxheX1tcyAxIGJvdGhgO1xuICAgIGFjdGl2ZSArPSAxO1xuICAgIHJldHVybiBuYW1lO1xufVxuZnVuY3Rpb24gZGVsZXRlX3J1bGUobm9kZSwgbmFtZSkge1xuICAgIGNvbnN0IHByZXZpb3VzID0gKG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnKS5zcGxpdCgnLCAnKTtcbiAgICBjb25zdCBuZXh0ID0gcHJldmlvdXMuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKTtcbiAgICBjb25zdCBkZWxldGVkID0gcHJldmlvdXMubGVuZ3RoIC0gbmV4dC5sZW5ndGg7XG4gICAgaWYgKGRlbGV0ZWQpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBuZXh0LmpvaW4oJywgJyk7XG4gICAgICAgIGFjdGl2ZSAtPSBkZWxldGVkO1xuICAgICAgICBpZiAoIWFjdGl2ZSlcbiAgICAgICAgICAgIGNsZWFyX3J1bGVzKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xlYXJfcnVsZXMoKSB7XG4gICAgcmFmKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgYWN0aXZlX2RvY3MuZm9yRWFjaChkb2MgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IGRvYy5fX3N2ZWx0ZV9zdHlsZXNoZWV0O1xuICAgICAgICAgICAgbGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICAgICAgZG9jLl9fc3ZlbHRlX3J1bGVzID0ge307XG4gICAgICAgIH0pO1xuICAgICAgICBhY3RpdmVfZG9jcy5jbGVhcigpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfYW5pbWF0aW9uKG5vZGUsIGZyb20sIGZuLCBwYXJhbXMpIHtcbiAgICBpZiAoIWZyb20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHRvID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoZnJvbS5sZWZ0ID09PSB0by5sZWZ0ICYmIGZyb20ucmlnaHQgPT09IHRvLnJpZ2h0ICYmIGZyb20udG9wID09PSB0by50b3AgJiYgZnJvbS5ib3R0b20gPT09IHRvLmJvdHRvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBzaG91bGQgdGhpcyBiZSBzZXBhcmF0ZWQgZnJvbSBkZXN0cnVjdHVyaW5nPyBPciBzdGFydC9lbmQgYWRkZWQgdG8gcHVibGljIGFwaSBhbmQgZG9jdW1lbnRhdGlvbj9cbiAgICBzdGFydDogc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzpcbiAgICBlbmQgPSBzdGFydF90aW1lICsgZHVyYXRpb24sIHRpY2sgPSBub29wLCBjc3MgfSA9IGZuKG5vZGUsIHsgZnJvbSwgdG8gfSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBsZXQgbmFtZTtcbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVsYXkpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBuYW1lKTtcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgIH1cbiAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgIGlmICghc3RhcnRlZCAmJiBub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgbm93ID49IGVuZCkge1xuICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHN0YXJ0X3RpbWU7XG4gICAgICAgICAgICBjb25zdCB0ID0gMCArIDEgKiBlYXNpbmcocCAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHN0YXJ0KCk7XG4gICAgdGljaygwLCAxKTtcbiAgICByZXR1cm4gc3RvcDtcbn1cbmZ1bmN0aW9uIGZpeF9wb3NpdGlvbihub2RlKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChzdHlsZS5wb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyAmJiBzdHlsZS5wb3NpdGlvbiAhPT0gJ2ZpeGVkJykge1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHN0eWxlO1xuICAgICAgICBjb25zdCBhID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGFkZF90cmFuc2Zvcm0obm9kZSwgYSk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkX3RyYW5zZm9ybShub2RlLCBhKSB7XG4gICAgY29uc3QgYiA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGEubGVmdCAhPT0gYi5sZWZ0IHx8IGEudG9wICE9PSBiLnRvcCkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgICAgIG5vZGUuc3R5bGUudHJhbnNmb3JtID0gYCR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHthLmxlZnQgLSBiLmxlZnR9cHgsICR7YS50b3AgLSBiLnRvcH1weClgO1xuICAgIH1cbn1cblxubGV0IGN1cnJlbnRfY29tcG9uZW50O1xuZnVuY3Rpb24gc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIGN1cnJlbnRfY29tcG9uZW50ID0gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkge1xuICAgIGlmICghY3VycmVudF9jb21wb25lbnQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24gY2FsbGVkIG91dHNpZGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uJyk7XG4gICAgcmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuZnVuY3Rpb24gYmVmb3JlVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYmVmb3JlX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25EZXN0cm95KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fZGVzdHJveS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5zZXQoa2V5LCBjb250ZXh0KTtcbn1cbmZ1bmN0aW9uIGdldENvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuZ2V0KGtleSk7XG59XG5mdW5jdGlvbiBnZXRBbGxDb250ZXh0cygpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dDtcbn1cbmZ1bmN0aW9uIGhhc0NvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuaGFzKGtleSk7XG59XG4vLyBUT0RPIGZpZ3VyZSBvdXQgaWYgd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0XG4vLyBzaG9ydGhhbmQgZXZlbnRzLCBvciBpZiB3ZSB3YW50IHRvIGltcGxlbWVudFxuLy8gYSByZWFsIGJ1YmJsaW5nIG1lY2hhbmlzbVxuZnVuY3Rpb24gYnViYmxlKGNvbXBvbmVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW2V2ZW50LnR5cGVdO1xuICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuLmNhbGwodGhpcywgZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmxldCBmbHVzaGluZyA9IGZhbHNlO1xuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBpZiAoZmx1c2hpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSk7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKGdvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgY29uc3QgZ3JvdXAgPSBvdXRyb3M7XG4gICAgZ3JvdXAuciArPSAxO1xuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAxLCAwLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnc3RhcnQnKSk7XG4gICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIS0tZ3JvdXAucikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIHJlc3VsdCBpbiBgZW5kKClgIGJlaW5nIGNhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gY2xlYW4gdXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxIC0gdCwgdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgIGdvKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW5kKHJlc2V0KSB7XG4gICAgICAgICAgICBpZiAocmVzZXQgJiYgY29uZmlnLnRpY2spIHtcbiAgICAgICAgICAgICAgICBjb25maWcudGljaygxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcywgaW50cm8pIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgdCA9IGludHJvID8gMCA6IDE7XG4gICAgbGV0IHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lID0gbnVsbDtcbiAgICBmdW5jdGlvbiBjbGVhcl9hbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5pdChwcm9ncmFtLCBkdXJhdGlvbikge1xuICAgICAgICBjb25zdCBkID0gKHByb2dyYW0uYiAtIHQpO1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzW2ldID09PSBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfYXdhaXRfYmxvY2tfYnJhbmNoKGluZm8sIGN0eCwgZGlydHkpIHtcbiAgICBjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcbiAgICBjb25zdCB7IHJlc29sdmVkIH0gPSBpbmZvO1xuICAgIGlmIChpbmZvLmN1cnJlbnQgPT09IGluZm8udGhlbikge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby52YWx1ZV0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby5jYXRjaCkge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby5lcnJvcl0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaW5mby5ibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xufVxuXG5jb25zdCBnbG9iYWxzID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgPyB3aW5kb3dcbiAgICA6IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICA/IGdsb2JhbFRoaXNcbiAgICAgICAgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9rZXlzKGN0eCwgbGlzdCwgZ2V0X2NvbnRleHQsIGdldF9rZXkpIHtcbiAgICBjb25zdCBrZXlzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSkpO1xuICAgICAgICBpZiAoa2V5cy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaGF2ZSBkdXBsaWNhdGUga2V5cyBpbiBhIGtleWVkIGVhY2gnKTtcbiAgICAgICAgfVxuICAgICAgICBrZXlzLmFkZChrZXkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpc21hcCcsXG4gICAgJ2xvb3AnLFxuICAgICdtdWx0aXBsZScsXG4gICAgJ211dGVkJyxcbiAgICAnbm9tb2R1bGUnLFxuICAgICdub3ZhbGlkYXRlJyxcbiAgICAnb3BlbicsXG4gICAgJ3BsYXlzaW5saW5lJyxcbiAgICAncmVhZG9ubHknLFxuICAgICdyZXF1aXJlZCcsXG4gICAgJ3JldmVyc2VkJyxcbiAgICAnc2VsZWN0ZWQnXG5dKTtcblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgY2xhc3Nlc190b19hZGQpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG4gICAgaWYgKGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmNsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICBlbHNlIGlmIChib29sZWFuX2F0dHJpYnV0ZXMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gYCAke25hbWV9PVwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gZXNjYXBlKHZhbHVlKSA6IHZhbHVlO1xufVxuZnVuY3Rpb24gZXNjYXBlX29iamVjdChvYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMsIGNvbnRleHQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKGNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCB7ICQkc2xvdHMgPSB7fSwgY29udGV4dCA9IG5ldyBNYXAoKSB9ID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdGl0bGU6ICcnLCBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgJCRzbG90cywgY29udGV4dCk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LnRpdGxlICsgcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7dmFsdWUgPT09IHRydWUgPyAnJyA6IGA9JHt0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkoZXNjYXBlKHZhbHVlKSkgOiBgXCIke3ZhbHVlfVwiYH1gfWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvciwgY3VzdG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICBpZiAoIWN1c3RvbUVsZW1lbnQpIHtcbiAgICAgICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBhcHBlbmRfc3R5bGVzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKG9wdGlvbnMuY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eSxcbiAgICAgICAgc2tpcF9ib3VuZDogZmFsc2UsXG4gICAgICAgIHJvb3Q6IG9wdGlvbnMudGFyZ2V0IHx8IHBhcmVudF9jb21wb25lbnQuJCQucm9vdFxuICAgIH07XG4gICAgYXBwZW5kX3N0eWxlcyAmJiBhcHBlbmRfc3R5bGVzKCQkLnJvb3QpO1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBvcHRpb25zLnByb3BzIHx8IHt9LCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgc3RhcnRfaHlkcmF0aW5nKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvciwgb3B0aW9ucy5jdXN0b21FbGVtZW50KTtcbiAgICAgICAgZW5kX2h5ZHJhdGluZygpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbl9tb3VudCB9ID0gdGhpcy4kJDtcbiAgICAgICAgICAgIHRoaXMuJCQub25fZGlzY29ubmVjdCA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QpO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cy4gVXNlZCB3aGVuIGRldj1mYWxzZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy40My4wJyB9LCBkZXRhaWwpLCB0cnVlKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9oeWRyYXRpb25fZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydF9oeWRyYXRpb24odGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbJ2NhcHR1cmUnXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGEnLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnICYmICEoYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIGFyZykpIHtcbiAgICAgICAgbGV0IG1zZyA9ICd7I2VhY2h9IG9ubHkgaXRlcmF0ZXMgb3ZlciBhcnJheS1saWtlIG9iamVjdHMuJztcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgYXJnICYmIFN5bWJvbC5pdGVyYXRvciBpbiBhcmcpIHtcbiAgICAgICAgICAgIG1zZyArPSAnIFlvdSBjYW4gdXNlIGEgc3ByZWFkIHRvIGNvbnZlcnQgdGhpcyBpdGVyYWJsZSBpbnRvIGFuIGFycmF5Lic7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfc2xvdHMobmFtZSwgc2xvdCwga2V5cykge1xuICAgIGZvciAoY29uc3Qgc2xvdF9rZXkgb2YgT2JqZWN0LmtleXMoc2xvdCkpIHtcbiAgICAgICAgaWYgKCF+a2V5cy5pbmRleE9mKHNsb3Rfa2V5KSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGA8JHtuYW1lfT4gcmVjZWl2ZWQgYW4gdW5leHBlY3RlZCBzbG90IFwiJHtzbG90X2tleX1cIi5gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgU3ZlbHRlIGNvbXBvbmVudHMgd2l0aCBzb21lIG1pbm9yIGRldi1lbmhhbmNlbWVudHMuIFVzZWQgd2hlbiBkZXY9dHJ1ZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50RGV2IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAoIW9wdGlvbnMudGFyZ2V0ICYmICFvcHRpb25zLiQkaW5saW5lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25cIik7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWQnKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxuICAgICRjYXB0dXJlX3N0YXRlKCkgeyB9XG4gICAgJGluamVjdF9zdGF0ZSgpIHsgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIHRvIGNyZWF0ZSBzdHJvbmdseSB0eXBlZCBTdmVsdGUgY29tcG9uZW50cy5cbiAqIFRoaXMgb25seSBleGlzdHMgZm9yIHR5cGluZyBwdXJwb3NlcyBhbmQgc2hvdWxkIGJlIHVzZWQgaW4gYC5kLnRzYCBmaWxlcy5cbiAqXG4gKiAjIyMgRXhhbXBsZTpcbiAqXG4gKiBZb3UgaGF2ZSBjb21wb25lbnQgbGlicmFyeSBvbiBucG0gY2FsbGVkIGBjb21wb25lbnQtbGlicmFyeWAsIGZyb20gd2hpY2hcbiAqIHlvdSBleHBvcnQgYSBjb21wb25lbnQgY2FsbGVkIGBNeUNvbXBvbmVudGAuIEZvciBTdmVsdGUrVHlwZVNjcmlwdCB1c2VycyxcbiAqIHlvdSB3YW50IHRvIHByb3ZpZGUgdHlwaW5ncy4gVGhlcmVmb3JlIHlvdSBjcmVhdGUgYSBgaW5kZXguZC50c2A6XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgU3ZlbHRlQ29tcG9uZW50VHlwZWQgfSBmcm9tIFwic3ZlbHRlXCI7XG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnRUeXBlZDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogYGBgXG4gKiBUeXBpbmcgdGhpcyBtYWtlcyBpdCBwb3NzaWJsZSBmb3IgSURFcyBsaWtlIFZTIENvZGUgd2l0aCB0aGUgU3ZlbHRlIGV4dGVuc2lvblxuICogdG8gcHJvdmlkZSBpbnRlbGxpc2Vuc2UgYW5kIHRvIHVzZSB0aGUgY29tcG9uZW50IGxpa2UgdGhpcyBpbiBhIFN2ZWx0ZSBmaWxlXG4gKiB3aXRoIFR5cGVTY3JpcHQ6XG4gKiBgYGBzdmVsdGVcbiAqIDxzY3JpcHQgbGFuZz1cInRzXCI+XG4gKiBcdGltcG9ydCB7IE15Q29tcG9uZW50IH0gZnJvbSBcImNvbXBvbmVudC1saWJyYXJ5XCI7XG4gKiA8L3NjcmlwdD5cbiAqIDxNeUNvbXBvbmVudCBmb289eydiYXInfSAvPlxuICogYGBgXG4gKlxuICogIyMjIyBXaHkgbm90IG1ha2UgdGhpcyBwYXJ0IG9mIGBTdmVsdGVDb21wb25lbnQoRGV2KWA/XG4gKiBCZWNhdXNlXG4gKiBgYGB0c1xuICogY2xhc3MgQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQ8e2Zvbzogc3RyaW5nfT4ge31cbiAqIGNvbnN0IGNvbXBvbmVudDogdHlwZW9mIFN2ZWx0ZUNvbXBvbmVudCA9IEFTdWJjbGFzc09mU3ZlbHRlQ29tcG9uZW50O1xuICogYGBgXG4gKiB3aWxsIHRocm93IGEgdHlwZSBlcnJvciwgc28gd2UgbmVlZCB0byBzZXBhcmF0ZSB0aGUgbW9yZSBzdHJpY3RseSB0eXBlZCBjbGFzcy5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50VHlwZWQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnREZXYge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZmluaXRlIGxvb3AgZGV0ZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIEh0bWxUYWdIeWRyYXRpb24sIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVDb21wb25lbnRUeXBlZCwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldCwgYXBwZW5kX2h5ZHJhdGlvbiwgYXBwZW5kX2h5ZHJhdGlvbl9kZXYsIGFwcGVuZF9zdHlsZXMsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGF0dHJpYnV0ZV90b19vYmplY3QsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX2h0bWxfdGFnLCBjbGFpbV9zcGFjZSwgY2xhaW1fc3ZnX2VsZW1lbnQsIGNsYWltX3RleHQsIGNsZWFyX2xvb3BzLCBjb21wb25lbnRfc3Vic2NyaWJlLCBjb21wdXRlX3Jlc3RfcHJvcHMsIGNvbXB1dGVfc2xvdHMsIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgY3JlYXRlX2FuaW1hdGlvbiwgY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbiwgY3JlYXRlX2NvbXBvbmVudCwgY3JlYXRlX2luX3RyYW5zaXRpb24sIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbiwgY3JlYXRlX3Nsb3QsIGNyZWF0ZV9zc3JfY29tcG9uZW50LCBjdXJyZW50X2NvbXBvbmVudCwgY3VzdG9tX2V2ZW50LCBkYXRhc2V0X2RldiwgZGVidWcsIGRlc3Ryb3lfYmxvY2ssIGRlc3Ryb3lfY29tcG9uZW50LCBkZXN0cm95X2VhY2gsIGRldGFjaCwgZGV0YWNoX2FmdGVyX2RldiwgZGV0YWNoX2JlZm9yZV9kZXYsIGRldGFjaF9iZXR3ZWVuX2RldiwgZGV0YWNoX2RldiwgZGlydHlfY29tcG9uZW50cywgZGlzcGF0Y2hfZGV2LCBlYWNoLCBlbGVtZW50LCBlbGVtZW50X2lzLCBlbXB0eSwgZW5kX2h5ZHJhdGluZywgZXNjYXBlLCBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlLCBlc2NhcGVfb2JqZWN0LCBlc2NhcGVkLCBleGNsdWRlX2ludGVybmFsX3Byb3BzLCBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9wb3NpdGlvbiwgZmx1c2gsIGdldEFsbENvbnRleHRzLCBnZXRDb250ZXh0LCBnZXRfYWxsX2RpcnR5X2Zyb21fc2NvcGUsIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlLCBnZXRfY3VycmVudF9jb21wb25lbnQsIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMsIGdldF9yb290X2Zvcl9zdHlsZSwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc0NvbnRleHQsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnNlcnRfaHlkcmF0aW9uLCBpbnNlcnRfaHlkcmF0aW9uX2RldiwgaW50cm9zLCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciwgaXNfY2xpZW50LCBpc19jcm9zc29yaWdpbiwgaXNfZW1wdHksIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCBxdWVyeV9zZWxlY3Rvcl9hbGwsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzcmNfdXJsX2VxdWFsLCBzdGFydF9oeWRyYXRpbmcsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHRydXN0ZWQsIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2gsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdXBkYXRlX3Nsb3RfYmFzZSwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiY29uc3QgY3NwQXJyID0gW1xyXG4gICdkZWZhdWx0LXNyYycsXHJcbiAgJ2NoaWxkLXNyYycsXHJcbiAgJ2Nvbm5lY3Qtc3JjJyxcclxuICAnZm9udC1zcmMnLFxyXG4gICdmcmFtZS1zcmMnLFxyXG4gICdpbWctc3JjJyxcclxuICAnbWFuaWZlc3Qtc3JjJyxcclxuICAnbWVkaWEtc3JjJyxcclxuICAnb2JqZWN0LXNyYycsXHJcbiAgJ3ByZWZldGNoLXNyYycsXHJcbiAgJ3NjcmlwdC1zcmMnLFxyXG4gICdzY3JpcHQtc3JjLWVsZW0nLFxyXG4gICdzY3JpcHQtc3JjLWF0dHInLFxyXG4gICdzdHlsZS1zcmMnLFxyXG4gICdzdHlsZS1zcmMtZWxlbScsXHJcbiAgJ3N0eWxlLXNyYy1hdHRyJyxcclxuICAnd29ya2VyLXNyYycsXHJcbiAgJ2Jhc2UtdXJpJyxcclxuICAncGx1Z2luLXR5cGVzJyxcclxuICAnc2FuZGJveCcsXHJcbiAgJ25hdmlnYXRlLXRvJyxcclxuICAnZm9ybS1hY3Rpb24nLFxyXG4gICdmcmFtZS1hbmNlc3RvcnMnLFxyXG4gICd1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJyxcclxuICAncmVwb3J0LXVyaScsXHJcbiAgJ3JlcG9ydC10bycsXHJcbl1cclxuY29uc3QgY3NwRmV0Y2ggPSBbXHJcbiAgJ2RlZmF1bHQtc3JjJyxcclxuICAnY2hpbGQtc3JjJyxcclxuICAnY29ubmVjdC1zcmMnLFxyXG4gICdmb250LXNyYycsXHJcbiAgJ2ZyYW1lLXNyYycsXHJcbiAgJ2ltZy1zcmMnLFxyXG4gICdtYW5pZmVzdC1zcmMnLFxyXG4gICdtZWRpYS1zcmMnLFxyXG4gICdvYmplY3Qtc3JjJyxcclxuICAncHJlZmV0Y2gtc3JjJyxcclxuICAnc2NyaXB0LXNyYycsXHJcbiAgJ3N0eWxlLXNyYycsXHJcbiAgJ3dvcmtlci1zcmMnLFxyXG5dXHJcbmNvbnN0IGNzcEVBdHRyID0gW1xyXG4gICdzY3JpcHQtc3JjLWVsZW0nLFxyXG4gICdzY3JpcHQtc3JjLWF0dHInLFxyXG4gICdzdHlsZS1zcmMtZWxlbScsXHJcbiAgJ3N0eWxlLXNyYy1hdHRyJyxcclxuXVxyXG5jb25zdCBjc3BJbmZvID0ge1xyXG4gICdkZWZhdWx0LXNyYyc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9kZWZhdWx0LXNyYycsXHJcbiAgICBub3RlOiAnaXMgYSBmYWxsYmFjayBkaXJlY3RpdmUgZm9yIHRoZSBvdGhlciBmZXRjaCBkaXJlY3RpdmVzOiA8Yj5jaGlsZC1zcmM8L2I+LCA8Yj5jb25uZWN0LXNyYzwvYj4sIDxiPmZvbnQtc3JjPC9iPiwgPGI+aW1nLXNyYzwvYj4sIDxiPm1hbmlmZXN0LXNyYzwvYj4sIDxiPm1lZGlhLXNyYzwvYj4sIDxiPnByZWZldGNoLXNyYzwvYj4sIDxiPm9iamVjdC1zcmM8L2I+LCA8Yj5zY3JpcHQtc3JjKHNjcmlwdC1zcmMtZWxlbSwgc2NyaXB0LXNyYy1hdHRyKTwvYj4sIDxiPnN0eWxlLXNyYyhzdHlsZS1zcmMtZWxlbSwgc3R5bGUtc3JjLWF0dHIpPC9iPi4nXHJcbiAgfSxcclxuICAnY2hpbGQtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDIsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2NoaWxkLXNyYycsXHJcbiAgICBub3RlOiAnYWxsb3dzIHRoZSBkZXZlbG9wZXIgdG8gY29udHJvbCBuZXN0ZWQgYnJvd3NpbmcgY29udGV4dHMgYW5kIHdvcmtlciBleGVjdXRpb24gY29udGV4dHMuJ1xyXG4gIH0sXHJcbiAgJ2Nvbm5lY3Qtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Nvbm5lY3Qtc3JjJyxcclxuICAgIG5vdGU6ICdwcm92aWRlcyBjb250cm9sIG92ZXIgZmV0Y2ggcmVxdWVzdHMsIFhIUiwgZXZlbnRzb3VyY2UsIGJlYWNvbiBhbmQgd2Vic29ja2V0cyBjb25uZWN0aW9ucy4nXHJcbiAgfSxcclxuICAnZm9udC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZm9udC1zcmMnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB3aGljaCBVUkxzIHRvIGxvYWQgZm9udHMgZnJvbS4nXHJcbiAgfSxcclxuICAnZnJhbWUtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZyYW1lLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIG5lc3RlZCBicm93c2luZyBjb250ZXh0cyBsb2FkaW5nIHVzaW5nIGVsZW1lbnRzIHN1Y2ggYXMgJmx0O2ZyYW1lJmd0OyBhbmQgJmx0O2lmcmFtZSZndDsuJ1xyXG4gIH0sXHJcbiAgJ2ltZy1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvaW1nLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIHRoYXQgaW1hZ2VzIGNhbiBiZSBsb2FkZWQgZnJvbS4nXHJcbiAgfSxcclxuICAnbWFuaWZlc3Qtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDMsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L21hbmlmZXN0LXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIHRoYXQgYXBwbGljYXRpb24gbWFuaWZlc3RzIG1heSBiZSBsb2FkZWQgZnJvbS4nXHJcbiAgfSxcclxuICAnbWVkaWEtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L21lZGlhLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggdmlkZW8sIGF1ZGlvIGFuZCB0ZXh0IHRyYWNrIHJlc291cmNlcyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xyXG4gIH0sXHJcbiAgJ29iamVjdC1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvb2JqZWN0LXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcGx1Z2lucyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xyXG4gIH0sXHJcbiAgJ3ByZWZldGNoLXNyYyc6IHtcclxuICAgIGxldmVsOiAzLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9wcmVmZXRjaC1zcmMnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyBmcm9tIHdoaWNoIHJlc291cmNlcyBjYW4gYmUgcHJlZmV0Y2hlZCBmcm9tLidcclxuICB9LFxyXG4gICdzY3JpcHQtc3JjJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgbG9jYXRpb25zIGZyb20gd2hpY2ggYSBzY3JpcHQgY2FuIGJlIGV4ZWN1dGVkIGZyb20uIEl0IGlzIGEgZmFsbGJhY2sgZGlyZWN0aXZlIGZvciBvdGhlciBzY3JpcHQtbGlrZSBkaXJlY3RpdmVzOiA8Yj5zY3JpcHQtc3JjLWVsZW08L2I+LCA8Yj5zY3JpcHQtc3JjLWF0dHI8L2I+J1xyXG4gIH0sXHJcbiAgJ3NjcmlwdC1zcmMtZWxlbSc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zY3JpcHQtc3JjLWVsZW0nLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0ICZsdDtzY3JpcHQmZ3Q7IGVsZW1lbnRzLCBidXQgbm90IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLidcclxuICB9LFxyXG4gICdzY3JpcHQtc3JjLWF0dHInOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2NyaXB0LXNyYy1hdHRyJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgSmF2YVNjcmlwdCBpbmxpbmUgZXZlbnQgaGFuZGxlcnMuIFRoaXMgaW5jbHVkZXMgb25seSBpbmxpbmUgc2NyaXB0IGV2ZW50IGhhbmRsZXJzIGxpa2Ugb25jbGljaywgYnV0IG5vdCBVUkxzIGxvYWRlZCBkaXJlY3RseSBpbnRvICZsdDtzY3JpcHQmZ3Q7IGVsZW1lbnRzLidcclxuICB9LFxyXG4gICdzdHlsZS1zcmMnOiB7XHJcbiAgICBsZXZlbDogMSxcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcclxuICAgIG5vdGU6ICdjb250cm9scyBmcm9tIHdoZXJlIHN0eWxlcyBnZXQgYXBwbGllZCB0byBhIGRvY3VtZW50LiBUaGlzIGluY2x1ZGVzIDxsaW5rPiBlbGVtZW50cywgQGltcG9ydCBydWxlcywgYW5kIHJlcXVlc3RzIG9yaWdpbmF0aW5nIGZyb20gYSBMaW5rIEhUVFAgcmVzcG9uc2UgaGVhZGVyIGZpZWxkOiA8Yj5zdHlsZS1zcmMtZWxlbTwvYj4sIDxiPnN0eWxlLXNyYy1hdHRyPC9iPidcclxuICB9LFxyXG4gICdzdHlsZS1zcmMtZWxlbSc6IHtcclxuICAgIGxldmVsOiAxLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBzdHlsZXNoZWV0cyAmbHQ7c3R5bGUmZ3Q7IGVsZW1lbnRzIGFuZCAmbHQ7bGluayZndDsgZWxlbWVudHMgd2l0aCByZWw9XCJzdHlsZXNoZWV0XCIuJ1xyXG4gIH0sXHJcbiAgJ3N0eWxlLXNyYy1hdHRyJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXHJcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIGlubGluZSBzdHlsZXMgYXBwbGllZCB0byBpbmRpdmlkdWFsIERPTSBlbGVtZW50cy4nXHJcbiAgfSxcclxuICAnd29ya2VyLXNyYyc6IHtcclxuICAgIGxldmVsOiAzLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS93b3JrZXItc3JjJyxcclxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgV29ya2VyLCBTaGFyZWRXb3JrZXIsIG9yIFNlcnZpY2VXb3JrZXIgc2NyaXB0cy4nXHJcbiAgfSxcclxuICAnYmFzZS11cmknOiB7XHJcbiAgICBsZXZlbDogMixcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvYmFzZS11cmknLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgcG9zc2libGUgVVJMcyB0aGF0IHRoZSAmbHQ7YmFzZSZndDsgZWxlbWVudCBjYW4gdXNlLidcclxuICB9LFxyXG4gICdwbHVnaW4tdHlwZXMnOiB7XHJcbiAgICBsZXZlbDogMixcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcGx1Z2luLXR5cGVzJyxcclxuICAgIG5vdGU6ICdsaW1pdHMgdGhlIHR5cGVzIG9mIHJlc291cmNlcyB0aGF0IGNhbiBiZSBsb2FkZWQgaW50byB0aGUgZG9jdW1lbnQgKGUuZy4gYXBwbGljYXRpb24vcGRmKS4gMyBydWxlcyBhcHBseSB0byB0aGUgYWZmZWN0ZWQgZWxlbWVudHMsICZsdDtlbWJlZCZndDsgYW5kICZsdDtvYmplY3QmZ3Q7JyxcclxuICAgIGRlcHJlY2F0ZWQ6IHRydWVcclxuICB9LFxyXG4gICdzYW5kYm94Jzoge1xyXG4gICAgbGV2ZWw6ICcxLjEvMicsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NhbmRib3gnLFxyXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgcG9zc2libGUgVVJMcyB0aGF0IHRoZSAmbHQ7YmFzZSZndDsgZWxlbWVudCBjYW4gdXNlLidcclxuICB9LFxyXG4gICduYXZpZ2F0ZS10byc6IHtcclxuICAgIGxldmVsOiAzLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9uYXZpZ2F0ZS10bycsXHJcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHdoaWNoIGEgZG9jdW1lbnQgY2FuIG5hdmlnYXRlIHRvIGJ5IGFueSBtZWFuIChub3QgeWV0IHN1cHBvcnRlZCBieSBtb2Rlcm4gYnJvd3NlcnMgaW4gSmFuIDIwMjEpLidcclxuICB9LFxyXG4gICdmb3JtLWFjdGlvbic6IHtcclxuICAgIGxldmVsOiAyLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mb3JtLWFjdGlvbicsXHJcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHdoaWNoIHRoZSBmb3JtcyBjYW4gc3VibWl0IHRvLidcclxuICB9LFxyXG4gICdmcmFtZS1hbmNlc3RvcnMnOiB7XHJcbiAgICBsZXZlbDogMixcclxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZnJhbWUtYW5jZXN0b3JzJyxcclxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgdGhhdCBjYW4gZW1iZWQgdGhlIHJlcXVlc3RlZCByZXNvdXJjZSBpbnNpZGUgb2YgJmx0O2ZyYW1lJmd0OywgJmx0O2lmcmFtZSZndDssICZsdDtvYmplY3QmZ3Q7LCAmbHQ7ZW1iZWQmZ3Q7LCBvciAmbHQ7YXBwbGV0Jmd0OyBlbGVtZW50cy4nXHJcbiAgfSxcclxuICAndXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cyc6IHtcclxuICAgIGxldmVsOiAnPycsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnLFxyXG4gICAgbm90ZTogJ2luc3RydWN0cyB1c2VyIGFnZW50cyB0byB0cmVhdCBhbGwgb2YgYSBzaXRlXFwncyBpbnNlY3VyZSBVUkxzICh0aG9zZSBzZXJ2ZWQgb3ZlciBIVFRQKSBhcyB0aG91Z2ggdGhleSBoYXZlIGJlZW4gcmVwbGFjZWQgd2l0aCBzZWN1cmUgVVJMcyAodGhvc2Ugc2VydmVkIG92ZXIgSFRUUFMpLiBUaGlzIGRpcmVjdGl2ZSBpcyBpbnRlbmRlZCBmb3Igd2ViIHNpdGVzIHdpdGggbGFyZ2UgbnVtYmVycyBvZiBpbnNlY3VyZSBsZWdhY3kgVVJMcyB0aGF0IG5lZWQgdG8gYmUgcmV3cml0dGVuLidcclxuICB9LFxyXG4gICdyZXBvcnQtdXJpJzoge1xyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3JlcG9ydC11cmknLFxyXG4gICAgbm90ZTogJ2RpcmVjdGl2ZSBpcyBkZXByZWNhdGVkIGJ5IHJlcG9ydC10bywgd2hpY2ggaXMgYSBVUkkgdGhhdCB0aGUgcmVwb3J0cyBhcmUgc2VudCB0by4nLFxyXG4gICAgZGVwcmVjYXRlZDogdHJ1ZVxyXG4gIH0sXHJcbiAgJ3JlcG9ydC10byc6IHtcclxuICAgIGxldmVsOiAzLFxyXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9yZXBvcnQtdG8nLFxyXG4gICAgbm90ZTogJ3doaWNoIGlzIGEgZ3JvdXBuYW1lIGRlZmluZWQgaW4gdGhlIGhlYWRlciBpbiBhIGpzb24gZm9ybWF0dGVkIGhlYWRlciB2YWx1ZS4nXHJcbiAgfSxcclxufVxyXG5jb25zdCBwb2xpY3kgPSB7XHJcbiAgJ25vbmUnICA6ICdXb25cXCd0IGFsbG93IGxvYWRpbmcgb2YgYW55IHJlc291cmNlcy4nLFxyXG4gICdibG9iOicgOiAnUmF3IGRhdGEgdGhhdCBpc25cXCd0IG5lY2Vzc2FyaWx5IGluIGEgSmF2YVNjcmlwdC1uYXRpdmUgZm9ybWF0LicsXHJcbiAgJ2RhdGE6JyA6ICdPbmx5IGFsbG93IHJlc291cmNlcyBmcm9tIHRoZSBkYXRhIHNjaGVtZSAoaWU6IEJhc2U2NCBlbmNvZGVkIGltYWdlcykuJyxcclxuICBcIidzZWxmJ1wiOiAnT25seSBhbGxvdyByZXNvdXJjZXMgZnJvbSB0aGUgY3VycmVudCBvcmlnaW4uJyxcclxuICBcIid1bnNhZmUtaW5saW5lJ1wiOiAnJyxcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY3NwQXJyLFxyXG4gIGNzcEluZm8sXHJcbiAgY3NwRmV0Y2gsXHJcbiAgY3NwRUF0dHIsXHJcbiAgcG9saWN5LFxyXG59IiwiPHNjcmlwdD5cclxuaW1wb3J0IHtvbk1vdW50fSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQge1xyXG4gIGNzcEFycixcclxuICBjc3BJbmZvLFxyXG4gIGNzcEZldGNoLFxyXG4gIGNzcEVBdHRyLFxyXG59IGZyb20gJy4vQ3NwZGlyZWN0aXZlJ1xyXG5sZXQgY3NwID0gd2luZG93Lm1pdG0uaW5mby5jc3BcclxubGV0IHJlcG9ydFRvID0gY3NwLnJlcG9ydFRvXHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zdCBmYWxsYmFjayA9IHRydWVcclxuICBjb25zdCB7cG9saWN5fSA9IGNzcFsnZGVmYXVsdC1zcmMnXSB8fCB7fVxyXG4gIGlmIChwb2xpY3kgJiYgcG9saWN5Lmxlbmd0aD4wKSB7XHJcbiAgICBmb3IgKGNvbnN0IGlkIG9mIGNzcEZldGNoKSB7XHJcbiAgICAgIGlmICghY3NwW2lkXSkge1xyXG4gICAgICAgIGNzcFtpZF0gPSB7cG9saWN5LCBmYWxsYmFja31cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBmb3IgKGNvbnN0IGlkIG9mIGNzcEVBdHRyKSB7XHJcbiAgICBjb25zdCBwYXIgPSBpZC5yZXBsYWNlKC8tLns0fSQvLCAnJylcclxuICAgIGNvbnN0IHtwb2xpY3l9ID0gY3NwW3Bhcl0gfHwge31cclxuICAgIGlmICghY3NwW2lkXSAmJiBwb2xpY3kpIHtcclxuICAgICAgY3NwW2lkXSA9IHtwb2xpY3ksIGZhbGxiYWNrfVxyXG4gICAgfVxyXG4gIH1cclxuICBpZiAocmVwb3J0VG8hPT0nSlNPTiBFcnJvciEnICYmIHJlcG9ydFRvPy5sZW5ndGggPiAxNSkge1xyXG4gICAgbGV0IGNiID0gcmVwb3J0VG8ucmVwbGFjZSgvXFxuL2csJycpLnRyaW0oKVxyXG4gICAgaWYgKGNiWzBdPT09J3snICYmIGNiLnNsaWNlKC0xKT09PSd9Jykge1xyXG4gICAgICBjYiA9IEpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UoYFske2NifV1gKSwgbnVsbCwgMilcclxuICAgICAgcmVwb3J0VG8gPSBjYi5yZXBsYWNlKC9cXFt8XFxdL2csICcnKS5yZXBsYWNlKC9cXG4gIC9nLCAnXFxuJykudHJpbSgpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XHJcbiAgPGI+Q29udGVudCBTZWN1cml0eSBQb2xpY3k8L2I+XHJcbiAgPHA+XHJcbiAgICBDU1Agb246XHJcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvQ1NQXCI+TW96aWxsYTwvYT4sIFxyXG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2NvbnRlbnQtc2VjdXJpdHktcG9saWN5LmNvbS9cIj5jb250ZW50LXNlY3VyaXR5LXBvbGljeS5jb208L2E+LFxyXG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2NoZWF0c2hlZXRzZXJpZXMub3dhc3Aub3JnL2NoZWF0c2hlZXRzL0NvbnRlbnRfU2VjdXJpdHlfUG9saWN5X0NoZWF0X1NoZWV0Lmh0bWxcIj5PV0FTUC1jaGVhdC1zaGVldDwvYT5cclxuICA8L3A+XHJcbiAgPGRpdj5cclxuICAgIHsjZWFjaCBjc3BBcnIgYXMgaWQsIGl9XHJcbiAgICB7I2lmIGNzcFtpZF19ICAgICAgXHJcbiAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5IGNsYXNzPXtjc3BbaWRdLmZhbGxiYWNrID8gJ2ZhbGxiYWNrJyA6ICcnfT5cclxuICAgICAgICB7I2lmIGNzcEluZm9baWRdLmxpbmt9XHJcbiAgICAgICAgICB7aSsxfS57aWR9Oih7Y3NwW2lkXS5wb2xpY3kubGVuZ3RofSk8YSB0YXJnZXQ9YmxhbmsgaHJlZj17Y3NwSW5mb1tpZF0ubGlua30+PHNtYWxsPnZ7Y3NwSW5mb1tpZF0ubGV2ZWx9PC9zbWFsbD48L2E+XHJcbiAgICAgICAgezplbHNlfVxyXG4gICAgICAgICAge2krMX0ue2lkfTooe2NzcFtpZF0ucG9saWN5Lmxlbmd0aH0pPHNtYWxsPnZ7Y3NwSW5mb1tpZF0ubGV2ZWx9PC9zbWFsbD5cclxuICAgICAgICB7L2lmfVxyXG4gICAgICA8L3N1bW1hcnk+XHJcbiAgICAgICAgeyNpZiBjc3BJbmZvW2lkXS5ub3RlfVxyXG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9XCJub3RlXCI+PHN1bW1hcnk+ZXhwYW5kLi4uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICA8c21hbGw+e0BodG1sIGNzcEluZm9baWRdLm5vdGV9PC9zbWFsbD5cclxuICAgICAgICAgIDwvZGV0YWlscz5cclxuICAgICAgICB7L2lmfVxyXG4gICAgICAgIHsjZWFjaCBjc3BbaWRdLnBvbGljeSBhcyBpdGVtLCB4fVxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW1cIj57eCsxfTp7aXRlbX08L2Rpdj5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvZGV0YWlscz5cclxuICAgIHsvaWZ9XHJcbiAgICB7L2VhY2h9XHJcbiAgICA8aHIgLz5cclxuICAgIDxkZXRhaWxzPjxzdW1tYXJ5IGNsYXNzPVwicmVwb3J0XCI+PGI+cmVwb3J0LXRvPC9iPjo8L3N1bW1hcnk+XHJcbiAgICAgIDxkZXRhaWxzIGNsYXNzPVwibm90ZVwiPjxzdW1tYXJ5PmV4cGFuZC4uLjwvc3VtbWFyeT5cclxuICAgICAgICA8c21hbGw+e0BodG1sICd1c2VkIHRvIHNwZWNpZnkgZGV0YWlscyBhYm91dCB0aGUgZGlmZmVyZW50IGVuZHBvaW50cyB0aGF0IGEgdXNlci1hZ2VudCBoYXMgYXZhaWxhYmxlIHRvIGl0IGZvciBkZWxpdmVyaW5nIHJlcG9ydHMgdG8uIFlvdSBjYW4gdGhlbiByZXRyaWV2ZSByZXBvcnRzIGJ5IG1ha2luZyBhIHJlcXVlc3QgdG8gdGhvc2UgVVJMcy4nfTwvc21hbGw+XHJcbiAgICAgIDwvZGV0YWlscz5cclxuICAgICAgPGRpdiBjbGFzcz1cIml0ZW1cIj57cmVwb3J0VG99PC9kaXY+XHJcbiAgICA8L2RldGFpbHM+XHJcbiAgPC9kaXY+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cclxuZGV0YWlscy5ub3RlIHtcclxuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XHJcbiAgcGFkZGluZy1ib3R0b206IDNweDtcclxuICBzdW1tYXJ5IHtcclxuICAgIGNvbG9yOiByZWQ7XHJcbiAgICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgICBmb250LXNpemU6IHgtc21hbGw7XHJcbiAgICBtYXJnaW4tbGVmdDogLTE0cHg7XHJcbiAgICBwYWRkaW5nLWxlZnQ6IDE0cHg7XHJcbiAgICBsaXN0LXN0eWxlOiBub25lO1xyXG4gICAgJjo6LXdlYmtpdC1kZXRhaWxzLW1hcmtlciB7XHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICB9XHJcbiAgICAmOmhvdmVyIHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XHJcbiAgICB9XHJcbiAgfVxyXG59IFxyXG5zdW1tYXJ5LC5pdGVtIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgZm9udC1mYW1pbHk6ICdDb3VyaWVyIE5ldycsIENvdXJpZXIsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxuICBmb250LXNpemU6IHNtYWxsO1xyXG4gICY6aG92ZXIge1xyXG4gICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRibHVlO1xyXG4gIH1cclxufVxyXG5zdW1tYXJ5LmZhbGxiYWNrIHtcclxuICBjb2xvcjogZGFya3JlZDtcclxufVxyXG4uaXRlbSB7XHJcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xyXG4gIGZvbnQtc2l6ZTogc21hbGxlcjtcclxuICBjb2xvcjogIzkxMDBjZDtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmNvbnN0IF9jID0gJ2NvbG9yOiBibHVldmlvbGV0J1xyXG5cclxubGV0IGtleXMgPSBbXVxyXG4kOiBfa2V5cyA9IGtleXNcclxuXHJcbmZ1bmN0aW9uIHJlbG9hZEtleXMoKSB7XHJcbiAgY29uc29sZS5sb2coJyVjUmVsb2FkIGhvdGtleXMuJywgX2MpO1xyXG4gIGNvbnN0IHttYWNyb2tleXM6IG1rZXl9ID0gd2luZG93Lm1pdG1cclxuICBrZXlzID0gW11cclxuICBmb3IgKGNvbnN0IGlkIGluIG1rZXkpIHtcclxuICAgIGtleXMucHVzaCh7aWQsIHRpdGxlOiBta2V5W2lkXS5fdGl0bGV9KVxyXG4gIH1cclxufVxyXG5cclxubGV0IG9ic2VydmVyXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IHFyeSA9ICcubWl0bS1jb250YWluZXIuY2VudGVyJ1xyXG4gIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHFyeSlcclxuICBjb25zdCBub2RlVmlzaWJsZSA9IG9icyA9PiB7XHJcbiAgICBpZiAobm9kZS5hdHRyaWJ1dGVzLnN0eWxlKSB7XHJcbiAgICAgIHJlbG9hZEtleXMoKVxyXG4gICAgfVxyXG4gIH1cclxuICBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG5vZGVWaXNpYmxlKTtcclxuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHthdHRyaWJ1dGVzOiB0cnVlfSlcclxuICBzZXRUaW1lb3V0KHJlbG9hZEtleXMsIDEwMDApXHJcbn0pO1xyXG5cclxub25EZXN0cm95KCgpID0+IHtcclxuICBpZiAob2JzZXJ2ZXIpIHtcclxuICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxyXG4gICAgb2JzZXJ2ZXIgPSB1bmRlZmluZWRcclxuICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xyXG4gIGNvbnN0IGtleSA9IGUudGFyZ2V0LmRhdGFzZXQuaWRcclxuICBjb25zdCBmbiA9IG1pdG0ubWFjcm9rZXlzW2tleV1cclxuICBsZXQgW3R5cCwgLi4uYXJyXSA9IGtleS5zcGxpdCgnOicpXHJcbiAgY29uc3Qgb3B0ID0ge31cclxuICBpZiAodHlwPT09J2tleScpIHtcclxuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXHJcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxyXG4gICAgbGV0IGtcclxuICAgIGlmIChxY3RsKSB7XHJcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXHJcbiAgICAgIGsgPSBxY3RsWzFdLnN1YnN0cigtMSlcclxuICAgIH0gZWxzZSBpZiAocWFsdCkge1xyXG4gICAgICBrLmN0cmxLZXkgPSB0cnVlXHJcbiAgICAgIGsgPSBxYWx0WzFdLnN1YnN0cigtMSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXHJcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxyXG4gICAgICBrID0gYXJyLnBvcCgpLnN1YnN0cigtMSlcclxuICAgIH1cclxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcclxuICAgIG9wdC5jb2RlID0gYEtleSR7ay50b1VwcGVyQ2FzZSgpfWBcclxuICAgIG9wdC5rZXkgPSBtaXRtLmZuLmNvZGVUb0NoYXIob3B0KVxyXG4gIH0gZWxzZSBpZiAodHlwPT09J2NvZGUnKSB7XHJcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxyXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcclxuICAgIGlmIChxY3RsKSB7XHJcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxyXG4gICAgICBhcnIgPSBxY3RsWzFdLnNwbGl0KCc6JylcclxuICAgIH0gZWxzZSBpZiAocWFsdCkge1xyXG4gICAgICBvcHQuYWx0S2V5ID0gdHJ1ZVxyXG4gICAgICBhcnIgPSBxYWx0WzFdLnNwbGl0KCc6JylcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxyXG4gICAgICBvcHQuYWx0S2V5ICA9IHRydWVcclxuICAgIH1cclxuICAgIG9wdC5jb2RlID0gYXJyLnBvcCgpXHJcbiAgICBvcHQuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5XHJcbiAgICBvcHQua2V5ID0gbWl0bS5mbi5jb2RlVG9DaGFyKG9wdClcclxuICB9XHJcbiAgaWYgKGZuKSB7XHJcbiAgICBjb25zdCBtYWNybyA9IGZuKG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgb3B0KSlcclxuICAgIG1pdG0uZm4ubWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGt0b1Nob3coaykge1xyXG4gIHJldHVybiBrLnNwbGl0KCcnKS5tYXAoeD0+YCR7eH1gKS5qb2luKCfinKcnKVxyXG59XHJcblxyXG5mdW5jdGlvbiBrY29kZShvYmopIHtcclxuICBjb25zdCBrZXkgPSBvYmouaWRcclxuICBjb25zdCB7Y29kZVRvQ2hhcjogY2hhcn0gPSBtaXRtLmZuXHJcbiAgbGV0IFt0eXAsIC4uLmFycl0gPSBrZXkuc3BsaXQoJzonKVxyXG4gIGNvbnN0IG9wdCA9IHt9XHJcbiAgbGV0IG1zZ1xyXG4gIGlmICh0eXA9PT0na2V5Jykge1xyXG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcclxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXHJcbiAgICBpZiAgICAgIChxY3RsKSB7IG1zZyA9IGBjdGwgLiAuLi4g4oe+ICR7a3RvU2hvdyhxY3RsWzFdKX1gICB9XHJcbiAgICBlbHNlIGlmIChxYWx0KSB7IG1zZyA9IGBhbHQgLiAuLi4g4oe+ICR7a3RvU2hvdyhxYWx0WzFdKX1gICB9XHJcbiAgICBlbHNlICAgICAgICAgICB7IG1zZyA9IGBjdGwgKyBhbHQg4oe+ICR7a3RvU2hvdyhhcnIucG9wKCkpfWB9XHJcbiAgfSBlbHNlIGlmICh0eXA9PT0nY29kZScpIHtcclxuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXHJcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxyXG4gICAgaWYgICAgICAocWN0bCkgeyBtc2cgPSAnY3RsIC4gLi4uIOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhxY3RsWzFdKX1cclxuICAgIGVsc2UgaWYgKHFhbHQpIHsgbXNnID0gJ2FsdCAuIC4uLiDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3cocWFsdFsxXSl9XHJcbiAgICBlbHNlICAgICAgICAgICB7IG1zZyA9ICdjdGwgKyBhbHQg4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KGFyci5qb2luKCc6JykpfVxyXG4gIH1cclxuICByZXR1cm4gbXNnXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidmJveFwiPlxyXG4gIDxiPkhvdC1rZXlzOjwvYj5cclxuICA8dGFibGU+XHJcbiAgICB7I2VhY2ggX2tleXMgYXMgb2JqLGl9XHJcbiAgICAgIDx0cj5cclxuICAgICAgICA8dGQgY2xhc3M9XCJub1wiPntpKzF9PC90ZD5cclxuICAgICAgICA8dGQgY2xhc3M9XCJrY29kZVwiIGRhdGEtaWQ9e29iai5pZH0gb246Y2xpY2s9e2hhbmRsZUNsaWNrfT5cclxuICAgICAgICAgIHtrY29kZShvYmopfVxyXG4gICAgICAgIDwvdGQ+XHJcbiAgICAgICAgPHRkIGNsYXNzPVwidGl0bGVcIj57b2JqLnRpdGxlfTwvdGQ+XHJcbiAgICAgIDwvdHI+XHJcbiAgICB7L2VhY2h9XHJcbiAgPC90YWJsZT5cclxuPC9kaXY+XHJcblxyXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPlxyXG4gIC52Ym94IHtcclxuICAgIGNvbG9yOmJsdWU7XHJcbiAgICBsZWZ0OiAwO1xyXG4gICAgcmlnaHQ6IDA7XHJcbiAgfVxyXG4gIHRhYmxlIHtcclxuICAgIHdpZHRoOiAxMDAlO1xyXG4gICAgY29sb3I6IG1hcm9vbjtcclxuICAgIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XHJcbiAgICB0cjpob3ZlciB7XHJcbiAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTk5LCAxNjYsIDExNiwgMC40NTIpO1xyXG4gICAgICAua2NvZGUge1xyXG4gICAgICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xyXG4gICAgICAgICY6aG92ZXIge1xyXG4gICAgICAgICAgY29sb3I6IHJlZDtcclxuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRkIHtcclxuICAgICAgYm9yZGVyOiAxcHggc29saWQgIzk5OTtcclxuICAgICAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbiAgICB9XHJcbiAgICAubm8ge1xyXG4gICAgICBwYWRkaW5nOiAwO1xyXG4gICAgICB3aWR0aDogMjVweDtcclxuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgfVxyXG4gICAgLmtjb2RlIHtcclxuICAgICAgZm9udC1mYW1pbHk6ICdDb3VyaWVyIE5ldycsIENvdXJpZXIsIG1vbm9zcGFjZTtcclxuICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XHJcbiAgICB9XHJcbiAgICAudGl0bGUge1xyXG4gICAgICBmb250LWZhbWlseTogJ0dpbGwgU2FucycsICdHaWxsIFNhbnMgTVQnLCBDYWxpYnJpLCAnVHJlYnVjaGV0IE1TJywgc2Fucy1zZXJpZjtcclxuICAgICAgd2lkdGg6IDUwJTtcclxuICAgIH1cclxuICB9XHJcbjwvc3R5bGU+IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIE5vdGU6IFRoaXMgcmVnZXggbWF0Y2hlcyBldmVuIGludmFsaWQgSlNPTiBzdHJpbmdzLCBidXQgc2luY2Ugd2XigJlyZVxuLy8gd29ya2luZyBvbiB0aGUgb3V0cHV0IG9mIGBKU09OLnN0cmluZ2lmeWAgd2Uga25vdyB0aGF0IG9ubHkgdmFsaWQgc3RyaW5nc1xuLy8gYXJlIHByZXNlbnQgKHVubGVzcyB0aGUgdXNlciBzdXBwbGllZCBhIHdlaXJkIGBvcHRpb25zLmluZGVudGAgYnV0IGluXG4vLyB0aGF0IGNhc2Ugd2UgZG9u4oCZdCBjYXJlIHNpbmNlIHRoZSBvdXRwdXQgd291bGQgYmUgaW52YWxpZCBhbnl3YXkpLlxudmFyIHN0cmluZ09yQ2hhciA9IC8oXCIoPzpbXlxcXFxcIl18XFxcXC4pKlwiKXxbOixdL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5naWZ5KHBhc3NlZE9iaiwgb3B0aW9ucykge1xuICB2YXIgaW5kZW50LCBtYXhMZW5ndGgsIHJlcGxhY2VyO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpbmRlbnQgPSBKU09OLnN0cmluZ2lmeShcbiAgICBbMV0sXG4gICAgdW5kZWZpbmVkLFxuICAgIG9wdGlvbnMuaW5kZW50ID09PSB1bmRlZmluZWQgPyAyIDogb3B0aW9ucy5pbmRlbnRcbiAgKS5zbGljZSgyLCAtMyk7XG4gIG1heExlbmd0aCA9XG4gICAgaW5kZW50ID09PSBcIlwiXG4gICAgICA/IEluZmluaXR5XG4gICAgICA6IG9wdGlvbnMubWF4TGVuZ3RoID09PSB1bmRlZmluZWRcbiAgICAgID8gODBcbiAgICAgIDogb3B0aW9ucy5tYXhMZW5ndGg7XG4gIHJlcGxhY2VyID0gb3B0aW9ucy5yZXBsYWNlcjtcblxuICByZXR1cm4gKGZ1bmN0aW9uIF9zdHJpbmdpZnkob2JqLCBjdXJyZW50SW5kZW50LCByZXNlcnZlZCkge1xuICAgIC8vIHByZXR0aWVyLWlnbm9yZVxuICAgIHZhciBlbmQsIGluZGV4LCBpdGVtcywga2V5LCBrZXlQYXJ0LCBrZXlzLCBsZW5ndGgsIG5leHRJbmRlbnQsIHByZXR0aWZpZWQsIHN0YXJ0LCBzdHJpbmcsIHZhbHVlO1xuXG4gICAgaWYgKG9iaiAmJiB0eXBlb2Ygb2JqLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBvYmogPSBvYmoudG9KU09OKCk7XG4gICAgfVxuXG4gICAgc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkob2JqLCByZXBsYWNlcik7XG5cbiAgICBpZiAoc3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgbGVuZ3RoID0gbWF4TGVuZ3RoIC0gY3VycmVudEluZGVudC5sZW5ndGggLSByZXNlcnZlZDtcblxuICAgIGlmIChzdHJpbmcubGVuZ3RoIDw9IGxlbmd0aCkge1xuICAgICAgcHJldHRpZmllZCA9IHN0cmluZy5yZXBsYWNlKFxuICAgICAgICBzdHJpbmdPckNoYXIsXG4gICAgICAgIGZ1bmN0aW9uIChtYXRjaCwgc3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgIHJldHVybiBzdHJpbmdMaXRlcmFsIHx8IG1hdGNoICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICBpZiAocHJldHRpZmllZC5sZW5ndGggPD0gbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBwcmV0dGlmaWVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXBsYWNlciAhPSBudWxsKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKHN0cmluZyk7XG4gICAgICByZXBsYWNlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogIT09IG51bGwpIHtcbiAgICAgIG5leHRJbmRlbnQgPSBjdXJyZW50SW5kZW50ICsgaW5kZW50O1xuICAgICAgaXRlbXMgPSBbXTtcbiAgICAgIGluZGV4ID0gMDtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICBzdGFydCA9IFwiW1wiO1xuICAgICAgICBlbmQgPSBcIl1cIjtcbiAgICAgICAgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChcbiAgICAgICAgICAgIF9zdHJpbmdpZnkob2JqW2luZGV4XSwgbmV4dEluZGVudCwgaW5kZXggPT09IGxlbmd0aCAtIDEgPyAwIDogMSkgfHxcbiAgICAgICAgICAgICAgXCJudWxsXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IFwie1wiO1xuICAgICAgICBlbmQgPSBcIn1cIjtcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgICBrZXlQYXJ0ID0gSlNPTi5zdHJpbmdpZnkoa2V5KSArIFwiOiBcIjtcbiAgICAgICAgICB2YWx1ZSA9IF9zdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIG5leHRJbmRlbnQsXG4gICAgICAgICAgICBrZXlQYXJ0Lmxlbmd0aCArIChpbmRleCA9PT0gbGVuZ3RoIC0gMSA/IDAgOiAxKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2goa2V5UGFydCArIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtzdGFydCwgaW5kZW50ICsgaXRlbXMuam9pbihcIixcXG5cIiArIG5leHRJbmRlbnQpLCBlbmRdLmpvaW4oXG4gICAgICAgICAgXCJcXG5cIiArIGN1cnJlbnRJbmRlbnRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9KShwYXNzZWRPYmosIFwiXCIsIDApO1xufTtcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCBzdHJpbmdpZnkgZnJvbSBcImpzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0XCI7XHJcblxyXG5leHBvcnQgbGV0IGdlbmVyYWwgPSB7fVxyXG5leHBvcnQgbGV0IGpzb24gPSB7fVxyXG5cclxubGV0IGtleXMgPSBPYmplY3Qua2V5cyhqc29uKSBcclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPXN2LWl0ZW0+XHJcbnsjZWFjaCBrZXlzIGFzIGtleX1cclxuPGRldGFpbHMgY2xhc3M9J3N2LWRhdGEgc3Yte2tleX0gc3R7TWF0aC50cnVuYyhnZW5lcmFsLnN0YXR1cy8xMDApfXgnPlxyXG4gIDxzdW1tYXJ5IGNsYXNzPXN2LXRpdGxlPntrZXl9PC9zdW1tYXJ5PlxyXG4gIDxwcmUgY2xhc3M9c3Yte2dlbmVyYWwuZXh0fT57c3RyaW5naWZ5KGpzb25ba2V5XSl9PC9wcmU+XHJcbjwvZGV0YWlscz5cclxuey9lYWNofVxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxyXG4uc3YtaXRlbSB7XHJcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xyXG59XHJcbi5zdi10aXRsZSwgcHJlIHtcclxuICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xyXG4gIGZvbnQtc2l6ZTogc21hbGw7XHJcbiAgbWFyZ2luOiAwO1xyXG4gICYuc3YtaHRtbCB7XHJcbiAgICBmb250LXNpemU6IHgtc21hbGw7XHJcbiAgfVxyXG59XHJcbi5zdi10aXRsZTpob3ZlciB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XHJcbn1cclxuLnN2LXJlc3BCb2R5IHtcclxuICBjb2xvcjogYmx1ZXZpb2xldDtcclxuICBmb250LXdlaWdodDogNjAwO1xyXG4gICY6aXMoLnN0NHgsLnN0NXgpIHtcclxuICAgIGNvbG9yOiByZWQ7XHJcbiAgfVxyXG59XHJcbi5zdi1yZXFzQm9keSB7XHJcbiAgY29sb3I6IG1lZGl1bXZpb2xldHJlZDtcclxuICBmb250LXdlaWdodDogNjAwO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbiAgaW1wb3J0IHsgb25Nb3VudCwgb25EZXN0cm95IH0gZnJvbSAnc3ZlbHRlJztcclxuICBpbXBvcnQgSnNvbiBmcm9tICcuL0pzb24uc3ZlbHRlJztcclxuXHJcbiAgbGV0IGxzdCA9IHt9XHJcbiAgbGV0IG9iaiA9IHtyb3dzOiBbXX1cclxuICBsZXQgcXVlcnk9IGZhbHNlO1xyXG4gIGxldCBwYXRoID0gdHJ1ZTtcclxuICBsZXQgYm9keSA9IHRydWU7XHJcbiAgXHJcbiAgb25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCByb3dzID0gKHdpbmRvdy5pbm5lckhlaWdodC0xMDApLzE3LjVcclxuICAgIGNvbnNvbGUubG9nKHtyb3dzfSlcclxuICAgIGNvbnN0IF9saW1pdF8gPSByb3dzXHJcbiAgICBjb25zdCBfY291bnRfID0ge3RvdGFsOidpZCd9XHJcbiAgICBjb25zdCBfZGlzdGluY3RfID0gWydzZXNzaW9uJ11cclxuICAgIGNvbnN0IF93aGVyZV89ICdpZD4wIG9yZGVyYnkgaWQ6ZCdcclxuICAgIG9iaiA9IGF3YWl0IG1pdG0uZm4uc3FsTGlzdCh7X2NvdW50XywgX2Rpc3RpbmN0XywgX3doZXJlXywgX2xpbWl0X30sICdsb2cnKVxyXG4gICAgb2JqLnJvd3MuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgbHN0W2l0ZW0uc2Vzc2lvbl0gPSBbXVxyXG4gICAgfSk7XHJcbiAgfSlcclxuXHJcbiAgYXN5bmMgZnVuY3Rpb24gZGV0YWlsQ2xpY2soZSkge1xyXG4gICAgY29uc3Qgc3MgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zc1xyXG4gICAgaWYgKCFsc3Rbc3NdPy5sZW5ndGgpIHtcclxuICAgICAgY29uc3Qgb2JqID0gYXdhaXQgbWl0bS5mbi5zcWxMaXN0KHtfd2hlcmVfOiBgc2Vzc2lvbj0ke3NzfSBvcmRlcmJ5IGlkYH0sICdsb2cnKVxyXG4gICAgICBsc3Rbc3NdID0gb2JqLnJvd3MubWFwKHggPT4ge1xyXG4gICAgICAgIHgubWV0YSA9IEpTT04ucGFyc2UoeC5tZXRhKVxyXG4gICAgICAgIGlmICh4Lm1ldGEuZ2VuZXJhbC5leHQ9PT0nanNvbicpIHtcclxuICAgICAgICAgIHguZGF0YSA9IEpTT04ucGFyc2UoeC5kYXRhKVxyXG4gICAgICAgICAgZGVsZXRlIHguZGF0YS5nZW5lcmFsXHJcbiAgICAgICAgICBpZiAoeC5tZXRhLmdlbmVyYWwubWV0aG9kPT09J0dFVCcpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHguZGF0YS5yZXFzQm9keVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geFxyXG4gICAgICB9KVxyXG4gICAgICBjb25zb2xlLmxvZyhzcywgb2JqLnJvd3MpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBmdW5jdGlvbiBleHBDbGljayhlKSB7XHJcbiAgICBpZiAoYm9keSkge1xyXG4gICAgICBjb25zdCBkZXRhaWxzID0gZS5jdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgaWYgKGRldGFpbHMuYXR0cmlidXRlcy5vcGVuKSB7XHJcbiAgICAgICAgICBkZXRhaWxzLmNoaWxkcmVuWzJdLnNldEF0dHJpYnV0ZSgnb3BlbicsJycpXHJcbiAgICAgICAgICBjb25zdCBhcnIxID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtR0VULC5tdC1ERUxFVEUpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5LC5zdi1yZXNwSGVhZGVyKScpXHJcbiAgICAgICAgICBjb25zdCBhcnIyID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtUFVULC5tdC1QT1NUKSBkZXRhaWxzOmlzKC5zdi1yZXFzQm9keSknKVxyXG4gICAgICAgICAgY29uc3QgYXJyMyA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LVJFRElSRUNUKSBkZXRhaWxzOmlzKC5zdi1yZXNwSGVhZGVyKScpXHJcbiAgICAgICAgICBjb25zdCBhcnI0ID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtRVJST1IpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5KScpXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMSkgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMikgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMykgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyNCkgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCAwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhvc3QodXJsKSB7XHJcbiAgICBjb25zdCBvYmogPSBuZXcgVVJMKHVybClcclxuICAgIGxldCBtc2cgPSBwYXRoID8gb2JqLnBhdGhuYW1lIDogb2JqLm9yaWdpbiArIG9iai5wYXRobmFtZVxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgIG1zZyArPSBvYmouc2VhcmNoXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbXNnLmxlbmd0aD45MCA/IG1zZy5zbGljZSgwLCA5MCkrJy4uLicgOiBtc2dcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGVycl9tZXRob2QoaTIpIHtcclxuICAgIGNvbnN0IHttZXRob2QsIHN0YXR1c30gPSBpMi5tZXRhLmdlbmVyYWxcclxuICAgIGNvbnN0IHN0ID0gTWF0aC50cnVuYyhzdGF0dXMvMTAwKVxyXG4gICAgaWYgKHN0PT09Mykge1xyXG4gICAgICByZXR1cm4gJ210LVJFRElSRUNUJ1xyXG4gICAgfSBlbHNlIGlmIChzdD4zKSB7XHJcbiAgICAgIHJldHVybiAnbXQtRVJST1InXHJcbiAgICB9XHJcbiAgICByZXR1cm4gYG10LSR7bWV0aG9kfWAgXHJcbiAgfVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXY+XHJcbjxiPlNxbGl0ZSBMb2dzITwvYj5cclxuPGxhYmVsIGZvcj1zdi1ib2R5PlxyXG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LWJvZHkgYmluZDpjaGVja2VkPXtib2R5fSAvPmV4cC1ib2R5XHJcbjwvbGFiZWw+XHJcbjxsYWJlbCBmb3I9c3Ytbm8taG9zdD5cclxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1uby1ob3N0IGJpbmQ6Y2hlY2tlZD17cGF0aH0gLz5uby1ob3N0XHJcbjwvbGFiZWw+XHJcbjxsYWJlbCBmb3I9c3YtcXVlcnk+XHJcbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3YtcXVlcnkgYmluZDpjaGVja2VkPXtxdWVyeX0gLz5xdWVyeVxyXG48L2xhYmVsPlxyXG57I2VhY2ggb2JqLnJvd3MgYXMgaXRlbX1cclxuICA8ZGV0YWlscyBjbGFzcz1zdi1zZXNzaW9uIGRhdGEtc3M9e2l0ZW0uc2Vzc2lvbn0gb246Y2xpY2s9e2RldGFpbENsaWNrfT5cclxuICAgIDxzdW1tYXJ5IGNsYXNzPXN2LW1haW4+XHJcbiAgICAgIHtpdGVtLnNlc3Npb259PHNwYW4gY2xhc3M9c3YtdG90YWw+KHtpdGVtLnRvdGFsfSk8L3NwYW4+XHJcbiAgICA8L3N1bW1hcnk+XHJcbiAgICB7I2lmIGxzdFtpdGVtLnNlc3Npb25dLmxlbmd0aH1cclxuICAgICAgeyNlYWNoIGxzdFtpdGVtLnNlc3Npb25dIGFzIGkyfVxyXG4gICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3dzJz5cclxuICAgICAgICAgIDxzdW1tYXJ5IFxyXG4gICAgICAgICAgZGF0YS1pZD17aTIuaWR9XHJcbiAgICAgICAgICBkYXRhLXNzPXtpdGVtLnNlc3Npb259XHJcbiAgICAgICAgICBjbGFzcz0nc3YtdGl0bGUgc3R7TWF0aC50cnVuYyhpMi5tZXRhLmdlbmVyYWwuc3RhdHVzLzEwMCl9eCdcclxuICAgICAgICAgIG9uOmNsaWNrPXtleHBDbGlja30+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPXN2LXtpMi5tZXRhLmdlbmVyYWwuc3RhdHVzfT57aTIubWV0YS5nZW5lcmFsLnN0YXR1c308L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPXN2LXtpMi5tZXRhLmdlbmVyYWwubWV0aG9kfT57aTIubWV0YS5nZW5lcmFsLm1ldGhvZC5wYWRFbmQoNCwnLicpfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte3BhdGg/J3BhdGgnOidmdWxscGF0aCd9Pntob3N0KGkyLnVybCwgcGF0aCwgcXVlcnkpfTwvc3Bhbj5cclxuICAgICAgICAgIDwvc3VtbWFyeT5cclxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3ctZGF0YSBzdi1oZWFkZXInPlxyXG4gICAgICAgICAgICA8c3VtbWFyeSBjbGFzcz0nc3YtdGl0bGUgc3YtaGVhZGVyJz5oZWFkZXI8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIDxKc29uIGpzb249e2kyLm1ldGF9Lz5cclxuICAgICAgICAgIDwvZGV0YWlscz5cclxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3ctZGF0YSBzdi1jb250ZW50IHtlcnJfbWV0aG9kKGkyKX0nPlxyXG4gICAgICAgICAgICA8c3VtbWFyeSBjbGFzcz0nc3YtdGl0bGUgc3YtY29udGVudCc+Y29udGVudDwvc3VtbWFyeT5cclxuICAgICAgICAgICAgeyNpZiBpMi5tZXRhLmdlbmVyYWwuZXh0PT09J2pzb24nfVxyXG4gICAgICAgICAgICAgIDxKc29uIGpzb249e2kyLmRhdGF9IGdlbmVyYWw9e2kyLm1ldGEuZ2VuZXJhbH0gLz5cclxuICAgICAgICAgICAgezplbHNlfVxyXG4gICAgICAgICAgICAgIDxwcmUgY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5leHR9PntpMi5kYXRhfTwvcHJlPlxyXG4gICAgICAgICAgICB7L2lmfVxyXG4gICAgICAgICAgPC9kZXRhaWxzPlxyXG4gICAgICAgIDwvZGV0YWlscz4gICAgICAgIFxyXG4gICAgICB7L2VhY2h9XHJcbiAgICB7OmVsc2V9XHJcbiAgICAgIGxvYWRpbmctMS4uLiAgICAgICAgICBcclxuICAgIHsvaWZ9XHJcbiAgPC9kZXRhaWxzPlxyXG57L2VhY2h9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XHJcblt0eXBlPWNoZWNrYm94XSB7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxufVxyXG4uc3Ytc2Vzc2lvbiB7XHJcbiAgc3VtbWFyeSB7XHJcbiAgICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgICAmLnN2LW1haW46aG92ZXIge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcclxuICAgIH1cclxuICB9XHJcbn1cclxuLnN2LXJvd3Mge1xyXG4gIHBhZGRpbmctbGVmdDogMTZweDtcclxufVxyXG4uc3Ytcm93LWRhdGEge1xyXG4gIHBhZGRpbmctbGVmdDogMTRweDtcclxufVxyXG4uc3YtdG90YWwge1xyXG4gIGZvbnQtc2l6ZTogeC1zbWFsbDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogdGV4dC10b3A7XHJcbiAgY29sb3I6IGRhcmttYWdlbnRhO1xyXG59XHJcbi5zdi10aXRsZSwgLnN2LXJvdy1kYXRhIHByZSB7XHJcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxuICBmb250LXNpemU6IHNtYWxsO1xyXG4gIG1hcmdpbjogMDtcclxuICAmLnN2LWh0bWwge1xyXG4gICAgZm9udC1zaXplOiB4LXNtYWxsO1xyXG4gIH1cclxufVxyXG5zdW1tYXJ5OmlzKC5zdDJ4KSB7XHJcbiAgY29sb3I6IzMwMDQ3ZTtcclxufVxyXG5zdW1tYXJ5OmlzKC5zdDN4LC5zdDR4LC5zdDV4KSB7XHJcbiAgY29sb3I6ICNiNDAwMDA7XHJcbn1cclxuLnN2LVBPU1QsLnN2LVBVVCB7XHJcbiAgY29sb3I6IGNyaW1zb247XHJcbn1cclxuLnN2LURFTEVURSB7XHJcbiAgY29sb3I6IHJlZFxyXG59XHJcbi5zdi1wYXRoIHtcclxuICBjb2xvcjogZGFya2dyZWVuO1xyXG59XHJcbi5zdi1mdWxscGF0aCB7XHJcbiAgY29sb3I6IGRhcmttYWdlbnRhO1xyXG59XHJcbi5zdi10aXRsZTpob3ZlciB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiLy8gZmVhdDogc3ZlbHRlIHJlbGF0ZWRcclxuY29uc3Qge2RlZmF1bHQ6IENzcGhlYWRlcn0gPSByZXF1aXJlKCcuL0NzcGhlYWRlci5zdmVsdGUnKVxyXG5jb25zdCB7ZGVmYXVsdDogSG90a2V5c30gICA9IHJlcXVpcmUoJy4vSG90a2V5cy5zdmVsdGUnKVxyXG5jb25zdCB7ZGVmYXVsdDogU3FsaXRlfSAgICA9IHJlcXVpcmUoJy4vc3FsaXRlLnN2ZWx0ZScpXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIENzcGhlYWRlcixcclxuICBIb3RrZXlzLFxyXG4gIFNxbGl0ZVxyXG59XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXHJcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKVxyXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxyXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXHJcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJylcclxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcclxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxyXG5jb25zdCBfd3NfbWFjcm9zID0gcmVxdWlyZSgnLi9fd3NfbWFjcm9zJylcclxuY29uc3QgX2MgPSAnY29sb3I6IHJlZCdcclxuXHJcbl93c19wb3N0bWVzc2FnZSgpXHJcbl93c19pbml0U29ja2V0KClcclxuX3dzX3NjcmVlbnNob3QoKVxyXG5fd3NfbG9jYXRpb24oKVxyXG5fd3Nfb2JzZXJ2ZXIoKVxyXG5fd3NfZ2VuZXJhbCgpXHJcbl93c19jc3BFcnIoKVxyXG5fd3NfbWFjcm9zKClcclxuY29uc29sZS5sb2coJyVjV3M6IHdzLWNsaWVudCBsb2FkZWQuLi4nLCBfYylcclxud2luZG93Lm1pdG0uc3ZlbHRlID0gcmVxdWlyZSgnLi4vc3ZlbHRlJylcclxuIl0sIm5hbWVzIjpbIl9jIiwic3FsaXRlIiwicmVxdWlyZSQkMCIsInBsYXkiLCJsb2NhdGlvbiIsImluaXQiLCJzdmVsdGUiLCJjc3BJbmZvIiwiY3NwQXJyIiwiY3NwRmV0Y2giLCJjc3BFQXR0ciIsInN0cmluZ2lmeSJdLCJtYXBwaW5ncyI6Ijs7OztFQUNBLG1CQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLFNBQVMsY0FBYyxFQUFFLEtBQUssRUFBRTtFQUNsQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0VBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUM7RUFDN0YsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBQztFQUMzRDs7RUNSQSxNQUFNQSxJQUFFLEdBQUcsaUJBQWdCO0FBQzNCO0VBQ0EsY0FBYyxHQUFHLE1BQU07RUFDdkIsRUFBRSxJQUFJLFVBQVM7RUFDZixFQUFFLE9BQU87RUFDVDtFQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtFQUNyQixNQUFNLE9BQU8sQ0FBQyxH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LEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsTUFBTSxLQUFLLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLFNBQVMsRUFBRSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBQztBQUNEO0VBQ0EsTUFBTSxNQUFNLEdBQUc7RUFDZixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLEVBQUUsRUFBRSxHQUFHO0VBQ1QsRUFBQztBQUNEO0VBQ0EsTUFBTSxLQUFLLEdBQUc7RUFDZCxFQUFFLEdBQUcsTUFBTTtFQUNYLEVBQUUsS0FBSyxFQUFFLE9BQU87RUFDaEIsRUFBRSxRQUFRLEVBQUUsTUFBTTtFQUNsQixFQUFFLFNBQVMsRUFBRSxJQUFJO0VBQ2pCLEVBQUUsTUFBTSxFQUFFLEtBQUs7RUFDZixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ2IsRUFBRSxHQUFHLEVBQUUsS0FBSztFQUNaLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztFQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDWCxFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ1gsRUFB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QVMsRUFBRSxPQUFPLEVBQUM7RUFDdkMsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFDO0VBQzVELEVBQUUsVUFBVSxDQUFDLE1BQU07RUFDbkIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87RUFDNUIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87RUFDNUIsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVE7RUFDN0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLE9BQU07RUFDN0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVM7RUFDaEMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0VBRTVDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQztFQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7RUFDdEMsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0VBQ3RDLElBQUksU0FBUyxDQUFZLEVBQUM7RUFDMUIsSUFBSSxRQUFRLEdBQUU7RUFDZCxJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxLQUFLLEVBQUU7RUFDdkQsTUFBTSxJQUFJLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0VBQ3ZELFFBQVEsU0FBUyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFDO0VBQ3JELFFBQVEsTUFBTSxHQUFHLE1BQUs7RUFDdEIsT0FBTztFQUNQLEtBQUssQ0FBQyxDQUFDO0VBQ1AsR0FBRyxFQUFFLENBQUMsRUFBQztFQUNQLENBQUM7QUFDRDtFQUNBLFNBQVMsZUFB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O0VBQ0E7RUFDQTtFQUNBLEVBQUUsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0VBQy9DLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtFQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDL0MsSUFBRztBQUNIO0VBQ0E7RUFDQTtFQUNBLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0VBQzdDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRTtFQUNyQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDOUMsSUFBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztFQUM1QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7RUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQzVDLElBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0VBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0VBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FB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
