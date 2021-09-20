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

  const _c$6 = 'color: #bada55';

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
          console.log('%cWs: Update routes', _c$6);
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
        console.log('%cWs: _setClient', _c$6, data);
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



  const _c$5 = 'color: #bada55';

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
          console.log(`%cWs: ${fn+''}`, _c$5);
          fn(data);
        }
      }

      if (__flag['ws-connect']) {
        console.log('%cWs: open connection', _c$5);
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
        console.log('%cWs: close connection', _c$5);
      }
    };

    const onmessage = function (e) {
      if (__flag['on-message']) {
        console.log('%cWs: on-message:', _c$5, e.data);
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
      console.log(`%cWs: ${connect ? 'init' : 'off'} connection`, _c$5);
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



  const _c$4 = 'color: #bada55';

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
              console.log('%cWs: delay action undefined', _c$4);
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
    Backquote: '`',
    BracketLeft: '[',
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
    Backquote: '~',
    BracketLeft: '{',
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

  var _keyboard = (evn, opt={codeOnly:false}) => {
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
  };

  /* global location, history, chrome, Event, CssSelectorGenerator */

  /* eslint-disable camelcase */



  const _c$3 = 'color: #bada55';
  const styleLeft  = 'top:  1px; left:  3px;';
  const styleTopR  = 'top: -4px; right: 3px;';
  const styleRight = 'top: 16px; right: 3px; text-align: end;';
  const buttonStyle= '';
  const style = `
.mitm-container {
  position: fixed;
  z-index: 99999;
}
.mitm-container.center {
  background: #dceaffb0;
  position: fixed;
  /* center the element */
  right: 0;
  left: 0;
  top: 20px;
  margin-right: auto;
  margin-left: auto;
  /* give it dimensions */
  height: calc(100vh - 50px);
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
.bgroup-left button,
.bgroup-right button {
  display:table;
  margin-top: 4px;
}`;

  let container = {
    right: {},
    topr: {},
    left: {},
    svlt: {},
  };
  let bgroup = {
    right: {},
    topr: {},
    left: {},
  };

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
      console.log(`%cMacros: ${msg}`, _c$3);
      let result;
      if ([true, 'off'].includes(__args.nosocket)) {
        result = await _post(_json);
      } else {
        result = await _play(_json);
      }
      return result
    }
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

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
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
      const fn  = buttons[id];
      btn.onclick = async e => {
        let arr = fn(e);
        if (arr instanceof Promise) {
          arr = await arr;
        }
        if (Array.isArray(arr)) {
          await play(arr);
        }
      };
      btn.innerText = caption;
      btn.classList.add('mitm-btn');
      btn.classList.add(`${pos}`);
      btn.classList.add(klas || caption);
      btn.style = buttonStyle + (color ? `background: ${color};` : '');
      if (pos==='topr') {
        br = document.createElement('span');
        br.innerHTML = '&nbsp;';
        bgroup[pos].appendChild(br);
      }
      bgroup[pos].appendChild(btn);
    }
  }

  function setButtons (buttons, position) {
    if (bgroup[position]) {
      bgroup[position].innerHTML = '';
      createButton(buttons, position);
    }
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
    if (mitm.macrokeys)    {delete mitm.macrokeys;   }
    if (namespace) {
      const {href, origin} = location$1;
      const _href = href.replace(origin, '');
      const {_macros_, macros} = window.mitm;
      observerfn = [];
      _macros_ && _macros_();
      for (const key in macros) {
        const { path, msg } = toRegex(key);
        if (_href.match(path)) {
          let fns = macros[key]();
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
          debunk = setTimeout(() => {
            onces = {}; // feat: onetime fn call
            debunk = undefined;
            const {autobuttons, rightbuttons, leftbuttons} = window.mitm;
            rightbuttons && setButtons(rightbuttons, 'right');
            leftbuttons && setButtons(leftbuttons, 'left');
            if (window.mitm.autofill) {
              autobuttons && setButtons({
                ...autobuttons,
                'Entry'() {
                  let {autofill} = window.mitm;
                  if (typeof autofill === 'function') {
                    autofill = autofill();
                  }
                  play(autofill);
                }
              }, 'topr');
            } else {
              autobuttons && setButtons(autobuttons, 'topr');
            }
          }, 0);
        }
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
    divRight.innerHTML = `<span class="bgroup-right"></span>`;
    divTopR.innerHTML  = `<span class="bgroup-topr"></span>`;
    divLeft.innerHTML  = `<span class="bgroup-left"></span>`;
    divLeft.className  = 'mitm-container left';
    divTopR.className  = 'mitm-container topr';
    divRight.className = 'mitm-container right';
    divCenter.className= 'mitm-container center';
    divRight.style = styleRight;
    divTopR.style  = styleTopR;
    divLeft.style   = styleLeft;

    html.insertBefore(styleBtn, htmlref);
    html.insertBefore(divRight, htmlref);
    html.insertBefore(divTopR, htmlref);
    html.insertBefore(divLeft, htmlref);
    html.insertBefore(divCenter, htmlref);
    setTimeout(() => {
      container.right= divRight;
      container.topr = divTopR;
      container.left = divLeft;
      container.svlt = divCenter;
      bgroup.right = divRight.children[0];
      bgroup.topr  = divTopR.children[0];
      bgroup.left  = divLeft.children[0];
      urlChange();
      observed();
    }, 0);
  }

  function macroAutomation(macro) {
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
  var svlt = false;
  function keybCtrl (e) {
    if (!e.code || ['Alt', 'Control', 'Meta'].includes(e.key)) {
      return
    } else {
      if (e.key==='Shift') {
        if (e.ctrlKey && !e.altKey) {
          if (e.code==='ShiftRight') {
            ctrl = !ctrl;
            container.right.style = styleRight + (!ctrl ? '' : 'display: none;');
            container.topr.style  = styleTopR + (!ctrl ? '' : 'display: none;');
            container.left.style  = styleLeft + (!ctrl ? '' : 'display: none;');  
          } else {
            svlt = !svlt;
            if (svlt) {
              container.svlt.style = 'display: block;';
            } else {
              container.svlt.attributes.removeNamedItem('style');
            }
          }
        }
      } else {
        let char = _keyboard(e);
        if (e.ctrlKey && e.altKey) {
          if (e.shiftKey) {
            char = _keyboard(e, {codeOnly: true});
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
              'Entry'() {play(autofill);}
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

    window.mitm.fn.play = play;
    window.mitm.fn.wait = wait;
    const fn = history.pushState;
    history.pushState = function () {
      fn.apply(history, arguments);
      compareHref();
    };
  }
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
      _ws.send(params);
    };
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

    window.mitm.fn.hotKeys = obj => {
      window.mitm.macrokeys = {
        ...window.mitm.macrokeys,
        ...obj
      };
    };
    
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

    window.mitm._macros_ = () => {
      window.mitm.macrokeys = {};
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
  function attr(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function children(element) {
      return Array.from(element.childNodes);
  }
  function custom_event(type, detail) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, false, false, detail);
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
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }

  const globals = (typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
          ? globalThis
          : global);
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
  function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
          context: new Map(parent_component ? parent_component.$$.context : options.context || []),
          // everything else
          callbacks: blank_object(),
          dirty,
          skip_bound: false
      };
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
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

  /* ws-client\svelte\Hotkeys.svelte generated by Svelte v3.38.2 */

  const { console: console_1 } = globals;
  const file = "ws-client\\svelte\\Hotkeys.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[4] = list[i];
  	child_ctx[6] = i;
  	return child_ctx;
  }

  // (42:4) {#each _keys as obj,i}
  function create_each_block(ctx) {
  	let tr;
  	let td0;
  	let t0_value = /*i*/ ctx[6] + 1 + "";
  	let t0;
  	let t1;
  	let td1;
  	let t2_value = /*obj*/ ctx[4].id + "";
  	let t2;
  	let t3;
  	let td2;
  	let t4_value = /*obj*/ ctx[4].title + "";
  	let t4;
  	let t5;

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
  			attr_dev(td0, "class", "no svelte-1ucdyll");
  			add_location(td0, file, 43, 8, 893);
  			attr_dev(td1, "class", "kcode svelte-1ucdyll");
  			add_location(td1, file, 44, 8, 928);
  			attr_dev(td2, "class", "title svelte-1ucdyll");
  			add_location(td2, file, 45, 8, 969);
  			add_location(tr, file, 42, 6, 879);
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
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*_keys*/ 1 && t2_value !== (t2_value = /*obj*/ ctx[4].id + "")) set_data_dev(t2, t2_value);
  			if (dirty & /*_keys*/ 1 && t4_value !== (t4_value = /*obj*/ ctx[4].title + "")) set_data_dev(t4, t4_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(tr);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(42:4) {#each _keys as obj,i}",
  		ctx
  	});

  	return block;
  }

  function create_fragment(ctx) {
  	let div;
  	let b;
  	let t1;
  	let table;
  	let each_value = /*_keys*/ ctx[0];
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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

  			add_location(b, file, 39, 2, 816);
  			attr_dev(table, "class", "svelte-1ucdyll");
  			add_location(table, file, 40, 2, 836);
  			attr_dev(div, "class", "vbox svelte-1ucdyll");
  			add_location(div, file, 38, 0, 794);
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
  			if (dirty & /*_keys*/ 1) {
  				each_value = /*_keys*/ ctx[0];
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
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
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  const _c$1 = "color: blueviolet";

  function instance($$self, $$props, $$invalidate) {
  	let _keys;
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots("Hotkeys", slots, []);
  	let keys = [];

  	function reloadKeys() {
  		console.log("%cReload hotkeys.", _c$1);
  		const { macrokeys: mkey } = window.mitm;
  		$$invalidate(1, keys = []);

  		for (const id in mkey) {
  			keys.push({ id, title: mkey[id]._title });
  		}
  	}

  	let observer;

  	onMount(async () => {
  		const qry = ".mitm-container.center";
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
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Hotkeys> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		_c: _c$1,
  		keys,
  		reloadKeys,
  		observer,
  		_keys
  	});

  	$$self.$inject_state = $$props => {
  		if ("keys" in $$props) $$invalidate(1, keys = $$props.keys);
  		if ("observer" in $$props) observer = $$props.observer;
  		if ("_keys" in $$props) $$invalidate(0, _keys = $$props._keys);
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
  		init(this, options, instance, create_fragment, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Hotkeys",
  			options,
  			id: create_fragment.name
  		});
  	}
  }

  var Hotkeys$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': Hotkeys$1
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

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(Hotkeys$2);

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

  const {default: Hotkeys} = require$$0;
  window.mitm.svelte = {
    Hotkeys
  };

  var wsClient = {

  };

  return wsClient;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfc3JjL193c19wb3N0bWVzc2FnZS5qcyIsIl9zcmMvX3dzX2NsaWVudC5qcyIsIl9zcmMvX3dzX21zZy1wYXJzZXIuanMiLCJfc3JjL193c19pbi1pZnJhbWUuanMiLCJfc3JjL193c192ZW5kb3IuanMiLCJfc3JjL193c19pbml0LXNvY2tldC5qcyIsIl9zcmMvX3NjcmVlbnNob3QuanMiLCJfc3JjL193c19uYW1lc3BhY2UuanMiLCJfc3JjL193c19zY3JlZW5zaG90LmpzIiwiX3NyYy9fa2V5Ym9hcmQuanMiLCJfc3JjL193c19sb2NhdGlvbi5qcyIsIl9zcmMvX3dzX2RlYm91bmNlLmpzIiwiX3NyYy9fd3Nfcm91dGUuanMiLCJfc3JjL193c19vYnNlcnZlci5qcyIsIl9zcmMvX3dzX2dlbmVyYWwuanMiLCJfc3JjL193c19jc3AtZXJyLmpzIiwiX3NyYy9fd3NfbWFjcm9zLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9pbnRlcm5hbC9pbmRleC5tanMiLCJzdmVsdGUvSG90a2V5cy5zdmVsdGUiLCJfc3JjL3dzLWNsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UgKGV2ZW50KSB7XHJcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxyXG4gICAgfVxyXG4gIH1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcclxufVxyXG4iLCJjb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCB3aW5kb3dSZWZcclxuICByZXR1cm4ge1xyXG4gICAgLy8gZXg6IHdzX19oZWxwKClcclxuICAgIF9oZWxwICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fcGluZyhcInRoZXJlXCIpXHJcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuICAgIH0sXHJcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXHJcbiAgICBfb3BlbiAoeyBkYXRhIH0pIHtcclxuICAgICAgY29uc3QgZmVhdHVyZXMgPSAnZGlyZWN0b3JpZXM9MCx0aXRsZWJhcj0wLHRvb2xiYXI9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCx3aWR0aD04MDAsaGVpZ2h0PTYwMCdcclxuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxyXG4gICAgICB3aW5kb3dSZWYuYmx1cigpXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxyXG4gICAgX3N0eWxlICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zdCB7IHEsIGNzcyB9ID0gZGF0YVxyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXHJcbiAgICAgICAgbm9kZSA9PiAobm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzKVxyXG4gICAgICApXHJcbiAgICB9LFxyXG4gICAgLy8gZXg6IHdzX19cclxuICAgIF9zYXZlVGFncyAoeyByb3V0ZXMgfSkge1xyXG4gICAgICBpZiAoIWxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IFVwZGF0ZSByb3V0ZXMnLCBfYylcclxuICAgICAgICB3aW5kb3cubWl0bS5yb3V0ZXMgPSByb3V0ZXNcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIGV4OiB3c19fXHJcbiAgICBfZmlsZXMgKHsgZGF0YSwgdHlwIH0pIHtcclxuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cclxuICAgICAgY29uc29sZS53YXJuKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcclxuICAgICAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cclxuICAgICAgICovXHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldICsgJycpXHJcbiAgICAgICAgZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfc2V0Q2xpZW50ICh7IGRhdGEgfSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxyXG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcclxuY29uc3QgX3dzX3djY21kID0gX3dzX2NsaWVudCgpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XHJcbiAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWcpIHtcclxuICAgIGlmIChtc2cubGVuZ3RoID4gNDApIHtcclxuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gd3MtbWVzc2FnZTogYCVzYCcsIG1zZylcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3QgYXJyID0gbXNnLnJlcGxhY2UoL1xccyskLywgJycpLm1hdGNoKC9eICooW1xcdzpdKykgKihcXHsuKikvKVxyXG4gIGlmIChhcnIpIHtcclxuICAgIGxldCBbLCBjbWQsIGpzb25dID0gYXJyXHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGpzb24sIGVycm9yKVxyXG4gICAgfVxyXG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xyXG4gICAgICBjb25zdCBoYW5kbGVyID0gd2luZG93Ll93c19xdWV1ZVtjbWRdXHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2NtZF1cclxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXHJcbiAgICB9IGVsc2UgaWYgKF93c193Y2NtZFtjbWRdKSB7XHJcbiAgICAgIF93c193Y2NtZFtjbWRdLmNhbGwoZXZlbnQsIGpzb24pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGxldCBpZnJtXHJcbiAgdHJ5IHtcclxuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmcm0gPSB0cnVlXHJcbiAgfVxyXG4gIHJldHVybiBpZnJtID8gJ2lmcmFtZScgOiAnd2luZG93J1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgdmVuZG9yIH0gPSBuYXZpZ2F0b3JcclxuICBjb25zdCBicm93c2VyID0ge1xyXG4gICAgJyc6ICdmaXJlZm94JyxcclxuICAgICdHb29nbGUgSW5jLic6ICdjaHJvbWl1bScsXHJcbiAgICAnQXBwbGUgQ29tcHV0ZXIsIEluYy4nOiAnd2Via2l0J1xyXG4gIH1bdmVuZG9yXVxyXG4gIHJldHVybiBicm93c2VyXHJcbn1cclxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX21zZ1BhcnNlciA9IHJlcXVpcmUoJy4vX3dzX21zZy1wYXJzZXInKVxyXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxyXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcclxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICB3aW5kb3cuX3dzX3F1ZXVlID0ge31cclxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXHJcbiAgY29uc3Qge19fYXJncywgX19mbGFnfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcclxuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcclxuICAgIGZ1bmN0aW9uIHdzX3NlbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZuID0gd2luZG93Ll93c19jb25uZWN0W2tleV1cclxuICAgICAgICB3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kID0gdHJ1ZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxyXG4gICAgICAgIGZuKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcclxuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxyXG4gICAgd2luZG93Ll93c19jb25uZWN0ZWQgPSB0cnVlXHJcblxyXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGlmICghd2luZG93Ll93c19jb25uZWN0ZWRfc2VuZCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXHJcbiAgICAgICAgd3Nfc2VuZCgpXHJcbiAgICAgIH1cclxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXHJcbiAgfVxyXG5cclxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBjbG9zZSBjb25uZWN0aW9uJywgX2MpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKF9fZmxhZ1snb24tbWVzc2FnZSddKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBvbi1tZXNzYWdlOicsIF9jLCBlLmRhdGEpXHJcbiAgICB9XHJcbiAgICBfd3NfbXNnUGFyc2VyKGUsIGUuZGF0YSlcclxuICB9XHJcbiAgXHJcbiAgY29uc3QgY29ubmVjdCA9IF9fYXJncy5ub3NvY2tldD09PXVuZGVmaW5lZFxyXG4gIGlmIChjb25uZWN0IHx8ICh3aW5kb3cuY2hyb21lICYmIGNocm9tZS50YWJzKSkge1xyXG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcclxuICAgIGNvbnN0IHByZSA9IHZlbmRvciA/ICd3cycgOiAnd3NzJ1xyXG4gICAgY29uc3QgcHJ0ID0gdmVuZG9yID8gJzMwMDInIDogJzMwMDEnXHJcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcclxuICAgIGxldCB3c1xyXG4gICAgdHJ5IHtcclxuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxyXG4gICAgfVxyXG4gICAgY29uc29sZS50aW1lKCd3cycpXHJcbiAgICB3aW5kb3cuX3dzID0gd3NcclxuICBcclxuICAgIHdzLm9ub3BlbiA9IG9ub3BlblxyXG4gICAgd3Mub25jbG9zZSA9IG9uY2xvc2VcclxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXHJcbiAgfVxyXG4gIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xyXG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXHJcbiAgfVxyXG59XHJcbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XHJcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxyXG4gIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgICB9XHJcbiAgICAgICAgZmV0Y2goJy9taXRtLXBsYXkvc2NyZW5zaG90Lmpzb24nLCBjb25maWcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmVzb2x2ZShyZXNwb25zZS5qc29uKCkpfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHJlamVjdChlcnJvcilcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5zaG90JywganNvbiwgcmVzb2x2ZSlcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICByZWplY3QoZXJyb3IpXHJcbiAgICAgIH1cclxuICAgIH0pICBcclxuICB9XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cclxuICBsZXQgbmFtZXNwYWNlXHJcblxyXG4gIGZ1bmN0aW9uIHRvUmVnZXggKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcclxuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vZywgJ1teLl0qJykpKSkge1xyXG4gICAgICBuYW1lc3BhY2UgPSBrZXlcclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5hbWVzcGFjZVxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgbWl0bSAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuXHJcbmxldCBhY3RcclxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xyXG4gIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XHJcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBkZWxheSBhY3Rpb24nKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChhY3QpIHtcclxuICAgICAgYWN0ID0gdW5kZWZpbmVkXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cclxuICBjb25zdCB7IHNlbGVjdG9yIH0gPSByb3V0ZS5zY3JlZW5zaG90XHJcblxyXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcclxuICBjb25zdCBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vZywgJ34nKVxyXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcclxuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xyXG4gICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXHJcbiAgICB9XHJcbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXHJcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgYnJvd3NlciB9XHJcbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXHJcbiAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcclxuICAgICAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcclxuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcclxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXRcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgYWN0ID0gd2luZG93Lm1pdG0uc2NyZWVuc2hvdFxyXG4gICAgICAgICAgaWYgKGFjdCkge1xyXG4gICAgICAgICAgICBhY3QuY2xpY2soKVxyXG4gICAgICAgICAgICBhY3QgPSB1bmRlZmluZWRcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBkZWxheSBhY3Rpb24gdW5kZWZpbmVkJywgX2MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIGRlbGF5KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXZlbnRjbGljayhlKSB7XHJcbiAgbWl0bS5sYXN0RXZlbnQgPSBlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50Y2xpY2spXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG4iLCJjb25zdCBrY29kZTEgPSB7XHJcbiAgQmFja3F1b3RlOiAnYCcsXHJcbiAgQnJhY2tldExlZnQ6ICdbJyxcclxuICBCcmFja2V0UmlnaHQ6ICddJyxcclxuICBCYWNrc2xhc2g6ICdcXFxcJyxcclxuICBDb21tYSAgICA6ICcsJyxcclxuICBQZXJpb2QgICA6ICcuJyxcclxuICBRdW90ZSAgICA6IFwiJ1wiLFxyXG4gIFNlbWljb2xvbjogJzsnLFxyXG4gIFNsYXNoICAgIDogJy8nLFxyXG4gIFNwYWNlICAgIDogJyAnLFxyXG4gIE1pbnVzICAgIDogJy0nLFxyXG4gIEVxdWFsICAgIDogJz0nLFxyXG59XHJcblxyXG5jb25zdCBrY29kZTIgPSB7XHJcbiAgQmFja3F1b3RlOiAnficsXHJcbiAgQnJhY2tldExlZnQ6ICd7JyxcclxuICBCcmFja2V0UmlnaHQ6ICd9JyxcclxuICBCYWNrc2xhc2g6ICd8JyxcclxuICBDb21tYSAgICA6ICc8JyxcclxuICBQZXJpb2QgICA6ICc+JyxcclxuICBRdW90ZSAgICA6ICdcIicsXHJcbiAgU2VtaWNvbG9uOiAnOicsXHJcbiAgU2xhc2ggICAgOiAnPycsXHJcbiAgU3BhY2UgICAgOiAnICcsXHJcbiAgTWludXMgICAgOiAnXycsXHJcbiAgRXF1YWwgICAgOiAnKycsXHJcbn1cclxuXHJcbmNvbnN0IGtjb2RlMyA9IHtcclxuICAxOiAnIScsXHJcbiAgMjogJ0AnLFxyXG4gIDM6ICcjJyxcclxuICA0OiAnJCcsXHJcbiAgNTogJyUnLFxyXG4gIDY6ICdeJyxcclxuICA3OiAnJicsXHJcbiAgODogJyonLFxyXG4gIDk6ICcoJyxcclxuICAxMDogJyknXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGV2biwgb3B0PXtjb2RlT25seTpmYWxzZX0pID0+IHtcclxuICBjb25zdCB7Y29kZSwgc2hpZnRLZXl9ID0gZXZuXHJcbiAgY29uc3Qge2NvZGVPbmx5fSA9IG9wdFxyXG4gIGxldCBtYXRjaFxyXG4gIGxldCBjaGFyID0gJydcclxuICBtYXRjaCA9IGNvZGUubWF0Y2goL0tleSguKS8pXHJcbiAgaWYgKG1hdGNoKSB7XHJcbiAgICBjaGFyID0gbWF0Y2gucG9wKClcclxuICAgIGlmICghY29kZU9ubHkgJiYgIXNoaWZ0S2V5KSB7XHJcbiAgICAgIGNoYXIgPSBjaGFyLnRvTG93ZXJDYXNlKClcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgbWF0Y2ggPSBjb2RlLm1hdGNoKC8oRGlnaXR8TnVtcGFkKSguKS8pXHJcbiAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgY2hhciA9IG1hdGNoLnBvcCgpXHJcbiAgICAgIGlmICghY29kZU9ubHkgJiYgc2hpZnRLZXkpIHtcclxuICAgICAgICBjaGFyID0ga2NvZGUzW2NoYXJdXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICghY29kZU9ubHkgJiYgc2hpZnRLZXkpIHtcclxuICAgICAgICBjaGFyID0ga2NvZGUyW2NvZGVdXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY2hhciA9IGtjb2RlMVtjb2RlXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjaGFyXHJcbn1cclxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxyXG5jb25zdCBfa2V5ID0gcmVxdWlyZSgnLi9fa2V5Ym9hcmQnKVxyXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcclxuY29uc3Qgc3R5bGVMZWZ0ICA9ICd0b3A6ICAxcHg7IGxlZnQ6ICAzcHg7J1xyXG5jb25zdCBzdHlsZVRvcFIgID0gJ3RvcDogLTRweDsgcmlnaHQ6IDNweDsnXHJcbmNvbnN0IHN0eWxlUmlnaHQgPSAndG9wOiAxNnB4OyByaWdodDogM3B4OyB0ZXh0LWFsaWduOiBlbmQ7J1xyXG5jb25zdCBidXR0b25TdHlsZT0gJydcclxuY29uc3Qgc3R5bGUgPSBgXHJcbi5taXRtLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGZpeGVkO1xyXG4gIHotaW5kZXg6IDk5OTk5O1xyXG59XHJcbi5taXRtLWNvbnRhaW5lci5jZW50ZXIge1xyXG4gIGJhY2tncm91bmQ6ICNkY2VhZmZiMDtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgLyogY2VudGVyIHRoZSBlbGVtZW50ICovXHJcbiAgcmlnaHQ6IDA7XHJcbiAgbGVmdDogMDtcclxuICB0b3A6IDIwcHg7XHJcbiAgbWFyZ2luLXJpZ2h0OiBhdXRvO1xyXG4gIG1hcmdpbi1sZWZ0OiBhdXRvO1xyXG4gIC8qIGdpdmUgaXQgZGltZW5zaW9ucyAqL1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDUwcHgpO1xyXG4gIHdpZHRoOiA5MCU7XHJcbiAgZGlzcGxheTogbm9uZTtcclxufVxyXG4ubWl0bS1idG4ge1xyXG4gIGNvbG9yOiBibGFjaztcclxuICBib3JkZXI6IG5vbmU7XHJcbiAgZm9udC1zaXplOiA4cHg7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIHBhZGRpbmc6IDFweCA2cHg7XHJcbiAgYm9yZGVyLXJhZGl1czogM3B4O1xyXG4gIGZvbnQtZmFtaWx5OiBtb25hY28sIENvbnNvbGFzLCBcIkx1Y2lkYSBDb25zb2xlXCIsIG1vbm9zcGFjZTtcclxufVxyXG4ubWl0bS1idG46aG92ZXJ7XHJcbiAgdGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtcclxufVxyXG4uYmdyb3VwLWxlZnQgYnV0dG9uLFxyXG4uYmdyb3VwLXJpZ2h0IGJ1dHRvbiB7XHJcbiAgZGlzcGxheTp0YWJsZTtcclxuICBtYXJnaW4tdG9wOiA0cHg7XHJcbn1gXHJcblxyXG5sZXQgY29udGFpbmVyID0ge1xyXG4gIHJpZ2h0OiB7fSxcclxuICB0b3ByOiB7fSxcclxuICBsZWZ0OiB7fSxcclxuICBzdmx0OiB7fSxcclxufVxyXG5sZXQgYnV0dG9uID0ge31cclxubGV0IGJncm91cCA9IHtcclxuICByaWdodDoge30sXHJcbiAgdG9wcjoge30sXHJcbiAgbGVmdDoge30sXHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9wb3N0KGpzb24pIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcclxuICAgICAgfVxyXG4gICAgICBmZXRjaCgnL21pdG0tcGxheS9wbGF5Lmpzb24nLCBjb25maWcpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEgICAgKSB7IHJlc29sdmUoZGF0YSkgICAgICAgICAgIH0pXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICByZWplY3QoZXJyb3IpXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcGxheSAoYXV0b2ZpbGwpIHtcclxuICBjb25zdCB7X19hcmdzfSA9IHdpbmRvdy5taXRtXHJcbiAgaWYgKGF1dG9maWxsKSB7XHJcbiAgICBpZiAodHlwZW9mIChhdXRvZmlsbCkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXHJcbiAgICB9XHJcbiAgICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXHJcbiAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxyXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgY29uc3QgX2ZyYW1lID0gd2luZG93Wyd4cGxheS1mcmFtZSddXHJcbiAgICBjb25zdCBfanNvbiA9IHthdXRvZmlsbCwgYnJvd3NlciwgX3BhZ2UsIF9mcmFtZX1cclxuICAgIGNvbnN0IG1zZyA9IGxlbnRoID09PSAxID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpXHJcbiAgICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6ICR7bXNnfWAsIF9jKVxyXG4gICAgbGV0IHJlc3VsdFxyXG4gICAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xyXG4gICAgICByZXN1bHQgPSBhd2FpdCBfcG9zdChfanNvbilcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc3VsdCA9IGF3YWl0IF9wbGF5KF9qc29uKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gX3BsYXkoanNvbikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCBqc29uLCByZXNvbHZlKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhaXQobXMpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSlcclxufTtcclxuXHJcbmZ1bmN0aW9uIHRvUmVnZXggKHBhdGhNc2cpIHtcclxuICBsZXQgW3BhdGgsIG1zZ10gPSBwYXRoTXNnLnNwbGl0KCc9PicpLm1hcChpdGVtID0+IGl0ZW0udHJpbSgpKVxyXG4gIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JylcclxuICByZXR1cm4geyBwYXRoLCBtc2cgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVCdXR0b24oYnV0dG9ucywgcG9zKSB7XHJcbiAgbGV0IGJyXHJcbiAgZm9yIChjb25zdCBpZCBpbiBidXR0b25zKSB7XHJcbiAgICBjb25zdCBbY2FwdGlvbiwgY29sb3IsIGtsYXNdID0gaWQuc3BsaXQoJ3wnKVxyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcclxuICAgIGNvbnN0IGZuICA9IGJ1dHRvbnNbaWRdXHJcbiAgICBidG4ub25jbGljayA9IGFzeW5jIGUgPT4ge1xyXG4gICAgICBsZXQgYXJyID0gZm4oZSlcclxuICAgICAgaWYgKGFyciBpbnN0YW5jZW9mIFByb21pc2UpIHtcclxuICAgICAgICBhcnIgPSBhd2FpdCBhcnJcclxuICAgICAgfVxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XHJcbiAgICAgICAgYXdhaXQgcGxheShhcnIpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGJ0bi5pbm5lclRleHQgPSBjYXB0aW9uXHJcbiAgICBidG4uY2xhc3NMaXN0LmFkZCgnbWl0bS1idG4nKVxyXG4gICAgYnRuLmNsYXNzTGlzdC5hZGQoYCR7cG9zfWApXHJcbiAgICBidG4uY2xhc3NMaXN0LmFkZChrbGFzIHx8IGNhcHRpb24pXHJcbiAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXHJcbiAgICBpZiAocG9zPT09J3RvcHInKSB7XHJcbiAgICAgIGJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXHJcbiAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXHJcbiAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJyKVxyXG4gICAgfVxyXG4gICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoYnRuKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0QnV0dG9ucyAoYnV0dG9ucywgcG9zaXRpb24pIHtcclxuICBpZiAoYmdyb3VwW3Bvc2l0aW9uXSkge1xyXG4gICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xyXG4gICAgY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvc2l0aW9uKVxyXG4gIH1cclxufVxyXG5cclxubGV0IGRlYnVua1xyXG5sZXQgaW50ZXJ2SWRcclxubGV0IG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXHJcblxyXG5hc3luYyBmdW5jdGlvbiB1cmxDaGFuZ2UgKGV2ZW50KSB7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgY29uc3Qge21pdG19ID0gd2luZG93XHJcblxyXG4gIGNsZWFySW50ZXJ2YWwoaW50ZXJ2SWQpXHJcbiAgaWYgKG1pdG0uYXV0b2ludGVydmFsKSB7ZGVsZXRlIG1pdG0uYXV0b2ludGVydmFsfVxyXG4gIGlmIChtaXRtLmF1dG9maWxsKSAgICAge2RlbGV0ZSBtaXRtLmF1dG9maWxsICAgIH1cclxuICBpZiAobWl0bS5hdXRvYnV0dG9ucykgIHtkZWxldGUgbWl0bS5hdXRvYnV0dG9ucyB9XHJcbiAgaWYgKG1pdG0ubGVmdGJ1dHRvbnMpICB7ZGVsZXRlIG1pdG0ubGVmdGJ1dHRvbnMgfVxyXG4gIGlmIChtaXRtLnJpZ2h0YnV0dG9ucykge2RlbGV0ZSBtaXRtLnJpZ2h0YnV0dG9uc31cclxuICBpZiAobWl0bS5tYWNyb2tleXMpICAgIHtkZWxldGUgbWl0bS5tYWNyb2tleXMgICB9XHJcbiAgaWYgKG5hbWVzcGFjZSkge1xyXG4gICAgY29uc3Qge2hyZWYsIG9yaWdpbn0gPSBsb2NhdGlvblxyXG4gICAgY29uc3QgX2hyZWYgPSBocmVmLnJlcGxhY2Uob3JpZ2luLCAnJylcclxuICAgIGNvbnN0IHtfbWFjcm9zXywgbWFjcm9zfSA9IHdpbmRvdy5taXRtXHJcbiAgICBvYnNlcnZlcmZuID0gW11cclxuICAgIF9tYWNyb3NfICYmIF9tYWNyb3NfKClcclxuICAgIGZvciAoY29uc3Qga2V5IGluIG1hY3Jvcykge1xyXG4gICAgICBjb25zdCB7IHBhdGgsIG1zZyB9ID0gdG9SZWdleChrZXkpXHJcbiAgICAgIGlmIChfaHJlZi5tYXRjaChwYXRoKSkge1xyXG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBtc2cgfHwgJ0VudHJ5J1xyXG4gICAgICAgIGxldCBmbnMgPSBtYWNyb3Nba2V5XSgpXHJcbiAgICAgICAgaWYgKGZucyBpbnN0YW5jZW9mIFByb21pc2UpIHtcclxuICAgICAgICAgIGZucyA9IGF3YWl0IGZuc1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGZucyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZucylcclxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZm5zKSkge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBmbjIgb2YgZm5zKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4yID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZuMilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KGRlYnVuaylcclxuICAgICAgICBkZWJ1bmsgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXHJcbiAgICAgICAgICBkZWJ1bmsgPSB1bmRlZmluZWRcclxuICAgICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxyXG4gICAgICAgICAgbGVmdGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhsZWZ0YnV0dG9ucywgJ2xlZnQnKVxyXG4gICAgICAgICAgaWYgKHdpbmRvdy5taXRtLmF1dG9maWxsKSB7XHJcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xyXG4gICAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxyXG4gICAgICAgICAgICAgICdFbnRyeScoKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQge2F1dG9maWxsfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF1dG9maWxsID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcGxheShhdXRvZmlsbClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sICd0b3ByJylcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICd0b3ByJylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCAwKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcclxuICBjb250YWluZXIudG9wci5zdHlsZSAgPSBzdHlsZVRvcFJcclxuICBjb250YWluZXIubGVmdC5zdHlsZSAgPSBzdHlsZUxlZnRcclxuICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxyXG4gIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgaWYgKHR5cGVvZiAod2luZG93Lm1pdG0uYXV0b2ludGVydmFsKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcclxuICB9XHJcbiAgY3RybCA9IGZhbHNlXHJcbn1cclxuXHJcbmNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY29tcGFyZUhyZWYpO1xyXG53aW5kb3cub2JzZXJ2ZXIgPSBvYnNlcnZlclxyXG5mdW5jdGlvbiBvYnNlcnZlZCgpIHtcclxuICBvYnNlcnZlci5kaXNjb25uZWN0KClcclxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgIHN1YnRyZWU6IHRydWVcclxuICB9KVxyXG59XHJcblxyXG5jb25zdCBfdXJsQ2hhbmdlZCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgY29uc3QgaHRtbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKVxyXG4gIGNvbnN0IGh0bWxyZWYgPSBodG1sLmZpcnN0RWxlbWVudENoaWxkXHJcbiAgY29uc3Qgc3R5bGVCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXHJcbiAgY29uc3QgZGl2UmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gIGNvbnN0IGRpdlRvcFIgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICBjb25zdCBkaXZMZWZ0ICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgY29uc3QgZGl2Q2VudGVyPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG5cclxuICBzdHlsZUJ0bi5pbm5lckhUTUwgPSBzdHlsZVxyXG4gIGRpdlJpZ2h0LmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1yaWdodFwiPjwvc3Bhbj5gXHJcbiAgZGl2VG9wUi5pbm5lckhUTUwgID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXRvcHJcIj48L3NwYW4+YFxyXG4gIGRpdkxlZnQuaW5uZXJIVE1MICA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1sZWZ0XCI+PC9zcGFuPmBcclxuICBkaXZMZWZ0LmNsYXNzTmFtZSAgPSAnbWl0bS1jb250YWluZXIgbGVmdCdcclxuICBkaXZUb3BSLmNsYXNzTmFtZSAgPSAnbWl0bS1jb250YWluZXIgdG9wcidcclxuICBkaXZSaWdodC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcmlnaHQnXHJcbiAgZGl2Q2VudGVyLmNsYXNzTmFtZT0gJ21pdG0tY29udGFpbmVyIGNlbnRlcidcclxuICBkaXZSaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcclxuICBkaXZUb3BSLnN0eWxlICA9IHN0eWxlVG9wUlxyXG4gIGRpdkxlZnQuc3R5bGUgICA9IHN0eWxlTGVmdFxyXG5cclxuICBodG1sLmluc2VydEJlZm9yZShzdHlsZUJ0biwgaHRtbHJlZilcclxuICBodG1sLmluc2VydEJlZm9yZShkaXZSaWdodCwgaHRtbHJlZilcclxuICBodG1sLmluc2VydEJlZm9yZShkaXZUb3BSLCBodG1scmVmKVxyXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdkxlZnQsIGh0bWxyZWYpXHJcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2Q2VudGVyLCBodG1scmVmKVxyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgY29udGFpbmVyLnJpZ2h0PSBkaXZSaWdodFxyXG4gICAgY29udGFpbmVyLnRvcHIgPSBkaXZUb3BSXHJcbiAgICBjb250YWluZXIubGVmdCA9IGRpdkxlZnRcclxuICAgIGNvbnRhaW5lci5zdmx0ID0gZGl2Q2VudGVyXHJcbiAgICBidXR0b24uc3R5bGUgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXHJcbiAgICBiZ3JvdXAucmlnaHQgPSBkaXZSaWdodC5jaGlsZHJlblswXVxyXG4gICAgYmdyb3VwLnRvcHIgID0gZGl2VG9wUi5jaGlsZHJlblswXVxyXG4gICAgYmdyb3VwLmxlZnQgID0gZGl2TGVmdC5jaGlsZHJlblswXVxyXG4gICAgdXJsQ2hhbmdlKF91cmxDaGFuZ2VkKVxyXG4gICAgb2JzZXJ2ZWQoKVxyXG4gIH0sIDApXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hY3JvQXV0b21hdGlvbihtYWNybykge1xyXG4gIGlmIChBcnJheS5pc0FycmF5KG1hY3JvKSkge1xyXG4gICAgbGV0IG1hY3JvSW5kZXggPSAwXHJcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgbGV0IHNlbGVjdG9yID0gbWFjcm9bbWFjcm9JbmRleF1cclxuICAgICAgaWYgKHNlbGVjdG9yLm1hdGNoKC9eICpbPS1dPi8pKSB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXHJcbiAgICAgICAgc2VsZWN0b3IgPSBgJHthY3RpdmVFbGVtZW50fSAke3NlbGVjdG9yfWBcclxuICAgICAgfVxyXG4gICAgICBwbGF5KFtzZWxlY3Rvcl0pXHJcblxyXG4gICAgICBtYWNyb0luZGV4ICs9IDFcclxuICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcclxuICAgICAgfVxyXG4gICAgfSwgMTAwKVxyXG4gIH1cclxufVxyXG5cclxubGV0IHN0ZERibCA9IFtdXHJcbmxldCBoZ2hEYmwgPSBbXVxyXG5sZXQgc3RkQ3RsID0gW11cclxubGV0IGhnaEN0bCA9IFtdXHJcbmxldCBzdGRBbHQgPSBbXVxyXG5sZXQgaGdoQWx0ID0gW11cclxubGV0IHNhdmVLZXkgPSAnJ1xyXG5jb25zdCBrZGVsYXkgPSAxMDAwXHJcblxyXG5sZXQgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcclxuZnVuY3Rpb24gbWFjcm9EYmwoKSB7XHJcbiAgY29uc3Qga2V5MSA9IGBrZXk6JHtzdGREYmwuam9pbignJyl9YFxyXG4gIGNvbnN0IGtleTIgPSBgY29kZToke2hnaERibC5qb2luKCc6Jyl9YFxyXG4gIGNvbnN0IHsgbWFjcm9rZXlzLCBsYXN0S2V5OiBlIH0gPSB3aW5kb3cubWl0bVxyXG5cclxuICBzdGREYmwgPSBbXVxyXG4gIGhnaERibCA9IFtdXHJcbiAgc2F2ZUtleSA9ICcnXHJcbiAgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcclxuICBsZXQgbWFjcm8gPSBtYWNyb2tleXNba2V5MV0gfHwgbWFjcm9rZXlzW2tleTJdXHJcbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiBjdHJsICsgYWx0ICArICAke2tleTF9ICB8ICAke2tleTJ9YCwgX2MpXHJcbiAgaWYgKG1hY3JvKSB7XHJcbiAgICBtYWNybyA9IG1hY3JvKGUpXHJcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxufVxyXG5cclxubGV0IGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXHJcbmZ1bmN0aW9uIG1hY3JvQ3RsKCkge1xyXG4gIGNvbnN0IGtleTEgPSBga2V5Ojwke3N0ZEN0bC5qb2luKCcnKX0+YFxyXG4gIGNvbnN0IGtleTIgPSBgY29kZTo8JHtoZ2hDdGwuam9pbignOicpfT5gXHJcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXHJcblxyXG4gIHN0ZEN0bCA9IFtdXHJcbiAgaGdoQ3RsID0gW11cclxuICBzYXZlS2V5ID0gJydcclxuICBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxyXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cclxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBjdHJsICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWVhZjEnKVxyXG4gIGlmIChtYWNybykge1xyXG4gICAgbWFjcm8gPSBtYWNybyhlKVxyXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbn1cclxuXHJcbmxldCBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxyXG5mdW5jdGlvbiBtYWNyb0FsdCgpIHtcclxuICBjb25zdCBrZXkxID0gYGtleTp7JHtzdGRBbHQuam9pbignJyl9fWBcclxuICBjb25zdCBrZXkyID0gYGNvZGU6eyR7aGdoQWx0LmpvaW4oJzonKX19YFxyXG4gIGNvbnN0IHsgbWFjcm9rZXlzLCBsYXN0S2V5OiBlIH0gPSB3aW5kb3cubWl0bVxyXG5cclxuICBzdGRBbHQgPSBbXVxyXG4gIGhnaEFsdCA9IFtdXHJcbiAgc2F2ZUtleSA9ICcnXHJcbiAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcclxuICBsZXQgbWFjcm8gPSBtYWNyb2tleXNba2V5MV0gfHwgbWFjcm9rZXlzW2tleTJdXHJcbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAuLi4uICsgYWx0ICArICR7a2V5MX0gfCAke2tleTJ9YCwgJ2NvbG9yOiAjYmFkYWYxJylcclxuICBpZiAobWFjcm8pIHtcclxuICAgIG1hY3JvID0gbWFjcm8oZSlcclxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBrZXliVXAgKGUpIHtcclxuICBpZiAoIWUuYWx0S2V5KSB7XHJcbiAgICBpZiAoZGVib3VuY2VEYmwgfHwgKGRlYm91bmNlQ3RsICYmICFlLmN0cmxLZXkpIHx8IGRlYm91bmNlQWx0KSB7XHJcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcclxuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQ3RsKVxyXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXHJcbiAgICAgIGlmIChkZWJvdW5jZURibCkge1xyXG4gICAgICAgIG1hY3JvRGJsKClcclxuICAgICAgfSBlbHNlIFxyXG4gICAgICBpZiAoZGVib3VuY2VDdGwpIHtcclxuICAgICAgICBtYWNyb0N0bCgpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWFjcm9BbHQoKVxyXG4gICAgICB9XHJcbiAgICAgIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXHJcbiAgICAgIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXHJcbiAgICAgIGRlYm91bmNlQWx0ID0gdW5kZWZpbmVkXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbnZhciBjdHJsID0gZmFsc2VcclxudmFyIHN2bHQgPSBmYWxzZVxyXG5mdW5jdGlvbiBrZXliQ3RybCAoZSkge1xyXG4gIGlmICghZS5jb2RlIHx8IFsnQWx0JywgJ0NvbnRyb2wnLCAnTWV0YSddLmluY2x1ZGVzKGUua2V5KSkge1xyXG4gICAgcmV0dXJuXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChlLmtleT09PSdTaGlmdCcpIHtcclxuICAgICAgaWYgKGUuY3RybEtleSAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICBpZiAoZS5jb2RlPT09J1NoaWZ0UmlnaHQnKSB7XHJcbiAgICAgICAgICBjdHJsID0gIWN0cmxcclxuICAgICAgICAgIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IHN0eWxlUmlnaHQgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICAgICAgICBjb250YWluZXIudG9wci5zdHlsZSAgPSBzdHlsZVRvcFIgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpXHJcbiAgICAgICAgICBjb250YWluZXIubGVmdC5zdHlsZSAgPSBzdHlsZUxlZnQgKyAoIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOycpICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc3ZsdCA9ICFzdmx0XHJcbiAgICAgICAgICBpZiAoc3ZsdCkge1xyXG4gICAgICAgICAgICBjb250YWluZXIuc3ZsdC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb250YWluZXIuc3ZsdC5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IGNoYXIgPSBfa2V5KGUpXHJcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcclxuICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgY2hhciA9IF9rZXkoZSwge2NvZGVPbmx5OiB0cnVlfSlcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcclxuICAgICAgICAgIHNhdmVLZXkgKz0gY2hhclxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBcclxuICAgICAgICBzdGREYmwucHVzaChjaGFyKVxyXG4gICAgICAgIGhnaERibC5wdXNoKGUuY29kZSlcclxuICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXHJcbiAgICAgICAgZGVib3VuY2VEYmwgPSBzZXRUaW1lb3V0KG1hY3JvRGJsLCBrZGVsYXkpXHJcbiAgICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgc3RkQ3RsLnB1c2goY2hhcilcclxuICAgICAgICBoZ2hDdGwucHVzaChlLmNvZGUpXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQ3RsKVxyXG4gICAgICAgIGRlYm91bmNlQ3RsID0gc2V0VGltZW91dChtYWNyb0N0bCwga2RlbGF5KVxyXG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XHJcbiAgICAgICAgc3RkQWx0LnB1c2goY2hhcilcclxuICAgICAgICBoZ2hBbHQucHVzaChlLmNvZGUpXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxyXG4gICAgICAgIGRlYm91bmNlQWx0ID0gc2V0VGltZW91dChtYWNyb0FsdCwga2RlbGF5KVxyXG4gICAgICB9XHJcbiAgICAgIGUuX2tleXMgPSBzYXZlS2V5XHJcbiAgICAgIG1pdG0ubGFzdEtleSA9IGUgICAgICAgIFxyXG4gICAgfSBcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxyXG5sZXQgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxubGV0IG9EZWJ1bmsgPSB1bmRlZmluZWRcclxubGV0IG9ic2VydmVyZm4gPSBbXVxyXG5cclxuZnVuY3Rpb24gY29tcGFyZUhyZWYobm9kZXMpIHtcclxuICAvLyBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IERPTSBtdXRhdGVkIWAsIF9jKVxyXG4gIGlmIChvbGRIcmVmICE9IGxvY2F0aW9uLmhyZWYpIHtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KF91cmxDaGFuZ2VkKVxyXG4gICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKG9ic2VydmVyZm4ubGVuZ3RoKSB7XHJcbiAgICAgIG9EZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KG9EZWJ1bmspXHJcbiAgICAgIG9EZWJ1bmsgPSBzZXRUaW1lb3V0KCgpPT4ge1xyXG4gICAgICAgIG9EZWJ1bmsgPSB1bmRlZmluZWRcclxuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIG9ic2VydmVyZm4pIHtcclxuICAgICAgICAgIGNvbnN0IG5hbWUgPSBmbi5uYW1lXHJcbiAgICAgICAgICBpZiAobmFtZSAmJiBuYW1lLm1hdGNoKC9PbmNlJC8pKSB7XHJcbiAgICAgICAgICAgIGlmIChvbmNlc1tuYW1lXSkgeyAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcclxuICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG9uY2VzW25hbWVdID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBmbihub2RlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qge2F1dG9idXR0b25zLCByaWdodGJ1dHRvbnMsIGxlZnRidXR0b25zfSA9IHdpbmRvdy5taXRtXHJcbiAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxyXG4gICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JylcclxuICAgICAgICBjb25zdCB7IGF1dG9maWxsIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgICAgIGlmIChhdXRvZmlsbCkge1xyXG4gICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XHJcbiAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxyXG4gICAgICAgICAgICAnRW50cnknKCkge3BsYXkoYXV0b2ZpbGwpfVxyXG4gICAgICAgICAgfSwgJ3RvcHInKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSwgMTAwKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gd3NMb2NhdGlvbigpIHtcclxuICBjb25zdCB2ZW5kb3IgPSBfd3NfdmVuZG9yKClcclxuICBpZiAoWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKHZlbmRvcikgfHwgKGNocm9tZSAmJiAhY2hyb21lLnRhYnMpKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWJDdHJsKVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5YlVwKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpXHJcbiAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcclxuICAgICAgaW5pdCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0KVxyXG4gICAgfSAgICBcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG5cclxuICB3aW5kb3cubWl0bS5mbi5wbGF5ID0gcGxheVxyXG4gIHdpbmRvdy5taXRtLmZuLndhaXQgPSB3YWl0XHJcbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxyXG4gIGhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxyXG4gICAgY29tcGFyZUhyZWYoKVxyXG4gIH1cclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IHdzTG9jYXRpb24iLCJmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGRlbGF5ID0gNTAwKSB7XHJcbiAgbGV0IF90aW1lb3V0XHJcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IF90aGlzID0gdGhpc1xyXG4gICAgY29uc3QgYXJncyA9IGFyZ3VtZW50c1xyXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxyXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgZm4uYXBwbHkoX3RoaXMsIGFyZ3MpXHJcbiAgICB9LCBkZWxheSlcclxuICB9XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZVxyXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcclxuICBsZXQgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXVxyXG4gIGNvbnN0IHtfc3VibnM6IHN9ID0gcm91dGUuX2NoaWxkbnNcclxuICBpZiAocyAmJiBtaXRtLnJvdXRlc1tzXSkge1xyXG4gICAgcm91dGU9IG1pdG0ucm91dGVzW3NdXHJcbiAgfVxyXG4gIHJldHVybiByb3V0ZVxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgTXV0YXRpb25PYnNlcnZlciAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcbmNvbnN0IF93c19kZWJvdW5jZSA9IHJlcXVpcmUoJy4vX3dzX2RlYm91bmNlJylcclxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXHJcbmNvbnN0IF93c19yb3V0ZSA9IHJlcXVpcmUoJy4vX3dzX3JvdXRlJylcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGlmIChsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG4gIGNvbnN0IGhvc3QgPSBsb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSgnOi8vJyAsJ35+JylcclxuICBjb25zdCBzc2hvdCA9IHt9XHJcbiAgY29uc3Qgbm9kZXMgPSB7fVxyXG5cclxuICBsZXQgcm91dGUgPSBfd3Nfcm91dGUoKVxyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBvYikge1xyXG4gICAgICBsZXQgZWwgPSB7fVxyXG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XHJcbiAgICAgICAgZWwgPSB7XHJcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGlmICh0eXBlb2Ygb2JbaWRdICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGVsID0ge1xyXG4gICAgICAgICAgdGl0bGU6ICdub2NhcHR1cmUnLFxyXG4gICAgICAgICAgaW5zZXJ0OiBmYWxzZSxcclxuICAgICAgICAgIHJlbW92ZTogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gb2JbaWRdLnNwbGl0KCc6JylcclxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XHJcbiAgICAgICAgICBlbFtlXSA9IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXHJcbiAgICAgIH1cclxuICAgICAgc3Nob3RbaWRdID0gZWxcclxuICAgICAgbm9kZXNbaWRdID0ge1xyXG4gICAgICAgIGluc2VydDogZmFsc2UsXHJcbiAgICAgICAgcmVtb3ZlOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBvYlxyXG4gIGxldCBmbmFtZVxyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxyXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcclxuICBjb25zdCBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XHJcbiAgICAgIG9iID0gcm91dGUuc2NyZWVuc2hvdC5vYnNlcnZlclxyXG4gICAgfVxyXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBub2Rlcykge1xyXG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChpZClcclxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWVcclxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAob2IgJiYgdHlwZW9mIG9iW2lkXT09PSdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kID0gZWxbMF0gfHwgZWxcclxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ9PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBub2QuX3dzX2NvdW50ID0gMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZC5fd3NfY291bnQgKz0gMVxyXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudDwyKSB7XHJcbiAgICAgICAgICAgICAgb2JbaWRdKG5vZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBcclxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxyXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LWluc2VydGBcclxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9XHJcbiAgICAgICAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxyXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcclxuICAgICAgICAgICAgZm5hbWUgPSBgfiR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgXHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxyXG4gICAgICAgICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90XHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICBhdHRyaWJ1dGVzOiBvYiA/IHRydWUgOiBmYWxzZSxcclxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxyXG4gICAgICBzdWJ0cmVlOiB0cnVlXHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKF93c19kZWJvdW5jZShjYWxsYmFjaywgMjgwKSlcclxuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCBvcHRpb25zKVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXHJcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xyXG5cclxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XHJcbiAgbGV0IGlkID0gJydcclxuICB3aGlsZSAoc2l6ZS0tID4gMCkge1xyXG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXHJcbiAgfVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCB7IF93cyB9ID0gd2luZG93XHJcblxyXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxyXG4gIHdpbmRvdy53c19icm9hZGNhc3QgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XHJcbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXHJcbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXHJcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4ID0gJycpID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxyXG4gICAgX3dzLnNlbmQoYGVtaXRwYWdlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX3N0eWxlKHtcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn0pXHJcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cclxuICAgIF93cy5zZW5kKGBfc3R5bGUke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIC8vIGV4OiB3c19fcGluZygnSGkhJylcclxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xyXG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cclxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxyXG4gIH1cclxuXHJcbiAgLy8gZXg6IHdzX19oZWxwKClcclxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XHJcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXHJcbiAgfVxyXG5cclxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXHJcbiAgd2luZG93LndzX19vcGVuID0gKGpzb24pID0+IHtcclxuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XHJcbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcclxuICB9XHJcblxyXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcclxuICAgIGNvbnN0IHsgX19mbGFnIH0gPSB3aW5kb3cubWl0bVxyXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKVxyXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcclxuICAgIHdpbmRvdy5fd3NfcXVldWVba2V5XSA9IGhhbmRsZXIgfHwgKHcgPT4ge30pXHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2tleV0pIHtcclxuICAgICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtrZXldXHJcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IHdzIHRpbWVvdXQhJywgX2MsIGtleSlcclxuICAgICAgfVxyXG4gICAgfSwgNTAwMClcclxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXHJcbiAgICBfd3Muc2VuZChwYXJhbXMpXHJcbiAgfVxyXG59XHJcbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cclxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXHJcblxyXG5sZXQgX3RpbWVvdXRcclxubGV0IF9jc3AgPSB7fVxyXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxyXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXHJcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICAgLnJlcGxhY2UoL15cXC8vLCAnJylcclxuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLScpXHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGJsb2NrZWRVUkksXHJcbiAgICAgIGRpc3Bvc2l0aW9uLFxyXG4gICAgICBkb2N1bWVudFVSSSxcclxuICAgICAgZWZmZWN0aXZlRGlyZWN0aXZlLFxyXG4gICAgICBvcmlnaW5hbFBvbGljeSxcclxuICAgICAgdGltZVN0YW1wLFxyXG4gICAgICB0eXBlLFxyXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZVxyXG4gICAgfSA9IGVcclxuICAgIGNvbnN0IHR5cCA9IGBbJHtkaXNwb3NpdGlvbn1dICR7ZG9jdW1lbnRVUkl9YFxyXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcclxuICAgICAgX2NzcFt0eXBdID0ge31cclxuICAgIH1cclxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xyXG4gICAgICBfY3NwW3R5cF0uX2dlbmVyYWxfID0ge1xyXG4gICAgICAgIHBvbGljeTogb3JpZ2luYWxQb2xpY3ksXHJcbiAgICAgICAgbmFtZXNwYWNlLFxyXG4gICAgICAgIGhvc3QsXHJcbiAgICAgICAgcGF0aFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zdCBfZG9jID0gX2NzcFt0eXBdXHJcbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XHJcbiAgICAgIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdID0ge31cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBfZXJyID0gX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV1cclxuICAgIGlmICghX2VycltibG9ja2VkVVJJXSkge1xyXG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge31cclxuICAgIH1cclxuICAgIGNvbnN0IF9tYXRjaCA9IG9yaWdpbmFsUG9saWN5Lm1hdGNoKGAke3Zpb2xhdGVkRGlyZWN0aXZlfSBbXjtdKztgKVxyXG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlXHJcbiAgICBfZXJyW2Jsb2NrZWRVUkldID0ge1xyXG4gICAgICBkaXJlY3RpdmUsXHJcbiAgICAgIHRpbWVTdGFtcCxcclxuICAgICAgdHlwZVxyXG4gICAgfVxyXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxyXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coJz4+PiBDU1A6JywgX2NzcClcclxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XHJcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxyXG4gICAgICAvLyAgIGhvc3QsXHJcbiAgICAgIC8vICAgcGF0aCxcclxuICAgICAgLy8gICBfY3NwLFxyXG4gICAgICAvLyB9KTtcclxuICAgICAgX2NzcCA9IHt9XHJcbiAgICB9LCA0MDAwKVxyXG4gIH1cclxuXHJcbiAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5jc3ApIHtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlY3VyaXR5cG9saWN5dmlvbGF0aW9uJywgY3NwRXJyb3IpXHJcbiAgfVxyXG59XHJcbi8vIGRpc3Bvc2l0aW9uOiBcInJlcG9ydFwiXHJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcclxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXHJcblxyXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcclxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxyXG4vLyBvcmlnaW5hbFBvbGljeTogXCJzY3JpcHQtc3JjIG51bGw7IGZyYW1lLXNyYyBudWxsOyBzdHlsZS1zcmMgbnVsbDsgc3R5bGUtc3JjLWVsZW0gbnVsbDsgaW1nLXNyYyBudWxsO1wiXHJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXHJcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcclxuICBpZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxyXG4gIH1cclxuXHJcbiAgd2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgICAgLi4ub2JqXHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIHdpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gICAgfSwgMTAwMClcclxuICB9XHJcbiAgXHJcbiAgd2luZG93Lm1pdG0uZm4uZ2V0Q29va2llID0gbmFtZSA9PiB7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGA7ICR7ZG9jdW1lbnQuY29va2llfWA7XHJcbiAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KGA7ICR7bmFtZX09YCk7XHJcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAyKSByZXR1cm4gcGFydHMucG9wKCkuc3BsaXQoJzsnKS5zaGlmdCgpO1xyXG4gIH1cclxuXHJcbiAgd2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XHJcbiAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7fVxyXG4gIH1cclxuICBjb25zdCBvbk1vdW50ID0gZSA9PiBjb25zb2xlLmxvZygnJWNNYWNyb3M6IGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCAnY29sb3I6ICM1YWRhNTUnLCBlKVxyXG4gIHdpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gb25Nb3VudFxyXG59XHJcbiIsImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmZ1bmN0aW9uIG5vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5mdW5jdGlvbiBpc19lbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuICAgIGlmIChzdG9yZSAhPSBudWxsICYmIHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICgkJHNjb3BlLmRpcnR5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBsZXRzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGV0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90KHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdF9zcHJlYWQoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGRpcnR5LCBnZXRfc2xvdF9jaGFuZ2VzX2ZuLCBnZXRfc2xvdF9zcHJlYWRfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X3NwcmVhZF9jaGFuZ2VzX2ZuKGRpcnR5KSB8IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfcmVzdF9wcm9wcyhwcm9wcywga2V5cykge1xuICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICBrZXlzID0gbmV3IFNldChrZXlzKTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmICgha2V5cy5oYXMoaykgJiYga1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9zbG90cyhzbG90cykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHNsb3RzKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19fdmFsdWUnKSB7XG4gICAgICAgICAgICBub2RlLnZhbHVlID0gbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdHlwZW9mIG5vZGVbcHJvcF0gPT09ICdib29sZWFuJyAmJiB2YWx1ZSA9PT0gJycgPyB0cnVlIDogdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCwgX192YWx1ZSwgY2hlY2tlZCkge1xuICAgIGNvbnN0IHZhbHVlID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIGlmICghY2hlY2tlZCkge1xuICAgICAgICB2YWx1ZS5kZWxldGUoX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Zykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgbGV0IGogPSAwO1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gW107XG4gICAgICAgICAgICB3aGlsZSAoaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbaisrXTtcbiAgICAgICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZS5wdXNoKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJlbW92ZS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKHJlbW92ZVtrXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuLy8gdW5mb3J0dW5hdGVseSB0aGlzIGNhbid0IGJlIGEgY29uc3RhbnQgYXMgdGhhdCB3b3VsZG4ndCBiZSB0cmVlLXNoYWtlYWJsZVxuLy8gc28gd2UgY2FjaGUgdGhlIHJlc3VsdCBpbnN0ZWFkXG5sZXQgY3Jvc3NvcmlnaW47XG5mdW5jdGlvbiBpc19jcm9zc29yaWdpbigpIHtcbiAgICBpZiAoY3Jvc3NvcmlnaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjcm9zc29yaWdpbiA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjcm9zc29yaWdpbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNyb3Nzb3JpZ2luO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihub2RlLCBmbikge1xuICAgIGNvbnN0IGNvbXB1dGVkX3N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICAnb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGlmcmFtZS50YWJJbmRleCA9IC0xO1xuICAgIGNvbnN0IGNyb3Nzb3JpZ2luID0gaXNfY3Jvc3NvcmlnaW4oKTtcbiAgICBsZXQgdW5zdWJzY3JpYmU7XG4gICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSBcImRhdGE6dGV4dC9odG1sLDxzY3JpcHQ+b25yZXNpemU9ZnVuY3Rpb24oKXtwYXJlbnQucG9zdE1lc3NhZ2UoMCwnKicpfTwvc2NyaXB0PlwiO1xuICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3Rlbih3aW5kb3csICdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBpZnJhbWUuY29udGVudFdpbmRvdylcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBpZnJhbWUub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4oaWZyYW1lLmNvbnRlbnRXaW5kb3csICdyZXNpemUnLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFwcGVuZChub2RlLCBpZnJhbWUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bnN1YnNjcmliZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXRhY2goaWZyYW1lKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5mdW5jdGlvbiBxdWVyeV9zZWxlY3Rvcl9hbGwoc2VsZWN0b3IsIHBhcmVudCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoYW5jaG9yID0gbnVsbCkge1xuICAgICAgICB0aGlzLmEgPSBhbmNob3I7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgfVxuICAgIG0oaHRtbCwgdGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5lKSB7XG4gICAgICAgICAgICB0aGlzLmUgPSBlbGVtZW50KHRhcmdldC5ub2RlTmFtZSk7XG4gICAgICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pKGFuY2hvcik7XG4gICAgfVxuICAgIGgoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnQodGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgICAgIHRoaXMuaSh0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGF0dHJpYnV0ZV90b19vYmplY3QoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmVzdWx0W2F0dHJpYnV0ZS5uYW1lXSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMoZWxlbWVudCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIHJlc3VsdFtub2RlLnNsb3QgfHwgJ2RlZmF1bHQnXSA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgYWN0aXZlX2RvY3MgPSBuZXcgU2V0KCk7XG5sZXQgYWN0aXZlID0gMDtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGNvbnN0IGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBhY3RpdmVfZG9jcy5hZGQoZG9jKTtcbiAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgfHwgKGRvYy5fX3N2ZWx0ZV9zdHlsZXNoZWV0ID0gZG9jLmhlYWQuYXBwZW5kQ2hpbGQoZWxlbWVudCgnc3R5bGUnKSkuc2hlZXQpO1xuICAgIGNvbnN0IGN1cnJlbnRfcnVsZXMgPSBkb2MuX19zdmVsdGVfcnVsZXMgfHwgKGRvYy5fX3N2ZWx0ZV9ydWxlcyA9IHt9KTtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgY3VycmVudF9ydWxlc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIHN0eWxlc2hlZXQuaW5zZXJ0UnVsZShgQGtleWZyYW1lcyAke25hbWV9ICR7cnVsZX1gLCBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnO1xuICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gYCR7YW5pbWF0aW9uID8gYCR7YW5pbWF0aW9ufSwgYCA6ICcnfSR7bmFtZX0gJHtkdXJhdGlvbn1tcyBsaW5lYXIgJHtkZWxheX1tcyAxIGJvdGhgO1xuICAgIGFjdGl2ZSArPSAxO1xuICAgIHJldHVybiBuYW1lO1xufVxuZnVuY3Rpb24gZGVsZXRlX3J1bGUobm9kZSwgbmFtZSkge1xuICAgIGNvbnN0IHByZXZpb3VzID0gKG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnKS5zcGxpdCgnLCAnKTtcbiAgICBjb25zdCBuZXh0ID0gcHJldmlvdXMuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKTtcbiAgICBjb25zdCBkZWxldGVkID0gcHJldmlvdXMubGVuZ3RoIC0gbmV4dC5sZW5ndGg7XG4gICAgaWYgKGRlbGV0ZWQpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBuZXh0LmpvaW4oJywgJyk7XG4gICAgICAgIGFjdGl2ZSAtPSBkZWxldGVkO1xuICAgICAgICBpZiAoIWFjdGl2ZSlcbiAgICAgICAgICAgIGNsZWFyX3J1bGVzKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xlYXJfcnVsZXMoKSB7XG4gICAgcmFmKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgYWN0aXZlX2RvY3MuZm9yRWFjaChkb2MgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IGRvYy5fX3N2ZWx0ZV9zdHlsZXNoZWV0O1xuICAgICAgICAgICAgbGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICAgICAgZG9jLl9fc3ZlbHRlX3J1bGVzID0ge307XG4gICAgICAgIH0pO1xuICAgICAgICBhY3RpdmVfZG9jcy5jbGVhcigpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfYW5pbWF0aW9uKG5vZGUsIGZyb20sIGZuLCBwYXJhbXMpIHtcbiAgICBpZiAoIWZyb20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHRvID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoZnJvbS5sZWZ0ID09PSB0by5sZWZ0ICYmIGZyb20ucmlnaHQgPT09IHRvLnJpZ2h0ICYmIGZyb20udG9wID09PSB0by50b3AgJiYgZnJvbS5ib3R0b20gPT09IHRvLmJvdHRvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBzaG91bGQgdGhpcyBiZSBzZXBhcmF0ZWQgZnJvbSBkZXN0cnVjdHVyaW5nPyBPciBzdGFydC9lbmQgYWRkZWQgdG8gcHVibGljIGFwaSBhbmQgZG9jdW1lbnRhdGlvbj9cbiAgICBzdGFydDogc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzpcbiAgICBlbmQgPSBzdGFydF90aW1lICsgZHVyYXRpb24sIHRpY2sgPSBub29wLCBjc3MgfSA9IGZuKG5vZGUsIHsgZnJvbSwgdG8gfSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBsZXQgbmFtZTtcbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVsYXkpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBuYW1lKTtcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgIH1cbiAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgIGlmICghc3RhcnRlZCAmJiBub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgbm93ID49IGVuZCkge1xuICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHN0YXJ0X3RpbWU7XG4gICAgICAgICAgICBjb25zdCB0ID0gMCArIDEgKiBlYXNpbmcocCAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHN0YXJ0KCk7XG4gICAgdGljaygwLCAxKTtcbiAgICByZXR1cm4gc3RvcDtcbn1cbmZ1bmN0aW9uIGZpeF9wb3NpdGlvbihub2RlKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChzdHlsZS5wb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyAmJiBzdHlsZS5wb3NpdGlvbiAhPT0gJ2ZpeGVkJykge1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHN0eWxlO1xuICAgICAgICBjb25zdCBhID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGFkZF90cmFuc2Zvcm0obm9kZSwgYSk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkX3RyYW5zZm9ybShub2RlLCBhKSB7XG4gICAgY29uc3QgYiA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGEubGVmdCAhPT0gYi5sZWZ0IHx8IGEudG9wICE9PSBiLnRvcCkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgICAgIG5vZGUuc3R5bGUudHJhbnNmb3JtID0gYCR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHthLmxlZnQgLSBiLmxlZnR9cHgsICR7YS50b3AgLSBiLnRvcH1weClgO1xuICAgIH1cbn1cblxubGV0IGN1cnJlbnRfY29tcG9uZW50O1xuZnVuY3Rpb24gc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIGN1cnJlbnRfY29tcG9uZW50ID0gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkge1xuICAgIGlmICghY3VycmVudF9jb21wb25lbnQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24gY2FsbGVkIG91dHNpZGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uJyk7XG4gICAgcmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuZnVuY3Rpb24gYmVmb3JlVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYmVmb3JlX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25EZXN0cm95KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fZGVzdHJveS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5zZXQoa2V5LCBjb250ZXh0KTtcbn1cbmZ1bmN0aW9uIGdldENvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuZ2V0KGtleSk7XG59XG5mdW5jdGlvbiBoYXNDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmhhcyhrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4oZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmxldCBmbHVzaGluZyA9IGZhbHNlO1xuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBpZiAoZmx1c2hpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IHByb2dyYW0uYiAtIHQ7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5ibG9ja3NbaV0gPT09IGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2goaW5mbywgY3R4LCBkaXJ0eSkge1xuICAgIGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuICAgIGNvbnN0IHsgcmVzb2x2ZWQgfSA9IGluZm87XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby50aGVuKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLnZhbHVlXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLmNhdGNoKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLmVycm9yXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpbmZvLmJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke1N0cmluZyh2YWx1ZSkucmVwbGFjZSgvXCIvZywgJyYjMzQ7JykucmVwbGFjZSgvJy9nLCAnJiMzOTsnKX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cywgY29udGV4dCkge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IGNvbnRleHQgfHwgW10pLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCB7ICQkc2xvdHMgPSB7fSwgY29udGV4dCA9IG5ldyBNYXAoKSB9ID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdGl0bGU6ICcnLCBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgJCRzbG90cywgY29udGV4dCk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LnRpdGxlICsgcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7dmFsdWUgPT09IHRydWUgPyAnJyA6IGA9JHt0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkoZXNjYXBlKHZhbHVlKSkgOiBgXCIke3ZhbHVlfVwiYH1gfWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvciwgY3VzdG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICBpZiAoIWN1c3RvbUVsZW1lbnQpIHtcbiAgICAgICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBvcHRpb25zLmNvbnRleHQgfHwgW10pLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHksXG4gICAgICAgIHNraXBfYm91bmQ6IGZhbHNlXG4gICAgfTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgb3B0aW9ucy5wcm9wcyB8fCB7fSwgKGksIHJldCwgLi4ucmVzdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByZXN0Lmxlbmd0aCA/IHJlc3RbMF0gOiByZXQ7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghJCQuc2tpcF9ib3VuZCAmJiAkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50Lmwobm9kZXMpO1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChkZXRhY2gpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yLCBvcHRpb25zLmN1c3RvbUVsZW1lbnQpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbl9tb3VudCB9ID0gdGhpcy4kJDtcbiAgICAgICAgICAgIHRoaXMuJCQub25fZGlzY29ubmVjdCA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QpO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cy4gVXNlZCB3aGVuIGRldj1mYWxzZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy4zOC4yJyB9LCBkZXRhaWwpKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZScsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFsnY2FwdHVyZSddIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUgfSk7XG4gICAgZWxzZVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldEF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRQcm9wZXJ0eScsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YXNldCcsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YScsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9hcmd1bWVudChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycgJiYgIShhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJnKSkge1xuICAgICAgICBsZXQgbXNnID0gJ3sjZWFjaH0gb25seSBpdGVyYXRlcyBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cy4nO1xuICAgICAgICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBhcmcgJiYgU3ltYm9sLml0ZXJhdG9yIGluIGFyZykge1xuICAgICAgICAgICAgbXNnICs9ICcgWW91IGNhbiB1c2UgYSBzcHJlYWQgdG8gY29udmVydCB0aGlzIGl0ZXJhYmxlIGludG8gYW4gYXJyYXkuJztcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zbG90cyhuYW1lLCBzbG90LCBrZXlzKSB7XG4gICAgZm9yIChjb25zdCBzbG90X2tleSBvZiBPYmplY3Qua2V5cyhzbG90KSkge1xuICAgICAgICBpZiAoIX5rZXlzLmluZGV4T2Yoc2xvdF9rZXkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYDwke25hbWV9PiByZWNlaXZlZCBhbiB1bmV4cGVjdGVkIHNsb3QgXCIke3Nsb3Rfa2V5fVwiLmApO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cyB3aXRoIHNvbWUgbWlub3IgZGV2LWVuaGFuY2VtZW50cy4gVXNlZCB3aGVuIGRldj10cnVlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJGNhcHR1cmVfc3RhdGUoKSB7IH1cbiAgICAkaW5qZWN0X3N0YXRlKCkgeyB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgdG8gY3JlYXRlIHN0cm9uZ2x5IHR5cGVkIFN2ZWx0ZSBjb21wb25lbnRzLlxuICogVGhpcyBvbmx5IGV4aXN0cyBmb3IgdHlwaW5nIHB1cnBvc2VzIGFuZCBzaG91bGQgYmUgdXNlZCBpbiBgLmQudHNgIGZpbGVzLlxuICpcbiAqICMjIyBFeGFtcGxlOlxuICpcbiAqIFlvdSBoYXZlIGNvbXBvbmVudCBsaWJyYXJ5IG9uIG5wbSBjYWxsZWQgYGNvbXBvbmVudC1saWJyYXJ5YCwgZnJvbSB3aGljaFxuICogeW91IGV4cG9ydCBhIGNvbXBvbmVudCBjYWxsZWQgYE15Q29tcG9uZW50YC4gRm9yIFN2ZWx0ZStUeXBlU2NyaXB0IHVzZXJzLFxuICogeW91IHdhbnQgdG8gcHJvdmlkZSB0eXBpbmdzLiBUaGVyZWZvcmUgeW91IGNyZWF0ZSBhIGBpbmRleC5kLnRzYDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBTdmVsdGVDb21wb25lbnRUeXBlZCB9IGZyb20gXCJzdmVsdGVcIjtcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkPHtmb286IHN0cmluZ30+IHt9XG4gKiBgYGBcbiAqIFR5cGluZyB0aGlzIG1ha2VzIGl0IHBvc3NpYmxlIGZvciBJREVzIGxpa2UgVlMgQ29kZSB3aXRoIHRoZSBTdmVsdGUgZXh0ZW5zaW9uXG4gKiB0byBwcm92aWRlIGludGVsbGlzZW5zZSBhbmQgdG8gdXNlIHRoZSBjb21wb25lbnQgbGlrZSB0aGlzIGluIGEgU3ZlbHRlIGZpbGVcbiAqIHdpdGggVHlwZVNjcmlwdDpcbiAqIGBgYHN2ZWx0ZVxuICogPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAqIFx0aW1wb3J0IHsgTXlDb21wb25lbnQgfSBmcm9tIFwiY29tcG9uZW50LWxpYnJhcnlcIjtcbiAqIDwvc2NyaXB0PlxuICogPE15Q29tcG9uZW50IGZvbz17J2Jhcid9IC8+XG4gKiBgYGBcbiAqXG4gKiAjIyMjIFdoeSBub3QgbWFrZSB0aGlzIHBhcnQgb2YgYFN2ZWx0ZUNvbXBvbmVudChEZXYpYD9cbiAqIEJlY2F1c2VcbiAqIGBgYHRzXG4gKiBjbGFzcyBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogY29uc3QgY29tcG9uZW50OiB0eXBlb2YgU3ZlbHRlQ29tcG9uZW50ID0gQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQ7XG4gKiBgYGBcbiAqIHdpbGwgdGhyb3cgYSB0eXBlIGVycm9yLCBzbyB3ZSBuZWVkIHRvIHNlcGVyYXRlIHRoZSBtb3JlIHN0cmljdGx5IHR5cGVkIGNsYXNzLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnRUeXBlZCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudERldiB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgbG9vcCBkZXRlY3RlZCcpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUNvbXBvbmVudFR5cGVkLCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGF0dHJpYnV0ZV90b19vYmplY3QsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVzY2FwZSwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRDb250ZXh0LCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzLCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzQ29udGV4dCwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfY3Jvc3NvcmlnaW4sIGlzX2VtcHR5LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcXVlcnlfc2VsZWN0b3JfYWxsLCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdXBkYXRlX2F3YWl0X2Jsb2NrX2JyYW5jaCwgdXBkYXRlX2tleWVkX2VhY2gsIHVwZGF0ZV9zbG90LCB1cGRhdGVfc2xvdF9zcHJlYWQsIHZhbGlkYXRlX2NvbXBvbmVudCwgdmFsaWRhdGVfZWFjaF9hcmd1bWVudCwgdmFsaWRhdGVfZWFjaF9rZXlzLCB2YWxpZGF0ZV9zbG90cywgdmFsaWRhdGVfc3RvcmUsIHhsaW5rX2F0dHIgfTtcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmNvbnN0IF9jID0gJ2NvbG9yOiBibHVldmlvbGV0J1xyXG5cclxubGV0IGtleXMgPSBbXVxyXG4kOiBfa2V5cyA9IGtleXNcclxuXHJcbmZ1bmN0aW9uIHJlbG9hZEtleXMoKSB7XHJcbiAgY29uc29sZS5sb2coJyVjUmVsb2FkIGhvdGtleXMuJywgX2MpO1xyXG4gIGNvbnN0IHttYWNyb2tleXM6IG1rZXl9ID0gd2luZG93Lm1pdG1cclxuICBrZXlzID0gW11cclxuICBmb3IgKGNvbnN0IGlkIGluIG1rZXkpIHtcclxuICAgIGtleXMucHVzaCh7aWQsIHRpdGxlOiBta2V5W2lkXS5fdGl0bGV9KVxyXG4gIH1cclxufVxyXG5cclxubGV0IG9ic2VydmVyXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IHFyeSA9ICcubWl0bS1jb250YWluZXIuY2VudGVyJ1xyXG4gIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHFyeSlcclxuICBjb25zdCBub2RlVmlzaWJsZSA9IG9icyA9PiB7XHJcbiAgICBpZiAobm9kZS5hdHRyaWJ1dGVzLnN0eWxlKSB7XHJcbiAgICAgIHJlbG9hZEtleXMoKVxyXG4gICAgfVxyXG4gIH1cclxuICBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG5vZGVWaXNpYmxlKTtcclxuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHthdHRyaWJ1dGVzOiB0cnVlfSlcclxuICBzZXRUaW1lb3V0KHJlbG9hZEtleXMsIDEwMDApXHJcbn0pO1xyXG5cclxub25EZXN0cm95KCgpID0+IHtcclxuICBpZiAob2JzZXJ2ZXIpIHtcclxuICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxyXG4gICAgb2JzZXJ2ZXIgPSB1bmRlZmluZWRcclxuICB9XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XHJcbiAgPGI+SG90LWtleXM6PC9iPlxyXG4gIDx0YWJsZT5cclxuICAgIHsjZWFjaCBfa2V5cyBhcyBvYmosaX1cclxuICAgICAgPHRyPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cIm5vXCI+e2krMX08L3RkPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cImtjb2RlXCI+e29iai5pZH08L3RkPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cInRpdGxlXCI+e29iai50aXRsZX08L3RkPlxyXG4gICAgICA8L3RyPlxyXG4gICAgey9lYWNofVxyXG4gIDwvdGFibGU+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cclxuICAudmJveCB7XHJcbiAgICBwYWRkaW5nOiAwIDEwcHg7XHJcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICBjb2xvcjpibHVlO1xyXG4gICAgbGVmdDogMDtcclxuICAgIHJpZ2h0OiAwO1xyXG4gIH1cclxuICB0YWJsZSB7XHJcbiAgICB3aWR0aDogMTAwJTtcclxuICAgIGNvbG9yOiBtYXJvb247XHJcbiAgICBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xyXG4gICAgdGQge1xyXG4gICAgICBmb250LXNpemU6IHNtYWxsO1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xyXG4gICAgICBwYWRkaW5nLWxlZnQ6IDVweDtcclxuICAgIH1cclxuICAgIC5ubyB7XHJcbiAgICAgIHBhZGRpbmc6IDA7XHJcbiAgICAgIHdpZHRoOiAyNXB4O1xyXG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICB9XHJcbiAgICAua2NvZGUge1xyXG4gICAgICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlO1xyXG4gICAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgICAgd2lkdGg6IDEwMHB4O1xyXG4gICAgfVxyXG4gICAgLnRpdGxlIHtcclxuICAgICAgZm9udC1mYW1pbHk6ICdHaWxsIFNhbnMnLCAnR2lsbCBTYW5zIE1UJywgQ2FsaWJyaSwgJ1RyZWJ1Y2hldCBNUycsIHNhbnMtc2VyaWY7XHJcbiAgICAgIHdpZHRoOiBjYWxjKDEwMCUgLSAxMDBweCk7XHJcbiAgICB9XHJcbiAgfVxyXG48L3N0eWxlPiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xyXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXHJcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKVxyXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxyXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXHJcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJylcclxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcclxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxyXG5jb25zdCBfd3NfbWFjcm9zID0gcmVxdWlyZSgnLi9fd3NfbWFjcm9zJylcclxuY29uc3QgX2MgPSAnY29sb3I6IHJlZCdcclxuXHJcbl93c19wb3N0bWVzc2FnZSgpXHJcbl93c19pbml0U29ja2V0KClcclxuX3dzX3NjcmVlbnNob3QoKVxyXG5fd3NfbG9jYXRpb24oKVxyXG5fd3Nfb2JzZXJ2ZXIoKVxyXG5fd3NfZ2VuZXJhbCgpXHJcbl93c19jc3BFcnIoKVxyXG5fd3NfbWFjcm9zKClcclxuY29uc29sZS5sb2coJyVjV3M6IHdzLWNsaWVudCBsb2FkZWQuLi4nLCBfYylcclxuXHJcbmNvbnN0IHtkZWZhdWx0OiBIb3RrZXlzfSA9IHJlcXVpcmUoJy4uL3N2ZWx0ZS9Ib3RrZXlzLnN2ZWx0ZScpXHJcbndpbmRvdy5taXRtLnN2ZWx0ZSA9IHtcclxuICBIb3RrZXlzXHJcbn0iXSwibmFtZXMiOlsiX2MiLCJsb2NhdGlvbiIsImluaXQiLCJfa2V5Il0sIm1hcHBpbmdzIjoiOzs7O0VBQ0EsbUJBQWMsR0FBRyxNQUFNO0VBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0VBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7RUFDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztFQUM3RixLQUFLO0VBQ0wsR0FBRztFQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDO0VBQzNEOztFQ1JBLE1BQU1BLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7RUFDQSxjQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLElBQUksVUFBUztFQUNmLEVBQUUsT0FBTztFQUNUO0VBQ0EsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO0VBQ3JCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUM7RUFDdkIsS0FBSztFQUNMO0VBQ0EsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO0VBQ3JCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUM7RUFDdkIsS0FBSztFQUNMO0VBQ0EsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO0VBQ3JCLE1BQU0sTUFBTSxRQUFRLEdBQUcsd0ZBQXVGO0VBQzlHLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDO0VBQzFELE1BQU0sU0FBUyxDQUFDLElBQUksR0FBRTtFQUN0QixLQUFLO0VBQ0w7RUFDQSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDdEIsTUFBTSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUk7RUFDN0IsTUFBTSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztFQUMxQyxRQUFRLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7RUFDMUMsUUFBTztFQUNQLEtBQUs7RUFDTDtFQUNBLElBQUksU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRTtFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO0VBQ3RELFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRUEsSUFBRSxFQUFDO0VBQzlDLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTTtFQUNuQyxPQUFPO0VBQ1AsS0FBSztFQUNMO0VBQ0EsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtFQUMzQixNQUFNLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUNuQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDO0VBQzdDO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsTUFBTSxLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7RUFDaEQsUUFBUSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFDO0VBQ3RELFFBQVEsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7RUFDekMsT0FBTztFQUNQLEtBQUs7RUFDTCxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDMUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFQSxJQUFFLEVBQUUsSUFBSSxFQUFDO0VBQy9DLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSTtFQUMvQixLQUFLO0VBQ0wsR0FBRztFQUNIOzs7O0VDakRBLE1BQU0sU0FBUyxHQUFHLFVBQVUsR0FBRTtBQUM5QjtFQUNBLGlCQUFjLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLO0VBQ2pDLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7RUFDOUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFO0VBQ3pCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztFQUM5RCxLQUFLLE1BQU07RUFDWCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFDO0VBQzlDLEtBQUs7RUFDTCxHQUFHO0VBQ0gsRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUM7RUFDbEUsRUFBRSxJQUFJLEdBQUcsRUFBRTtFQUNYLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFHO0VBQzNCLElBQUksSUFBSTtFQUNSLE1BQU0sSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtFQUN0QyxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztFQUMvQixPQUFPO0VBQ1AsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0VBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFDO0VBQ2hDLEtBQUs7RUFDTCxJQUFJLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUMvQixNQUFNLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDO0VBQzNDLE1BQU0sT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQztFQUNsQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQ3hCLEtBQUssTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUMvQixNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBQztFQUN0QyxLQUFLO0VBQ0wsR0FBRztFQUNIOztFQzlCQSxnQkFBYyxHQUFHLE1BQU07RUFDdkIsRUFBRSxJQUFJLEtBQUk7RUFDVixFQUFFLElBQUk7RUFDTixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFHO0VBQ3JDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtFQUNkLElBQUksSUFBSSxHQUFHLEtBQUk7RUFDZixHQUFHO0VBQ0gsRUFBRSxPQUFPLElBQUksR0FBRyxRQUFRLEdBQUcsUUFBUTtFQUNuQzs7RUNSQSxjQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxVQUFTO0VBQzlCLEVBQUUsTUFBTSxPQUFPLEdBQUc7RUFDbEIsSUFBSSxFQUFFLEVBQUUsU0FBUztFQUNqQixJQUFJLGFBQWEsRUFBRSxVQUFVO0VBQzdCLElBQUksc0JBQXNCLEVBQUUsUUFBUTtFQUNwQyxHQUFHLENBQUMsTUFBTSxFQUFDO0VBQ1gsRUFBRSxPQUFPLE9BQU87RUFDaEI7Ozs7RUNQQTtBQUNpRDtBQUNGO0FBQ0w7RUFDMUMsTUFBTUEsSUFBRSxHQUFHLGlCQUFnQjtBQUMzQjtFQUNBLGtCQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRTtFQUN2QixFQUFFLE1BQU0sQ0FBQyxhQUFhLEdBQUcsTUFBSztFQUM5QixFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUk7QUFDdEM7RUFDQSxFQUFFLElBQUksTUFBTSxDQUFDLFdBQVcsR0FBRyxTQUFTLEVBQUU7RUFDdEMsSUFBSSxNQUFNLENBQUMsV0FBVyxHQUFHLEdBQUU7RUFDM0IsR0FBRztBQUNIO0VBQ0EsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUk7RUFDekIsSUFBSSxTQUFTLE9BQU8sR0FBRztFQUN2QixNQUFNLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRTtFQUM1QyxRQUFRLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFDO0VBQzFDLFFBQVEsTUFBTSxDQUFDLGtCQUFrQixHQUFHLEtBQUk7RUFDeEMsUUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFQSxJQUFFLEVBQUM7RUFDekMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFDO0VBQ2hCLE9BQU87RUFDUCxLQUFLO0FBQ0w7RUFDQSxJQUFJLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFO0VBQzlCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRUEsSUFBRSxFQUFDO0VBQzlDLEtBQUs7QUFDTDtFQUNBLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUM7RUFDekIsSUFBSSxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUk7QUFDL0I7RUFDQSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFDO0VBQzFCLElBQUksVUFBVSxDQUFDLE1BQU07RUFDckIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFO0VBQ3RDLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBQztFQUN4QyxRQUFRLE9BQU8sR0FBRTtFQUNqQixPQUFPO0VBQ1AsS0FBSyxFQUFFLEVBQUUsRUFBQztFQUNWLElBQUc7QUFDSDtFQUNBLEVBQUUsTUFBTSxPQUFPLEdBQUcsWUFBWTtFQUM5QixJQUFJLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFO0VBQzlCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRUEsSUFBRSxFQUFDO0VBQy9DLEtBQUs7RUFDTCxJQUFHO0FBQ0g7RUFDQSxFQUFFLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxFQUFFO0VBQ2pDLElBQUksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7RUFDOUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFQSxJQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBQztFQUNsRCxLQUFLO0VBQ0wsSUFBSSxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUM7RUFDNUIsSUFBRztFQUNIO0VBQ0EsRUFBRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxHQUFHLFVBQVM7RUFDN0MsRUFBRSxJQUFJLE9BQU8sS0FBSyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUNqRCxJQUFJLE1BQU0sTUFBTSxHQUFHLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBQztFQUMvRCxJQUFJLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLEdBQUcsTUFBSztFQUNyQyxJQUFJLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsT0FBTTtFQUN4QyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDdkcsSUFBSSxJQUFJLEdBQUU7RUFDVixJQUFJLElBQUk7RUFDUixNQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUM7RUFDN0IsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0VBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUM7RUFDMUIsS0FBSztFQUNMLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7RUFDdEIsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUU7RUFDbkI7RUFDQSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsT0FBTTtFQUN0QixJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsUUFBTztFQUN4QixJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsVUFBUztFQUM1QixHQUFHO0VBQ0gsRUFBRSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRTtFQUM1QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUVBLElBQUUsRUFBQztFQUNuRSxHQUFHO0VBQ0g7O0VDN0VBLGVBQWUsU0FBUyxDQUFDLElBQUksRUFBRTtFQUMvQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUM5QixFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtFQUMvQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0VBQ2pELE1BQU0sSUFBSTtFQUNWLFFBQVEsTUFBTSxNQUFNLEdBQUc7RUFDdkIsVUFBVSxNQUFNLEVBQUUsTUFBTTtFQUN4QixVQUFVLE9BQU8sRUFBRTtFQUNuQixjQUFjLFFBQVEsRUFBRSxrQkFBa0I7RUFDMUMsY0FBYyxjQUFjLEVBQUUsa0JBQWtCO0VBQ2hELFdBQVc7RUFDWCxVQUFVLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztFQUNwQyxVQUFTO0VBQ1QsUUFBUSxLQUFLLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDO0VBQ2xELFNBQVMsSUFBSSxDQUFDLFNBQVMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDLENBQUM7RUFDN0QsU0FBUyxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFDLFlBQVksRUFBQztFQUM3RCxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUU7RUFDdEIsUUFBUSxNQUFNLENBQUMsS0FBSyxFQUFDO0VBQ3JCLE9BQU87RUFDUCxLQUFLLENBQUM7RUFDTixHQUFHLE1BQU07RUFDVCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0VBQ2pELE1BQU0sSUFBSTtFQUNWLFFBQVEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztFQUNwRCxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUU7RUFDdEIsUUFBUSxNQUFNLENBQUMsS0FBSyxFQUFDO0VBQ3JCLE9BQU87RUFDUCxLQUFLLENBQUM7RUFDTixHQUFHO0VBQ0gsQ0FBQztFQUNELGVBQWMsR0FBRzs7O0VDN0JqQixpQkFBYyxHQUFHLE1BQU07RUFDdkIsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLFNBQVE7RUFDckMsRUFBRSxJQUFJLFVBQVM7QUFDZjtFQUNBLEVBQUUsU0FBUyxPQUFPLEVBQUUsR0FBRyxFQUFFO0VBQ3pCLElBQUksT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztFQUMxRCxHQUFHO0FBQ0g7RUFDQSxFQUFFLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7RUFDeEMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtFQUN6RCxNQUFNLFNBQVMsR0FBRyxJQUFHO0VBQ3JCLE1BQU0sS0FBSztFQUNYLEtBQUs7RUFDTCxHQUFHO0VBQ0gsRUFBRSxPQUFPLFNBQVM7RUFDbEI7Ozs7RUNmQTtBQUM0QztBQUNJO0FBQ047RUFDMUMsTUFBTUEsSUFBRSxHQUFHLGlCQUFnQjtBQUMzQjtFQUNBLElBQUksSUFBRztFQUNQLFNBQVMsVUFBVSxFQUFFLENBQUMsRUFBRTtFQUN4QixFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7RUFDM0IsSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7RUFDekIsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFTO0VBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBQztFQUNyQyxNQUFNLE1BQU07RUFDWixLQUFLO0VBQ0wsSUFBSSxJQUFJLEdBQUcsRUFBRTtFQUNiLE1BQU0sR0FBRyxHQUFHLFVBQVM7RUFDckIsTUFBTSxNQUFNO0VBQ1osS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLE1BQU0sU0FBUyxHQUFHLGFBQWEsR0FBRTtFQUNuQyxFQUFFLE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRTtFQUM5QixFQUFFLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUM7RUFDbkQsRUFBRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUM7RUFDN0MsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVU7QUFDdkM7RUFDQSxFQUFFLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFDO0VBQ3RELEVBQUUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQztFQUN0RCxFQUFFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFTO0VBQ3hFLEVBQUUsS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUU7RUFDeEIsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTTtFQUN2QixJQUFJLE9BQU8sRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxFQUFFO0VBQ25FLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFVO0VBQzVCLEtBQUs7RUFDTCxJQUFJLElBQUksSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUU7RUFDaEMsTUFBTSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFDO0VBQ3hDLE1BQU0sTUFBTSxNQUFNLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEdBQUU7RUFDeEQsTUFBTSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLE1BQUs7RUFDL0MsTUFBTSxXQUFXLENBQUMsTUFBTSxFQUFDO0VBQ3pCLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtFQUMvQjtFQUNBLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU07RUFDekMsUUFBUSxDQUFDLENBQUMsd0JBQXdCLEdBQUU7RUFDcEMsUUFBUSxDQUFDLENBQUMsZUFBZSxHQUFFO0VBQzNCLFFBQVEsQ0FBQyxDQUFDLGNBQWMsR0FBRTtFQUMxQixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBQztFQUMxQixRQUFRLFVBQVUsQ0FBQyxNQUFNO0VBQ3pCLFVBQVUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVTtFQUN0QyxVQUFVLElBQUksR0FBRyxFQUFFO0VBQ25CLFlBQVksR0FBRyxDQUFDLEtBQUssR0FBRTtFQUN2QixZQUFZLEdBQUcsR0FBRyxVQUFTO0VBQzNCLFdBQVcsTUFBTTtFQUNqQixZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUVBLElBQUUsQ0FBQyxDQUFDO0VBQzVELFdBQVc7RUFDWCxTQUFTLEVBQUUsS0FBSyxFQUFDO0VBQ2pCLE9BQU8sTUFBTTtFQUNiLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFDO0VBQzFCLE9BQU87RUFDUCxNQUFNLE1BQU07RUFDWixLQUFLO0VBQ0wsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUN2QixFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBQztFQUNwQixDQUFDO0FBQ0Q7RUFDQSxrQkFBYyxHQUFHLE1BQU07RUFDdkIsRUFBRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBQztFQUNuRCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNO0VBQ3BELElBQUksTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7RUFDL0MsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO0VBQ25DLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUM7RUFDaEQsS0FBSyxNQUFNO0VBQ1gsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQztFQUNoRCxLQUFLO0VBQ0wsR0FBRyxFQUFDO0VBQ0o7O0VDN0VBLE1BQU0sTUFBTSxHQUFHO0VBQ2YsRUFBRSxTQUFTLEVBQUUsR0FBRztFQUNoQixFQUFFLFdBQVcsRUFBRSxHQUFHO0VBQ2xCLEVBQUUsWUFBWSxFQUFFLEdBQUc7RUFDbkIsRUFBRSxTQUFTLEVBQUUsSUFBSTtFQUNqQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsTUFBTSxLQUFLLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLFNBQVMsRUFBRSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBQztBQUNEO0VBQ0EsTUFBTSxNQUFNLEdBQUc7RUFDZixFQUFFLFNBQVMsRUFBRSxHQUFHO0VBQ2hCLEVBQUUsV0FBVyxFQUFFLEdBQUc7RUFDbEIsRUFBRSxZQUFZLEVBQUUsR0FBRztFQUNuQixFQUFFLFNBQVMsRUFBRSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBRSxNQUFNLEtBQUssR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsU0FBUyxFQUFFLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7RUFDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztFQUNoQixFQUFDO0FBQ0Q7RUFDQSxNQUFNLE1BQU0sR0FBRztFQUNmLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7RUFDUixFQUFFLENBQUMsRUFBRSxHQUFHO0VBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztFQUNSLEVBQUUsRUFBRSxFQUFFLEdBQUc7RUFDVCxFQUFDO0FBQ0Q7RUFDQSxhQUFjLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLO0VBQ2hELEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFHO0VBQzlCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUc7RUFDeEIsRUFBRSxJQUFJLE1BQUs7RUFDWCxFQUFFLElBQUksSUFBSSxHQUFHLEdBQUU7RUFDZixFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBQztFQUM5QixFQUFFLElBQUksS0FBSyxFQUFFO0VBQ2IsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRTtFQUN0QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUU7RUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRTtFQUMvQixLQUFLO0VBQ0wsR0FBRyxNQUFNO0VBQ1QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBQztFQUMzQyxJQUFJLElBQUksS0FBSyxFQUFFO0VBQ2YsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRTtFQUN4QixNQUFNLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxFQUFFO0VBQ2pDLFFBQVEsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUM7RUFDM0IsT0FBTztFQUNQLEtBQUssTUFBTTtFQUNYLE1BQU0sSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7RUFDakMsUUFBUSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBQztFQUMzQixPQUFPLE1BQU07RUFDYixRQUFRLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFDO0VBQzNCLE9BQU87RUFDUCxLQUFLO0VBQ0wsR0FBRztFQUNILEVBQUUsT0FBTyxJQUFJO0VBQ2I7Ozs7RUNyRUE7QUFDZ0Q7QUFDTjtBQUNQO0VBQ25DLE1BQU1BLElBQUUsR0FBRyxpQkFBZ0I7RUFDM0IsTUFBTSxTQUFTLElBQUkseUJBQXdCO0VBQzNDLE1BQU0sU0FBUyxJQUFJLHlCQUF3QjtFQUMzQyxNQUFNLFVBQVUsR0FBRywwQ0FBeUM7RUFDNUQsTUFBTSxXQUFXLEVBQUUsR0FBRTtFQUNyQixNQUFNLEtBQUssR0FBRyxDQUFDO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLEVBQUM7QUFDRjtFQUNBLElBQUksU0FBUyxHQUFHO0VBQ2hCLEVBQUUsS0FBSyxFQUFFLEVBQUU7RUFDWCxFQUFFLElBQUksRUFBRSxFQUFFO0VBQ1YsRUFBRSxJQUFJLEVBQUUsRUFBRTtFQUNWLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDVixFQUFDO0VBRUQsSUFBSSxNQUFNLEdBQUc7RUFDYixFQUFFLEtBQUssRUFBRSxFQUFFO0VBQ1gsRUFBRSxJQUFJLEVBQUUsRUFBRTtFQUNWLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDVixFQUFDO0FBQ0Q7RUFDQSxTQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUU7RUFDckIsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRTtFQUMvQyxJQUFJLElBQUk7RUFDUixNQUFNLE1BQU0sTUFBTSxHQUFHO0VBQ3JCLFFBQVEsTUFBTSxFQUFFLE1BQU07RUFDdEIsUUFBUSxPQUFPLEVBQUU7RUFDakIsWUFBWSxRQUFRLEVBQUUsa0JBQWtCO0VBQ3hDLFlBQVksY0FBYyxFQUFFLGtCQUFrQjtFQUM5QyxTQUFTO0VBQ1QsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7RUFDbEMsUUFBTztFQUNQLE1BQU0sS0FBSyxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQztFQUMzQyxPQUFPLElBQUksQ0FBQyxTQUFTLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUMsQ0FBQyxDQUFDO0VBQzNELE9BQU8sSUFBSSxDQUFDLFNBQVMsSUFBSSxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBQyxZQUFZLEVBQUM7RUFDM0QsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0VBQ3BCLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBQztFQUNuQixLQUFLO0VBQ0wsR0FBRyxDQUFDO0VBQ0osQ0FBQztBQUNEO0VBQ0EsZUFBZSxJQUFJLEVBQUUsUUFBUSxFQUFFO0VBQy9CLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO0VBQzlCLEVBQUUsSUFBSSxRQUFRLEVBQUU7RUFDaEIsSUFBSSxJQUFJLFFBQVEsUUFBUSxDQUFDLEtBQUssVUFBVSxFQUFFO0VBQzFDLE1BQU0sUUFBUSxHQUFHLFFBQVEsR0FBRTtFQUMzQixLQUFLO0VBQ0wsSUFBSSxNQUFNLE9BQU8sR0FBRyxVQUFVLEdBQUU7RUFDaEMsSUFBSSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTTtFQUNqQyxJQUFJLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUM7RUFDdEMsSUFBSSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFDO0VBQ3hDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUM7RUFDcEQsSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQztFQUNqRixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRUEsSUFBRSxFQUFDO0VBQ3ZDLElBQUksSUFBSSxPQUFNO0VBQ2QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7RUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFDO0VBQ2pDLEtBQUssTUFBTTtFQUNYLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssRUFBQztFQUNqQyxLQUFLO0VBQ0wsSUFBSSxPQUFPLE1BQU07RUFDakIsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsS0FBSyxDQUFDLElBQUksRUFBRTtFQUNyQixFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0VBQy9DLElBQUksSUFBSTtFQUNSLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztFQUNoRCxLQUFLLENBQUMsT0FBTyxLQUFLLEVBQUU7RUFDcEIsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFDO0VBQ25CLEtBQUs7RUFDTCxHQUFHLENBQUM7RUFDSixDQUFDO0FBQ0Q7RUFDQSxTQUFTLElBQUksQ0FBQyxFQUFFLEVBQUU7RUFDbEIsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ3hELENBQ0E7RUFDQSxTQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUU7RUFDM0IsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUM7RUFDaEUsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUM7RUFDekQsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtFQUN0QixDQUFDO0FBQ0Q7RUFDQSxTQUFTLFlBQVksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO0VBQ3BDLEVBQUUsSUFBSSxHQUFFO0VBQ1IsRUFBRSxLQUFLLE1BQU0sRUFBRSxJQUFJLE9BQU8sRUFBRTtFQUM1QixJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDO0VBQ2hELElBQUksTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUM7RUFDaEQsSUFBSSxNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFDO0VBQzNCLElBQUksR0FBRyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSTtFQUM3QixNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUM7RUFDckIsTUFBTSxJQUFJLEdBQUcsWUFBWSxPQUFPLEVBQUU7RUFDbEMsUUFBUSxHQUFHLEdBQUcsTUFBTSxJQUFHO0VBQ3ZCLE9BQU87RUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUM5QixRQUFRLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBQztFQUN2QixPQUFPO0VBQ1AsTUFBSztFQUNMLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxRQUFPO0VBQzNCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFDO0VBQ2pDLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUM7RUFDL0IsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFDO0VBQ3RDLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyxXQUFXLElBQUksS0FBSyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUM7RUFDcEUsSUFBSSxJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUU7RUFDdEIsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7RUFDekMsTUFBTSxFQUFFLENBQUMsU0FBUyxHQUFHLFNBQVE7RUFDN0IsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBQztFQUNqQyxLQUFLO0VBQ0wsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBQztFQUNoQyxHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ0EsU0FBUyxVQUFVLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRTtFQUN4QyxFQUFFLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0VBQ3hCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFFO0VBQ25DLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUM7RUFDbkMsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLElBQUksT0FBTTtFQUNWLElBQUksU0FBUTtFQUNaLElBQUksS0FBSyxHQUFHLEdBQUU7QUFDZDtFQUNBLGVBQWUsU0FBUyxFQUFFLEtBQUssRUFBRTtFQUNqQyxFQUFFLE1BQU0sU0FBUyxHQUFHLGFBQWEsR0FBRTtFQUNuQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFNO0FBQ3ZCO0VBQ0EsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFDO0VBQ3pCLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsYUFBWSxDQUFDO0VBQ25ELEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsU0FBUSxLQUFLO0VBQ25ELEVBQUUsSUFBSSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsWUFBVyxFQUFFO0VBQ25ELEVBQUUsSUFBSSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsWUFBVyxFQUFFO0VBQ25ELEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsYUFBWSxDQUFDO0VBQ25ELEVBQUUsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsT0FBTyxJQUFJLENBQUMsVUFBUyxJQUFJO0VBQ25ELEVBQUUsSUFBSSxTQUFTLEVBQUU7RUFDakIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHQyxXQUFRO0VBQ25DLElBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFDO0VBQzFDLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUMxQyxJQUFJLFVBQVUsR0FBRyxHQUFFO0VBQ25CLElBQUksUUFBUSxJQUFJLFFBQVEsR0FBRTtFQUMxQixJQUFJLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFO0VBQzlCLE1BQU0sTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFDO0VBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0VBRTdCLFFBQVEsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFFO0VBQy9CLFFBQVEsSUFBSSxHQUFHLFlBQVksT0FBTyxFQUFFO0VBQ3BDLFVBQVUsR0FBRyxHQUFHLE1BQU0sSUFBRztFQUN6QixTQUFTO0VBQ1QsUUFBUSxJQUFJLE9BQU8sR0FBRyxLQUFLLFVBQVUsRUFBRTtFQUN2QyxVQUFVLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO0VBQzlCLFNBQVMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7RUFDdkMsVUFBVSxLQUFLLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRTtFQUNqQyxZQUFZLElBQUksT0FBTyxHQUFHLEtBQUssVUFBVSxFQUFFO0VBQzNDLGNBQWMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7RUFDbEMsYUFBYTtFQUNiLFdBQVc7RUFDWCxTQUFTO0VBQ1QsUUFBUSxNQUFNLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBQztFQUN0QyxRQUFRLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTTtFQUNsQyxVQUFVLEtBQUssR0FBRyxHQUFFO0VBQ3BCLFVBQVUsTUFBTSxHQUFHLFVBQVM7RUFDNUIsVUFBVSxNQUFNLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUN0RSxVQUFVLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQztFQUMzRCxVQUFVLFdBQVcsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBQztFQUN4RCxVQUFVLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7RUFDcEMsWUFBWSxXQUFXLElBQUksVUFBVSxDQUFDO0VBQ3RDLGNBQWMsR0FBRyxXQUFXO0VBQzVCLGNBQWMsT0FBTyxHQUFHO0VBQ3hCLGdCQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUk7RUFDNUMsZ0JBQWdCLElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO0VBQ3BELGtCQUFrQixRQUFRLEdBQUcsUUFBUSxHQUFFO0VBQ3ZDLGlCQUFpQjtFQUNqQixnQkFBZ0IsSUFBSSxDQUFDLFFBQVEsRUFBQztFQUM5QixlQUFlO0VBQ2YsYUFBYSxFQUFFLE1BQU0sRUFBQztFQUN0QixXQUFXLE1BQU07RUFDakIsWUFBWSxXQUFXLElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUM7RUFDMUQsV0FBVztFQUNYLFNBQVMsRUFBRSxDQUFDLEVBQUM7RUFDYixPQUFPO0VBQ1AsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVU7RUFDcEMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxVQUFTO0VBQ25DLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksVUFBUztFQUNuQyxHQUFtQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBQztFQUV4QyxFQUFFLElBQUksUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLFVBQVUsRUFBRTtFQUN4RCxJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFDO0VBQ3pELEdBQUc7RUFDSCxFQUFFLElBQUksR0FBRyxNQUFLO0VBQ2QsQ0FBQztBQUNEO0VBQ0EsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztFQUNuRCxNQUFNLENBQUMsUUFBUSxHQUFHLFNBQVE7RUFDMUIsU0FBUyxRQUFRLEdBQUc7RUFDcEIsRUFBRSxRQUFRLENBQUMsVUFBVSxHQUFFO0VBQ3ZCLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0VBQ2xDLElBQUksU0FBUyxFQUFFLElBQUk7RUFDbkIsSUFBSSxPQUFPLEVBQUUsSUFBSTtFQUNqQixHQUFHLEVBQUM7RUFDSixDQUFDO0FBQ0Q7RUFDQSxNQUFNLFdBQVcsR0FBRyxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUM7RUFDM0MsU0FBU0MsTUFBSSxHQUFHO0VBQ2hCLEVBQUUsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7RUFDN0MsRUFBRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWlCO0VBQ3hDLEVBQUUsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUM7RUFDbEQsRUFBRSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBQztFQUNoRCxFQUFFLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFDO0VBQ2hELEVBQUUsTUFBTSxPQUFPLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUM7RUFDaEQsRUFBRSxNQUFNLFNBQVMsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBQztBQUNoRDtFQUNBLEVBQUUsUUFBUSxDQUFDLFNBQVMsR0FBRyxNQUFLO0VBQzVCLEVBQUUsUUFBUSxDQUFDLFNBQVMsR0FBRyxDQUFDLGtDQUFrQyxFQUFDO0VBQzNELEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLGlDQUFpQyxFQUFDO0VBQzFELEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLGlDQUFpQyxFQUFDO0VBQzFELEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxzQkFBcUI7RUFDNUMsRUFBRSxPQUFPLENBQUMsU0FBUyxJQUFJLHNCQUFxQjtFQUM1QyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEdBQUcsdUJBQXNCO0VBQzdDLEVBQUUsU0FBUyxDQUFDLFNBQVMsRUFBRSx3QkFBdUI7RUFDOUMsRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFHLFdBQVU7RUFDN0IsRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLFVBQVM7RUFDNUIsRUFBRSxPQUFPLENBQUMsS0FBSyxLQUFLLFVBQVM7QUFDN0I7RUFDQSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBQztFQUN0QyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBQztFQUN0QyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQztFQUNyQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQztFQUNyQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQztFQUN2QyxFQUFFLFVBQVUsQ0FBQyxNQUFNO0VBQ25CLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFRO0VBQzdCLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxRQUFPO0VBQzVCLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxRQUFPO0VBQzVCLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxVQUFTO0VBRTlCLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQztFQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7RUFDdEMsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0VBQ3RDLElBQUksU0FBUyxDQUFZLEVBQUM7RUFDMUIsSUFBSSxRQUFRLEdBQUU7RUFDZCxHQUFHLEVBQUUsQ0FBQyxFQUFDO0VBQ1AsQ0FBQztBQUNEO0VBQ0EsU0FBUyxlQUFlLENBQUMsS0FBSyxFQUFFO0VBQ2hDLEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0VBQzVCLElBQUksSUFBSSxVQUFVLEdBQUcsRUFBQztFQUN0QixJQUFJLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNO0VBQ3ZDLE1BQU0sSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsRUFBQztFQUN0QyxNQUFNLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtFQUN0QyxRQUFRLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFDO0VBQ3pGLFFBQVEsUUFBUSxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFDO0VBQ2pELE9BQU87RUFDUCxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ3RCO0VBQ0EsTUFBTSxVQUFVLElBQUksRUFBQztFQUNyQixNQUFNLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7RUFDdEMsUUFBUSxhQUFhLENBQUMsUUFBUSxFQUFDO0VBQy9CLE9BQU87RUFDUCxLQUFLLEVBQUUsR0FBRyxFQUFDO0VBQ1gsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLElBQUksTUFBTSxHQUFHLEdBQUU7RUFDZixJQUFJLE1BQU0sR0FBRyxHQUFFO0VBQ2YsSUFBSSxNQUFNLEdBQUcsR0FBRTtFQUNmLElBQUksTUFBTSxHQUFHLEdBQUU7RUFDZixJQUFJLE1BQU0sR0FBRyxHQUFFO0VBQ2YsSUFBSSxNQUFNLEdBQUcsR0FBRTtFQUNmLElBQUksT0FBTyxHQUFHLEdBQUU7RUFDaEIsTUFBTSxNQUFNLEdBQUcsS0FBSTtBQUNuQjtFQUNBLElBQUksV0FBVyxHQUFHLFVBQVM7RUFDM0IsU0FBUyxRQUFRLEdBQUc7RUFDcEIsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUM7RUFDdkMsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUM7RUFDekMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUMvQztFQUNBLEVBQUUsTUFBTSxHQUFHLEdBQUU7RUFDYixFQUFFLE1BQU0sR0FBRyxHQUFFO0VBQ2IsRUFBRSxPQUFPLEdBQUcsR0FBRTtFQUNkLEVBQUUsV0FBVyxHQUFHLFVBQVM7RUFDekIsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBQztFQUNoRCxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUVGLElBQUUsRUFBQztFQUNqRSxFQUFFLElBQUksS0FBSyxFQUFFO0VBQ2IsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBQztFQUNwQixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUM7RUFDMUIsSUFBSSxPQUFPLElBQUk7RUFDZixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ0EsSUFBSSxXQUFXLEdBQUcsVUFBUztFQUMzQixTQUFTLFFBQVEsR0FBRztFQUNwQixFQUFFLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQ3pDLEVBQUUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDM0MsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUMvQztFQUNBLEVBQUUsTUFBTSxHQUFHLEdBQUU7RUFDYixFQUFFLE1BQU0sR0FBRyxHQUFFO0VBQ2IsRUFBRSxPQUFPLEdBQUcsR0FBRTtFQUNkLEVBQUUsV0FBVyxHQUFHLFVBQVM7RUFDekIsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBQztFQUNoRCxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUM7RUFDNUUsRUFBRSxJQUFJLEtBQUssRUFBRTtFQUNiLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUM7RUFDcEIsSUFBSSxlQUFlLENBQUMsS0FBSyxFQUFDO0VBQzFCLElBQUksT0FBTyxJQUFJO0VBQ2YsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLElBQUksV0FBVyxHQUFHLFVBQVM7RUFDM0IsU0FBUyxRQUFRLEdBQUc7RUFDcEIsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQztFQUN6QyxFQUFFLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQzNDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUk7QUFDL0M7RUFDQSxFQUFFLE1BQU0sR0FBRyxHQUFFO0VBQ2IsRUFBRSxNQUFNLEdBQUcsR0FBRTtFQUNiLEVBQUUsT0FBTyxHQUFHLEdBQUU7RUFDZCxFQUFFLFdBQVcsR0FBRyxVQUFTO0VBQ3pCLEVBQUUsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUM7RUFDaEQsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFDO0VBQzVFLEVBQUUsSUFBSSxLQUFLLEVBQUU7RUFDYixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFDO0VBQ3BCLElBQUksZUFBZSxDQUFDLEtBQUssRUFBQztFQUMxQixJQUFJLE9BQU8sSUFBSTtFQUNmLEdBQUc7RUFDSCxDQUFDO0FBQ0Q7RUFDQSxTQUFTLE1BQU0sRUFBRSxDQUFDLEVBQUU7RUFDcEIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtFQUNqQixJQUFJLElBQUksV0FBVyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxXQUFXLEVBQUU7RUFDbkUsTUFBTSxZQUFZLENBQUMsV0FBVyxFQUFDO0VBQy9CLE1BQU0sWUFBWSxDQUFDLFdBQVcsRUFBQztFQUMvQixNQUFNLFlBQVksQ0FBQyxXQUFXLEVBQUM7RUFDL0IsTUFBTSxJQUFJLFdBQVcsRUFBRTtFQUN2QixRQUFRLFFBQVEsR0FBRTtFQUNsQixPQUFPO0VBQ1AsTUFBTSxJQUFJLFdBQVcsRUFBRTtFQUN2QixRQUFRLFFBQVEsR0FBRTtFQUNsQixPQUFPLE1BQU07RUFDYixRQUFRLFFBQVEsR0FBRTtFQUNsQixPQUFPO0VBQ1AsTUFBTSxXQUFXLEdBQUcsVUFBUztFQUM3QixNQUFNLFdBQVcsR0FBRyxVQUFTO0VBQzdCLE1BQU0sV0FBVyxHQUFHLFVBQVM7RUFDN0IsS0FBSztFQUNMLEdBQUc7RUFDSCxDQUFDO0VBQ0QsSUFBSSxJQUFJLEdBQUcsTUFBSztFQUNoQixJQUFJLElBQUksR0FBRyxNQUFLO0VBQ2hCLFNBQVMsUUFBUSxFQUFFLENBQUMsRUFBRTtFQUN0QixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0VBQzdELElBQUksTUFBTTtFQUNWLEdBQUcsTUFBTTtFQUNULElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFBRTtFQUN6QixNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7RUFDbEMsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsWUFBWSxFQUFFO0VBQ25DLFVBQVUsSUFBSSxHQUFHLENBQUMsS0FBSTtFQUN0QixVQUFVLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFVBQVUsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUM7RUFDOUUsVUFBVSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixFQUFDO0VBQzdFLFVBQVUsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxnQkFBZ0IsRUFBQztFQUM3RSxTQUFTLE1BQU07RUFDZixVQUFVLElBQUksR0FBRyxDQUFDLEtBQUk7RUFDdEIsVUFBVSxJQUFJLElBQUksRUFBRTtFQUNwQixZQUFZLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGtCQUFpQjtFQUNwRCxXQUFXLE1BQU07RUFDakIsWUFBWSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFDO0VBQzlELFdBQVc7RUFDWCxTQUFTO0VBQ1QsT0FBTztFQUNQLEtBQUssTUFBTTtFQUNYLE1BQU0sSUFBSSxJQUFJLEdBQUdHLFNBQUksQ0FBQyxDQUFDLEVBQUM7RUFDeEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtFQUNqQyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRTtFQUN4QixVQUFVLElBQUksR0FBR0EsU0FBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBQztFQUMxQyxVQUFVLFlBQVksQ0FBQyxXQUFXLEVBQUM7RUFDbkMsVUFBVSxZQUFZLENBQUMsV0FBVyxFQUFDO0VBQ25DLFVBQVUsWUFBWSxDQUFDLFdBQVcsRUFBQztFQUNuQyxVQUFVLE9BQU8sSUFBSSxLQUFJO0VBQ3pCLFVBQVUsTUFBTTtFQUNoQixTQUFTO0VBQ1QsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztFQUN6QixRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQztFQUMzQixRQUFRLFlBQVksQ0FBQyxXQUFXLEVBQUM7RUFDakMsUUFBUSxXQUFXLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUM7RUFDbEQsT0FBTyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtFQUM1QixRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQ3pCLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDO0VBQzNCLFFBQVEsWUFBWSxDQUFDLFdBQVcsRUFBQztFQUNqQyxRQUFRLFdBQVcsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBQztFQUNsRCxPQUFPLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO0VBQzNCLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7RUFDekIsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUM7RUFDM0IsUUFBUSxZQUFZLENBQUMsV0FBVyxFQUFDO0VBQ2pDLFFBQVEsV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFDO0VBQ2xELE9BQU87RUFDUCxNQUFNLENBQUMsQ0FBQyxLQUFLLEdBQUcsUUFBTztFQUN2QixNQUFNLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBQztFQUN0QixLQUFLO0VBQ0wsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLE1BQU0sV0FBQ0YsVUFBUSxDQUFDLEdBQUcsU0FBUTtFQUMzQixJQUFJLE9BQU8sR0FBR0EsVUFBUSxDQUFDLEtBQUk7RUFDM0IsSUFBSSxPQUFPLEdBQUcsVUFBUztFQUN2QixJQUFJLFVBQVUsR0FBRyxHQUFFO0FBQ25CO0VBQ0EsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0VBQzVCO0VBQ0EsRUFBRSxJQUFJLE9BQU8sSUFBSUEsVUFBUSxDQUFDLElBQUksRUFBRTtFQUNoQyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFDO0VBQ3JDLElBQUksT0FBTyxHQUFHQSxVQUFRLENBQUMsS0FBSTtFQUMzQixHQUFHLE1BQU07RUFDVCxJQUFJLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTtFQUMzQixNQUFNLE9BQU8sSUFBSSxZQUFZLENBQUMsT0FBTyxFQUFDO0VBQ3RDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxLQUFLO0VBQ2hDLFFBQVEsT0FBTyxHQUFHLFVBQVM7RUFDM0IsUUFBUSxLQUFLLE1BQU0sRUFBRSxJQUFJLFVBQVUsRUFBRTtFQUNyQyxVQUFVLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxLQUFJO0VBQzlCLFVBQVUsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtFQUMzQyxZQUFZLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQzdCLGNBQWMsUUFBUTtFQUN0QixhQUFhLE1BQU07RUFDbkIsY0FBYyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSTtFQUNoQyxhQUFhO0VBQ2IsV0FBVztFQUNYLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBQztFQUNuQixTQUFTO0VBQ1QsUUFBUSxNQUFNLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUNwRSxRQUFRLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQztFQUN6RCxRQUFRLFdBQVcsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBQztFQUN0RCxRQUFRLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUN4QyxRQUFRLElBQUksUUFBUSxFQUFFO0VBQ3RCLFVBQVUsV0FBVyxJQUFJLFVBQVUsQ0FBQztFQUNwQyxZQUFZLEdBQUcsV0FBVztFQUMxQixZQUFZLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUMsQ0FBQztFQUN0QyxXQUFXLEVBQUUsTUFBTSxFQUFDO0VBQ3BCLFNBQVMsTUFBTTtFQUNmLFVBQVUsV0FBVyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFDO0VBQ3hELFNBQVM7QUFDVDtFQUNBLE9BQU8sRUFBRSxHQUFHLEVBQUM7RUFDYixLQUFLO0VBQ0wsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsVUFBVSxHQUFHO0VBQ3RCLEVBQUUsTUFBTSxNQUFNLEdBQUcsVUFBVSxHQUFFO0VBQzdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQzFFLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFDO0VBQ3hFLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFDO0VBQ3BFLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUM7RUFDcEQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO0VBQzFDLE1BQU1DLE1BQUksRUFBRSxDQUFDO0VBQ2IsS0FBSyxNQUFNO0VBQ1gsTUFBTSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUVBLE1BQUksRUFBQztFQUN2RCxLQUFLO0VBQ0wsR0FBRyxNQUFNO0VBQ1QsSUFBSSxNQUFNO0VBQ1YsR0FBRztBQUNIO0VBQ0EsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsS0FBSTtFQUM1QixFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxLQUFJO0VBQzVCLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVM7RUFDOUIsRUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLFlBQVk7RUFDbEMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUM7RUFDaEMsSUFBSSxXQUFXLEdBQUU7RUFDakIsSUFBRztFQUNILENBQUM7RUFDRCxnQkFBYyxHQUFHOztFQzlmakIsU0FBUyxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssR0FBRyxHQUFHLEVBQUU7RUFDcEMsRUFBRSxJQUFJLFNBQVE7RUFDZCxFQUFFLE9BQU8sWUFBWTtFQUNyQixJQUFJLE1BQU0sS0FBSyxHQUFHLEtBQUk7RUFDdEIsSUFBSSxNQUFNLElBQUksR0FBRyxVQUFTO0VBQzFCLElBQUksUUFBUSxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUM7RUFDdEMsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLE1BQU07RUFDaEMsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUM7RUFDM0IsS0FBSyxFQUFFLEtBQUssRUFBQztFQUNiLEdBQUc7RUFDSCxDQUFDO0VBQ0QsZ0JBQWMsR0FBRzs7OztFQ1JqQixhQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLE1BQU0sU0FBUyxHQUFHLGFBQWEsR0FBRTtFQUNuQyxFQUFFLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBQztFQUMzQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVE7RUFDcEMsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO0VBQzNCLElBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDO0VBQ3pCLEdBQUc7RUFDSCxFQUFFLE9BQU8sS0FBSztFQUNkOzs7O0VDVkE7QUFDNEM7QUFDSTtBQUNGO0FBQ0o7QUFDRjtBQUN4QztFQUNBLGdCQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBRTtFQUNqRCxJQUFJLE1BQU07RUFDVixHQUFHO0VBQ0gsRUFBRSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFDO0VBQ25ELEVBQUUsTUFBTSxLQUFLLEdBQUcsR0FBRTtFQUNsQixFQUFFLE1BQU0sS0FBSyxHQUFHLEdBQUU7QUFDbEI7RUFDQSxFQUFFLElBQUksS0FBSyxHQUFHLFNBQVMsR0FBRTtFQUN6QixFQUFFLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7RUFDakMsSUFBSSxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFVO0VBQzdDLElBQUksS0FBSyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDekIsTUFBTSxJQUFJLEVBQUUsR0FBRyxHQUFFO0VBQ2pCLE1BQU0sSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFO0VBQzNCLFFBQVEsRUFBRSxHQUFHO0VBQ2IsVUFBVSxLQUFLLEVBQUUsU0FBUztFQUMxQixVQUFVLE1BQU0sRUFBRSxJQUFJO0VBQ3RCLFVBQVUsTUFBTSxFQUFFLElBQUk7RUFDdEIsVUFBUztFQUNULE9BQU8sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsRUFBRTtFQUN4QyxRQUFRLEVBQUUsR0FBRztFQUNiLFVBQVUsS0FBSyxFQUFFLFdBQVc7RUFDNUIsVUFBVSxNQUFNLEVBQUUsS0FBSztFQUN2QixVQUFVLE1BQU0sRUFBRSxLQUFLO0VBQ3ZCLFVBQVM7RUFDVCxPQUFPLE1BQU07RUFDYixRQUFRLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDO0VBQ3JDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJO0VBQ25DLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUk7RUFDdEIsU0FBUyxFQUFDO0VBQ1YsUUFBUSxFQUFFLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUM7RUFDekIsT0FBTztFQUNQLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUU7RUFDcEIsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUc7RUFDbEIsUUFBUSxNQUFNLEVBQUUsS0FBSztFQUNyQixRQUFRLE1BQU0sRUFBRSxJQUFJO0VBQ3BCLFFBQU87RUFDUCxLQUFLO0VBQ0wsR0FBRztBQUNIO0VBQ0EsRUFBRSxJQUFJLEdBQUU7RUFDUixFQUFFLElBQUksTUFBSztFQUNYLEVBQUUsTUFBTSxTQUFTLEdBQUcsYUFBYSxHQUFFO0VBQ25DLEVBQUUsTUFBTSxPQUFPLEdBQUcsVUFBVSxHQUFFO0VBQzlCLEVBQUUsTUFBTSxRQUFRLEdBQUcsWUFBWTtFQUMvQixJQUFJLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7RUFDbkMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFRO0VBQ3BDLEtBQUs7RUFDTCxJQUFJLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUM7RUFDdEMsSUFBSSxLQUFLLE1BQU0sRUFBRSxJQUFJLEtBQUssRUFBRTtFQUM1QixNQUFNLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFDO0VBQ25ELE1BQU0sSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFO0VBQ3JCLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7RUFDL0IsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUk7RUFDakMsVUFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO0VBQzlDLFlBQVksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFLO0VBQ3BDLFdBQVc7RUFDWCxVQUFVLElBQUksRUFBRSxJQUFJLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRTtFQUNoRCxZQUFZLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFFO0VBQ25DLFlBQVksSUFBSSxHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsRUFBRTtFQUMzQyxjQUFjLEdBQUcsQ0FBQyxTQUFTLEdBQUcsRUFBQztFQUMvQixhQUFhO0VBQ2IsWUFBWSxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUM7RUFDOUIsWUFBWSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO0VBQ2pDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBQztFQUN6QixhQUFhO0VBQ2IsV0FBVztFQUNYLFVBQVUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFO0VBQ2hDLFlBQVksS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBQztFQUM1RSxZQUFZLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFDO0VBQ3pELFlBQVksTUFBTSxNQUFNLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxHQUFFO0VBQ3JFLFlBQVksV0FBVyxDQUFDLE1BQU0sRUFBQztFQUMvQixXQUFXO0VBQ1gsU0FBUztFQUNULE9BQU8sTUFBTTtFQUNiLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7RUFDL0IsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUk7RUFDakMsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQUs7RUFDbEMsVUFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7RUFDaEMsWUFBWSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDO0VBQzVFLFlBQVksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUM7RUFDekQsWUFBWSxNQUFNLE1BQU0sR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEdBQUU7RUFDckUsWUFBWSxXQUFXLENBQUMsTUFBTSxFQUFDO0VBQy9CLFdBQVc7RUFDWCxTQUFTO0VBQ1QsT0FBTztFQUNQLEtBQUs7RUFDTCxJQUFHO0FBQ0g7RUFDQSxFQUFFLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7RUFDakMsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxXQUFVO0VBQzNDLElBQUksTUFBTSxPQUFPLEdBQUc7RUFDcEIsTUFBTSxVQUFVLEVBQUUsRUFBRSxHQUFHLElBQUksR0FBRyxLQUFLO0VBQ25DLE1BQU0sU0FBUyxFQUFFLElBQUk7RUFDckIsTUFBTSxPQUFPLEVBQUUsSUFBSTtFQUNuQixNQUFLO0VBQ0wsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsTUFBTTtFQUN4RCxNQUFNLE1BQU0sUUFBUSxHQUFHLElBQUksZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBQztFQUN4RSxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7RUFDOUMsS0FBSyxFQUFDO0VBQ04sR0FBRztFQUNIOztFQzdHQSxNQUFNLEdBQUcsR0FBRyxtRUFBa0U7RUFDOUUsTUFBTUYsSUFBRSxHQUFHLGlCQUFnQjtBQUMzQjtFQUNBLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSztFQUM3QixFQUFFLElBQUksRUFBRSxHQUFHLEdBQUU7RUFDYixFQUFFLE9BQU8sSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0VBQ3JCLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQztFQUNyQyxHQUFHO0VBQ0gsRUFBRSxPQUFPLEVBQUU7RUFDWCxFQUFDO0FBQ0Q7RUFDQSxlQUFjLEdBQUcsTUFBTTtFQUN2QixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFNO0FBQ3hCO0VBQ0E7RUFDQTtFQUNBLEVBQUUsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0VBQy9DLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtFQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDL0MsSUFBRztBQUNIO0VBQ0E7RUFDQTtFQUNBLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0VBQzdDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRTtFQUNyQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDOUMsSUFBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztFQUM1QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7RUFDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQzVDLElBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0VBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0VBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztFQUMzQyxJQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsTUFBTSxD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
