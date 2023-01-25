var app = (function () {
	'use strict';

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

	var wsClient = {};

	/* global location */

	var _ws_postmessage$1 = () => {
	  function receiveMessage (event) {
	    if (window.mitm.client.postmessage) {
	      console.log(`>>> Postmessage: ${event.origin} => https://${location.host}`, event.data);
	    }
	  }
	  window.addEventListener('message', receiveMessage, false);
	};

	const _c$6 = 'color: #bada55';

	var _ws_client$1 = () => {
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
	    _saveTags ({ routes, __tag1, __tag2, __tag3, _id }) {
	      if (!location.origin.match('chrome-extension')) {
	        console.log('%cWs: Update routes', _c$6);
	        window.mitm.routes = routes;
	        window.mitm.__tag1 = __tag1; //# __tag1 in-sync
	        /**
	         * run as urlChange!
	         */
	        window.mitm.fn.urlChange();
	      } else if (_id!==window._ws_id) {
	        console.log('%cWs: Update routes', _c$6);
	        window.mitm.routes = routes;
	        window.mitm.__tag1 = __tag1; //# __tag1 in-sync
	        window.mitm.__tag2 = __tag2; //# __tag2 in-sync
	        window.mitm.__tag3 = __tag3; //# __tag3 in-sync
	        window.mitm.fn.broadcastEvent();
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

	const _ws_client = _ws_client$1;
	const _ws_wccmd = _ws_client();

	var _ws_msgParser$1 = (event, msg) => {
	  if (window.mitm.argv.debug?.includes('W')) {
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

	var _ws_inIframe$1 = () => {
	  let ifrm;
	  try {
	    ifrm = window.self !== window.top;
	  } catch (e) {
	    ifrm = true;
	  }
	  return ifrm ? 'iframe' : 'window'
	};

	var _ws_vendor$5 = () => {
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
	const _ws_msgParser = _ws_msgParser$1;
	const _ws_inIframe = _ws_inIframe$1;
	const _ws_vendor$4 = _ws_vendor$5;
	const _c$5 = 'color: #bada55';

	var _ws_initSocket$1 = () => {
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
	    const vendor = ['firefox', 'webkit'].includes(_ws_vendor$4());
	    const pre = vendor ? 'ws' : 'wss';
	    const prt = vendor ? '3002' : '3005';
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
	var _screenshot$2 = screnshot;

	/* global location */

	var _ws_namespace$5 = () => {
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
	const _screenshot$1 = _screenshot$2;
	const _ws_namespace$4 = _ws_namespace$5;
	const _ws_vendor$3 = _ws_vendor$5;
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
	  const namespace = _ws_namespace$4();
	  const browser = _ws_vendor$3();
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
	      _screenshot$1(params);
	      if (mitm.argv.lazyclick) {
	        // delay action to finish screenshot
	        window.mitm.screenshot = e.target;
	        e.stopImmediatePropagation();
	        e.stopPropagation();
	        e.preventDefault();
	        mitm.lastEvent = e;
	        setTimeout(() => {
	          act = window.mitm.screenshot;
	          if (act?.click) {
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

	var _ws_screenshot$1 = () => {
	  const route = window.mitm.routes[_ws_namespace$4()];
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
	var char = codeToChar;

	const _ws_vendor$2 = _ws_vendor$5;
	const _c$3 = 'color: #bada55';

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

	async function play$2 (autofill) {
	  const {__args} = window.mitm;
	  if (autofill) {
	    if (typeof (autofill) === 'function') {
	      autofill = autofill();
	    }
	    const browser = _ws_vendor$2();
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

	var play_1 = play$2;

	const style$1 = `
.mitm-app {
  position: absolute;  
}
.mitm-container {
  z-index: 99999;
  position: fixed;
  font-size: 12px;
  line-height: 14px;
}
.mitm-container.topr  {top:  0px; right: 3px;}
.mitm-container.left  {top: -2px; left : 3px;}
.mitm-container.right {top: 14px; right: 3px;}
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
.bgroup-left2 {
  display: table;
  margin-top: 0;
}
.bgroup-left>div,
.bgroup-left2>div,
.bgroup-right>div {
  padding-bottom: 2px;
}
.bgroup-topr,
.bgroup-topr span {
  font-size: 14px;
}`;
	var css = style$1;

	const play$1 = play_1;

	var buttons = bgroup => {

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
	          await play$1(arr);
	        }
	      };

	      btn.innerText = caption;
	      btn.classList.add('mitm-btn');
	      btn.classList.add(`${pos}`);
	      btn.classList.add(klas || caption);
	      btn.style = color ? `background: ${color};` : '';

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

	  return setButtons  
	};

	function defaultHotKeys$1() {
	  const {mitm: {svelte: {Cspheader, Sqlite}, argv, fn}} = window;
	  const qry  = '.mitm-container.popup'; 
	  const wcag2 = [
	    'wcag2a',
	    'wcag2aa',
	    'wcag21a',
	    'wcag21aa',
	  ];
	  const wcag3 = [
	    // ...wcag2,
	    'wcag2aaa',
	    'wcag21aaa',
	    'best-practice',
	  ];
	  const rulesObj = {
	    'color-contrast': { enabled: true },
	  };

	  let keys = {
	    'code:KeyP'(_e) {fn.svelte(Cspheader, 'LightPastelGreen');},
	    'code:KeyQ'(_e) {fn.svelte(Sqlite   , 'LightPastelGreen');},
	  };
	  keys['code:KeyP']._title = 'Show CSP Header';
	  keys['code:KeyQ']._title = 'Show Sqlite';

	  if (argv.a11y && fn.axerun) {
	    keys = {
	      ...keys,
	      'key:yyy'(_e) {fn.axerun(wcag3, rulesObj              );},
	      'key:yy' (_e) {fn.axerun(wcag2                        );},
	      'key:y'  (_e) {fn.axerun(                             );},
	      'key:c'  (_e) {document.querySelector(qry).innerText='';},
	    };
	    keys['key:yyy']._title = 'Exec. a11y strict';
	    keys['key:yy' ]._title = 'Exec. a11y wcag:aa';
	    keys['key:y'  ]._title = 'Exec. a11y default';
	    keys['key:c'  ]._title = 'Clear a11y result';
	  }
	  return keys
	}

	var hotkeys$1 = defaultHotKeys$1;

	/* global location, history, chrome, Event, CssSelectorGenerator */

	/* eslint-disable camelcase */
	const _ws_vendor$1    = _ws_vendor$5;
	const _ws_namespace$3 = _ws_namespace$5;
	const _key          = char;
	const play          = play_1;
	const style         = css;

	const bgroup = {
	  right: {},
	  topr: {},
	  left: {},
	};

	const setButtons = buttons(bgroup);
	const defaultHotKeys = hotkeys$1;

	let container = {
	  topr: {},
	  left: {},
	  right: {},
	  target: {},
	};

	function wait(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms))
	}

	function toRegex (pathMsg) {
	  let [path, msg] = pathMsg.split('=>').map(item => item.trim());
	  path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?');
	  return { path, msg }
	}

	let debunk;
	let intervId;
	let onces = {}; // feat: onetime fn call

	async function urlChange (event) {
	  const namespace = _ws_namespace$3();
	  const {mitm} = window;
	  const {fn}   = mitm;
	  
	  if (mitm.argv.a11y && fn.axerun) {
	    fn.axerun();
	  }

	  clearInterval(intervId);
	  if (mitm.autointerval) {delete mitm.autointerval;}
	  if (mitm.autofill)     {delete mitm.autofill;    }
	  if (mitm.autobuttons)  {delete mitm.autobuttons; }
	  if (mitm.leftbuttons)  {delete mitm.leftbuttons; }
	  if (mitm.rightbuttons) {delete mitm.rightbuttons;}
	  if (!mitm.macrokeys)   {
	    mitm.macrokeys = defaultHotKeys();     
	  }

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
	          const {
	            autobuttons,
	            rightbuttons,
	            leftbuttons,
	            left2buttons
	          } = window.mitm;
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
	            autobuttons && setButtons(autobuttons, 'topr' );
	          }
	          rightbuttons && setButtons(rightbuttons, 'right');
	          left2buttons && setButtons(left2buttons, 'left2');
	          leftbuttons  && setButtons(leftbuttons , 'left' );
	        }, 0);
	      }
	    }
	    if (none) {
	      setButtons({}, 'right');
	      setButtons({}, 'left');
	      setButtons({}, 'topr');
	      const {left2buttons} = window.mitm;
	      left2buttons && setButtons(left2buttons, 'left2');
	    }
	  } else {
	    setButtons({}, 'right');
	    setButtons({}, 'left');
	    setButtons({}, 'topr');
	    const {left2buttons} = window.mitm;
	    left2buttons && setButtons(left2buttons, 'left2');
	  }
	  container.right.style = '';
	  container.topr.style  = '';
	  container.left.style  = '';
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
	  const body     = document.body;
	  const divx     = document.createElement('div'  );
	  const divRight = document.createElement('div'  );
	  const divTopR  = document.createElement('div'  );
	  const divLeft  = document.createElement('div'  );
	  const divPopup = document.createElement('div'  );
	  const divCenter= document.createElement('div'  );
	  const html     = document.querySelector('html' );
	  const styleBtn = document.createElement('style');
	  const htmlref  = html.firstElementChild;
	  const divxref  = divx.firstElementChild;
	  const bodyref  = body.firstElementChild;
	  divRight.style = '';
	  divTopR .style = '';
	  divLeft .style = '';

	  styleBtn .innerHTML = style;
	  styleBtn .className = 'mitm-class';
	  divRight .innerHTML = `<span class="bgroup-right"></span>`;
	  divTopR  .innerHTML = `<span class="bgroup-topr"></span>`;
	  divLeft  .innerHTML = `<span class="bgroup-left"></span><span class="bgroup-left2"></span>`;
	  divx     .className = 'mitm-app';
	  divLeft  .className = 'mitm-container left';
	  divTopR  .className = 'mitm-container topr';
	  divRight .className = 'mitm-container right';
	  divPopup .className = 'mitm-container popup';
	  divCenter.className = 'mitm-container center';
	  html.insertBefore(divx     , htmlref);
	  html.insertBefore(styleBtn , htmlref);
	  divx.insertBefore(divRight , divxref);
	  divx.insertBefore(divTopR  , divxref);
	  divx.insertBefore(divLeft  , divxref);
	  divx.insertBefore(divCenter, divxref);
	  body.insertBefore(divPopup , bodyref);
	  // body.appendChild (divPopup)
	  const hotkey = new mitm.svelte.Hotkeys({target:divCenter});
	  setTimeout(() => {
	    container.topr = divTopR;
	    container.left = divLeft;
	    container.right= divRight;
	    container.hotkey = hotkey;
	    container.popup  = divPopup;
	    container.target = divCenter;
	    container.nodekey= divCenter.children[0];
	    bgroup.right = divRight.children[0];
	    bgroup.topr  = divTopR .children[0];
	    bgroup.left  = divLeft .children[0];
	    bgroup.left2 = divLeft .children[1];
	    urlChange();
	    observed();
	    document.addEventListener('click', function(event) {
	      const el = event.target;
	      if (center && !divCenter.contains(el)) {
	        divCenter.attributes.removeNamedItem('style');
	        center = false;
	      } else {
	        const a11yPopup = document.querySelector('.a11y-popup');
	        if (a11yPopup && !el.closest('.a11y-popup')) {
	          const {elNode={}} = mitm.axerun;
	          elNode.node = undefined;
	          a11yPopup.remove();
	        }
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
	  console.log(`%cMacros: ctrl + alt  +  ${key1}  |  ${key2}`, 'color: #bada55');
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
	          right.style = !ctrl ? '' : 'display: none;';
	          topr.style  = !ctrl ? '' : 'display: none;';
	          left.style  = !ctrl ? '' : 'display: none;';
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
	  // console.log(`%cMacros: DOM mutated!`, 'color: #bada55')
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
	  const vendor = _ws_vendor$1();
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

	function svelte(Svelt, bg='PostIt') { // feat: svelte related
	  const {target, popup} = container;
	  target.replaceChildren('');
	  // popup .replaceChildren('')
	  if (typeof(bg)!=='string' && bg.popup) {
	    const props = {node: bg.node};
	    window.mitm.sapp = new Svelt({target: popup, props});
	  } else {
	    window.mitm.sapp = new Svelt({target});
	    setTimeout(() => {
	      const bcolor = pastel[bg];
	      target.style = `display: block${bcolor ? ';background:'+bcolor : ''};`;
	      center = true;
	    }, 0);  
	  }
	}

	function hotKeys(newkeys) {
	  const {mitm} = window;
	  const keys = mitm.macrokeys || {};
	  delete keys['key:yyy'];
	  delete keys['key:yy' ];
	  delete keys['key:y'  ];
	  delete keys['key:c'  ];
	  mitm.macrokeys = {...keys,...newkeys,...defaultHotKeys()};
	}

	window.mitm.fn.macroAutomation = macroAutomation;
	window.mitm.fn.urlChange = urlChange;
	window.mitm.fn.hotKeys = hotKeys;
	window.mitm.fn.svelte = svelte;
	window.mitm.fn.play = play;
	window.mitm.fn.wait = wait;

	var _ws_location$1 = wsLocation;

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
	var _ws_debounce$1 = debounce;

	/* global location */

	const _ws_namespace$2 = _ws_namespace$5;

	var _ws_route$1 = () => {
	  const namespace = _ws_namespace$2();
	  let route = window.mitm.routes[namespace];
	  if (route) {
	    const {_subns: s} = route._childns;
	    if (s && mitm.routes[s]) {
	      route= mitm.routes[s];
	    }  
	  }
	  return route
	};

	/* global location, MutationObserver */

	/* eslint-disable camelcase */
	const _screenshot = _screenshot$2;
	const _ws_namespace$1 = _ws_namespace$5;
	const _ws_debounce = _ws_debounce$1;
	const _ws_vendor = _ws_vendor$5;
	const _ws_route = _ws_route$1;

	var _ws_observer$1 = () => {
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
	  const namespace = _ws_namespace$1();
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

	var _ws_general$1 = () => {
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
	    window._ws_id = id;
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
	const _ws_namespace = _ws_namespace$5;

	let _timeout;
	let _csp = {};
	var _ws_cspErr$1 = () => {
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

	var _ws_macros$1 = function () {
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
	function svg_element(name) {
	    return document.createElementNS('http://www.w3.org/2000/svg', name);
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
	function set_style(node, key, value, important) {
	    if (value === null) {
	        node.style.removeProperty(key);
	    }
	    else {
	        node.style.setProperty(key, value, important ? 'important' : '');
	    }
	}
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	    const e = document.createEvent('CustomEvent');
	    e.initCustomEvent(type, bubbles, cancelable, detail);
	    return e;
	}
	class HtmlTag {
	    constructor(is_svg = false) {
	        this.is_svg = false;
	        this.is_svg = is_svg;
	        this.e = this.n = null;
	    }
	    c(html) {
	        this.h(html);
	    }
	    m(html, target, anchor = null) {
	        if (!this.e) {
	            if (this.is_svg)
	                this.e = svg_element(target.nodeName);
	            else
	                this.e = element(target.nodeName);
	            this.t = target;
	            this.c(html);
	        }
	        this.i(anchor);
	    }
	    h(html) {
	        this.e.innerHTML = html;
	        this.n = Array.from(this.e.childNodes);
	    }
	    i(anchor) {
	        for (let i = 0; i < this.n.length; i += 1) {
	            insert(this.t, this.n[i], anchor);
	        }
	    }
	    p(html) {
	        this.d();
	        this.h(html);
	        this.i(this.a);
	    }
	    d() {
	        this.n.forEach(detach);
	    }
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
	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();
	let flushidx = 0; // Do *not* move this inside the flush() function
	function flush() {
	    const saved_component = current_component;
	    do {
	        // first, call beforeUpdate functions
	        // and update components
	        while (flushidx < dirty_components.length) {
	            const component = dirty_components[flushidx];
	            flushidx++;
	            set_current_component(component);
	            update(component.$$);
	        }
	        set_current_component(null);
	        dirty_components.length = 0;
	        flushidx = 0;
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
	    seen_callbacks.clear();
	    set_current_component(saved_component);
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
	    else if (callback) {
	        callback();
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
	    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
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

	/* ws-client/_svelte/a11y-popup.svelte generated by Svelte v3.49.0 */

	const { Object: Object_1$1, console: console_1$2 } = globals;
	const file$4 = "ws-client/_svelte/a11y-popup.svelte";

	function get_each_context_1$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[24] = list[i];
		return child_ctx;
	}

	function get_each_context$4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[24] = list[i];
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[29] = list[i][0];
		child_ctx[30] = list[i][1];
		return child_ctx;
	}

	function get_each_context_3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[33] = list[i];
		return child_ctx;
	}

	// (129:8) {:else}
	function create_else_block$2(ctx) {
		let t_1_value = /*tag*/ ctx[33] + "";
		let t_1;

		const block = {
			c: function create() {
				t_1 = text(t_1_value);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t_1, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(t_1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(129:8) {:else}",
			ctx
		});

		return block;
	}

	// (127:8) {#if criterion1[tag]}
	function create_if_block_6(ctx) {
		let a;
		let t_1_value = /*tag*/ ctx[33] + "";
		let t_1;

		const block = {
			c: function create() {
				a = element("a");
				t_1 = text(t_1_value);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*criterion1*/ ctx[5][/*tag*/ ctx[33]].link);
				add_location(a, file$4, 127, 10, 3800);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, t_1);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(a);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_6.name,
			type: "if",
			source: "(127:8) {#if criterion1[tag]}",
			ctx
		});

		return block;
	}

	// (126:6) {#each tags as tag}
	function create_each_block_3(ctx) {
		let t_1;

		function select_block_type(ctx, dirty) {
			if (/*criterion1*/ ctx[5][/*tag*/ ctx[33]]) return create_if_block_6;
			return create_else_block$2;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				if_block.c();
				t_1 = text("\n         ");
			},
			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert_dev(target, t_1, anchor);
			},
			p: function update(ctx, dirty) {
				if_block.p(ctx, dirty);
			},
			d: function destroy(detaching) {
				if_block.d(detaching);
				if (detaching) detach_dev(t_1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_3.name,
			type: "each",
			source: "(126:6) {#each tags as tag}",
			ctx
		});

		return block;
	}

	// (137:6) {#each Object.entries(criterion2) as [key, value]}
	function create_each_block_2(ctx) {
		let a;
		let t0_value = /*value*/ ctx[30].name + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				a = element("a");
				t0 = text(t0_value);
				t1 = text(",");
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*value*/ ctx[30].link);
				add_location(a, file$4, 137, 8, 4065);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, t0);
				insert_dev(target, t1, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(a);
				if (detaching) detach_dev(t1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_2.name,
			type: "each",
			source: "(137:6) {#each Object.entries(criterion2) as [key, value]}",
			ctx
		});

		return block;
	}

	// (145:4) {#if all.length||any.length}
	function create_if_block$2(ctx) {
		let hr0;
		let t0;
		let div;
		let t1;
		let t2;
		let hr1;

		function select_block_type_1(ctx, dirty) {
			if (/*all*/ ctx[0].length > 1) return create_if_block_2$1;
			if (/*all*/ ctx[0].length === 1) return create_if_block_3;
			if (/*any*/ ctx[1].length > 1) return create_if_block_4;
			if (/*any*/ ctx[1].length === 1) return create_if_block_5;
		}

		let current_block_type = select_block_type_1(ctx);
		let if_block0 = current_block_type && current_block_type(ctx);
		let if_block1 = /*incomplete*/ ctx[4] && /*grp*/ ctx[12] === 'color-contrast' && create_if_block_1$2(ctx);

		const block = {
			c: function create() {
				hr0 = element("hr");
				t0 = space();
				div = element("div");
				if (if_block0) if_block0.c();
				t1 = space();
				if (if_block1) if_block1.c();
				t2 = space();
				hr1 = element("hr");
				add_location(hr0, file$4, 145, 6, 4362);
				attr_dev(div, "class", "pre svelte-tj161o");
				add_location(div, file$4, 146, 6, 4374);
				add_location(hr1, file$4, 170, 6, 4993);
			},
			m: function mount(target, anchor) {
				insert_dev(target, hr0, anchor);
				insert_dev(target, t0, anchor);
				insert_dev(target, div, anchor);
				if (if_block0) if_block0.m(div, null);
				append_dev(div, t1);
				if (if_block1) if_block1.m(div, null);
				insert_dev(target, t2, anchor);
				insert_dev(target, hr1, anchor);
			},
			p: function update(ctx, dirty) {
				if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if (if_block0) if_block0.d(1);
					if_block0 = current_block_type && current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(div, t1);
					}
				}

				if (/*incomplete*/ ctx[4] && /*grp*/ ctx[12] === 'color-contrast') if_block1.p(ctx, dirty);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(hr0);
				if (detaching) detach_dev(t0);
				if (detaching) detach_dev(div);

				if (if_block0) {
					if_block0.d();
				}

				if (if_block1) if_block1.d();
				if (detaching) detach_dev(t2);
				if (detaching) detach_dev(hr1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(145:4) {#if all.length||any.length}",
			ctx
		});

		return block;
	}

	// (164:33) 
	function create_if_block_5(ctx) {
		let html_tag;
		let raw_value = /*any*/ ctx[1][0] + "";
		let html_anchor;

		const block = {
			c: function create() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m: function mount(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert_dev(target, html_anchor, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*any*/ 2 && raw_value !== (raw_value = /*any*/ ctx[1][0] + "")) html_tag.p(raw_value);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(html_anchor);
				if (detaching) html_tag.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_5.name,
			type: "if",
			source: "(164:33) ",
			ctx
		});

		return block;
	}

	// (157:31) 
	function create_if_block_4(ctx) {
		let b;
		let t1;
		let ol;
		let each_value_1 = /*any*/ ctx[1];
		validate_each_argument(each_value_1);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
		}

		const block = {
			c: function create() {
				b = element("b");
				b.textContent = "Fix ONE of the following:";
				t1 = space();
				ol = element("ol");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				add_location(b, file$4, 157, 10, 4672);
				attr_dev(ol, "class", "svelte-tj161o");
				add_location(ol, file$4, 158, 10, 4715);
			},
			m: function mount(target, anchor) {
				insert_dev(target, b, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, ol, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(ol, null);
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*any*/ 2) {
					each_value_1 = /*any*/ ctx[1];
					validate_each_argument(each_value_1);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_1$2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ol, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_1.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(b);
				if (detaching) detach_dev(t1);
				if (detaching) detach_dev(ol);
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4.name,
			type: "if",
			source: "(157:31) ",
			ctx
		});

		return block;
	}

	// (155:33) 
	function create_if_block_3(ctx) {
		let html_tag;
		let raw_value = /*all*/ ctx[0][0] + "";
		let html_anchor;

		const block = {
			c: function create() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m: function mount(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert_dev(target, html_anchor, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*all*/ 1 && raw_value !== (raw_value = /*all*/ ctx[0][0] + "")) html_tag.p(raw_value);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(html_anchor);
				if (detaching) html_tag.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(155:33) ",
			ctx
		});

		return block;
	}

	// (148:8) {#if all.length>1}
	function create_if_block_2$1(ctx) {
		let b;
		let t1;
		let ol;
		let each_value = /*all*/ ctx[0];
		validate_each_argument(each_value);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				b = element("b");
				b.textContent = "Fix ALL of the following:";
				t1 = space();
				ol = element("ol");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				add_location(b, file$4, 148, 10, 4427);
				attr_dev(ol, "class", "svelte-tj161o");
				add_location(ol, file$4, 149, 10, 4470);
			},
			m: function mount(target, anchor) {
				insert_dev(target, b, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, ol, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(ol, null);
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*all*/ 1) {
					each_value = /*all*/ ctx[0];
					validate_each_argument(each_value);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$4(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ol, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(b);
				if (detaching) detach_dev(t1);
				if (detaching) detach_dev(ol);
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$1.name,
			type: "if",
			source: "(148:8) {#if all.length>1}",
			ctx
		});

		return block;
	}

	// (160:10) {#each any as cat}
	function create_each_block_1$2(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 160, 12, 4761);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				li.innerHTML = raw_value;
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*any*/ 2 && raw_value !== (raw_value = /*cat*/ ctx[24] + "")) li.innerHTML = raw_value;		},
			d: function destroy(detaching) {
				if (detaching) detach_dev(li);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1$2.name,
			type: "each",
			source: "(160:10) {#each any as cat}",
			ctx
		});

		return block;
	}

	// (151:10) {#each all as cat}
	function create_each_block$4(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 151, 12, 4516);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				li.innerHTML = raw_value;
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*all*/ 1 && raw_value !== (raw_value = /*cat*/ ctx[24] + "")) li.innerHTML = raw_value;		},
			d: function destroy(detaching) {
				if (detaching) detach_dev(li);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$4.name,
			type: "each",
			source: "(151:10) {#each all as cat}",
			ctx
		});

		return block;
	}

	// (167:8) {#if incomplete && grp==='color-contrast'}
	function create_if_block_1$2(ctx) {
		let t_1_value = /*ratio*/ ctx[13]() + "";
		let t_1;

		const block = {
			c: function create() {
				t_1 = text(t_1_value);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t_1, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(t_1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$2.name,
			type: "if",
			source: "(167:8) {#if incomplete && grp==='color-contrast'}",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let div2;
		let span1;
		let svg;
		let g;
		let path;
		let t0;
		let span0;
		let t2;
		let div0;
		let h4;
		let t4;
		let p0;
		let t6;
		let p1;
		let b0;
		let t8;
		let t9;
		let p2;
		let b1;
		let t11;
		let t12;
		let a;
		let t13;
		let t14;
		let details;
		let summary;
		let b2;
		let t16;
		let t17;
		let t18;
		let t19;
		let div1;
		let pre;
		let code;
		let mounted;
		let dispose;
		let each_value_3 = /*tags*/ ctx[11];
		validate_each_argument(each_value_3);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_3.length; i += 1) {
			each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
		}

		let each_value_2 = Object.entries(/*criterion2*/ ctx[6]);
		validate_each_argument(each_value_2);
		let each_blocks = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		let if_block = (/*all*/ ctx[0].length || /*any*/ ctx[1].length) && create_if_block$2(ctx);

		const block = {
			c: function create() {
				div2 = element("div");
				span1 = element("span");
				svg = svg_element("svg");
				g = svg_element("g");
				path = svg_element("path");
				t0 = space();
				span0 = element("span");
				span0.textContent = "Copied to clipboard";
				t2 = space();
				div0 = element("div");
				h4 = element("h4");
				h4.textContent = `${/*help*/ ctx[10]}`;
				t4 = space();
				p0 = element("p");
				p0.textContent = `${/*description*/ ctx[3]}`;
				t6 = space();
				p1 = element("p");
				b0 = element("b");
				b0.textContent = "tags:";
				t8 = space();

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t9 = space();
				p2 = element("p");
				b1 = element("b");
				b1.textContent = "criteria:";
				t11 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t12 = space();
				a = element("a");
				t13 = text(/*grp*/ ctx[12]);
				t14 = space();
				details = element("details");
				summary = element("summary");
				b2 = element("b");
				b2.textContent = "impact:";
				t16 = space();
				t17 = text(/*impact*/ ctx[8]);
				t18 = space();
				if (if_block) if_block.c();
				t19 = space();
				div1 = element("div");
				pre = element("pre");
				code = element("code");
				code.textContent = `${/*html*/ ctx[9]}`;
				set_style(path, "stroke", "none");
				set_style(path, "fill-rule", "nonzero");
				set_style(path, "fill", "rgb(0%,0%,0%)");
				set_style(path, "fill-opacity", "1");
				attr_dev(path, "d", "M 10.882812 4.027344 L 10.882812 0 L 1.730469 0 L 1.730469 12.269531 L 5.117188 12.269531 L 5.117188 16 L 14.269531 16 L 14.269531 7.417969 Z M 10.882812 5.464844 L 12.535156 7.117188 L 10.882812 7.117188 Z M 2.746094 11.253906 L 2.746094 1.015625 L 9.863281 1.015625 L 9.863281 3.730469 L 5.117188 3.730469 L 5.117188 11.253906 Z M 6.136719 14.984375 L 6.136719 4.746094 L 9.863281 4.746094 L 9.863281 8.136719 L 13.253906 8.136719 L 13.253906 14.984375 Z M 6.136719 14.984375 ");
				add_location(path, file$4, 116, 6, 2980);
				attr_dev(g, "id", "surface1");
				add_location(g, file$4, 115, 6, 2956);
				attr_dev(svg, "width", "16px");
				attr_dev(svg, "height", "16px");
				attr_dev(svg, "viewBox", "0 0 16 16");
				attr_dev(svg, "version", "1.1");
				add_location(svg, file$4, 114, 4, 2883);
				attr_dev(span0, "class", "icopied svelte-tj161o");
				add_location(span0, file$4, 119, 4, 3571);
				attr_dev(span1, "class", "icopy svelte-tj161o");
				add_location(span1, file$4, 113, 2, 2840);
				attr_dev(h4, "class", "svelte-tj161o");
				add_location(h4, file$4, 122, 4, 3663);
				attr_dev(p0, "class", "svelte-tj161o");
				add_location(p0, file$4, 123, 4, 3683);
				add_location(b0, file$4, 124, 17, 3721);
				attr_dev(p1, "class", "tgs svelte-tj161o");
				add_location(p1, file$4, 124, 4, 3708);
				add_location(b1, file$4, 135, 6, 3983);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*helpUrl*/ ctx[7]);
				add_location(a, file$4, 139, 6, 4169);
				attr_dev(p2, "class", "svelte-tj161o");
				add_location(p2, file$4, 134, 4, 3973);
				attr_dev(div0, "class", "a11y-content");
				add_location(div0, file$4, 121, 2, 3632);
				add_location(b2, file$4, 143, 13, 4289);
				attr_dev(summary, "class", "svelte-tj161o");
				add_location(summary, file$4, 143, 4, 4280);
				attr_dev(code, "class", "language-html svelte-tj161o");
				add_location(code, file$4, 173, 11, 5040);
				attr_dev(pre, "class", "svelte-tj161o");
				add_location(pre, file$4, 173, 6, 5035);
				attr_dev(div1, "class", "pre svelte-tj161o");
				add_location(div1, file$4, 172, 4, 5013);
				details.open = true;
				attr_dev(details, "class", "svelte-tj161o");
				add_location(details, file$4, 142, 2, 4261);
				attr_dev(div2, "class", "a11y-popup svelte-tj161o");
				attr_dev(div2, "style", /*style*/ ctx[2]);
				add_location(div2, file$4, 112, 0, 2805);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, span1);
				append_dev(span1, svg);
				append_dev(svg, g);
				append_dev(g, path);
				append_dev(span1, t0);
				append_dev(span1, span0);
				append_dev(div2, t2);
				append_dev(div2, div0);
				append_dev(div0, h4);
				append_dev(div0, t4);
				append_dev(div0, p0);
				append_dev(div0, t6);
				append_dev(div0, p1);
				append_dev(p1, b0);
				append_dev(p1, t8);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].m(p1, null);
				}

				append_dev(div0, t9);
				append_dev(div0, p2);
				append_dev(p2, b1);
				append_dev(p2, t11);

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(p2, null);
				}

				append_dev(p2, t12);
				append_dev(p2, a);
				append_dev(a, t13);
				append_dev(div2, t14);
				append_dev(div2, details);
				append_dev(details, summary);
				append_dev(summary, b2);
				append_dev(summary, t16);
				append_dev(summary, t17);
				append_dev(details, t18);
				if (if_block) if_block.m(details, null);
				append_dev(details, t19);
				append_dev(details, div1);
				append_dev(div1, pre);
				append_dev(pre, code);

				if (!mounted) {
					dispose = listen_dev(span1, "click", copyto, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*criterion1, tags*/ 2080) {
					each_value_3 = /*tags*/ ctx[11];
					validate_each_argument(each_value_3);
					let i;

					for (i = 0; i < each_value_3.length; i += 1) {
						const child_ctx = get_each_context_3(ctx, each_value_3, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_3(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(p1, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_3.length;
				}

				if (dirty[0] & /*criterion2*/ 64) {
					each_value_2 = Object.entries(/*criterion2*/ ctx[6]);
					validate_each_argument(each_value_2);
					let i;

					for (i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2(ctx, each_value_2, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(p2, t12);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_2.length;
				}

				if (/*all*/ ctx[0].length || /*any*/ ctx[1].length) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.m(details, t19);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (dirty[0] & /*style*/ 4) {
					attr_dev(div2, "style", /*style*/ ctx[2]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(div2);
				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
				if (if_block) if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function reformat(arr) {
		const rgx = /([\d.#:]+)( |\w+)/g;

		return arr.map(item => {
			let x1 = item.message;
			const x2 = x1.match(rgx);
			x1 = x1.replace(/</g, '&lt;').replace(/>/g, '&gt;');

			x2 && x2.filter(x => x.length > 2).forEach(element => {
				x1 = x1.replace(element, `<b>${element}</b>`);
			});

			return x1;
		});
	}

	function copyto(e) {
		const html = document.querySelector('.a11y-content').innerHTML;
		const type = 'text/plain';
		const blob = new Blob([html], { type });
		const data = new ClipboardItem({ [type]: blob });

		navigator.clipboard.write([data]).then(
			function () {
				
			},
			function (err) {
				console.warn('copy to clipboard error', err);
			}
		);

		const ic = document.querySelector('.icopied');
		ic.style = 'display:block;';

		setTimeout(
			() => {
				ic.style = '';
			},
			3000
		);
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('A11y_popup', slots, []);
		let { node } = $$props;
		const rect = node.getBoundingClientRect();
		const { x, y } = document.body.getBoundingClientRect();
		const { top: t, left: l, height: h } = rect;
		let top = -y + t + h + 3;
		let left = -x + l - 5;
		let { description, incomplete, criterion1, criterion2, helpUrl, impact, html, all, any, help, tags, grp, el } = node._axe_;
		all = reformat(all);
		any = reformat(any);
		let style;

		if (grp.match(/page-/)) {
			style = `top:${top}px;left:0;right:0;margin:auto;`;
		} else {
			style = `top:0;left:0;opacity:0;`;
		}

		setTimeout(() => {
			const popup = document.querySelector('.a11y-popup');
			const { width: popWidth, height: popHeight } = popup.getBoundingClientRect();
			const winHeight = window.innerHeight;
			const winYOffst = window.pageYOffset;

			if (top + popHeight > winHeight - winYOffst) {
				top -= popHeight + 30;
			}

			const winWidth = document.body.getBoundingClientRect().width;
			const winXOffst = window.pageXOffset;

			if (left + popWidth > winWidth - winXOffst) {
				left -= popWidth - 18;
			}

			if (node.style.position === 'fixed') {
				// if box in fixed position, popup too(and update top position)
				popup.style = `top:${top - winYOffst}px;left:${left}px;position:fixed;`;
			} else {
				if (grp.match(/page-/)) {
					popup.style = `top:${top}px;left:0;right:0;margin:auto;`;
				} else {
					popup.style = `top:${top}px;left:${left}px;`;
				}
			}
		});

		function ratio() {
			const { contrastRatio, expectedContrastRatio } = node._axe_.any[0].data;

			if (contrastRatio) {
				return `
      , contrast ratio: ${contrastRatio},
      expected: ${expectedContrastRatio}.`;
			} else {
				const { getColor, contrast } = window.mitm.fn;
				const ratio = contrast(...getColor(el));
				return `. Contrast ratio: ${ratio}.`;
			}
		}

		setTimeout(() => hljs.highlightAll());
		const writable_props = ['node'];

		Object_1$1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<A11y_popup> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('node' in $$props) $$invalidate(14, node = $$props.node);
		};

		$$self.$capture_state = () => ({
			node,
			rect,
			x,
			y,
			t,
			l,
			h,
			top,
			left,
			description,
			incomplete,
			criterion1,
			criterion2,
			helpUrl,
			impact,
			html,
			all,
			any,
			help,
			tags,
			grp,
			el,
			reformat,
			style,
			ratio,
			copyto
		});

		$$self.$inject_state = $$props => {
			if ('node' in $$props) $$invalidate(14, node = $$props.node);
			if ('top' in $$props) top = $$props.top;
			if ('left' in $$props) left = $$props.left;
			if ('description' in $$props) $$invalidate(3, description = $$props.description);
			if ('incomplete' in $$props) $$invalidate(4, incomplete = $$props.incomplete);
			if ('criterion1' in $$props) $$invalidate(5, criterion1 = $$props.criterion1);
			if ('criterion2' in $$props) $$invalidate(6, criterion2 = $$props.criterion2);
			if ('helpUrl' in $$props) $$invalidate(7, helpUrl = $$props.helpUrl);
			if ('impact' in $$props) $$invalidate(8, impact = $$props.impact);
			if ('html' in $$props) $$invalidate(9, html = $$props.html);
			if ('all' in $$props) $$invalidate(0, all = $$props.all);
			if ('any' in $$props) $$invalidate(1, any = $$props.any);
			if ('help' in $$props) $$invalidate(10, help = $$props.help);
			if ('tags' in $$props) $$invalidate(11, tags = $$props.tags);
			if ('grp' in $$props) $$invalidate(12, grp = $$props.grp);
			if ('el' in $$props) el = $$props.el;
			if ('style' in $$props) $$invalidate(2, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			all,
			any,
			style,
			description,
			incomplete,
			criterion1,
			criterion2,
			helpUrl,
			impact,
			html,
			help,
			tags,
			grp,
			ratio,
			node
		];
	}

	class A11y_popup extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { node: 14 }, null, [-1, -1]);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "A11y_popup",
				options,
				id: create_fragment$4.name
			});

			const { ctx } = this.$$;
			const props = options.props || {};

			if (/*node*/ ctx[14] === undefined && !('node' in props)) {
				console_1$2.warn("<A11y_popup> was created without expected prop 'node'");
			}
		}

		get node() {
			throw new Error("<A11y_popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set node(value) {
			throw new Error("<A11y_popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	var a11yPopup = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': A11y_popup
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(a11yPopup);

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

	var _cspDirective = {
	  cspArr,
	  cspInfo,
	  cspFetch,
	  cspEAttr,
	  policy,
	};

	/* ws-client/_svelte/csp-header.svelte generated by Svelte v3.49.0 */
	const file$3 = "ws-client/_svelte/csp-header.svelte";

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
			if (_cspDirective.cspInfo[/*id*/ ctx[2]].link) return create_if_block_2;
			return create_else_block$1;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let if_block1 = _cspDirective.cspInfo[/*id*/ ctx[2]].note && create_if_block_1$1(ctx);
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
				add_location(summary, file$3, 49, 15, 1385);
				add_location(details, file$3, 49, 6, 1376);
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

				if (_cspDirective.cspInfo[/*id*/ ctx[2]].note) if_block1.p(ctx, dirty);

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
		let t7_value = _cspDirective.cspInfo[/*id*/ ctx[2]].level + "";
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
				add_location(small, file$3, 53, 46, 1657);
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
		let t7_value = _cspDirective.cspInfo[/*id*/ ctx[2]].level + "";
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
				add_location(small, file$3, 51, 86, 1555);
				attr_dev(a, "target", "blank");
				attr_dev(a, "href", _cspDirective.cspInfo[/*id*/ ctx[2]].link);
				add_location(a, file$3, 51, 46, 1515);
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
		let raw_value = _cspDirective.cspInfo[/*id*/ ctx[2]].note + "";

		const block = {
			c: function create() {
				details = element("details");
				summary = element("summary");
				summary.textContent = "expand...";
				t1 = space();
				small = element("small");
				attr_dev(summary, "class", "svelte-ws3cmd");
				add_location(summary, file$3, 57, 32, 1787);
				add_location(small, file$3, 58, 12, 1828);
				attr_dev(details, "class", "note svelte-ws3cmd");
				add_location(details, file$3, 57, 10, 1765);
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
				add_location(div, file$3, 62, 10, 1955);
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
		let each_value = _cspDirective.cspArr;
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
				t2 = text("CSP on:\n    ");
				a0 = element("a");
				a0.textContent = "Mozilla";
				t4 = text(", \n    ");
				a1 = element("a");
				a1.textContent = "content-security-policy.com";
				t6 = text(",\n    ");
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
				add_location(b0, file$3, 39, 2, 925);
				attr_dev(a0, "target", "blank");
				attr_dev(a0, "href", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP");
				add_location(a0, file$3, 42, 4, 978);
				attr_dev(a1, "target", "blank");
				attr_dev(a1, "href", "https://content-security-policy.com/");
				add_location(a1, file$3, 43, 4, 1073);
				attr_dev(a2, "target", "blank");
				attr_dev(a2, "href", "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html");
				add_location(a2, file$3, 44, 4, 1170);
				add_location(p, file$3, 40, 2, 958);
				add_location(hr, file$3, 67, 4, 2051);
				add_location(b1, file$3, 68, 37, 2095);
				attr_dev(summary0, "class", "report svelte-ws3cmd");
				add_location(summary0, file$3, 68, 13, 2071);
				attr_dev(summary1, "class", "svelte-ws3cmd");
				add_location(summary1, file$3, 69, 28, 2151);
				add_location(small, file$3, 70, 8, 2188);
				attr_dev(details0, "class", "note svelte-ws3cmd");
				add_location(details0, file$3, 69, 6, 2129);
				attr_dev(div0, "class", "item svelte-ws3cmd");
				add_location(div0, file$3, 72, 6, 2420);
				add_location(details1, file$3, 68, 4, 2062);
				add_location(div1, file$3, 46, 2, 1312);
				attr_dev(div2, "class", "vbox");
				add_location(div2, file$3, 38, 0, 904);
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
					each_value = _cspDirective.cspArr;
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
		validate_slots('Csp_header', slots, []);
		let csp = window.mitm.info.csp;
		let reportTo = csp.reportTo;

		onMount(async () => {
			const fallback = true;
			const { policy } = csp['default-src'] || {};

			if (policy && policy.length > 0) {
				for (const id of _cspDirective.cspFetch) {
					if (!csp[id]) {
						$$invalidate(0, csp[id] = { policy, fallback }, csp);
					}
				}
			}

			for (const id of _cspDirective.cspEAttr) {
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
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Csp_header> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			onMount,
			cspArr: _cspDirective.cspArr,
			cspInfo: _cspDirective.cspInfo,
			cspFetch: _cspDirective.cspFetch,
			cspEAttr: _cspDirective.cspEAttr,
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

	class Csp_header extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Csp_header",
				options,
				id: create_fragment$3.name
			});
		}
	}

	var cspHeader = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': Csp_header
	});

	var require$$1 = /*@__PURE__*/getAugmentedNamespace(cspHeader);

	/* ws-client/_svelte/hotkeys.svelte generated by Svelte v3.49.0 */

	const { console: console_1$1 } = globals;
	const file$2 = "ws-client/_svelte/hotkeys.svelte";

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
				add_location(td0, file$2, 116, 8, 2865);
				attr_dev(td1, "class", "kcode svelte-1e9gn7l");
				attr_dev(td1, "data-id", td1_data_id_value = /*obj*/ ctx[4].id);
				add_location(td1, file$2, 117, 8, 2899);
				attr_dev(td2, "class", "title svelte-1e9gn7l");
				add_location(td2, file$2, 120, 8, 3003);
				attr_dev(tr, "class", "svelte-1e9gn7l");
				add_location(tr, file$2, 115, 6, 2852);
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

				add_location(b, file$2, 112, 2, 2792);
				attr_dev(table, "class", "svelte-1e9gn7l");
				add_location(table, file$2, 113, 2, 2811);
				attr_dev(div, "class", "vbox svelte-1e9gn7l");
				add_location(div, file$2, 111, 0, 2771);
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
		return k.split('').map(x => `${x}`).join(' ');
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

	var hotkeys = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': Hotkeys$1
	});

	var require$$2 = /*@__PURE__*/getAugmentedNamespace(hotkeys);

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

	/* ws-client/_svelte/json.svelte generated by Svelte v3.49.0 */

	const { Object: Object_1 } = globals;
	const file$1 = "ws-client/_svelte/json.svelte";

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
				add_location(summary, file$1, 12, 2, 265);
				attr_dev(pre, "class", pre_class_value = "sv-" + /*general*/ ctx[0].ext + " svelte-1hx80ts");
				add_location(pre, file$1, 13, 2, 307);
				attr_dev(details, "class", details_class_value = "sv-data sv-" + /*key*/ ctx[3] + " st" + Math.trunc(/*general*/ ctx[0].status / 100) + "x" + " svelte-1hx80ts");
				add_location(details, file$1, 11, 0, 192);
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
				add_location(div, file$1, 9, 0, 152);
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

	/* ws-client/_svelte/sqlite.svelte generated by Svelte v3.49.0 */

	const { console: console_1 } = globals;
	const file = "ws-client/_svelte/sqlite.svelte";

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
				add_location(pre, file, 119, 14, 4110);
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
				add_location(span0, file, 106, 12, 3381);
				attr_dev(span1, "class", span1_class_value = "sv-" + /*i2*/ ctx[14].meta.general.method + " svelte-wtlyn9");
				add_location(span1, file, 107, 12, 3465);
				attr_dev(span2, "class", span2_class_value = "sv-" + (/*path*/ ctx[3] ? 'path' : 'fullpath') + " svelte-wtlyn9");
				add_location(span2, file, 108, 12, 3563);
				attr_dev(summary0, "data-id", summary0_data_id_value = /*i2*/ ctx[14].id);
				attr_dev(summary0, "data-ss", summary0_data_ss_value = /*item*/ ctx[11].session);
				attr_dev(summary0, "class", summary0_class_value = "sv-title st" + Math.trunc(/*i2*/ ctx[14].meta.general.status / 100) + "x" + " svelte-wtlyn9");
				add_location(summary0, file, 101, 10, 3198);
				attr_dev(summary1, "class", "sv-title sv-header svelte-wtlyn9");
				add_location(summary1, file, 111, 12, 3721);
				attr_dev(details0, "class", "sv-row-data sv-header svelte-wtlyn9");
				add_location(details0, file, 110, 10, 3669);
				attr_dev(summary2, "class", "sv-title sv-content svelte-wtlyn9");
				add_location(summary2, file, 115, 12, 3910);
				attr_dev(details1, "class", details1_class_value = "sv-row-data sv-content " + err_method(/*i2*/ ctx[14]) + " svelte-wtlyn9");
				add_location(details1, file, 114, 10, 3840);
				attr_dev(details2, "class", "sv-rows svelte-wtlyn9");
				add_location(details2, file, 100, 8, 3162);
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
				add_location(span, file, 96, 20, 3023);
				attr_dev(summary, "class", "sv-main svelte-wtlyn9");
				add_location(summary, file, 95, 4, 2979);
				attr_dev(details, "class", "sv-session svelte-wtlyn9");
				attr_dev(details, "data-ss", details_data_ss_value = /*item*/ ctx[11].session);
				add_location(details, file, 94, 2, 2902);
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

				add_location(b, file, 83, 0, 2568);
				attr_dev(input0, "type", "checkbox");
				attr_dev(input0, "id", "sv-body");
				attr_dev(input0, "class", "svelte-wtlyn9");
				add_location(input0, file, 85, 2, 2610);
				attr_dev(label0, "for", "sv-body");
				add_location(label0, file, 84, 0, 2588);
				attr_dev(input1, "type", "checkbox");
				attr_dev(input1, "id", "sv-no-host");
				attr_dev(input1, "class", "svelte-wtlyn9");
				add_location(input1, file, 88, 2, 2707);
				attr_dev(label1, "for", "sv-no-host");
				add_location(label1, file, 87, 0, 2682);
				attr_dev(input2, "type", "checkbox");
				attr_dev(input2, "id", "sv-query");
				attr_dev(input2, "class", "svelte-wtlyn9");
				add_location(input2, file, 91, 2, 2804);
				attr_dev(label2, "for", "sv-query");
				add_location(label2, file, 90, 0, 2781);
				add_location(div, file, 82, 0, 2562);
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

	var require$$3 = /*@__PURE__*/getAugmentedNamespace(sqlite);

	// feat: svelte related
	const {default: A11yPopup} = require$$0;
	const {default: Cspheader} = require$$1;
	const {default: Hotkeys}   = require$$2;
	const {default: Sqlite}    = require$$3;
	var _svelte = {
	  A11yPopup,
	  Cspheader,
	  Hotkeys,
	  Sqlite
	};

	/* eslint-disable camelcase */

	const _ws_postmessage = _ws_postmessage$1;
	const _ws_initSocket = _ws_initSocket$1;
	const _ws_screenshot = _ws_screenshot$1;
	const _ws_location = _ws_location$1;
	const _ws_observer = _ws_observer$1;
	const _ws_general = _ws_general$1;
	const _ws_cspErr = _ws_cspErr$1;
	const _ws_macros = _ws_macros$1;
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
	window.mitm.svelte = _svelte;

	return wsClient;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfY2xpZW50L193c19wb3N0bWVzc2FnZS5qcyIsIl9jbGllbnQvX3dzX2NsaWVudC5qcyIsIl9jbGllbnQvX3dzX21zZy1wYXJzZXIuanMiLCJfY2xpZW50L193c19pbi1pZnJhbWUuanMiLCJfY2xpZW50L193c192ZW5kb3IuanMiLCJfY2xpZW50L193c19pbml0LXNvY2tldC5qcyIsIl9jbGllbnQvX3NjcmVlbnNob3QuanMiLCJfY2xpZW50L193c19uYW1lc3BhY2UuanMiLCJfY2xpZW50L193c19zY3JlZW5zaG90LmpzIiwiX2NsaWVudC9fd3NfbG9jYXRpb24vY2hhci5qcyIsIl9jbGllbnQvX3dzX2xvY2F0aW9uL3BsYXkuanMiLCJfY2xpZW50L193c19sb2NhdGlvbi9jc3MuanMiLCJfY2xpZW50L193c19sb2NhdGlvbi9idXR0b25zLmpzIiwiX2NsaWVudC9fd3NfbG9jYXRpb24vaG90a2V5cy5qcyIsIl9jbGllbnQvX3dzX2xvY2F0aW9uL2luZGV4LmpzIiwiX2NsaWVudC9fd3NfZGVib3VuY2UuanMiLCJfY2xpZW50L193c19yb3V0ZS5qcyIsIl9jbGllbnQvX3dzX29ic2VydmVyLmpzIiwiX2NsaWVudC9fd3NfZ2VuZXJhbC5qcyIsIl9jbGllbnQvX3dzX2NzcC1lcnIuanMiLCJfY2xpZW50L193c19tYWNyb3MuanMiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIl9zdmVsdGUvYTExeS1wb3B1cC5zdmVsdGUiLCJfc3ZlbHRlL19jc3AtZGlyZWN0aXZlLmpzIiwiX3N2ZWx0ZS9jc3AtaGVhZGVyLnN2ZWx0ZSIsIl9zdmVsdGUvaG90a2V5cy5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvanNvbi1zdHJpbmdpZnktcHJldHR5LWNvbXBhY3QvaW5kZXguanMiLCJfc3ZlbHRlL2pzb24uc3ZlbHRlIiwiX3N2ZWx0ZS9zcWxpdGUuc3ZlbHRlIiwiX3N2ZWx0ZS9pbmRleC5qcyIsIl9jbGllbnQvd3MtY2xpZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlIChldmVudCkge1xuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxuICAgIH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcbn1cbiIsImNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgbGV0IHdpbmRvd1JlZlxuICByZXR1cm4ge1xuICAgIC8vIGV4OiB3c19faGVscCgpXG4gICAgX2hlbHAgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19waW5nKFwidGhlcmVcIilcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgfSxcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9ICdkaXJlY3Rvcmllcz0wLHRpdGxlYmFyPTAsdG9vbGJhcj0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wLHdpZHRoPTgwMCxoZWlnaHQ9NjAwJ1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxuICAgICAgd2luZG93UmVmLmJsdXIoKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnN0IHsgcSwgY3NzIH0gPSBkYXRhXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcbiAgICAgIClcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fXG4gICAgX3NhdmVUYWdzICh7IHJvdXRlcywgX190YWcxLCBfX3RhZzIsIF9fdGFnMywgX2lkIH0pIHtcbiAgICAgIGlmICghbG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IFVwZGF0ZSByb3V0ZXMnLCBfYylcbiAgICAgICAgd2luZG93Lm1pdG0ucm91dGVzID0gcm91dGVzXG4gICAgICAgIHdpbmRvdy5taXRtLl9fdGFnMSA9IF9fdGFnMSAvLyMgX190YWcxIGluLXN5bmNcbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJ1biBhcyB1cmxDaGFuZ2UhXG4gICAgICAgICAqL1xuICAgICAgICB3aW5kb3cubWl0bS5mbi51cmxDaGFuZ2UoKVxuICAgICAgfSBlbHNlIGlmIChfaWQhPT13aW5kb3cuX3dzX2lkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBVcGRhdGUgcm91dGVzJywgX2MpXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xuICAgICAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBfX3RhZzEgLy8jIF9fdGFnMSBpbi1zeW5jXG4gICAgICAgIHdpbmRvdy5taXRtLl9fdGFnMiA9IF9fdGFnMiAvLyMgX190YWcyIGluLXN5bmNcbiAgICAgICAgd2luZG93Lm1pdG0uX190YWczID0gX190YWczIC8vIyBfX3RhZzMgaW4tc3luY1xuICAgICAgICB3aW5kb3cubWl0bS5mbi5icm9hZGNhc3RFdmVudCgpXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBleDogd3NfX1xuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cbiAgICAgIGNvbnNvbGUud2FybihgcmVjZWl2ZSBicm9kY2FzdCAke3R5cH1gKVxuICAgICAgLyoqXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcbiAgICAgICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAgICAgKi9cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgY29uc29sZS53YXJuKGZpbGVzW2Ake3R5cH1fZXZlbnRzYF1ba2V5XSArICcnKVxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcbiAgICAgIH1cbiAgICB9LFxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxuICAgIH1cbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnPy5pbmNsdWRlcygnVycpKSB7XG4gICAgaWYgKG1zZy5sZW5ndGggPiA0MCkge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKVxuICAgIH1cbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pXG4gIGlmIChhcnIpIHtcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgaWZybVxuICB0cnkge1xuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxuICB9IGNhdGNoIChlKSB7XG4gICAgaWZybSA9IHRydWVcbiAgfVxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IHZlbmRvciB9ID0gbmF2aWdhdG9yXG4gIGNvbnN0IGJyb3dzZXIgPSB7XG4gICAgJyc6ICdmaXJlZm94JyxcbiAgICAnR29vZ2xlIEluYy4nOiAnY2hyb21pdW0nLFxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXG4gIH1bdmVuZG9yXVxuICByZXR1cm4gYnJvd3NlclxufVxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fVxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXG4gIGNvbnN0IHtfX2FyZ3MsIF9fZmxhZ30gPSB3aW5kb3cubWl0bVxuXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxuICB9XG5cbiAgY29uc3Qgb25vcGVuID0gZGF0YSA9PiB7XG4gICAgZnVuY3Rpb24gd3Nfc2VuZCgpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xuICAgICAgICBjb25zdCBmbiA9IHdpbmRvdy5fd3NfY29ubmVjdFtrZXldXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxuICAgICAgICBmbihkYXRhKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxuICAgIH1cblxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxuICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gdHJ1ZVxuXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXG4gICAgICAgIHdzX3NlbmQoKVxuICAgICAgfVxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXG4gIH1cblxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IGNsb3NlIGNvbm5lY3Rpb24nLCBfYylcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChfX2ZsYWdbJ29uLW1lc3NhZ2UnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9uLW1lc3NhZ2U6JywgX2MsIGUuZGF0YSlcbiAgICB9XG4gICAgX3dzX21zZ1BhcnNlcihlLCBlLmRhdGEpXG4gIH1cbiAgXG4gIGNvbnN0IGNvbm5lY3QgPSBfX2FyZ3Mubm9zb2NrZXQ9PT11bmRlZmluZWRcbiAgaWYgKGNvbm5lY3QgfHwgKHdpbmRvdy5jaHJvbWUgJiYgY2hyb21lLnRhYnMpKSB7XG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcbiAgICBjb25zdCBwcmUgPSB2ZW5kb3IgPyAnd3MnIDogJ3dzcydcbiAgICBjb25zdCBwcnQgPSB2ZW5kb3IgPyAnMzAwMicgOiAnMzAwNSdcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcbiAgICBsZXQgd3NcbiAgICB0cnkge1xuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICAgIGNvbnNvbGUudGltZSgnd3MnKVxuICAgIHdpbmRvdy5fd3MgPSB3c1xuICBcbiAgICB3cy5vbm9wZW4gPSBvbm9wZW5cbiAgICB3cy5vbmNsb3NlID0gb25jbG9zZVxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXG4gIH1cbiAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXG4gIH1cbn1cbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShqc29uKVxuICAgICAgICB9XG4gICAgICAgIGZldGNoKCcvbWl0bS1wbGF5L3NjcmVuc2hvdC5qc29uJywgY29uZmlnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXNvbHZlKHJlc3BvbnNlLmpzb24oKSl9KVxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBqc29uLCByZXNvbHZlKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pICBcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICBsZXQgbmFtZXNwYWNlXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcbiAgICBpZiAoaG9zdC5tYXRjaCh0b1JlZ2V4KGtleS5yZXBsYWNlKC9+L2csICdbXi5dKicpKSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hbWVzcGFjZVxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBtaXRtICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF9zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmxldCBhY3RcbmZ1bmN0aW9uIHNjcmVlbnNob3QgKGUpIHtcbiAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XG4gICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gdW5kZWZpbmVkXG4gICAgICBjb25zb2xlLmxvZygnPj4+IGRlbGF5IGFjdGlvbicpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGFjdCkge1xuICAgICAgYWN0ID0gdW5kZWZpbmVkXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXG4gIGNvbnN0IHsgc2VsZWN0b3IgfSA9IHJvdXRlLnNjcmVlbnNob3RcblxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gIGNvbnN0IGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy9nLCAnficpXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcbiAgZm9yIChjb25zdCBlbCBvZiBhcnIpIHtcbiAgICBsZXQgbm9kZSA9IGUudGFyZ2V0XG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuICAgIH1cbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBicm93c2VyIH1cbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXG4gICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXG4gICAgICBpZiAobWl0bS5hcmd2LmxhenljbGljaykge1xuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgbWl0bS5sYXN0RXZlbnQgPSBlXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcbiAgICAgICAgICBpZiAoYWN0Py5jbGljaykge1xuICAgICAgICAgICAgYWN0LmNsaWNrKClcbiAgICAgICAgICAgIGFjdCA9IHVuZGVmaW5lZFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWNXczogZGVsYXkgYWN0aW9uIHVuZGVmaW5lZCcsIF9jKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGRlbGF5KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWl0bS5sYXN0RXZlbnQgPSBlXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRjbGljayhlKSB7XG4gIG1pdG0ubGFzdEV2ZW50ID0gZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbX3dzX25hbWVzcGFjZSgpXVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpXG4gICAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzY3JlZW5zaG90KVxuICAgIH0gZWxzZSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnRjbGljaylcbiAgICB9XG4gIH0pXG59XG4iLCJjb25zdCBrY29kZTEgPSB7XG4gIEJhY2txdW90ZSAgIDogJ2AnLFxuICBCcmFja2V0TGVmdCA6ICdbJyxcbiAgQnJhY2tldFJpZ2h0OiAnXScsXG4gIEJhY2tzbGFzaDogJ1xcXFwnLFxuICBDb21tYSAgICA6ICcsJyxcbiAgUGVyaW9kICAgOiAnLicsXG4gIFF1b3RlICAgIDogXCInXCIsXG4gIFNlbWljb2xvbjogJzsnLFxuICBTbGFzaCAgICA6ICcvJyxcbiAgU3BhY2UgICAgOiAnICcsXG4gIE1pbnVzICAgIDogJy0nLFxuICBFcXVhbCAgICA6ICc9Jyxcbn1cblxuY29uc3Qga2NvZGUyID0ge1xuICBCYWNrcXVvdGUgICA6ICd+JyxcbiAgQnJhY2tldExlZnQgOiAneycsXG4gIEJyYWNrZXRSaWdodDogJ30nLFxuICBCYWNrc2xhc2g6ICd8JyxcbiAgQ29tbWEgICAgOiAnPCcsXG4gIFBlcmlvZCAgIDogJz4nLFxuICBRdW90ZSAgICA6ICdcIicsXG4gIFNlbWljb2xvbjogJzonLFxuICBTbGFzaCAgICA6ICc/JyxcbiAgU3BhY2UgICAgOiAnICcsXG4gIE1pbnVzICAgIDogJ18nLFxuICBFcXVhbCAgICA6ICcrJyxcbn1cblxuY29uc3Qga2NvZGUzID0ge1xuICAxOiAnIScsXG4gIDI6ICdAJyxcbiAgMzogJyMnLFxuICA0OiAnJCcsXG4gIDU6ICclJyxcbiAgNjogJ14nLFxuICA3OiAnJicsXG4gIDg6ICcqJyxcbiAgOTogJygnLFxuICAxMDogJyknXG59XG5cbmNvbnN0IGtzaG93ID0ge1xuICAuLi5rY29kZTEsXG4gIEVudGVyOiAnRW50ZXInLFxuICBDYXBzTG9jazogJ0NhcHMnLFxuICBCYWNrc3BhY2U6ICdCUycsXG4gIEVzY2FwZTogJ0VzYycsXG4gIERpZ2l0MTogJzEnLFxuICBEaWdpdDI6ICcyJyxcbiAgRGlnaXQzOiAnMycsXG4gIERpZ2l0NDogJzQnLFxuICBEaWdpdDU6ICc1JyxcbiAgRGlnaXQ2OiAnNicsXG4gIERpZ2l0NzogJzcnLFxuICBEaWdpdDg6ICc4JyxcbiAgRGlnaXQ5OiAnOScsXG4gIERpZ2l0MDogJzAnLFxuICBUYWI6ICdUYWInLFxuICBLZXlBOiAnYScsXG4gIEtleUI6ICdiJyxcbiAgS2V5QzogJ2MnLFxuICBLZXlEOiAnZCcsXG4gIEtleUU6ICdlJyxcbiAgS2V5RjogJ2YnLFxuICBLZXlHOiAnZycsXG4gIEtleUg6ICdoJyxcbiAgS2V5STogJ2knLFxuICBLZXlKOiAnaicsXG4gIEtleUs6ICdrJyxcbiAgS2V5TDogJ2wnLFxuICBLZXlNOiAnbScsXG4gIEtleU46ICduJyxcbiAgS2V5TzogJ28nLFxuICBLZXlQOiAncCcsXG4gIEtleVE6ICdxJyxcbiAgS2V5UjogJ3InLFxuICBLZXlTOiAncycsXG4gIEtleVQ6ICd0JyxcbiAgS2V5VTogJ3UnLFxuICBLZXlWOiAndicsXG4gIEtleVc6ICd3JyxcbiAgS2V5WDogJ3gnLFxuICBLZXlZOiAneScsXG4gIEtleVo6ICd6JyxcbiAgRjE6ICAnRjEnLFxuICBGMjogICdGMicsXG4gIEYzOiAgJ0YzJyxcbiAgRjQ6ICAnRjQnLFxuICBGNTogICdGNScsXG4gIEY2OiAgJ0Y2JyxcbiAgRjc6ICAnRjcnLFxuICBGODogICdGOCcsXG4gIEY5OiAgJ0Y5JyxcbiAgRjEwOiAnRjEwJyxcbiAgRjExOiAnRjExJyxcbiAgRjEyOiAnRjEyJyxcbiAgRW5kOiAnRW5kJyxcbiAgSG9tZTogJ0hvbWUnLFxuICBBcnJvd1VwOiAgICAn4oaRJyxcbiAgQXJyb3dEb3duOiAgJ+KGkycsXG4gIEFycm93TGVmdDogICfihpAnLFxuICBBcnJvd1JpZ2h0OiAn4oaSJyxcbiAgRGVsZXRlOiAgICdEZWwnLFxuICBQYWdlVXA6ICAgJ1BnVXAnLFxuICBQYWdlRG93bjogJ1BnRG4nLFxufVxuXG5mdW5jdGlvbiBjb2RlVG9DaGFyKGV2biwgb3B0PXtjb2RlT25seTpmYWxzZX0pIHtcbiAgY29uc3Qge2NvZGUsIHNoaWZ0S2V5fSA9IGV2blxuICBjb25zdCB7Y29kZU9ubHl9ID0gb3B0XG4gIGxldCBtYXRjaFxuICBsZXQgY2hhciA9ICcnXG4gIG1hdGNoID0gY29kZS5tYXRjaCgvS2V5KC4pLylcbiAgaWYgKG1hdGNoKSB7XG4gICAgY2hhciA9IG1hdGNoLnBvcCgpXG4gICAgaWYgKCFjb2RlT25seSAmJiAhc2hpZnRLZXkpIHtcbiAgICAgIGNoYXIgPSBjaGFyLnRvTG93ZXJDYXNlKClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbWF0Y2ggPSBjb2RlLm1hdGNoKC8oRGlnaXR8TnVtcGFkKSguKS8pXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBjaGFyID0gbWF0Y2gucG9wKClcbiAgICAgIGlmICghY29kZU9ubHkgJiYgc2hpZnRLZXkpIHtcbiAgICAgICAgY2hhciA9IGtjb2RlM1tjaGFyXVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWNvZGVPbmx5ICYmIHNoaWZ0S2V5KSB7XG4gICAgICAgIGNoYXIgPSBrY29kZTJbY29kZV1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYXIgPSBrY29kZTFbY29kZV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYXJcbn1cblxuZnVuY3Rpb24gY29kZVRvU2hvdyhjb2Rlcykge1xuICByZXR1cm4gY29kZXMuc3BsaXQoJzonKS5tYXAoeD0+e1xuICAgIHJldHVybiBgJHtrc2hvd1t4XX1gXG4gIH0pLmpvaW4oJ+KcpycpXG59XG5cbndpbmRvdy5taXRtLmZuLmNvZGVUb0NoYXIgPSBjb2RlVG9DaGFyXG53aW5kb3cubWl0bS5mbi5jb2RlVG9TaG93ID0gY29kZVRvU2hvd1xubW9kdWxlLmV4cG9ydHMgPSBjb2RlVG9DaGFyIiwiY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4uL193c192ZW5kb3InKVxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmZ1bmN0aW9uIF9wb3N0KGpzb24pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcbiAgICAgIH1cbiAgICAgIGZldGNoKCcvbWl0bS1wbGF5L3BsYXkuanNvbicsIGNvbmZpZylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXG4gICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBfcGxheShqc29uKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIGpzb24sIHJlc29sdmUpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9XG4gIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgaWYgKGF1dG9maWxsKSB7XG4gICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcbiAgICB9XG4gICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxuICAgIGNvbnN0IGxlbnRoID0gYXV0b2ZpbGwubGVuZ3RoXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxuICAgIGNvbnN0IF9qc29uID0ge2F1dG9maWxsLCBicm93c2VyLCBfcGFnZSwgX2ZyYW1lfVxuICAgIGNvbnN0IG1zZyA9IGxlbnRoID09PSAxID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpXG4gICAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAke21zZ31gLCBfYylcbiAgICBsZXQgcmVzdWx0XG4gICAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgX3Bvc3QoX2pzb24pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IF9wbGF5KF9qc29uKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuZnVuY3Rpb24gc3FsaXRlKCkge1xuICBjb25zdCBbY21kLCBxLCB0YmxdID0gYXJndW1lbnRzXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IHtxfVxuICAgICAgaWYgKHRibCkge1xuICAgICAgICBkYXRhLnRibCA9IHRibFxuICAgICAgfVxuICAgICAgd2luZG93LndzX19zZW5kKGNtZCwgZGF0YSwgcmVzb2x2ZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKVxuICAgIH1cbiAgfSlcbn1cblxud2luZG93Lm1pdG0uZm4uc3FsTGlzdCA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsTGlzdCcsIHEsIHRibClcbndpbmRvdy5taXRtLmZuLnNxbERlbCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbERlbCcgLCBxLCB0YmwpXG53aW5kb3cubWl0bS5mbi5zcWxJbnMgID0gKHEsIHRibCkgPT4gc3FsaXRlKCdzcWxJbnMnICwgcSwgdGJsKVxud2luZG93Lm1pdG0uZm4uc3FsVXBkICA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsVXBkJyAsIHEsIHRibClcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5XG4iLCJjb25zdCBzdHlsZSA9IGBcbi5taXRtLWFwcCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTsgIFxufVxuLm1pdG0tY29udGFpbmVyIHtcbiAgei1pbmRleDogOTk5OTk7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBsaW5lLWhlaWdodDogMTRweDtcbn1cbi5taXRtLWNvbnRhaW5lci50b3ByICB7dG9wOiAgMHB4OyByaWdodDogM3B4O31cbi5taXRtLWNvbnRhaW5lci5sZWZ0ICB7dG9wOiAtMnB4OyBsZWZ0IDogM3B4O31cbi5taXRtLWNvbnRhaW5lci5yaWdodCB7dG9wOiAxNHB4OyByaWdodDogM3B4O31cbi5taXRtLWNvbnRhaW5lci5jZW50ZXIge1xuICBiYWNrZ3JvdW5kOiAjZmNmZmRjYjA7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgLyogY2VudGVyIHRoZSBlbGVtZW50ICovXG4gIHJpZ2h0OiAwO1xuICBsZWZ0OiAwO1xuICB0b3A6IDIwcHg7XG4gIG1hcmdpbi1yaWdodDogYXV0bztcbiAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gIC8qIGdpdmUgaXQgZGltZW5zaW9ucyAqL1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA1MHB4KTtcbiAgcGFkZGluZzogNXB4IDEwcHg7XG4gIG92ZXJmbG93OiBhdXRvO1xuICB3aWR0aDogOTAlO1xuICBkaXNwbGF5OiBub25lO1xufVxuLm1pdG0tYnRuIHtcbiAgY29sb3I6IGJsYWNrO1xuICBib3JkZXI6IG5vbmU7XG4gIGZvbnQtc2l6ZTogOHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDFweCA2cHg7XG4gIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgZm9udC1mYW1pbHk6IG1vbmFjbywgQ29uc29sYXMsIFwiTHVjaWRhIENvbnNvbGVcIiwgbW9ub3NwYWNlO1xufVxuLm1pdG0tYnRuOmhvdmVye1xuICB0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO1xufVxuLm1pdG0tYnRuLmxlZnQsXG4ubWl0bS1idG4ucmlnaHQge1xuICBkaXNwbGF5OiBibG9jaztcbn1cbi5taXRtLWJ0bi5yaWdodCB7XG4gIGZsb2F0OiByaWdodDtcbiAgbWFyZ2luLXRvcDogMnB4O1xufVxuLmJncm91cC1sZWZ0LFxuLmJncm91cC1yaWdodCB7XG4gIGRpc3BsYXk6IHRhYmxlO1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4uYmdyb3VwLWxlZnQyIHtcbiAgZGlzcGxheTogdGFibGU7XG4gIG1hcmdpbi10b3A6IDA7XG59XG4uYmdyb3VwLWxlZnQ+ZGl2LFxuLmJncm91cC1sZWZ0Mj5kaXYsXG4uYmdyb3VwLXJpZ2h0PmRpdiB7XG4gIHBhZGRpbmctYm90dG9tOiAycHg7XG59XG4uYmdyb3VwLXRvcHIsXG4uYmdyb3VwLXRvcHIgc3BhbiB7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1gXG5tb2R1bGUuZXhwb3J0cyA9IHN0eWxlXG4iLCJjb25zdCBwbGF5ID0gcmVxdWlyZSgnLi9wbGF5JylcblxubW9kdWxlLmV4cG9ydHMgPSBiZ3JvdXAgPT4ge1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3MpIHtcblxuICAgIGZvciAoY29uc3QgaWQgaW4gYnV0dG9ucykge1xuICAgICAgY29uc3QgW2NhcHRpb24sIGNvbG9yLCBrbGFzXSA9IGlkLnNwbGl0KCd8JykubWFwKHg9PngudHJpbSgpKVxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICAgIGNvbnN0IGZuICA9IGJ1dHRvbnNbaWRdXG5cbiAgICAgIGJ0bi5vbmNsaWNrID0gYXN5bmMgZSA9PiB7XG4gICAgICAgIGxldCBhcnIgPSBmbihlKVxuICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgIGFyciA9IGF3YWl0IGFyclxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgICAgICBhd2FpdCBwbGF5KGFycilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBidG4uaW5uZXJUZXh0ID0gY2FwdGlvblxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoJ21pdG0tYnRuJylcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGAke3Bvc31gKVxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoa2xhcyB8fCBjYXB0aW9uKVxuICAgICAgYnRuLnN0eWxlID0gY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnXG5cbiAgICAgIGlmIChwb3M9PT0ndG9wcicpIHtcbiAgICAgICAgY29uc3QgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgICAgYnIuaW5uZXJIVE1MID0gJyZuYnNwOydcbiAgICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoYnIpXG4gICAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJ0bilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgIGRpdi5hcHBlbmRDaGlsZChidG4pXG4gICAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGRpdilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHNldEJ1dHRvbnMgKGJ1dHRvbnMsIHBvc2l0aW9uKSB7XG5cbiAgICBpZiAoYmdyb3VwW3Bvc2l0aW9uXSkge1xuICAgICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xuICAgICAgY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvc2l0aW9uKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZXRCdXR0b25zICBcbn1cbiIsImZ1bmN0aW9uIGRlZmF1bHRIb3RLZXlzKCkge1xuICBjb25zdCB7bWl0bToge3N2ZWx0ZToge0NzcGhlYWRlciwgU3FsaXRlfSwgYXJndiwgZm59fSA9IHdpbmRvd1xuICBjb25zdCBxcnkgID0gJy5taXRtLWNvbnRhaW5lci5wb3B1cCcgXG4gIGNvbnN0IHdjYWcyID0gW1xuICAgICd3Y2FnMmEnLFxuICAgICd3Y2FnMmFhJyxcbiAgICAnd2NhZzIxYScsXG4gICAgJ3djYWcyMWFhJyxcbiAgXVxuICBjb25zdCB3Y2FnMyA9IFtcbiAgICAvLyAuLi53Y2FnMixcbiAgICAnd2NhZzJhYWEnLFxuICAgICd3Y2FnMjFhYWEnLFxuICAgICdiZXN0LXByYWN0aWNlJyxcbiAgXVxuICBjb25zdCBydWxlc09iaiA9IHtcbiAgICAnY29sb3ItY29udHJhc3QnOiB7IGVuYWJsZWQ6IHRydWUgfSxcbiAgfVxuXG4gIGxldCBrZXlzID0ge1xuICAgICdjb2RlOktleVAnKF9lKSB7Zm4uc3ZlbHRlKENzcGhlYWRlciwgJ0xpZ2h0UGFzdGVsR3JlZW4nKX0sXG4gICAgJ2NvZGU6S2V5UScoX2UpIHtmbi5zdmVsdGUoU3FsaXRlICAgLCAnTGlnaHRQYXN0ZWxHcmVlbicpfSxcbiAgfVxuICBrZXlzWydjb2RlOktleVAnXS5fdGl0bGUgPSAnU2hvdyBDU1AgSGVhZGVyJ1xuICBrZXlzWydjb2RlOktleVEnXS5fdGl0bGUgPSAnU2hvdyBTcWxpdGUnXG5cbiAgaWYgKGFyZ3YuYTExeSAmJiBmbi5heGVydW4pIHtcbiAgICBrZXlzID0ge1xuICAgICAgLi4ua2V5cyxcbiAgICAgICdrZXk6eXl5JyhfZSkge2ZuLmF4ZXJ1bih3Y2FnMywgcnVsZXNPYmogICAgICAgICAgICAgICl9LFxuICAgICAgJ2tleTp5eScgKF9lKSB7Zm4uYXhlcnVuKHdjYWcyICAgICAgICAgICAgICAgICAgICAgICAgKX0sXG4gICAgICAna2V5OnknICAoX2UpIHtmbi5heGVydW4oICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfSxcbiAgICAgICdrZXk6YycgIChfZSkge2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXJ5KS5pbm5lclRleHQ9Jyd9LFxuICAgIH1cbiAgICBrZXlzWydrZXk6eXl5J10uX3RpdGxlID0gJ0V4ZWMuIGExMXkgc3RyaWN0J1xuICAgIGtleXNbJ2tleTp5eScgXS5fdGl0bGUgPSAnRXhlYy4gYTExeSB3Y2FnOmFhJ1xuICAgIGtleXNbJ2tleTp5JyAgXS5fdGl0bGUgPSAnRXhlYy4gYTExeSBkZWZhdWx0J1xuICAgIGtleXNbJ2tleTpjJyAgXS5fdGl0bGUgPSAnQ2xlYXIgYTExeSByZXN1bHQnXG4gIH1cbiAgcmV0dXJuIGtleXNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0SG90S2V5c1xuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfdmVuZG9yICAgID0gcmVxdWlyZSgnLi4vX3dzX3ZlbmRvcicgICApXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi4vX3dzX25hbWVzcGFjZScpXG5jb25zdCBfa2V5ICAgICAgICAgID0gcmVxdWlyZSgnLi9jaGFyJyAgICAgICAgICApXG5jb25zdCBwbGF5ICAgICAgICAgID0gcmVxdWlyZSgnLi9wbGF5JyAgICAgICAgICApXG5jb25zdCBzdHlsZSAgICAgICAgID0gcmVxdWlyZSgnLi9jc3MnICAgICAgICAgICApXG5cbmNvbnN0IGJncm91cCA9IHtcbiAgcmlnaHQ6IHt9LFxuICB0b3ByOiB7fSxcbiAgbGVmdDoge30sXG59XG5cbmNvbnN0IHNldEJ1dHRvbnMgPSByZXF1aXJlKCcuL2J1dHRvbnMnKShiZ3JvdXApXG5jb25zdCBkZWZhdWx0SG90S2V5cyA9IHJlcXVpcmUoJy4vaG90a2V5cycpXG5cbmxldCBjb250YWluZXIgPSB7XG4gIHRvcHI6IHt9LFxuICBsZWZ0OiB7fSxcbiAgcmlnaHQ6IHt9LFxuICB0YXJnZXQ6IHt9LFxufVxubGV0IGJ1dHRvbiA9IHt9XG5cbmZ1bmN0aW9uIHdhaXQobXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXG59XG5cbmZ1bmN0aW9uIHRvUmVnZXggKHBhdGhNc2cpIHtcbiAgbGV0IFtwYXRoLCBtc2ddID0gcGF0aE1zZy5zcGxpdCgnPT4nKS5tYXAoaXRlbSA9PiBpdGVtLnRyaW0oKSlcbiAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKVxuICByZXR1cm4geyBwYXRoLCBtc2cgfVxufVxuXG5sZXQgZGVidW5rXG5sZXQgaW50ZXJ2SWRcbmxldCBvbmNlcyA9IHt9IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxuXG5hc3luYyBmdW5jdGlvbiB1cmxDaGFuZ2UgKGV2ZW50KSB7XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCB7bWl0bX0gPSB3aW5kb3dcbiAgY29uc3Qge2ZufSAgID0gbWl0bVxuICBcbiAgaWYgKG1pdG0uYXJndi5hMTF5ICYmIGZuLmF4ZXJ1bikge1xuICAgIGZuLmF4ZXJ1bigpXG4gIH1cblxuICBjbGVhckludGVydmFsKGludGVydklkKVxuICBpZiAobWl0bS5hdXRvaW50ZXJ2YWwpIHtkZWxldGUgbWl0bS5hdXRvaW50ZXJ2YWx9XG4gIGlmIChtaXRtLmF1dG9maWxsKSAgICAge2RlbGV0ZSBtaXRtLmF1dG9maWxsICAgIH1cbiAgaWYgKG1pdG0uYXV0b2J1dHRvbnMpICB7ZGVsZXRlIG1pdG0uYXV0b2J1dHRvbnMgfVxuICBpZiAobWl0bS5sZWZ0YnV0dG9ucykgIHtkZWxldGUgbWl0bS5sZWZ0YnV0dG9ucyB9XG4gIGlmIChtaXRtLnJpZ2h0YnV0dG9ucykge2RlbGV0ZSBtaXRtLnJpZ2h0YnV0dG9uc31cbiAgaWYgKCFtaXRtLm1hY3Jva2V5cykgICB7XG4gICAgbWl0bS5tYWNyb2tleXMgPSBkZWZhdWx0SG90S2V5cygpICAgICBcbiAgfVxuXG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBjb25zdCB7aHJlZiwgb3JpZ2lufSA9IGxvY2F0aW9uXG4gICAgY29uc3QgX2hyZWYgPSBocmVmLnJlcGxhY2Uob3JpZ2luLCAnJylcbiAgICBvYnNlcnZlcmZuID0gW11cbiAgICBsZXQgbm9uZSA9IHRydWVcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBtaXRtLm1hY3Jvcykge1xuICAgICAgY29uc3QgeyBwYXRoLCBtc2cgfSA9IHRvUmVnZXgoa2V5KVxuICAgICAgaWYgKF9ocmVmLm1hdGNoKHBhdGgpKSB7XG4gICAgICAgIG5vbmUgPSBmYWxzZVxuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbXNnIHx8ICdFbnRyeSdcbiAgICAgICAgbGV0IGZucyA9IG1pdG0ubWFjcm9zW2tleV0oKVxuICAgICAgICBpZiAoZm5zIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgIGZucyA9IGF3YWl0IGZuc1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZm5zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZucylcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGZucykpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGZuMiBvZiBmbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIG9ic2VydmVyZm4ucHVzaChmbjIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRlYnVuayAmJiBjbGVhclRpbWVvdXQoZGVidW5rKVxuICAgICAgICBkZWJ1bmsgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICBvbmNlcyA9IHt9IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxuICAgICAgICAgIGRlYnVuayA9IHVuZGVmaW5lZFxuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGF1dG9idXR0b25zLFxuICAgICAgICAgICAgcmlnaHRidXR0b25zLFxuICAgICAgICAgICAgbGVmdGJ1dHRvbnMsXG4gICAgICAgICAgICBsZWZ0MmJ1dHRvbnNcbiAgICAgICAgICB9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgICBpZiAod2luZG93Lm1pdG0uYXV0b2ZpbGwpIHtcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xuICAgICAgICAgICAgICAuLi5hdXRvYnV0dG9ucyxcbiAgICAgICAgICAgICAgJ0VudHJ5JygpIHtcbiAgICAgICAgICAgICAgICBsZXQge2F1dG9maWxsfSA9IHdpbmRvdy5taXRtXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdXRvZmlsbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBsYXkoYXV0b2ZpbGwpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sICd0b3ByJylcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyhhdXRvYnV0dG9ucywgJ3RvcHInIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxuICAgICAgICAgIGxlZnQyYnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnQyYnV0dG9ucywgJ2xlZnQyJylcbiAgICAgICAgICBsZWZ0YnV0dG9ucyAgJiYgc2V0QnV0dG9ucyhsZWZ0YnV0dG9ucyAsICdsZWZ0JyApXG4gICAgICAgIH0sIDApXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChub25lKSB7XG4gICAgICBzZXRCdXR0b25zKHt9LCAncmlnaHQnKVxuICAgICAgc2V0QnV0dG9ucyh7fSwgJ2xlZnQnKVxuICAgICAgc2V0QnV0dG9ucyh7fSwgJ3RvcHInKVxuICAgICAgY29uc3Qge2xlZnQyYnV0dG9uc30gPSB3aW5kb3cubWl0bVxuICAgICAgbGVmdDJidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdDJidXR0b25zLCAnbGVmdDInKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBzZXRCdXR0b25zKHt9LCAncmlnaHQnKVxuICAgIHNldEJ1dHRvbnMoe30sICdsZWZ0JylcbiAgICBzZXRCdXR0b25zKHt9LCAndG9wcicpXG4gICAgY29uc3Qge2xlZnQyYnV0dG9uc30gPSB3aW5kb3cubWl0bVxuICAgIGxlZnQyYnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnQyYnV0dG9ucywgJ2xlZnQyJylcbiAgfVxuICBjb250YWluZXIucmlnaHQuc3R5bGUgPSAnJ1xuICBjb250YWluZXIudG9wci5zdHlsZSAgPSAnJ1xuICBjb250YWluZXIubGVmdC5zdHlsZSAgPSAnJ1xuICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxuICBidXR0b24uc3R5bGUgPSAgdmlzaWJsZSA/ICdiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTsnIDogJ2Rpc3BsYXk6IG5vbmU7J1xuICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcbiAgfVxuICBjdHJsID0gZmFsc2Vcbn1cblxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XG53aW5kb3cub2JzZXJ2ZXIgPSBvYnNlcnZlclxuZnVuY3Rpb24gb2JzZXJ2ZWQoKSB7XG4gIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZVxuICB9KVxufVxuXG5jb25zdCBfdXJsQ2hhbmdlZCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXG5mdW5jdGlvbiBpbml0KCkge1xuICBjb25zdCBib2R5ICAgICA9IGRvY3VtZW50LmJvZHlcbiAgY29uc3QgZGl2eCAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdlJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZUb3BSICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgZGl2TGVmdCAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdlBvcHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZDZW50ZXI9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgaHRtbCAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJyApXG4gIGNvbnN0IHN0eWxlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICBjb25zdCBodG1scmVmICA9IGh0bWwuZmlyc3RFbGVtZW50Q2hpbGRcbiAgY29uc3QgZGl2eHJlZiAgPSBkaXZ4LmZpcnN0RWxlbWVudENoaWxkXG4gIGNvbnN0IGJvZHlyZWYgID0gYm9keS5maXJzdEVsZW1lbnRDaGlsZFxuICBkaXZSaWdodC5zdHlsZSA9ICcnXG4gIGRpdlRvcFIgLnN0eWxlID0gJydcbiAgZGl2TGVmdCAuc3R5bGUgPSAnJ1xuXG4gIHN0eWxlQnRuIC5pbm5lckhUTUwgPSBzdHlsZVxuICBzdHlsZUJ0biAuY2xhc3NOYW1lID0gJ21pdG0tY2xhc3MnXG4gIGRpdlJpZ2h0IC5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtcmlnaHRcIj48L3NwYW4+YFxuICBkaXZUb3BSICAuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXRvcHJcIj48L3NwYW4+YFxuICBkaXZMZWZ0ICAuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLWxlZnRcIj48L3NwYW4+PHNwYW4gY2xhc3M9XCJiZ3JvdXAtbGVmdDJcIj48L3NwYW4+YFxuICBkaXZ4ICAgICAuY2xhc3NOYW1lID0gJ21pdG0tYXBwJ1xuICBkaXZMZWZ0ICAuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIGxlZnQnXG4gIGRpdlRvcFIgIC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgdG9wcidcbiAgZGl2UmlnaHQgLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciByaWdodCdcbiAgZGl2UG9wdXAgLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciBwb3B1cCdcbiAgZGl2Q2VudGVyLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciBjZW50ZXInXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdnggICAgICwgaHRtbHJlZilcbiAgaHRtbC5pbnNlcnRCZWZvcmUoc3R5bGVCdG4gLCBodG1scmVmKVxuICBkaXZ4Lmluc2VydEJlZm9yZShkaXZSaWdodCAsIGRpdnhyZWYpXG4gIGRpdnguaW5zZXJ0QmVmb3JlKGRpdlRvcFIgICwgZGl2eHJlZilcbiAgZGl2eC5pbnNlcnRCZWZvcmUoZGl2TGVmdCAgLCBkaXZ4cmVmKVxuICBkaXZ4Lmluc2VydEJlZm9yZShkaXZDZW50ZXIsIGRpdnhyZWYpXG4gIGJvZHkuaW5zZXJ0QmVmb3JlKGRpdlBvcHVwICwgYm9keXJlZilcbiAgLy8gYm9keS5hcHBlbmRDaGlsZCAoZGl2UG9wdXApXG4gIGNvbnN0IGhvdGtleSA9IG5ldyBtaXRtLnN2ZWx0ZS5Ib3RrZXlzKHt0YXJnZXQ6ZGl2Q2VudGVyfSlcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29udGFpbmVyLnRvcHIgPSBkaXZUb3BSXG4gICAgY29udGFpbmVyLmxlZnQgPSBkaXZMZWZ0XG4gICAgY29udGFpbmVyLnJpZ2h0PSBkaXZSaWdodFxuICAgIGNvbnRhaW5lci5ob3RrZXkgPSBob3RrZXlcbiAgICBjb250YWluZXIucG9wdXAgID0gZGl2UG9wdXBcbiAgICBjb250YWluZXIudGFyZ2V0ID0gZGl2Q2VudGVyXG4gICAgY29udGFpbmVyLm5vZGVrZXk9IGRpdkNlbnRlci5jaGlsZHJlblswXVxuICAgIGJ1dHRvbi5zdHlsZSA9IGBiYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXG4gICAgYmdyb3VwLnJpZ2h0ID0gZGl2UmlnaHQuY2hpbGRyZW5bMF1cbiAgICBiZ3JvdXAudG9wciAgPSBkaXZUb3BSIC5jaGlsZHJlblswXVxuICAgIGJncm91cC5sZWZ0ICA9IGRpdkxlZnQgLmNoaWxkcmVuWzBdXG4gICAgYmdyb3VwLmxlZnQyID0gZGl2TGVmdCAuY2hpbGRyZW5bMV1cbiAgICB1cmxDaGFuZ2UoX3VybENoYW5nZWQpXG4gICAgb2JzZXJ2ZWQoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGNvbnN0IGVsID0gZXZlbnQudGFyZ2V0XG4gICAgICBpZiAoY2VudGVyICYmICFkaXZDZW50ZXIuY29udGFpbnMoZWwpKSB7XG4gICAgICAgIGRpdkNlbnRlci5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxuICAgICAgICBjZW50ZXIgPSBmYWxzZVxuICAgICAgfSBlbHNle1xuICAgICAgICBjb25zdCBhMTF5UG9wdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYTExeS1wb3B1cCcpXG4gICAgICAgIGlmIChhMTF5UG9wdXAgJiYgIWVsLmNsb3Nlc3QoJy5hMTF5LXBvcHVwJykpIHtcbiAgICAgICAgICBjb25zdCB7ZWxOb2RlPXt9fSA9IG1pdG0uYXhlcnVuXG4gICAgICAgICAgZWxOb2RlLm5vZGUgPSB1bmRlZmluZWRcbiAgICAgICAgICBhMTF5UG9wdXAucmVtb3ZlKClcbiAgICAgICAgfVxuICAgICAgfSBcbiAgICB9KTtcbiAgfSwgMClcbn1cblxuZnVuY3Rpb24gbWFjcm9BdXRvbWF0aW9uKG1hY3JvKSB7XG4gIGlmIChjZW50ZXIpIHtcbiAgICBjb250YWluZXIudGFyZ2V0LmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXG4gICAgY2VudGVyID0gZmFsc2VcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcbiAgICBsZXQgbWFjcm9JbmRleCA9IDBcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXG4gICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcbiAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG4gICAgICAgIHNlbGVjdG9yID0gYCR7YWN0aXZlRWxlbWVudH0gJHtzZWxlY3Rvcn1gXG4gICAgICB9XG4gICAgICBwbGF5KFtzZWxlY3Rvcl0pXG5cbiAgICAgIG1hY3JvSW5kZXggKz0gMVxuICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXG4gICAgICB9XG4gICAgfSwgMTAwKVxuICB9XG59XG5cbmxldCBzdGREYmwgPSBbXVxubGV0IGhnaERibCA9IFtdXG5sZXQgc3RkQ3RsID0gW11cbmxldCBoZ2hDdGwgPSBbXVxubGV0IHN0ZEFsdCA9IFtdXG5sZXQgaGdoQWx0ID0gW11cbmxldCBzYXZlS2V5ID0gJydcbmNvbnN0IGtkZWxheSA9IDEwMDBcblxubGV0IGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG5mdW5jdGlvbiBtYWNyb0RibCgpIHtcbiAgY29uc3Qga2V5MSA9IGBrZXk6JHtzdGREYmwuam9pbignJyl9YFxuICBjb25zdCBrZXkyID0gYGNvZGU6JHtoZ2hEYmwuam9pbignOicpfWBcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXG5cbiAgc3RkRGJsID0gW11cbiAgaGdoRGJsID0gW11cbiAgc2F2ZUtleSA9ICcnXG4gIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiBjdHJsICsgYWx0ICArICAke2tleTF9ICB8ICAke2tleTJ9YCwgJ2NvbG9yOiAjYmFkYTU1JylcbiAgaWYgKG1hY3JvKSB7XG4gICAgbWFjcm8gPSBtYWNybyhlKVxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmxldCBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxuZnVuY3Rpb24gbWFjcm9DdGwoKSB7XG4gIGNvbnN0IGtleTEgPSBga2V5Ojwke3N0ZEN0bC5qb2luKCcnKX0+YFxuICBjb25zdCBrZXkyID0gYGNvZGU6PCR7aGdoQ3RsLmpvaW4oJzonKX0+YFxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cblxuICBzdGRDdGwgPSBbXVxuICBoZ2hDdGwgPSBbXVxuICBzYXZlS2V5ID0gJydcbiAgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBjdHJsICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWVhZjEnKVxuICBpZiAobWFjcm8pIHtcbiAgICBtYWNybyA9IG1hY3JvKGUpXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxubGV0IGRlYm91bmNlQWx0ID0gdW5kZWZpbmVkXG5mdW5jdGlvbiBtYWNyb0FsdCgpIHtcbiAgY29uc3Qga2V5MSA9IGBrZXk6eyR7c3RkQWx0LmpvaW4oJycpfX1gXG4gIGNvbnN0IGtleTIgPSBgY29kZTp7JHtoZ2hBbHQuam9pbignOicpfX1gXG4gIGNvbnN0IHsgbWFjcm9rZXlzLCBsYXN0S2V5OiBlIH0gPSB3aW5kb3cubWl0bVxuXG4gIHN0ZEFsdCA9IFtdXG4gIGhnaEFsdCA9IFtdXG4gIHNhdmVLZXkgPSAnJ1xuICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuICBsZXQgbWFjcm8gPSBtYWNyb2tleXNba2V5MV0gfHwgbWFjcm9rZXlzW2tleTJdXG4gIGNvbnNvbGUubG9nKGAlY01hY3JvczogLi4uLiArIGFsdCAgKyAke2tleTF9IHwgJHtrZXkyfWAsICdjb2xvcjogI2JhZGFmMScpXG4gIGlmIChtYWNybykge1xuICAgIG1hY3JvID0gbWFjcm8oZSlcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5mdW5jdGlvbiBrZXliVXAgKGUpIHtcbiAgaWYgKCFlLmFsdEtleSkge1xuICAgIGlmIChkZWJvdW5jZURibCB8fCAoZGVib3VuY2VDdGwgJiYgIWUuY3RybEtleSkgfHwgZGVib3VuY2VBbHQpIHtcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcbiAgICAgIGlmIChkZWJvdW5jZURibCkge1xuICAgICAgICBtYWNyb0RibCgpXG4gICAgICB9IGVsc2UgXG4gICAgICBpZiAoZGVib3VuY2VDdGwpIHtcbiAgICAgICAgbWFjcm9DdGwoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFjcm9BbHQoKVxuICAgICAgfVxuICAgICAgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcbiAgICAgIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXG4gICAgICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfVxufVxudmFyIGN0cmwgPSBmYWxzZVxudmFyIGNlbnRlciA9IGZhbHNlXG5mdW5jdGlvbiBrZXliQ3RybCAoZSkge1xuICBpZiAoIWUuY29kZSB8fCBbJ0FsdCcsICdDb250cm9sJywgJ01ldGEnXS5pbmNsdWRlcyhlLmtleSkpIHtcbiAgICByZXR1cm5cbiAgfSBlbHNlIHtcbiAgICBpZiAoZS5rZXk9PT0nU2hpZnQnKSB7XG4gICAgICBpZiAoZS5jdHJsS2V5ICYmICFlLmFsdEtleSkge1xuICAgICAgICBjb25zdCB7bm9kZWtleSwgdGFyZ2V0LCByaWdodCwgdG9wciwgbGVmdH0gPSBjb250YWluZXJcbiAgICAgICAgaWYgKGUuY29kZT09PSdTaGlmdFJpZ2h0Jykge1xuICAgICAgICAgIGN0cmwgPSAhY3RybFxuICAgICAgICAgIHJpZ2h0LnN0eWxlID0gIWN0cmwgPyAnJyA6ICdkaXNwbGF5OiBub25lOydcbiAgICAgICAgICB0b3ByLnN0eWxlICA9ICFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnXG4gICAgICAgICAgbGVmdC5zdHlsZSAgPSAhY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0YXJnZXQuY2hpbGRyZW5bMF0hPT1ub2Rla2V5KSB7XG4gICAgICAgICAgICB0YXJnZXQucmVwbGFjZUNoaWxkcmVuKG5vZGVrZXkpXG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUgPSAnZGlzcGxheTogYmxvY2s7J1xuICAgICAgICAgICAgY2VudGVyID0gdHJ1ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZW50ZXIgPSAhY2VudGVyXG4gICAgICAgICAgICBpZiAoY2VudGVyKSB7XG4gICAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXQuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcbiAgICAgICAgICAgIH0gIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgY2hhciA9IF9rZXkoZSlcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcbiAgICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgICBjaGFyID0gX2tleShlLCB7Y29kZU9ubHk6IHRydWV9KVxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICAgIHNhdmVLZXkgKz0gY2hhclxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9IFxuICAgICAgICBzdGREYmwucHVzaChjaGFyKVxuICAgICAgICBoZ2hEYmwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgZGVib3VuY2VEYmwgPSBzZXRUaW1lb3V0KG1hY3JvRGJsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuY3RybEtleSkge1xuICAgICAgICBzdGRDdGwucHVzaChjaGFyKVxuICAgICAgICBoZ2hDdGwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgICAgZGVib3VuY2VDdGwgPSBzZXRUaW1lb3V0KG1hY3JvQ3RsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIHN0ZEFsdC5wdXNoKGNoYXIpXG4gICAgICAgIGhnaEFsdC5wdXNoKGUuY29kZSlcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICBkZWJvdW5jZUFsdCA9IHNldFRpbWVvdXQobWFjcm9BbHQsIGtkZWxheSlcbiAgICAgIH1cbiAgICAgIGUuX2tleXMgPSBzYXZlS2V5XG4gICAgICBtaXRtLmxhc3RLZXkgPSBlICAgICAgICBcbiAgICB9IFxuICB9XG59XG5cbmNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxubGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXG5sZXQgb0RlYnVuayA9IHVuZGVmaW5lZFxubGV0IG9ic2VydmVyZm4gPSBbXVxuXG5mdW5jdGlvbiBjb21wYXJlSHJlZihub2Rlcykge1xuICAvLyBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IERPTSBtdXRhdGVkIWAsICdjb2xvcjogI2JhZGE1NScpXG4gIGlmIChvbGRIcmVmICE9IGxvY2F0aW9uLmhyZWYpIHtcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChfdXJsQ2hhbmdlZClcbiAgICBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxuICB9IGVsc2Uge1xuICAgIGlmIChvYnNlcnZlcmZuLmxlbmd0aCkge1xuICAgICAgb0RlYnVuayAmJiBjbGVhclRpbWVvdXQob0RlYnVuaylcbiAgICAgIG9EZWJ1bmsgPSBzZXRUaW1lb3V0KCgpPT4ge1xuICAgICAgICBvRGVidW5rID0gdW5kZWZpbmVkXG4gICAgICAgIGZvciAoY29uc3QgZm4gb2Ygb2JzZXJ2ZXJmbikge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBmbi5uYW1lXG4gICAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5tYXRjaCgvT25jZSQvKSkge1xuICAgICAgICAgICAgaWYgKG9uY2VzW25hbWVdKSB7IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgb25jZXNbbmFtZV0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZuKG5vZGVzKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxuICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodCcpXG4gICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JylcbiAgICAgICAgY29uc3QgeyBhdXRvZmlsbCB9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgaWYgKGF1dG9maWxsKSB7XG4gICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XG4gICAgICAgICAgICAuLi5hdXRvYnV0dG9ucyxcbiAgICAgICAgICAgICdFbnRyeScoKSB7cGxheShhdXRvZmlsbCl9XG4gICAgICAgICAgfSwgJ3RvcHInKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICd0b3ByJylcbiAgICAgICAgfVxuXG4gICAgICB9LCAxMDApXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHdzTG9jYXRpb24oKSB7XG4gIGNvbnN0IHZlbmRvciA9IF93c192ZW5kb3IoKVxuICBpZiAoWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKHZlbmRvcikgfHwgKGNocm9tZSAmJiAhY2hyb21lLnRhYnMpKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBrZXliVXApXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpXG4gICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICBpbml0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdClcbiAgICB9ICAgIFxuICB9IGVsc2Uge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmbi5hcHBseShoaXN0b3J5LCBhcmd1bWVudHMpXG4gICAgY29tcGFyZUhyZWYoKVxuICB9XG59XG5cbmNvbnN0IHBhc3RlbCA9IHtcbiAgUG9zdEl0OiAgICAgICAgICAnI2ZjZmZkY2Q2JyxcbiAgUGFzdGVsR3JlZW46ICAgICAnIzc3ZGQ3N2Q2JyxcbiAgUGFzdGVsQnJvd246ICAgICAnIzgzNjk1M2Q2JyxcbiAgQmFieUJsdWU6ICAgICAgICAnIzg5Y2ZmMGQ2JyxcbiAgUGFzdGVsVHVycXVvaXNlOiAnIzk5YzVjNGQ2JyxcbiAgQmx1ZUdyZWVuUGFzdGVsOiAnIzlhZGVkYmQ2JyxcbiAgUGVyc2lhblBhc3RlbDogICAnI2FhOTQ5OWQ2JyxcbiAgTWFnaWNNaW50OiAgICAgICAnI2FhZjBkMWQ2JyxcbiAgTGlnaHRQYXN0ZWxHcmVlbjonI2IyZmJhNWQ2JyxcbiAgUGFzdGVsUHVycGxlOiAgICAnI2IzOWViNWQ2JyxcbiAgUGFzdGVsTGlsYWM6ICAgICAnI2JkYjBkMGQ2JyxcbiAgUGFzdGVsUGVhOiAgICAgICAnI2JlZTdhNWQ2JyxcbiAgTGlnaHRMaW1lOiAgICAgICAnI2JlZmQ3M2Q2JyxcbiAgTGlnaHRQZXJpd2lua2xlOiAnI2MxYzZmY2Q2JyxcbiAgUGFsZU1hdXZlOiAgICAgICAnI2M2YTRhNGQ2JyxcbiAgTGlnaHRMaWdodEdyZWVuOiAnI2M4ZmZiMGQ2JyxcbiAgUGFzdGVsVmlvbGV0OiAgICAnI2NiOTljOWQ2JyxcbiAgUGFzdGVsTWludDogICAgICAnI2NlZjBjY2Q2JyxcbiAgUGFzdGVsR3JleTogICAgICAnI2NmY2ZjNGQ2JyxcbiAgUGFsZUJsdWU6ICAgICAgICAnI2Q2ZmZmZWQ2JyxcbiAgUGFzdGVsTGF2ZW5kZXI6ICAnI2Q4YTFjNGQ2JyxcbiAgUGFzdGVsUGluazogICAgICAnI2RlYTVhNGQ2JyxcbiAgUGFzdGVsU21pcms6ICAgICAnI2RlZWNlMWQ2JyxcbiAgUGFzdGVsRGF5OiAgICAgICAnI2RmZDhlMWQ2JyxcbiAgUGFzdGVsUGFyY2htZW50OiAnI2U1ZDlkM2Q2JyxcbiAgUGFzdGVsUm9zZVRhbjogICAnI2U5ZDFiZmQ2JyxcbiAgUGFzdGVsTWFnZW50YTogICAnI2Y0OWFjMmQ2JyxcbiAgRWxlY3RyaWNMYXZlbmRlcjonI2Y0YmZmZmQ2JyxcbiAgUGFzdGVsWWVsbG93OiAgICAnI2ZkZmQ5NmQ2JyxcbiAgUGFzdGVsUmVkOiAgICAgICAnI2ZmNjk2MWQ2JyxcbiAgUGFzdGVsT3JhbmdlOiAgICAnI2ZmOTY0ZmQ2JyxcbiAgQW1lcmljYW5QaW5rOiAgICAnI2ZmOTg5OWQ2JyxcbiAgQmFieVBpbms6ICAgICAgICAnI2ZmYjdjZWQ2JyxcbiAgQmFieVB1cnBsZTogICAgICAnI2NhOWJmN2Q2Jyxcbn1cblxuZnVuY3Rpb24gc3ZlbHRlKFN2ZWx0LCBiZz0nUG9zdEl0JykgeyAvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxuICBjb25zdCB7dGFyZ2V0LCBwb3B1cH0gPSBjb250YWluZXJcbiAgdGFyZ2V0LnJlcGxhY2VDaGlsZHJlbignJylcbiAgLy8gcG9wdXAgLnJlcGxhY2VDaGlsZHJlbignJylcbiAgaWYgKHR5cGVvZihiZykhPT0nc3RyaW5nJyAmJiBiZy5wb3B1cCkge1xuICAgIGNvbnN0IHByb3BzID0ge25vZGU6IGJnLm5vZGV9XG4gICAgd2luZG93Lm1pdG0uc2FwcCA9IG5ldyBTdmVsdCh7dGFyZ2V0OiBwb3B1cCwgcHJvcHN9KVxuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5taXRtLnNhcHAgPSBuZXcgU3ZlbHQoe3RhcmdldH0pXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCBiY29sb3IgPSBwYXN0ZWxbYmddXG4gICAgICB0YXJnZXQuc3R5bGUgPSBgZGlzcGxheTogYmxvY2ske2Jjb2xvciA/ICc7YmFja2dyb3VuZDonK2Jjb2xvciA6ICcnfTtgXG4gICAgICBjZW50ZXIgPSB0cnVlXG4gICAgfSwgMCkgIFxuICB9XG59XG5cbmZ1bmN0aW9uIGhvdEtleXMobmV3a2V5cykge1xuICBjb25zdCB7bWl0bX0gPSB3aW5kb3dcbiAgY29uc3Qga2V5cyA9IG1pdG0ubWFjcm9rZXlzIHx8IHt9XG4gIGRlbGV0ZSBrZXlzWydrZXk6eXl5J11cbiAgZGVsZXRlIGtleXNbJ2tleTp5eScgXVxuICBkZWxldGUga2V5c1sna2V5OnknICBdXG4gIGRlbGV0ZSBrZXlzWydrZXk6YycgIF1cbiAgbWl0bS5tYWNyb2tleXMgPSB7Li4ua2V5cywuLi5uZXdrZXlzLC4uLmRlZmF1bHRIb3RLZXlzKCl9XG59XG5cbndpbmRvdy5taXRtLmZuLm1hY3JvQXV0b21hdGlvbiA9IG1hY3JvQXV0b21hdGlvblxud2luZG93Lm1pdG0uZm4udXJsQ2hhbmdlID0gdXJsQ2hhbmdlXG53aW5kb3cubWl0bS5mbi5ob3RLZXlzID0gaG90S2V5c1xud2luZG93Lm1pdG0uZm4uc3ZlbHRlID0gc3ZlbHRlXG53aW5kb3cubWl0bS5mbi5wbGF5ID0gcGxheVxud2luZG93Lm1pdG0uZm4ud2FpdCA9IHdhaXRcblxubW9kdWxlLmV4cG9ydHMgPSB3c0xvY2F0aW9uXG4iLCJmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGRlbGF5ID0gNTAwKSB7XG4gIGxldCBfdGltZW91dFxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHNcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKVxuICAgIH0sIGRlbGF5KVxuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGxldCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXG4gIGlmIChyb3V0ZSkge1xuICAgIGNvbnN0IHtfc3VibnM6IHN9ID0gcm91dGUuX2NoaWxkbnNcbiAgICBpZiAocyAmJiBtaXRtLnJvdXRlc1tzXSkge1xuICAgICAgcm91dGU9IG1pdG0ucm91dGVzW3NdXG4gICAgfSAgXG4gIH1cbiAgcmV0dXJuIHJvdXRlXG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIE11dGF0aW9uT2JzZXJ2ZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfd3Nfcm91dGUgPSByZXF1aXJlKCcuL193c19yb3V0ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBpZiAobG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoJzovLycgLCd+ficpXG4gIGNvbnN0IHNzaG90ID0ge31cbiAgY29uc3Qgbm9kZXMgPSB7fVxuXG4gIGxldCByb3V0ZSA9IF93c19yb3V0ZSgpXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgY29uc3QgeyBvYnNlcnZlcjogb2IgfSA9IHJvdXRlLnNjcmVlbnNob3RcbiAgICBmb3IgKGNvbnN0IGlkIGluIG9iKSB7XG4gICAgICBsZXQgZWwgPSB7fVxuICAgICAgaWYgKG9iW2lkXSA9PT0gdHJ1ZSkge1xuICAgICAgICBlbCA9IHtcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxuICAgICAgICAgIGluc2VydDogdHJ1ZSxcbiAgICAgICAgICByZW1vdmU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSBpZiAodHlwZW9mIG9iW2lkXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgZWwgPSB7XG4gICAgICAgICAgdGl0bGU6ICdub2NhcHR1cmUnLFxuICAgICAgICAgIGluc2VydDogZmFsc2UsXG4gICAgICAgICAgcmVtb3ZlOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XG4gICAgICAgICAgZWxbZV0gPSB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXG4gICAgICB9XG4gICAgICBzc2hvdFtpZF0gPSBlbFxuICAgICAgbm9kZXNbaWRdID0ge1xuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxuICAgICAgICByZW1vdmU6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgb2JcbiAgbGV0IGZuYW1lXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXG4gIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgICBvYiA9IHJvdXRlLnNjcmVlbnNob3Qub2JzZXJ2ZXJcbiAgICB9XG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgIGZvciAoY29uc3QgaWQgaW4gbm9kZXMpIHtcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKVxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xuICAgICAgICBpZiAoIW5vZGVzW2lkXS5pbnNlcnQpIHtcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZVxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob2IgJiYgdHlwZW9mIG9iW2lkXT09PSdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZCA9IGVsWzBdIHx8IGVsXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudD09PXVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBub2QuX3dzX2NvdW50ID0gMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kLl93c19jb3VudCArPSAxXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudDwyKSB7XG4gICAgICAgICAgICAgIG9iW2lkXShub2QpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLmluc2VydCkge1xuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LWluc2VydGBcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gZmFsc2VcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGF0dHJpYnV0ZXM6IG9iID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihfd3NfZGVib3VuY2UoY2FsbGJhY2ssIDI4MCkpXG4gICAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIG9wdGlvbnMpXG4gICAgfSlcbiAgfVxufVxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XG4gIGxldCBpZCA9ICcnXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXG4gIH1cbiAgcmV0dXJuIGlkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IF93cyB9ID0gd2luZG93XG5cbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfYnJvYWRjYXN0ID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX3BpbmcoJ0hpIScpXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX3Bpbmcke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19faGVscCgpXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXG4gIH1cblxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXG4gIHdpbmRvdy53c19fb3BlbiA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcbiAgICBjb25zdCB7IF9fZmxhZyB9ID0gd2luZG93Lm1pdG1cbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcbiAgICB3aW5kb3cuX3dzX2lkID0gaWRcbiAgICB3aW5kb3cuX3dzX3F1ZXVlW2tleV0gPSBoYW5kbGVyIHx8ICh3ID0+IHt9KVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAod2luZG93Ll93c19xdWV1ZVtrZXldKSB7XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IHdzIHRpbWVvdXQhJywgX2MsIGtleSlcbiAgICAgIH1cbiAgICB9LCA1MDAwKVxuICAgIFxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXG4gICAgY29uc3QgZmxhZyA9IHdpbmRvdy5taXRtLl9fZmxhZ1snd3MtbWVzc2FnZSddXG4gICAgaWYgKGZsYWcgPiAxKSB7XG4gICAgICBjb25zb2xlLmxvZyhgX3dzLnNlbmQ6ICR7cGFyYW1zfWApXG4gICAgfVxuICAgIF93cy5zZW5kKHBhcmFtcylcbiAgfVxuICBjb25zdCB3c3J1biA9IHt9XG4gIGNvbnN0IGFyciA9IHdpbmRvdy5taXRtLndzcnVuXG4gIGZvciAoY29uc3QgayBvZiBhcnIpIHtcbiAgICBjb25zdCBjbWQgID0gay5yZXBsYWNlKCckJywgJycpXG4gICAgd3NydW5bY21kXSA9IChkYXRhLCBoYW5kbGVyKSA9PiB3aW5kb3cud3NfX3NlbmQoY21kLCBkYXRhLCBoYW5kbGVyKVxuICB9XG4gIHdpbmRvdy5taXRtLndzcnVuID0gd3NydW5cbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubGV0IF90aW1lb3V0XG5sZXQgX2NzcCA9IHt9XG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXG4gICAgICAucmVwbGFjZSgvXlxcLy8sICcnKVxuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgY29uc3Qge1xuICAgICAgYmxvY2tlZFVSSSxcbiAgICAgIGRpc3Bvc2l0aW9uLFxuICAgICAgZG9jdW1lbnRVUkksXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXG4gICAgICBvcmlnaW5hbFBvbGljeSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZVxuICAgIH0gPSBlXG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcbiAgICAgIF9jc3BbdHlwXSA9IHt9XG4gICAgfVxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBob3N0LFxuICAgICAgICBwYXRoXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF1cbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XG4gICAgfVxuXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge31cbiAgICB9XG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApXG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcbiAgICAgIGRpcmVjdGl2ZSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGVcbiAgICB9XG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IENTUDonLCBfY3NwKVxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XG4gICAgICAvLyAgIG5hbWVzcGFjZSxcbiAgICAgIC8vICAgaG9zdCxcbiAgICAgIC8vICAgcGF0aCxcbiAgICAgIC8vICAgX2NzcCxcbiAgICAgIC8vIH0pO1xuICAgICAgX2NzcCA9IHt9XG4gICAgfSwgNDAwMClcbiAgfVxuXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcilcbiAgfVxufVxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICBpZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gICAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbiAgfVxuICBcbiAgd2luZG93Lm1pdG0uZm4uYXV0b2NsaWNrID0gKCkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ0bi1hdXRvZmlsbCcpLmNsaWNrKClcbiAgICB9LCAxMDAwKVxuICB9XG4gIFxuICB3aW5kb3cubWl0bS5mbi5nZXRDb29raWUgPSBuYW1lID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGA7ICR7ZG9jdW1lbnQuY29va2llfWA7XG4gICAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdChgOyAke25hbWV9PWApO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHJldHVybiBwYXJ0cy5wb3AoKS5zcGxpdCgnOycpLnNoaWZ0KCk7XG4gIH1cblxuICBjb25zdCBvbk1vdW50ID0gZSA9PiBjb25zb2xlLmxvZygnJWNNYWNyb3M6IGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCAnY29sb3I6ICM1YWRhNTUnLCBlKVxuICB3aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IG9uTW91bnRcbn1cbiIsImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmxldCBzcmNfdXJsX2VxdWFsX2FuY2hvcjtcbmZ1bmN0aW9uIHNyY191cmxfZXF1YWwoZWxlbWVudF9zcmMsIHVybCkge1xuICAgIGlmICghc3JjX3VybF9lcXVhbF9hbmNob3IpIHtcbiAgICAgICAgc3JjX3VybF9lcXVhbF9hbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgfVxuICAgIHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWYgPSB1cmw7XG4gICAgcmV0dXJuIGVsZW1lbnRfc3JjID09PSBzcmNfdXJsX2VxdWFsX2FuY2hvci5ocmVmO1xufVxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cbmZ1bmN0aW9uIGlzX2VtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG4gICAgaWYgKHN0b3JlICE9IG51bGwgJiYgdHlwZW9mIHN0b3JlLnN1YnNjcmliZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke25hbWV9JyBpcyBub3QgYSBzdG9yZSB3aXRoIGEgJ3N1YnNjcmliZScgbWV0aG9kYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3Vic2NyaWJlKHN0b3JlLCAuLi5jYWxsYmFja3MpIHtcbiAgICBpZiAoc3RvcmUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoLi4uY2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdW5zdWIudW5zdWJzY3JpYmUgPyAoKSA9PiB1bnN1Yi51bnN1YnNjcmliZSgpIDogdW5zdWI7XG59XG5mdW5jdGlvbiBnZXRfc3RvcmVfdmFsdWUoc3RvcmUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgc3Vic2NyaWJlKHN0b3JlLCBfID0+IHZhbHVlID0gXykoKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiBjb21wb25lbnRfc3Vic2NyaWJlKGNvbXBvbmVudCwgc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kucHVzaChzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBjcmVhdGVfc2xvdChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jdHggPSBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pO1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvblswXShzbG90X2N0eCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgcmV0dXJuIGRlZmluaXRpb25bMV0gJiYgZm5cbiAgICAgICAgPyBhc3NpZ24oJCRzY29wZS5jdHguc2xpY2UoKSwgZGVmaW5pdGlvblsxXShmbihjdHgpKSlcbiAgICAgICAgOiAkJHNjb3BlLmN0eDtcbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NoYW5nZXMoZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb25bMl0gJiYgZm4pIHtcbiAgICAgICAgY29uc3QgbGV0cyA9IGRlZmluaXRpb25bMl0oZm4oZGlydHkpKTtcbiAgICAgICAgaWYgKCQkc2NvcGUuZGlydHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGxldHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsZXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gW107XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1heCgkJHNjb3BlLmRpcnR5Lmxlbmd0aCwgbGV0cy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZFtpXSA9ICQkc2NvcGUuZGlydHlbaV0gfCBsZXRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJCRzY29wZS5kaXJ0eSB8IGxldHM7XG4gICAgfVxuICAgIHJldHVybiAkJHNjb3BlLmRpcnR5O1xufVxuZnVuY3Rpb24gdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKSB7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIHVwZGF0ZV9zbG90X2Jhc2Uoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIHNsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG59XG5mdW5jdGlvbiBnZXRfYWxsX2RpcnR5X2Zyb21fc2NvcGUoJCRzY29wZSkge1xuICAgIGlmICgkJHNjb3BlLmN0eC5sZW5ndGggPiAzMikge1xuICAgICAgICBjb25zdCBkaXJ0eSA9IFtdO1xuICAgICAgICBjb25zdCBsZW5ndGggPSAkJHNjb3BlLmN0eC5sZW5ndGggLyAzMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGlydHlbaV0gPSAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9yZXN0X3Byb3BzKHByb3BzLCBrZXlzKSB7XG4gICAgY29uc3QgcmVzdCA9IHt9O1xuICAgIGtleXMgPSBuZXcgU2V0KGtleXMpO1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKCFrZXlzLmhhcyhrKSAmJiBrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3Q7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Nsb3RzKHNsb3RzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gc2xvdHMpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIFRyYWNrIHdoaWNoIG5vZGVzIGFyZSBjbGFpbWVkIGR1cmluZyBoeWRyYXRpb24uIFVuY2xhaW1lZCBub2RlcyBjYW4gdGhlbiBiZSByZW1vdmVkIGZyb20gdGhlIERPTVxuLy8gYXQgdGhlIGVuZCBvZiBoeWRyYXRpb24gd2l0aG91dCB0b3VjaGluZyB0aGUgcmVtYWluaW5nIG5vZGVzLlxubGV0IGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xuZnVuY3Rpb24gc3RhcnRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IHRydWU7XG59XG5mdW5jdGlvbiBlbmRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xufVxuZnVuY3Rpb24gdXBwZXJfYm91bmQobG93LCBoaWdoLCBrZXksIHZhbHVlKSB7XG4gICAgLy8gUmV0dXJuIGZpcnN0IGluZGV4IG9mIHZhbHVlIGxhcmdlciB0aGFuIGlucHV0IHZhbHVlIGluIHRoZSByYW5nZSBbbG93LCBoaWdoKVxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICAgIGNvbnN0IG1pZCA9IGxvdyArICgoaGlnaCAtIGxvdykgPj4gMSk7XG4gICAgICAgIGlmIChrZXkobWlkKSA8PSB2YWx1ZSkge1xuICAgICAgICAgICAgbG93ID0gbWlkICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhpZ2ggPSBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbn1cbmZ1bmN0aW9uIGluaXRfaHlkcmF0ZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0Lmh5ZHJhdGVfaW5pdClcbiAgICAgICAgcmV0dXJuO1xuICAgIHRhcmdldC5oeWRyYXRlX2luaXQgPSB0cnVlO1xuICAgIC8vIFdlIGtub3cgdGhhdCBhbGwgY2hpbGRyZW4gaGF2ZSBjbGFpbV9vcmRlciB2YWx1ZXMgc2luY2UgdGhlIHVuY2xhaW1lZCBoYXZlIGJlZW4gZGV0YWNoZWQgaWYgdGFyZ2V0IGlzIG5vdCA8aGVhZD5cbiAgICBsZXQgY2hpbGRyZW4gPSB0YXJnZXQuY2hpbGROb2RlcztcbiAgICAvLyBJZiB0YXJnZXQgaXMgPGhlYWQ+LCB0aGVyZSBtYXkgYmUgY2hpbGRyZW4gd2l0aG91dCBjbGFpbV9vcmRlclxuICAgIGlmICh0YXJnZXQubm9kZU5hbWUgPT09ICdIRUFEJykge1xuICAgICAgICBjb25zdCBteUNoaWxkcmVuID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChub2RlLmNsYWltX29yZGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBteUNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW4gPSBteUNoaWxkcmVuO1xuICAgIH1cbiAgICAvKlxuICAgICogUmVvcmRlciBjbGFpbWVkIGNoaWxkcmVuIG9wdGltYWxseS5cbiAgICAqIFdlIGNhbiByZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5IGJ5IGZpbmRpbmcgdGhlIGxvbmdlc3Qgc3Vic2VxdWVuY2Ugb2ZcbiAgICAqIG5vZGVzIHRoYXQgYXJlIGFscmVhZHkgY2xhaW1lZCBpbiBvcmRlciBhbmQgb25seSBtb3ZpbmcgdGhlIHJlc3QuIFRoZSBsb25nZXN0XG4gICAgKiBzdWJzZXF1ZW5jZSBzdWJzZXF1ZW5jZSBvZiBub2RlcyB0aGF0IGFyZSBjbGFpbWVkIGluIG9yZGVyIGNhbiBiZSBmb3VuZCBieVxuICAgICogY29tcHV0aW5nIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgLmNsYWltX29yZGVyIHZhbHVlcy5cbiAgICAqXG4gICAgKiBUaGlzIGFsZ29yaXRobSBpcyBvcHRpbWFsIGluIGdlbmVyYXRpbmcgdGhlIGxlYXN0IGFtb3VudCBvZiByZW9yZGVyIG9wZXJhdGlvbnNcbiAgICAqIHBvc3NpYmxlLlxuICAgICpcbiAgICAqIFByb29mOlxuICAgICogV2Uga25vdyB0aGF0LCBnaXZlbiBhIHNldCBvZiByZW9yZGVyaW5nIG9wZXJhdGlvbnMsIHRoZSBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlXG4gICAgKiBhbHdheXMgZm9ybSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLCBzaW5jZSB0aGV5IGRvIG5vdCBtb3ZlIGFtb25nIGVhY2ggb3RoZXJcbiAgICAqIG1lYW5pbmcgdGhhdCB0aGV5IG11c3QgYmUgYWxyZWFkeSBvcmRlcmVkIGFtb25nIGVhY2ggb3RoZXIuIFRodXMsIHRoZSBtYXhpbWFsXG4gICAgKiBzZXQgb2Ygbm9kZXMgdGhhdCBkbyBub3QgbW92ZSBmb3JtIGEgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLlxuICAgICovXG4gICAgLy8gQ29tcHV0ZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICAvLyBtOiBzdWJzZXF1ZW5jZSBsZW5ndGggaiA9PiBpbmRleCBrIG9mIHNtYWxsZXN0IHZhbHVlIHRoYXQgZW5kcyBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGxlbmd0aCBqXG4gICAgY29uc3QgbSA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCArIDEpO1xuICAgIC8vIFByZWRlY2Vzc29yIGluZGljZXMgKyAxXG4gICAgY29uc3QgcCA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgbVswXSA9IC0xO1xuICAgIGxldCBsb25nZXN0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBjaGlsZHJlbltpXS5jbGFpbV9vcmRlcjtcbiAgICAgICAgLy8gRmluZCB0aGUgbGFyZ2VzdCBzdWJzZXF1ZW5jZSBsZW5ndGggc3VjaCB0aGF0IGl0IGVuZHMgaW4gYSB2YWx1ZSBsZXNzIHRoYW4gb3VyIGN1cnJlbnQgdmFsdWVcbiAgICAgICAgLy8gdXBwZXJfYm91bmQgcmV0dXJucyBmaXJzdCBncmVhdGVyIHZhbHVlLCBzbyB3ZSBzdWJ0cmFjdCBvbmVcbiAgICAgICAgLy8gd2l0aCBmYXN0IHBhdGggZm9yIHdoZW4gd2UgYXJlIG9uIHRoZSBjdXJyZW50IGxvbmdlc3Qgc3Vic2VxdWVuY2VcbiAgICAgICAgY29uc3Qgc2VxTGVuID0gKChsb25nZXN0ID4gMCAmJiBjaGlsZHJlblttW2xvbmdlc3RdXS5jbGFpbV9vcmRlciA8PSBjdXJyZW50KSA/IGxvbmdlc3QgKyAxIDogdXBwZXJfYm91bmQoMSwgbG9uZ2VzdCwgaWR4ID0+IGNoaWxkcmVuW21baWR4XV0uY2xhaW1fb3JkZXIsIGN1cnJlbnQpKSAtIDE7XG4gICAgICAgIHBbaV0gPSBtW3NlcUxlbl0gKyAxO1xuICAgICAgICBjb25zdCBuZXdMZW4gPSBzZXFMZW4gKyAxO1xuICAgICAgICAvLyBXZSBjYW4gZ3VhcmFudGVlIHRoYXQgY3VycmVudCBpcyB0aGUgc21hbGxlc3QgdmFsdWUuIE90aGVyd2lzZSwgd2Ugd291bGQgaGF2ZSBnZW5lcmF0ZWQgYSBsb25nZXIgc2VxdWVuY2UuXG4gICAgICAgIG1bbmV3TGVuXSA9IGk7XG4gICAgICAgIGxvbmdlc3QgPSBNYXRoLm1heChuZXdMZW4sIGxvbmdlc3QpO1xuICAgIH1cbiAgICAvLyBUaGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIG5vZGVzIChpbml0aWFsbHkgcmV2ZXJzZWQpXG4gICAgY29uc3QgbGlzID0gW107XG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIG5vZGVzLCBub2RlcyB0aGF0IHdpbGwgYmUgbW92ZWRcbiAgICBjb25zdCB0b01vdmUgPSBbXTtcbiAgICBsZXQgbGFzdCA9IGNoaWxkcmVuLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgY3VyID0gbVtsb25nZXN0XSArIDE7IGN1ciAhPSAwOyBjdXIgPSBwW2N1ciAtIDFdKSB7XG4gICAgICAgIGxpcy5wdXNoKGNoaWxkcmVuW2N1ciAtIDFdKTtcbiAgICAgICAgZm9yICg7IGxhc3QgPj0gY3VyOyBsYXN0LS0pIHtcbiAgICAgICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0LS07XG4gICAgfVxuICAgIGZvciAoOyBsYXN0ID49IDA7IGxhc3QtLSkge1xuICAgICAgICB0b01vdmUucHVzaChjaGlsZHJlbltsYXN0XSk7XG4gICAgfVxuICAgIGxpcy5yZXZlcnNlKCk7XG4gICAgLy8gV2Ugc29ydCB0aGUgbm9kZXMgYmVpbmcgbW92ZWQgdG8gZ3VhcmFudGVlIHRoYXQgdGhlaXIgaW5zZXJ0aW9uIG9yZGVyIG1hdGNoZXMgdGhlIGNsYWltIG9yZGVyXG4gICAgdG9Nb3ZlLnNvcnQoKGEsIGIpID0+IGEuY2xhaW1fb3JkZXIgLSBiLmNsYWltX29yZGVyKTtcbiAgICAvLyBGaW5hbGx5LCB3ZSBtb3ZlIHRoZSBub2Rlc1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHRvTW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB3aGlsZSAoaiA8IGxpcy5sZW5ndGggJiYgdG9Nb3ZlW2ldLmNsYWltX29yZGVyID49IGxpc1tqXS5jbGFpbV9vcmRlcikge1xuICAgICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuY2hvciA9IGogPCBsaXMubGVuZ3RoID8gbGlzW2pdIDogbnVsbDtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZSh0b01vdmVbaV0sIGFuY2hvcik7XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXModGFyZ2V0LCBzdHlsZV9zaGVldF9pZCwgc3R5bGVzKSB7XG4gICAgY29uc3QgYXBwZW5kX3N0eWxlc190byA9IGdldF9yb290X2Zvcl9zdHlsZSh0YXJnZXQpO1xuICAgIGlmICghYXBwZW5kX3N0eWxlc190by5nZXRFbGVtZW50QnlJZChzdHlsZV9zaGVldF9pZCkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9IHN0eWxlX3NoZWV0X2lkO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHN0eWxlcztcbiAgICAgICAgYXBwZW5kX3N0eWxlc2hlZXQoYXBwZW5kX3N0eWxlc190bywgc3R5bGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9yb290X2Zvcl9zdHlsZShub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgY29uc3Qgcm9vdCA9IG5vZGUuZ2V0Um9vdE5vZGUgPyBub2RlLmdldFJvb3ROb2RlKCkgOiBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgaWYgKHJvb3QgJiYgcm9vdC5ob3N0KSB7XG4gICAgICAgIHJldHVybiByb290O1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5vd25lckRvY3VtZW50O1xufVxuZnVuY3Rpb24gYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQobm9kZSkge1xuICAgIGNvbnN0IHN0eWxlX2VsZW1lbnQgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgIGFwcGVuZF9zdHlsZXNoZWV0KGdldF9yb290X2Zvcl9zdHlsZShub2RlKSwgc3R5bGVfZWxlbWVudCk7XG4gICAgcmV0dXJuIHN0eWxlX2VsZW1lbnQuc2hlZXQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfc3R5bGVzaGVldChub2RlLCBzdHlsZSkge1xuICAgIGFwcGVuZChub2RlLmhlYWQgfHwgbm9kZSwgc3R5bGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpIHtcbiAgICBpZiAoaXNfaHlkcmF0aW5nKSB7XG4gICAgICAgIGluaXRfaHlkcmF0ZSh0YXJnZXQpO1xuICAgICAgICBpZiAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID09PSB1bmRlZmluZWQpIHx8ICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5wYXJlbnRFbGVtZW50ICE9PSB0YXJnZXQpKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuZmlyc3RDaGlsZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBTa2lwIG5vZGVzIG9mIHVuZGVmaW5lZCBvcmRlcmluZ1xuICAgICAgICB3aGlsZSAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkICE9PSBudWxsKSAmJiAodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQuY2xhaW1fb3JkZXIgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkKSB7XG4gICAgICAgICAgICAvLyBXZSBvbmx5IGluc2VydCBpZiB0aGUgb3JkZXJpbmcgb2YgdGhpcyBub2RlIHNob3VsZCBiZSBtb2RpZmllZCBvciB0aGUgcGFyZW50IG5vZGUgaXMgbm90IHRhcmdldFxuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCB8fCBub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGlmIChpc19oeWRyYXRpbmcgJiYgIWFuY2hvcikge1xuICAgICAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT0gYW5jaG9yKSB7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRydXN0ZWQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LmlzVHJ1c3RlZClcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19fdmFsdWUnKSB7XG4gICAgICAgICAgICBub2RlLnZhbHVlID0gbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdHlwZW9mIG5vZGVbcHJvcF0gPT09ICdib29sZWFuJyAmJiB2YWx1ZSA9PT0gJycgPyB0cnVlIDogdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCwgX192YWx1ZSwgY2hlY2tlZCkge1xuICAgIGNvbnN0IHZhbHVlID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIGlmICghY2hlY2tlZCkge1xuICAgICAgICB2YWx1ZS5kZWxldGUoX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGluaXRfY2xhaW1faW5mbyhub2Rlcykge1xuICAgIGlmIChub2Rlcy5jbGFpbV9pbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZXMuY2xhaW1faW5mbyA9IHsgbGFzdF9pbmRleDogMCwgdG90YWxfY2xhaW1lZDogMCB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsYWltX25vZGUobm9kZXMsIHByZWRpY2F0ZSwgcHJvY2Vzc05vZGUsIGNyZWF0ZU5vZGUsIGRvbnRVcGRhdGVMYXN0SW5kZXggPSBmYWxzZSkge1xuICAgIC8vIFRyeSB0byBmaW5kIG5vZGVzIGluIGFuIG9yZGVyIHN1Y2ggdGhhdCB3ZSBsZW5ndGhlbiB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCByZXN1bHROb2RlID0gKCgpID0+IHtcbiAgICAgICAgLy8gV2UgZmlyc3QgdHJ5IHRvIGZpbmQgYW4gZWxlbWVudCBhZnRlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAgIGZvciAobGV0IGkgPSBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXg7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcHJvY2Vzc05vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNbaV0gPSByZXBsYWNlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkb250VXBkYXRlTGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgdHJ5IHRvIGZpbmQgb25lIGJlZm9yZVxuICAgICAgICAvLyBXZSBpdGVyYXRlIGluIHJldmVyc2Ugc28gdGhhdCB3ZSBkb24ndCBnbyB0b28gZmFyIGJhY2tcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBzcGxpY2VkIGJlZm9yZSB0aGUgbGFzdF9pbmRleCwgd2UgZGVjcmVhc2UgaXRcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4LS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGNhbid0IGZpbmQgYW55IG1hdGNoaW5nIG5vZGUsIHdlIGNyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoKTtcbiAgICB9KSgpO1xuICAgIHJlc3VsdE5vZGUuY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkICs9IDE7XG4gICAgcmV0dXJuIHJlc3VsdE5vZGU7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGNyZWF0ZV9lbGVtZW50KSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVOYW1lID09PSBuYW1lLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCByZW1vdmUgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlLmZvckVhY2godiA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSh2KSk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSwgKCkgPT4gY3JlYXRlX2VsZW1lbnQobmFtZSkpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3ZnX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmdfZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAzLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhU3RyID0gJycgKyBkYXRhO1xuICAgICAgICBpZiAobm9kZS5kYXRhLnN0YXJ0c1dpdGgoZGF0YVN0cikpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmRhdGEubGVuZ3RoICE9PSBkYXRhU3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnNwbGl0VGV4dChkYXRhU3RyLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSBkYXRhU3RyO1xuICAgICAgICB9XG4gICAgfSwgKCkgPT4gdGV4dChkYXRhKSwgdHJ1ZSAvLyBUZXh0IG5vZGVzIHNob3VsZCBub3QgdXBkYXRlIGxhc3QgaW5kZXggc2luY2UgaXQgaXMgbGlrZWx5IG5vdCB3b3J0aCBpdCB0byBlbGltaW5hdGUgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBhY3R1YWwgZWxlbWVudHNcbiAgICApO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIGZpbmRfY29tbWVudChub2RlcywgdGV4dCwgc3RhcnQpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIGNvbW1lbnQgbm9kZSAqLyAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGNsYWltX2h0bWxfdGFnKG5vZGVzLCBpc19zdmcpIHtcbiAgICAvLyBmaW5kIGh0bWwgb3BlbmluZyB0YWdcbiAgICBjb25zdCBzdGFydF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX1NUQVJUJywgMCk7XG4gICAgY29uc3QgZW5kX2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfRU5EJywgc3RhcnRfaW5kZXgpO1xuICAgIGlmIChzdGFydF9pbmRleCA9PT0gZW5kX2luZGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgSHRtbFRhZ0h5ZHJhdGlvbih1bmRlZmluZWQsIGlzX3N2Zyk7XG4gICAgfVxuICAgIGluaXRfY2xhaW1faW5mbyhub2Rlcyk7XG4gICAgY29uc3QgaHRtbF90YWdfbm9kZXMgPSBub2Rlcy5zcGxpY2Uoc3RhcnRfaW5kZXgsIGVuZF9pbmRleCAtIHN0YXJ0X2luZGV4ICsgMSk7XG4gICAgZGV0YWNoKGh0bWxfdGFnX25vZGVzWzBdKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbaHRtbF90YWdfbm9kZXMubGVuZ3RoIC0gMV0pO1xuICAgIGNvbnN0IGNsYWltZWRfbm9kZXMgPSBodG1sX3RhZ19ub2Rlcy5zbGljZSgxLCBodG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBuLmNsYWltX29yZGVyID0gbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkO1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKGNsYWltZWRfbm9kZXMsIGlzX3N2Zyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZWxlY3Quc2VsZWN0ZWRJbmRleCA9IC0xOyAvLyBubyBvcHRpb24gc2hvdWxkIGJlIHNlbGVjdGVkXG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIobm9kZSwgZm4pIHtcbiAgICBjb25zdCBjb21wdXRlZF9zdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKGNvbXB1dGVkX3N0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG4gICAgY29uc3QgaWZyYW1lID0gZWxlbWVudCgnaWZyYW1lJyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogYmxvY2s7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBsZWZ0OiAwOyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyAnICtcbiAgICAgICAgJ292ZXJmbG93OiBoaWRkZW47IGJvcmRlcjogMDsgb3BhY2l0eTogMDsgcG9pbnRlci1ldmVudHM6IG5vbmU7IHotaW5kZXg6IC0xOycpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBpZnJhbWUudGFiSW5kZXggPSAtMTtcbiAgICBjb25zdCBjcm9zc29yaWdpbiA9IGlzX2Nyb3Nzb3JpZ2luKCk7XG4gICAgbGV0IHVuc3Vic2NyaWJlO1xuICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICBpZnJhbWUuc3JjID0gXCJkYXRhOnRleHQvaHRtbCw8c2NyaXB0Pm9ucmVzaXplPWZ1bmN0aW9uKCl7cGFyZW50LnBvc3RNZXNzYWdlKDAsJyonKX08L3NjcmlwdD5cIjtcbiAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4od2luZG93LCAnbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PT0gaWZyYW1lLmNvbnRlbnRXaW5kb3cpXG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJztcbiAgICAgICAgaWZyYW1lLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKGlmcmFtZS5jb250ZW50V2luZG93LCAncmVzaXplJywgZm4pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBhcHBlbmQobm9kZSwgaWZyYW1lKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodW5zdWJzY3JpYmUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGV0YWNoKGlmcmFtZSk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lLCB0b2dnbGUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cbmZ1bmN0aW9uIGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwsIHsgYnViYmxlcyA9IGZhbHNlLCBjYW5jZWxhYmxlID0gZmFsc2UgfSA9IHt9KSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGJ1YmJsZXMsIGNhbmNlbGFibGUsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5mdW5jdGlvbiBxdWVyeV9zZWxlY3Rvcl9hbGwoc2VsZWN0b3IsIHBhcmVudCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoaXNfc3ZnID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5pc19zdmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19zdmcgPSBpc19zdmc7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgfVxuICAgIG0oaHRtbCwgdGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5lKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc19zdmcpXG4gICAgICAgICAgICAgICAgdGhpcy5lID0gc3ZnX2VsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLmUgPSBlbGVtZW50KHRhcmdldC5ub2RlTmFtZSk7XG4gICAgICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pKGFuY2hvcik7XG4gICAgfVxuICAgIGgoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnQodGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgICAgIHRoaXMuaSh0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cbmNsYXNzIEh0bWxUYWdIeWRyYXRpb24gZXh0ZW5kcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihjbGFpbWVkX25vZGVzLCBpc19zdmcgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc19zdmcpO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgICAgICB0aGlzLmwgPSBjbGFpbWVkX25vZGVzO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgaWYgKHRoaXMubCkge1xuICAgICAgICAgICAgdGhpcy5uID0gdGhpcy5sO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3VwZXIuYyhodG1sKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0X2h5ZHJhdGlvbih0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGF0dHJpYnV0ZV90b19vYmplY3QoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmVzdWx0W2F0dHJpYnV0ZS5uYW1lXSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMoZWxlbWVudCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIHJlc3VsdFtub2RlLnNsb3QgfHwgJ2RlZmF1bHQnXSA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gd2UgbmVlZCB0byBzdG9yZSB0aGUgaW5mb3JtYXRpb24gZm9yIG11bHRpcGxlIGRvY3VtZW50cyBiZWNhdXNlIGEgU3ZlbHRlIGFwcGxpY2F0aW9uIGNvdWxkIGFsc28gY29udGFpbiBpZnJhbWVzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8zNjI0XG5jb25zdCBtYW5hZ2VkX3N0eWxlcyA9IG5ldyBNYXAoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zdHlsZV9pbmZvcm1hdGlvbihkb2MsIG5vZGUpIHtcbiAgICBjb25zdCBpbmZvID0geyBzdHlsZXNoZWV0OiBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKSwgcnVsZXM6IHt9IH07XG4gICAgbWFuYWdlZF9zdHlsZXMuc2V0KGRvYywgaW5mbyk7XG4gICAgcmV0dXJuIGluZm87XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGNvbnN0IGRvYyA9IGdldF9yb290X2Zvcl9zdHlsZShub2RlKTtcbiAgICBjb25zdCB7IHN0eWxlc2hlZXQsIHJ1bGVzIH0gPSBtYW5hZ2VkX3N0eWxlcy5nZXQoZG9jKSB8fCBjcmVhdGVfc3R5bGVfaW5mb3JtYXRpb24oZG9jLCBub2RlKTtcbiAgICBpZiAoIXJ1bGVzW25hbWVdKSB7XG4gICAgICAgIHJ1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBtYW5hZ2VkX3N0eWxlcy5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBzdHlsZXNoZWV0IH0gPSBpbmZvO1xuICAgICAgICAgICAgbGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICAgICAgaW5mby5ydWxlcyA9IHt9O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFuYWdlZF9zdHlsZXMuY2xlYXIoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwsIHsgY2FuY2VsYWJsZSA9IGZhbHNlIH0gPSB7fSkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwsIHsgY2FuY2VsYWJsZSB9KTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAhZXZlbnQuZGVmYXVsdFByZXZlbnRlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0O1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbmZ1bmN0aW9uIGdldEFsbENvbnRleHRzKCkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0O1xufVxuZnVuY3Rpb24gaGFzQ29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5oYXMoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4uY2FsbCh0aGlzLCBldmVudCkpO1xuICAgIH1cbn1cblxuY29uc3QgZGlydHlfY29tcG9uZW50cyA9IFtdO1xuY29uc3QgaW50cm9zID0geyBlbmFibGVkOiBmYWxzZSB9O1xuY29uc3QgYmluZGluZ19jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHNjaGVkdWxlX3VwZGF0ZSgpIHtcbiAgICBpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcbiAgICAgICAgdXBkYXRlX3NjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHJlc29sdmVkX3Byb21pc2UudGhlbihmbHVzaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdGljaygpIHtcbiAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICByZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcbiAgICByZW5kZXJfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG4gICAgZmx1c2hfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuLy8gZmx1c2goKSBjYWxscyBjYWxsYmFja3MgaW4gdGhpcyBvcmRlcjpcbi8vIDEuIEFsbCBiZWZvcmVVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW5cbi8vIDIuIEFsbCBiaW5kOnRoaXMgY2FsbGJhY2tzLCBpbiByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIDMuIEFsbCBhZnRlclVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlbi4gRVhDRVBUXG4vLyAgICBmb3IgYWZ0ZXJVcGRhdGVzIGNhbGxlZCBkdXJpbmcgdGhlIGluaXRpYWwgb25Nb3VudCwgd2hpY2ggYXJlIGNhbGxlZCBpblxuLy8gICAgcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyBTaW5jZSBjYWxsYmFja3MgbWlnaHQgdXBkYXRlIGNvbXBvbmVudCB2YWx1ZXMsIHdoaWNoIGNvdWxkIHRyaWdnZXIgYW5vdGhlclxuLy8gY2FsbCB0byBmbHVzaCgpLCB0aGUgZm9sbG93aW5nIHN0ZXBzIGd1YXJkIGFnYWluc3QgdGhpczpcbi8vIDEuIER1cmluZyBiZWZvcmVVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBiZSBhZGRlZCB0byB0aGVcbi8vICAgIGRpcnR5X2NvbXBvbmVudHMgYXJyYXkgYW5kIHdpbGwgY2F1c2UgYSByZWVudHJhbnQgY2FsbCB0byBmbHVzaCgpLiBCZWNhdXNlXG4vLyAgICB0aGUgZmx1c2ggaW5kZXggaXMga2VwdCBvdXRzaWRlIHRoZSBmdW5jdGlvbiwgdGhlIHJlZW50cmFudCBjYWxsIHdpbGwgcGlja1xuLy8gICAgdXAgd2hlcmUgdGhlIGVhcmxpZXIgY2FsbCBsZWZ0IG9mZiBhbmQgZ28gdGhyb3VnaCBhbGwgZGlydHkgY29tcG9uZW50cy4gVGhlXG4vLyAgICBjdXJyZW50X2NvbXBvbmVudCB2YWx1ZSBpcyBzYXZlZCBhbmQgcmVzdG9yZWQgc28gdGhhdCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbFxuLy8gICAgbm90IGludGVyZmVyZSB3aXRoIHRoZSBcInBhcmVudFwiIGZsdXNoKCkgY2FsbC5cbi8vIDIuIGJpbmQ6dGhpcyBjYWxsYmFja3MgY2Fubm90IHRyaWdnZXIgbmV3IGZsdXNoKCkgY2FsbHMuXG4vLyAzLiBEdXJpbmcgYWZ0ZXJVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBOT1QgaGF2ZSB0aGVpciBhZnRlclVwZGF0ZVxuLy8gICAgY2FsbGJhY2sgY2FsbGVkIGEgc2Vjb25kIHRpbWU7IHRoZSBzZWVuX2NhbGxiYWNrcyBzZXQsIG91dHNpZGUgdGhlIGZsdXNoKClcbi8vICAgIGZ1bmN0aW9uLCBndWFyYW50ZWVzIHRoaXMgYmVoYXZpb3IuXG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmxldCBmbHVzaGlkeCA9IDA7IC8vIERvICpub3QqIG1vdmUgdGhpcyBpbnNpZGUgdGhlIGZsdXNoKCkgZnVuY3Rpb25cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNhdmVkX2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGZsdXNoaWR4IDwgZGlydHlfY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbZmx1c2hpZHhdO1xuICAgICAgICAgICAgZmx1c2hpZHgrKztcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZsdXNoaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHNlZW5fY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHNhdmVkX2NvbXBvbmVudCk7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSAocHJvZ3JhbS5iIC0gdCk7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5ibG9ja3NbaV0gPT09IGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2goaW5mbywgY3R4LCBkaXJ0eSkge1xuICAgIGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuICAgIGNvbnN0IHsgcmVzb2x2ZWQgfSA9IGluZm87XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby50aGVuKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLnZhbHVlXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLmNhdGNoKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLmVycm9yXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpbmZvLmJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCB2b2lkX2VsZW1lbnRfbmFtZXMgPSAvXig/OmFyZWF8YmFzZXxicnxjb2x8Y29tbWFuZHxlbWJlZHxocnxpbWd8aW5wdXR8a2V5Z2VufGxpbmt8bWV0YXxwYXJhbXxzb3VyY2V8dHJhY2t8d2JyKSQvO1xuZnVuY3Rpb24gaXNfdm9pZChuYW1lKSB7XG4gICAgcmV0dXJuIHZvaWRfZWxlbWVudF9uYW1lcy50ZXN0KG5hbWUpIHx8IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJyFkb2N0eXBlJztcbn1cblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgYXR0cnNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChhdHRyc190b19hZGQpIHtcbiAgICAgICAgY29uc3QgY2xhc3Nlc190b19hZGQgPSBhdHRyc190b19hZGQuY2xhc3NlcztcbiAgICAgICAgY29uc3Qgc3R5bGVzX3RvX2FkZCA9IGF0dHJzX3RvX2FkZC5zdHlsZXM7XG4gICAgICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0eWxlc190b19hZGQpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnN0eWxlID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZXNfdG9fYWRkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuc3R5bGUgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKG1lcmdlX3Nzcl9zdHlsZXMoYXR0cmlidXRlcy5zdHlsZSwgc3R5bGVzX3RvX2FkZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IGAgJHtuYW1lfT1cIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmZ1bmN0aW9uIG1lcmdlX3Nzcl9zdHlsZXMoc3R5bGVfYXR0cmlidXRlLCBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICBjb25zdCBzdHlsZV9vYmplY3QgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGluZGl2aWR1YWxfc3R5bGUgb2Ygc3R5bGVfYXR0cmlidXRlLnNwbGl0KCc7JykpIHtcbiAgICAgICAgY29uc3QgY29sb25faW5kZXggPSBpbmRpdmlkdWFsX3N0eWxlLmluZGV4T2YoJzonKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGluZGl2aWR1YWxfc3R5bGUuc2xpY2UoMCwgY29sb25faW5kZXgpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbmRpdmlkdWFsX3N0eWxlLnNsaWNlKGNvbG9uX2luZGV4ICsgMSkudHJpbSgpO1xuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZV9kaXJlY3RpdmVbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgc3R5bGVfb2JqZWN0W25hbWVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZV9vYmplY3Q7XG59XG5jb25zdCBBVFRSX1JFR0VYID0gL1smXCJdL2c7XG5jb25zdCBDT05URU5UX1JFR0VYID0gL1smPF0vZztcbi8qKlxuICogTm90ZTogdGhpcyBtZXRob2QgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIGFuZCBoYXMgYmVlbiBvcHRpbWl6ZWRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvcHVsbC81NzAxXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZSh2YWx1ZSwgaXNfYXR0ciA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc3RyID0gU3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBwYXR0ZXJuID0gaXNfYXR0ciA/IEFUVFJfUkVHRVggOiBDT05URU5UX1JFR0VYO1xuICAgIHBhdHRlcm4ubGFzdEluZGV4ID0gMDtcbiAgICBsZXQgZXNjYXBlZCA9ICcnO1xuICAgIGxldCBsYXN0ID0gMDtcbiAgICB3aGlsZSAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgY29uc3QgaSA9IHBhdHRlcm4ubGFzdEluZGV4IC0gMTtcbiAgICAgICAgY29uc3QgY2ggPSBzdHJbaV07XG4gICAgICAgIGVzY2FwZWQgKz0gc3RyLnN1YnN0cmluZyhsYXN0LCBpKSArIChjaCA9PT0gJyYnID8gJyZhbXA7JyA6IChjaCA9PT0gJ1wiJyA/ICcmcXVvdDsnIDogJyZsdDsnKSk7XG4gICAgICAgIGxhc3QgPSBpICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGVzY2FwZWQgKyBzdHIuc3Vic3RyaW5nKGxhc3QpO1xufVxuZnVuY3Rpb24gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSh2YWx1ZSkge1xuICAgIC8vIGtlZXAgYm9vbGVhbnMsIG51bGwsIGFuZCB1bmRlZmluZWQgZm9yIHRoZSBzYWtlIG9mIGBzcHJlYWRgXG4gICAgY29uc3Qgc2hvdWxkX2VzY2FwZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpO1xuICAgIHJldHVybiBzaG91bGRfZXNjYXBlID8gZXNjYXBlKHZhbHVlLCB0cnVlKSA6IHZhbHVlO1xufVxuZnVuY3Rpb24gZXNjYXBlX29iamVjdChvYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMsIGNvbnRleHQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKGNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCB7ICQkc2xvdHMgPSB7fSwgY29udGV4dCA9IG5ldyBNYXAoKSB9ID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdGl0bGU6ICcnLCBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgJCRzbG90cywgY29udGV4dCk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LnRpdGxlICsgcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgY29uc3QgYXNzaWdubWVudCA9IChib29sZWFuICYmIHZhbHVlID09PSB0cnVlKSA/ICcnIDogYD1cIiR7ZXNjYXBlKHZhbHVlLCB0cnVlKX1cImA7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7YXNzaWdubWVudH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiAnJztcbn1cbmZ1bmN0aW9uIHN0eWxlX29iamVjdF90b19zdHJpbmcoc3R5bGVfb2JqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHN0eWxlX29iamVjdClcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gc3R5bGVfb2JqZWN0W2tleV0pXG4gICAgICAgIC5tYXAoa2V5ID0+IGAke2tleX06ICR7c3R5bGVfb2JqZWN0W2tleV19O2ApXG4gICAgICAgIC5qb2luKCcgJyk7XG59XG5mdW5jdGlvbiBhZGRfc3R5bGVzKHN0eWxlX29iamVjdCkge1xuICAgIGNvbnN0IHN0eWxlcyA9IHN0eWxlX29iamVjdF90b19zdHJpbmcoc3R5bGVfb2JqZWN0KTtcbiAgICByZXR1cm4gc3R5bGVzID8gYCBzdHlsZT1cIiR7c3R5bGVzfVwiYCA6ICcnO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvciwgY3VzdG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICBpZiAoIWN1c3RvbUVsZW1lbnQpIHtcbiAgICAgICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBhcHBlbmRfc3R5bGVzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKG9wdGlvbnMuY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eSxcbiAgICAgICAgc2tpcF9ib3VuZDogZmFsc2UsXG4gICAgICAgIHJvb3Q6IG9wdGlvbnMudGFyZ2V0IHx8IHBhcmVudF9jb21wb25lbnQuJCQucm9vdFxuICAgIH07XG4gICAgYXBwZW5kX3N0eWxlcyAmJiBhcHBlbmRfc3R5bGVzKCQkLnJvb3QpO1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBvcHRpb25zLnByb3BzIHx8IHt9LCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgc3RhcnRfaHlkcmF0aW5nKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvciwgb3B0aW9ucy5jdXN0b21FbGVtZW50KTtcbiAgICAgICAgZW5kX2h5ZHJhdGluZygpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbl9tb3VudCB9ID0gdGhpcy4kJDtcbiAgICAgICAgICAgIHRoaXMuJCQub25fZGlzY29ubmVjdCA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QpO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cy4gVXNlZCB3aGVuIGRldj1mYWxzZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy40OS4wJyB9LCBkZXRhaWwpLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbl9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9kZXYobm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlJywgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gWydjYXB0dXJlJ10gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01BZGRFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgIGNvbnN0IGRpc3Bvc2UgPSBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0QXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUsIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gcHJvcF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldFByb3BlcnR5JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhc2V0JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhJywgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJyAmJiAhKGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiAnbGVuZ3RoJyBpbiBhcmcpKSB7XG4gICAgICAgIGxldCBtc2cgPSAneyNlYWNofSBvbmx5IGl0ZXJhdGVzIG92ZXIgYXJyYXktbGlrZSBvYmplY3RzLic7XG4gICAgICAgIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIGFyZyAmJiBTeW1ib2wuaXRlcmF0b3IgaW4gYXJnKSB7XG4gICAgICAgICAgICBtc2cgKz0gJyBZb3UgY2FuIHVzZSBhIHNwcmVhZCB0byBjb252ZXJ0IHRoaXMgaXRlcmFibGUgaW50byBhbiBhcnJheS4nO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3Nsb3RzKG5hbWUsIHNsb3QsIGtleXMpIHtcbiAgICBmb3IgKGNvbnN0IHNsb3Rfa2V5IG9mIE9iamVjdC5rZXlzKHNsb3QpKSB7XG4gICAgICAgIGlmICghfmtleXMuaW5kZXhPZihzbG90X2tleSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgPCR7bmFtZX0+IHJlY2VpdmVkIGFuIHVuZXhwZWN0ZWQgc2xvdCBcIiR7c2xvdF9rZXl9XCIuYCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9keW5hbWljX2VsZW1lbnQodGFnKSB7XG4gICAgY29uc3QgaXNfc3RyaW5nID0gdHlwZW9mIHRhZyA9PT0gJ3N0cmluZyc7XG4gICAgaWYgKHRhZyAmJiAhaXNfc3RyaW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignPHN2ZWx0ZTplbGVtZW50PiBleHBlY3RzIFwidGhpc1wiIGF0dHJpYnV0ZSB0byBiZSBhIHN0cmluZy4nKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV92b2lkX2R5bmFtaWNfZWxlbWVudCh0YWcpIHtcbiAgICBpZiAodGFnICYmIGlzX3ZvaWQodGFnKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDxzdmVsdGU6ZWxlbWVudCB0aGlzPVwiJHt0YWd9XCI+IGlzIHNlbGYtY2xvc2luZyBhbmQgY2Fubm90IGhhdmUgY29udGVudC5gKTtcbiAgICB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzIHdpdGggc29tZSBtaW5vciBkZXYtZW5oYW5jZW1lbnRzLiBVc2VkIHdoZW4gZGV2PXRydWUuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbi8qKlxuICogQmFzZSBjbGFzcyB0byBjcmVhdGUgc3Ryb25nbHkgdHlwZWQgU3ZlbHRlIGNvbXBvbmVudHMuXG4gKiBUaGlzIG9ubHkgZXhpc3RzIGZvciB0eXBpbmcgcHVycG9zZXMgYW5kIHNob3VsZCBiZSB1c2VkIGluIGAuZC50c2AgZmlsZXMuXG4gKlxuICogIyMjIEV4YW1wbGU6XG4gKlxuICogWW91IGhhdmUgY29tcG9uZW50IGxpYnJhcnkgb24gbnBtIGNhbGxlZCBgY29tcG9uZW50LWxpYnJhcnlgLCBmcm9tIHdoaWNoXG4gKiB5b3UgZXhwb3J0IGEgY29tcG9uZW50IGNhbGxlZCBgTXlDb21wb25lbnRgLiBGb3IgU3ZlbHRlK1R5cGVTY3JpcHQgdXNlcnMsXG4gKiB5b3Ugd2FudCB0byBwcm92aWRlIHR5cGluZ3MuIFRoZXJlZm9yZSB5b3UgY3JlYXRlIGEgYGluZGV4LmQudHNgOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFN2ZWx0ZUNvbXBvbmVudFR5cGVkIH0gZnJvbSBcInN2ZWx0ZVwiO1xuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50VHlwZWQ8e2Zvbzogc3RyaW5nfT4ge31cbiAqIGBgYFxuICogVHlwaW5nIHRoaXMgbWFrZXMgaXQgcG9zc2libGUgZm9yIElERXMgbGlrZSBWUyBDb2RlIHdpdGggdGhlIFN2ZWx0ZSBleHRlbnNpb25cbiAqIHRvIHByb3ZpZGUgaW50ZWxsaXNlbnNlIGFuZCB0byB1c2UgdGhlIGNvbXBvbmVudCBsaWtlIHRoaXMgaW4gYSBTdmVsdGUgZmlsZVxuICogd2l0aCBUeXBlU2NyaXB0OlxuICogYGBgc3ZlbHRlXG4gKiA8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuICogXHRpbXBvcnQgeyBNeUNvbXBvbmVudCB9IGZyb20gXCJjb21wb25lbnQtbGlicmFyeVwiO1xuICogPC9zY3JpcHQ+XG4gKiA8TXlDb21wb25lbnQgZm9vPXsnYmFyJ30gLz5cbiAqIGBgYFxuICpcbiAqICMjIyMgV2h5IG5vdCBtYWtlIHRoaXMgcGFydCBvZiBgU3ZlbHRlQ29tcG9uZW50KERldilgP1xuICogQmVjYXVzZVxuICogYGBgdHNcbiAqIGNsYXNzIEFTdWJjbGFzc09mU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50PHtmb286IHN0cmluZ30+IHt9XG4gKiBjb25zdCBjb21wb25lbnQ6IHR5cGVvZiBTdmVsdGVDb21wb25lbnQgPSBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudDtcbiAqIGBgYFxuICogd2lsbCB0aHJvdyBhIHR5cGUgZXJyb3IsIHNvIHdlIG5lZWQgdG8gc2VwYXJhdGUgdGhlIG1vcmUgc3RyaWN0bHkgdHlwZWQgY2xhc3MuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50RGV2IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBIdG1sVGFnSHlkcmF0aW9uLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlQ29tcG9uZW50VHlwZWQsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3N0eWxlcywgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQsIGFwcGVuZF9oeWRyYXRpb24sIGFwcGVuZF9oeWRyYXRpb25fZGV2LCBhcHBlbmRfc3R5bGVzLCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9odG1sX3RhZywgY2xhaW1fc3BhY2UsIGNsYWltX3N2Z19lbGVtZW50LCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVuZF9oeWRyYXRpbmcsIGVzY2FwZSwgZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSwgZXNjYXBlX29iamVjdCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRBbGxDb250ZXh0cywgZ2V0Q29udGV4dCwgZ2V0X2FsbF9kaXJ0eV9mcm9tX3Njb3BlLCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzLCBnZXRfcm9vdF9mb3Jfc3R5bGUsIGdldF9zbG90X2NoYW5nZXMsIGdldF9zcHJlYWRfb2JqZWN0LCBnZXRfc3ByZWFkX3VwZGF0ZSwgZ2V0X3N0b3JlX3ZhbHVlLCBnbG9iYWxzLCBncm91cF9vdXRyb3MsIGhhbmRsZV9wcm9taXNlLCBoYXNDb250ZXh0LCBoYXNfcHJvcCwgaWRlbnRpdHksIGluaXQsIGluc2VydCwgaW5zZXJ0X2RldiwgaW5zZXJ0X2h5ZHJhdGlvbiwgaW5zZXJ0X2h5ZHJhdGlvbl9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfY3Jvc3NvcmlnaW4sIGlzX2VtcHR5LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgaXNfdm9pZCwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtZXJnZV9zc3Jfc3R5bGVzLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcXVlcnlfc2VsZWN0b3JfYWxsLCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3JjX3VybF9lcXVhbCwgc3RhcnRfaHlkcmF0aW5nLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB0cnVzdGVkLCB1cGRhdGVfYXdhaXRfYmxvY2tfYnJhbmNoLCB1cGRhdGVfa2V5ZWRfZWFjaCwgdXBkYXRlX3Nsb3QsIHVwZGF0ZV9zbG90X2Jhc2UsIHZhbGlkYXRlX2NvbXBvbmVudCwgdmFsaWRhdGVfZHluYW1pY19lbGVtZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgdmFsaWRhdGVfdm9pZF9keW5hbWljX2VsZW1lbnQsIHhsaW5rX2F0dHIgfTtcbiIsIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgbm9kZTtcbiAgY29uc3QgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qge3gseX09IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qge3RvcDp0LCBsZWZ0OmwsIGhlaWdodDpofSA9IHJlY3RcbiAgbGV0IHRvcCAgPSAteSArIHQgKyBoICsgM1xuICBsZXQgbGVmdCA9IC14ICsgbCAtIDVcbiAgbGV0IHtcbiAgICBkZXNjcmlwdGlvbixcbiAgICBpbmNvbXBsZXRlLFxuICAgIGNyaXRlcmlvbjEsXG4gICAgY3JpdGVyaW9uMixcbiAgICBoZWxwVXJsLFxuICAgIGltcGFjdCxcbiAgICBodG1sLFxuICAgIGFsbCxcbiAgICBhbnksXG4gICAgaGVscCxcbiAgICB0YWdzLFxuICAgIGdycCxcbiAgICBlbCxcbiAgfSA9IG5vZGUuX2F4ZV9cblxuICBmdW5jdGlvbiByZWZvcm1hdChhcnIpIHtcbiAgICBjb25zdCByZ3ggPSAvKFtcXGQuIzpdKykoIHxcXHcrKS9nXG4gICAgcmV0dXJuIGFyci5tYXAoaXRlbT0+e1xuICAgICAgbGV0IHgxID0gaXRlbS5tZXNzYWdlXG4gICAgICBjb25zdCB4MiA9IHgxLm1hdGNoKHJneClcbiAgICAgIHgxID0geDEucmVwbGFjZSgvPC9nLCcmbHQ7JykucmVwbGFjZSgvPi9nLCcmZ3Q7JylcbiAgICAgIHgyICYmIHgyLmZpbHRlcih4PT54Lmxlbmd0aD4yKS5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICB4MSA9IHgxLnJlcGxhY2UoZWxlbWVudCwgYDxiPiR7ZWxlbWVudH08L2I+YClcbiAgICAgIH0pXG4gICAgICByZXR1cm4geDFcbiAgICB9KVxuICB9XG4gIGFsbCA9IHJlZm9ybWF0KGFsbClcbiAgYW55ID0gcmVmb3JtYXQoYW55KVxuXG4gIGxldCBzdHlsZVxuICBpZiAoZ3JwLm1hdGNoKC9wYWdlLS8pKSB7XG4gICAgc3R5bGUgPSBgdG9wOiR7dG9wfXB4O2xlZnQ6MDtyaWdodDowO21hcmdpbjphdXRvO2BcbiAgfSBlbHNlIHtcbiAgICBzdHlsZSA9IGB0b3A6MDtsZWZ0OjA7b3BhY2l0eTowO2BcbiAgfVxuXG4gIHNldFRpbWVvdXQoKCk9PiB7XG4gICAgY29uc3QgcG9wdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYTExeS1wb3B1cCcpXG4gICAgY29uc3Qge1xuICAgICAgd2lkdGg6cG9wV2lkdGgsXG4gICAgICBoZWlnaHQ6cG9wSGVpZ2h0XG4gICAgfSA9IHBvcHVwLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICBjb25zdCB3aW5IZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICBjb25zdCB3aW5ZT2Zmc3QgPSB3aW5kb3cucGFnZVlPZmZzZXRcbiAgICBpZiAodG9wK3BvcEhlaWdodD53aW5IZWlnaHQtd2luWU9mZnN0KSB7XG4gICAgICB0b3AgLT0gKHBvcEhlaWdodCArIDMwKVxuICAgIH1cblxuICAgIGNvbnN0IHdpbldpZHRoID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aFxuICAgIGNvbnN0IHdpblhPZmZzdD0gd2luZG93LnBhZ2VYT2Zmc2V0XG4gICAgaWYgKGxlZnQrcG9wV2lkdGg+d2luV2lkdGgtd2luWE9mZnN0KSB7XG4gICAgICBsZWZ0IC09IChwb3BXaWR0aCAtIDE4KSBcbiAgICB9XG4gICAgaWYgKG5vZGUuc3R5bGUucG9zaXRpb249PT0nZml4ZWQnKSB7XG4gICAgICAvLyBpZiBib3ggaW4gZml4ZWQgcG9zaXRpb24sIHBvcHVwIHRvbyhhbmQgdXBkYXRlIHRvcCBwb3NpdGlvbilcbiAgICAgIHBvcHVwLnN0eWxlID0gYHRvcDoke3RvcC13aW5ZT2Zmc3R9cHg7bGVmdDoke2xlZnR9cHg7cG9zaXRpb246Zml4ZWQ7YFxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZ3JwLm1hdGNoKC9wYWdlLS8pKSB7XG4gICAgICAgIHBvcHVwLnN0eWxlID0gYHRvcDoke3RvcH1weDtsZWZ0OjA7cmlnaHQ6MDttYXJnaW46YXV0bztgXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3B1cC5zdHlsZSA9IGB0b3A6JHt0b3B9cHg7bGVmdDoke2xlZnR9cHg7YFxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBmdW5jdGlvbiByYXRpbygpIHtcbiAgICBjb25zdCB7XG4gICAgICBjb250cmFzdFJhdGlvLFxuICAgICAgZXhwZWN0ZWRDb250cmFzdFJhdGlvLFxuICAgIH0gPSBub2RlLl9heGVfLmFueVswXS5kYXRhXG4gICAgaWYgKGNvbnRyYXN0UmF0aW8pIHtcbiAgICAgIHJldHVybiBgXG4gICAgICAsIGNvbnRyYXN0IHJhdGlvOiAke2NvbnRyYXN0UmF0aW99LFxuICAgICAgZXhwZWN0ZWQ6ICR7ZXhwZWN0ZWRDb250cmFzdFJhdGlvfS5gXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHtnZXRDb2xvciwgY29udHJhc3R9ID0gd2luZG93Lm1pdG0uZm5cbiAgICAgIGNvbnN0IHJhdGlvID0gY29udHJhc3QoLi4uZ2V0Q29sb3IoZWwpKVxuICAgICAgcmV0dXJuIGAuIENvbnRyYXN0IHJhdGlvOiAke3JhdGlvfS5gXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY29weXRvKGUpIHtcbiAgICBjb25zdCBodG1sID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmExMXktY29udGVudCcpLmlubmVySFRNTFxuICAgIGNvbnN0IHR5cGUgPSAndGV4dC9wbGFpbidcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2h0bWxdLCB7dHlwZX0pXG4gICAgY29uc3QgZGF0YSA9IG5ldyBDbGlwYm9hcmRJdGVtKHtbdHlwZV06IGJsb2J9KVxuXG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZShbZGF0YV0pLnRoZW4oXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignY29weSB0byBjbGlwYm9hcmQgZXJyb3InLCBlcnIpXG4gICAgICB9XG4gICAgKVxuXG4gICAgY29uc3QgaWMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaWNvcGllZCcpXG4gICAgaWMuc3R5bGUgPSAnZGlzcGxheTpibG9jazsnXG4gICAgc2V0VGltZW91dCgoKT0+e2ljLnN0eWxlID0gJyd9LCAzMDAwKVxuICB9XG5cbiAgc2V0VGltZW91dCgoKSA9PiBobGpzLmhpZ2hsaWdodEFsbCgpKVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJhMTF5LXBvcHVwXCIge3N0eWxlfT5cbiAgPHNwYW4gY2xhc3M9XCJpY29weVwiIG9uOmNsaWNrPXtjb3B5dG99PlxuICAgIDxzdmcgd2lkdGg9XCIxNnB4XCIgaGVpZ2h0PVwiMTZweFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiB2ZXJzaW9uPVwiMS4xXCI+XG4gICAgICA8ZyBpZD1cInN1cmZhY2UxXCI+XG4gICAgICA8cGF0aCBzdHlsZT1cIiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigwJSwwJSwwJSk7ZmlsbC1vcGFjaXR5OjE7XCIgZD1cIk0gMTAuODgyODEyIDQuMDI3MzQ0IEwgMTAuODgyODEyIDAgTCAxLjczMDQ2OSAwIEwgMS43MzA0NjkgMTIuMjY5NTMxIEwgNS4xMTcxODggMTIuMjY5NTMxIEwgNS4xMTcxODggMTYgTCAxNC4yNjk1MzEgMTYgTCAxNC4yNjk1MzEgNy40MTc5NjkgWiBNIDEwLjg4MjgxMiA1LjQ2NDg0NCBMIDEyLjUzNTE1NiA3LjExNzE4OCBMIDEwLjg4MjgxMiA3LjExNzE4OCBaIE0gMi43NDYwOTQgMTEuMjUzOTA2IEwgMi43NDYwOTQgMS4wMTU2MjUgTCA5Ljg2MzI4MSAxLjAxNTYyNSBMIDkuODYzMjgxIDMuNzMwNDY5IEwgNS4xMTcxODggMy43MzA0NjkgTCA1LjExNzE4OCAxMS4yNTM5MDYgWiBNIDYuMTM2NzE5IDE0Ljk4NDM3NSBMIDYuMTM2NzE5IDQuNzQ2MDk0IEwgOS44NjMyODEgNC43NDYwOTQgTCA5Ljg2MzI4MSA4LjEzNjcxOSBMIDEzLjI1MzkwNiA4LjEzNjcxOSBMIDEzLjI1MzkwNiAxNC45ODQzNzUgWiBNIDYuMTM2NzE5IDE0Ljk4NDM3NSBcIi8+XG4gICAgICA8L2c+XG4gICAgPC9zdmc+XG4gICAgPHNwYW4gY2xhc3M9XCJpY29waWVkXCI+Q29waWVkIHRvIGNsaXBib2FyZDwvc3Bhbj5cbiAgPC9zcGFuPlxuICA8ZGl2IGNsYXNzPVwiYTExeS1jb250ZW50XCI+XG4gICAgPGg0PntoZWxwfTwvaDQ+XG4gICAgPHA+e2Rlc2NyaXB0aW9ufTwvcD5cbiAgICA8cCBjbGFzcz10Z3M+PGI+dGFnczo8L2I+XG4gICAgICB7I2VhY2ggdGFncyBhcyB0YWd9XG4gICAgICAgIHsjaWYgY3JpdGVyaW9uMVt0YWddfVxuICAgICAgICAgIDxhIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIiBocmVmPVwie2NyaXRlcmlvbjFbdGFnXS5saW5rfVwiPnt0YWd9PC9hPlxuICAgICAgICB7OmVsc2V9XG4gICAgICAgICAge3RhZ31cbiAgICAgICAgey9pZn1cbiAgICAgICAgJm5ic3A7XG4gICAgICB7L2VhY2h9XG4gICAgPC9wPlxuICAgIDxwPlxuICAgICAgPGI+Y3JpdGVyaWE6PC9iPlxuICAgICAgeyNlYWNoIE9iamVjdC5lbnRyaWVzKGNyaXRlcmlvbjIpIGFzIFtrZXksIHZhbHVlXX1cbiAgICAgICAgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiIGhyZWY9XCJ7dmFsdWUubGlua31cIj57dmFsdWUubmFtZX08L2E+LCBcbiAgICAgIHsvZWFjaH1cbiAgICAgIDxhIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIiBocmVmPVwie2hlbHBVcmx9XCI+e2dycH08L2E+XG4gICAgPC9wPlxuICA8L2Rpdj5cbiAgPGRldGFpbHMgb3Blbj5cbiAgICA8c3VtbWFyeT48Yj5pbXBhY3Q6PC9iPiB7aW1wYWN0fTwvc3VtbWFyeT5cbiAgICB7I2lmIGFsbC5sZW5ndGh8fGFueS5sZW5ndGh9XG4gICAgICA8aHIvPlxuICAgICAgPGRpdiBjbGFzcz1wcmU+XG4gICAgICAgIHsjaWYgYWxsLmxlbmd0aD4xfVxuICAgICAgICAgIDxiPkZpeCBBTEwgb2YgdGhlIGZvbGxvd2luZzo8L2I+XG4gICAgICAgICAgPG9sPlxuICAgICAgICAgIHsjZWFjaCBhbGwgYXMgY2F0fVxuICAgICAgICAgICAgPGxpPntAaHRtbCBjYXR9PC9saT5cbiAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgPC9vbD5cbiAgICAgICAgezplbHNlIGlmIGFsbC5sZW5ndGg9PT0xfVxuICAgICAgICAgIHtAaHRtbCBhbGxbMF19XG4gICAgICAgIHs6ZWxzZSBpZiBhbnkubGVuZ3RoPjF9XG4gICAgICAgICAgPGI+Rml4IE9ORSBvZiB0aGUgZm9sbG93aW5nOjwvYj5cbiAgICAgICAgICA8b2w+XG4gICAgICAgICAgeyNlYWNoIGFueSBhcyBjYXR9XG4gICAgICAgICAgICA8bGk+e0BodG1sIGNhdH08L2xpPlxuICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICA8L29sPlxuICAgICAgICB7OmVsc2UgaWYgYW55Lmxlbmd0aD09PTF9XG4gICAgICAgICAge0BodG1sIGFueVswXX1cbiAgICAgICAgey9pZn1cbiAgICAgICAgeyNpZiBpbmNvbXBsZXRlICYmIGdycD09PSdjb2xvci1jb250cmFzdCd9XG4gICAgICAgICAge3JhdGlvKCl9XG4gICAgICAgIHsvaWZ9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxoci8+XG4gICAgey9pZn1cbiAgICA8ZGl2IGNsYXNzPXByZT5cbiAgICAgIDxwcmU+PGNvZGUgY2xhc3M9XCJsYW5ndWFnZS1odG1sXCI+e2h0bWx9PC9jb2RlPjwvcHJlPlxuICAgIDwvZGl2PlxuICA8L2RldGFpbHM+XG48L2Rpdj5cblxuPHN0eWxlPlxuLmExMXktcG9wdXAge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjI4LCAxOTYsIDAuNjUpO1xuICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoNHB4KTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IDJweDtcbiAgcGFkZGluZzogMCAxMHB4O1xuICBoZWlnaHQ6IGF1dG87XG4gIHdpZHRoOiAzNjBweDtcbiAgYm94LXNoYWRvdzogXG4gICAgcmdiKDAgMCAwIC8gMjUlKSAwcHggIDU0cHggNTVweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggLTEycHggMzBweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggICA0cHggIDZweCwgXG4gICAgcmdiKDAgMCAwIC8gMTclKSAwcHggIDEycHggMTNweCwgXG4gICAgcmdiKDAgMCAwIC8gIDklKSAwcHggIC0zcHggIDVweDtcbn1cbi5pY29weSB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICByaWdodDogMTBweDtcbiAgdG9wOiAxMHB4O1xufVxuLmljb3BpZWQge1xuICBhbmltYXRpb246IGJsaW5rZXIgMXMgbGluZWFyIGluZmluaXRlO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBjb2xvcjogYnJvd247XG4gIGRpc3BsYXk6IG5vbmU7XG4gIHJpZ2h0OiAzMHB4O1xuICB0b3A6IDIzcHg7XG59XG5Aa2V5ZnJhbWVzIGJsaW5rZXIge1xuICA1MCUge29wYWNpdHk6IDA7fVxufVxuaDQge1xuICBtYXJnaW46IDEwcHggMDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBmb250LXdlaWdodDogNzAwO1xufVxucCB7XG4gIG1hcmdpbjogMC4ycmVtIDA7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmRldGFpbHMge1xuICBtYXJnaW4tYm90dG9tOiA4cHg7XG59XG5kZXRhaWxzIHN1bW1hcnkge1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4udGdzIHtcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xuICB0ZXh0LWFsaWduOiBpbmhlcml0O1xufVxuLnByZSB7XG4gIGZvbnQtc2l6ZTogMTEuNXB4O1xufVxuLnByZSBvbCB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZy1pbmxpbmUtc3RhcnQ6IDE1cHg7XG59XG5wcmUge1xuICBmb250LWZhbWlseTogdWktbW9ub3NwYWNlLCBtb25vc3BhY2U7XG4gIHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbWFyZ2luOiAwO1xufVxucHJlIGNvZGUge1xuICBwYWRkaW5nOiA1cHg7XG59XG48L3N0eWxlPlxuIiwiY29uc3QgY3NwQXJyID0gW1xuICAnZGVmYXVsdC1zcmMnLFxuICAnY2hpbGQtc3JjJyxcbiAgJ2Nvbm5lY3Qtc3JjJyxcbiAgJ2ZvbnQtc3JjJyxcbiAgJ2ZyYW1lLXNyYycsXG4gICdpbWctc3JjJyxcbiAgJ21hbmlmZXN0LXNyYycsXG4gICdtZWRpYS1zcmMnLFxuICAnb2JqZWN0LXNyYycsXG4gICdwcmVmZXRjaC1zcmMnLFxuICAnc2NyaXB0LXNyYycsXG4gICdzY3JpcHQtc3JjLWVsZW0nLFxuICAnc2NyaXB0LXNyYy1hdHRyJyxcbiAgJ3N0eWxlLXNyYycsXG4gICdzdHlsZS1zcmMtZWxlbScsXG4gICdzdHlsZS1zcmMtYXR0cicsXG4gICd3b3JrZXItc3JjJyxcbiAgJ2Jhc2UtdXJpJyxcbiAgJ3BsdWdpbi10eXBlcycsXG4gICdzYW5kYm94JyxcbiAgJ25hdmlnYXRlLXRvJyxcbiAgJ2Zvcm0tYWN0aW9uJyxcbiAgJ2ZyYW1lLWFuY2VzdG9ycycsXG4gICd1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJyxcbiAgJ3JlcG9ydC11cmknLFxuICAncmVwb3J0LXRvJyxcbl1cbmNvbnN0IGNzcEZldGNoID0gW1xuICAnZGVmYXVsdC1zcmMnLFxuICAnY2hpbGQtc3JjJyxcbiAgJ2Nvbm5lY3Qtc3JjJyxcbiAgJ2ZvbnQtc3JjJyxcbiAgJ2ZyYW1lLXNyYycsXG4gICdpbWctc3JjJyxcbiAgJ21hbmlmZXN0LXNyYycsXG4gICdtZWRpYS1zcmMnLFxuICAnb2JqZWN0LXNyYycsXG4gICdwcmVmZXRjaC1zcmMnLFxuICAnc2NyaXB0LXNyYycsXG4gICdzdHlsZS1zcmMnLFxuICAnd29ya2VyLXNyYycsXG5dXG5jb25zdCBjc3BFQXR0ciA9IFtcbiAgJ3NjcmlwdC1zcmMtZWxlbScsXG4gICdzY3JpcHQtc3JjLWF0dHInLFxuICAnc3R5bGUtc3JjLWVsZW0nLFxuICAnc3R5bGUtc3JjLWF0dHInLFxuXVxuY29uc3QgY3NwSW5mbyA9IHtcbiAgJ2RlZmF1bHQtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZGVmYXVsdC1zcmMnLFxuICAgIG5vdGU6ICdpcyBhIGZhbGxiYWNrIGRpcmVjdGl2ZSBmb3IgdGhlIG90aGVyIGZldGNoIGRpcmVjdGl2ZXM6IDxiPmNoaWxkLXNyYzwvYj4sIDxiPmNvbm5lY3Qtc3JjPC9iPiwgPGI+Zm9udC1zcmM8L2I+LCA8Yj5pbWctc3JjPC9iPiwgPGI+bWFuaWZlc3Qtc3JjPC9iPiwgPGI+bWVkaWEtc3JjPC9iPiwgPGI+cHJlZmV0Y2gtc3JjPC9iPiwgPGI+b2JqZWN0LXNyYzwvYj4sIDxiPnNjcmlwdC1zcmMoc2NyaXB0LXNyYy1lbGVtLCBzY3JpcHQtc3JjLWF0dHIpPC9iPiwgPGI+c3R5bGUtc3JjKHN0eWxlLXNyYy1lbGVtLCBzdHlsZS1zcmMtYXR0cik8L2I+LidcbiAgfSxcbiAgJ2NoaWxkLXNyYyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2NoaWxkLXNyYycsXG4gICAgbm90ZTogJ2FsbG93cyB0aGUgZGV2ZWxvcGVyIHRvIGNvbnRyb2wgbmVzdGVkIGJyb3dzaW5nIGNvbnRleHRzIGFuZCB3b3JrZXIgZXhlY3V0aW9uIGNvbnRleHRzLidcbiAgfSxcbiAgJ2Nvbm5lY3Qtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvY29ubmVjdC1zcmMnLFxuICAgIG5vdGU6ICdwcm92aWRlcyBjb250cm9sIG92ZXIgZmV0Y2ggcmVxdWVzdHMsIFhIUiwgZXZlbnRzb3VyY2UsIGJlYWNvbiBhbmQgd2Vic29ja2V0cyBjb25uZWN0aW9ucy4nXG4gIH0sXG4gICdmb250LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZvbnQtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHdoaWNoIFVSTHMgdG8gbG9hZCBmb250cyBmcm9tLidcbiAgfSxcbiAgJ2ZyYW1lLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZyYW1lLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBuZXN0ZWQgYnJvd3NpbmcgY29udGV4dHMgbG9hZGluZyB1c2luZyBlbGVtZW50cyBzdWNoIGFzICZsdDtmcmFtZSZndDsgYW5kICZsdDtpZnJhbWUmZ3Q7LidcbiAgfSxcbiAgJ2ltZy1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9pbWctc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIHRoYXQgaW1hZ2VzIGNhbiBiZSBsb2FkZWQgZnJvbS4nXG4gIH0sXG4gICdtYW5pZmVzdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9tYW5pZmVzdC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgdGhhdCBhcHBsaWNhdGlvbiBtYW5pZmVzdHMgbWF5IGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ21lZGlhLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L21lZGlhLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyBmcm9tIHdoaWNoIHZpZGVvLCBhdWRpbyBhbmQgdGV4dCB0cmFjayByZXNvdXJjZXMgY2FuIGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ29iamVjdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9vYmplY3Qtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcGx1Z2lucyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xuICB9LFxuICAncHJlZmV0Y2gtc3JjJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcHJlZmV0Y2gtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcmVzb3VyY2VzIGNhbiBiZSBwcmVmZXRjaGVkIGZyb20uJ1xuICB9LFxuICAnc2NyaXB0LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIGxvY2F0aW9ucyBmcm9tIHdoaWNoIGEgc2NyaXB0IGNhbiBiZSBleGVjdXRlZCBmcm9tLiBJdCBpcyBhIGZhbGxiYWNrIGRpcmVjdGl2ZSBmb3Igb3RoZXIgc2NyaXB0LWxpa2UgZGlyZWN0aXZlczogPGI+c2NyaXB0LXNyYy1lbGVtPC9iPiwgPGI+c2NyaXB0LXNyYy1hdHRyPC9iPidcbiAgfSxcbiAgJ3NjcmlwdC1zcmMtZWxlbSc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMtZWxlbScsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0ICZsdDtzY3JpcHQmZ3Q7IGVsZW1lbnRzLCBidXQgbm90IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLidcbiAgfSxcbiAgJ3NjcmlwdC1zcmMtYXR0cic6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMtYXR0cicsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0IGlubGluZSBldmVudCBoYW5kbGVycy4gVGhpcyBpbmNsdWRlcyBvbmx5IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLCBidXQgbm90IFVSTHMgbG9hZGVkIGRpcmVjdGx5IGludG8gJmx0O3NjcmlwdCZndDsgZWxlbWVudHMuJ1xuICB9LFxuICAnc3R5bGUtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcbiAgICBub3RlOiAnY29udHJvbHMgZnJvbSB3aGVyZSBzdHlsZXMgZ2V0IGFwcGxpZWQgdG8gYSBkb2N1bWVudC4gVGhpcyBpbmNsdWRlcyA8bGluaz4gZWxlbWVudHMsIEBpbXBvcnQgcnVsZXMsIGFuZCByZXF1ZXN0cyBvcmlnaW5hdGluZyBmcm9tIGEgTGluayBIVFRQIHJlc3BvbnNlIGhlYWRlciBmaWVsZDogPGI+c3R5bGUtc3JjLWVsZW08L2I+LCA8Yj5zdHlsZS1zcmMtYXR0cjwvYj4nXG4gIH0sXG4gICdzdHlsZS1zcmMtZWxlbSc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBzdHlsZXNoZWV0cyAmbHQ7c3R5bGUmZ3Q7IGVsZW1lbnRzIGFuZCAmbHQ7bGluayZndDsgZWxlbWVudHMgd2l0aCByZWw9XCJzdHlsZXNoZWV0XCIuJ1xuICB9LFxuICAnc3R5bGUtc3JjLWF0dHInOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgaW5saW5lIHN0eWxlcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgRE9NIGVsZW1lbnRzLidcbiAgfSxcbiAgJ3dvcmtlci1zcmMnOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS93b3JrZXItc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIFdvcmtlciwgU2hhcmVkV29ya2VyLCBvciBTZXJ2aWNlV29ya2VyIHNjcmlwdHMuJ1xuICB9LFxuICAnYmFzZS11cmknOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9iYXNlLXVyaScsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgcG9zc2libGUgVVJMcyB0aGF0IHRoZSAmbHQ7YmFzZSZndDsgZWxlbWVudCBjYW4gdXNlLidcbiAgfSxcbiAgJ3BsdWdpbi10eXBlcyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3BsdWdpbi10eXBlcycsXG4gICAgbm90ZTogJ2xpbWl0cyB0aGUgdHlwZXMgb2YgcmVzb3VyY2VzIHRoYXQgY2FuIGJlIGxvYWRlZCBpbnRvIHRoZSBkb2N1bWVudCAoZS5nLiBhcHBsaWNhdGlvbi9wZGYpLiAzIHJ1bGVzIGFwcGx5IHRvIHRoZSBhZmZlY3RlZCBlbGVtZW50cywgJmx0O2VtYmVkJmd0OyBhbmQgJmx0O29iamVjdCZndDsnLFxuICAgIGRlcHJlY2F0ZWQ6IHRydWVcbiAgfSxcbiAgJ3NhbmRib3gnOiB7XG4gICAgbGV2ZWw6ICcxLjEvMicsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zYW5kYm94JyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBwb3NzaWJsZSBVUkxzIHRoYXQgdGhlICZsdDtiYXNlJmd0OyBlbGVtZW50IGNhbiB1c2UuJ1xuICB9LFxuICAnbmF2aWdhdGUtdG8nOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9uYXZpZ2F0ZS10bycsXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB3aGljaCBhIGRvY3VtZW50IGNhbiBuYXZpZ2F0ZSB0byBieSBhbnkgbWVhbiAobm90IHlldCBzdXBwb3J0ZWQgYnkgbW9kZXJuIGJyb3dzZXJzIGluIEphbiAyMDIxKS4nXG4gIH0sXG4gICdmb3JtLWFjdGlvbic6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Zvcm0tYWN0aW9uJyxcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHdoaWNoIHRoZSBmb3JtcyBjYW4gc3VibWl0IHRvLidcbiAgfSxcbiAgJ2ZyYW1lLWFuY2VzdG9ycyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZyYW1lLWFuY2VzdG9ycycsXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB0aGF0IGNhbiBlbWJlZCB0aGUgcmVxdWVzdGVkIHJlc291cmNlIGluc2lkZSBvZiAmbHQ7ZnJhbWUmZ3Q7LCAmbHQ7aWZyYW1lJmd0OywgJmx0O29iamVjdCZndDssICZsdDtlbWJlZCZndDssIG9yICZsdDthcHBsZXQmZ3Q7IGVsZW1lbnRzLidcbiAgfSxcbiAgJ3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnOiB7XG4gICAgbGV2ZWw6ICc/JyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnLFxuICAgIG5vdGU6ICdpbnN0cnVjdHMgdXNlciBhZ2VudHMgdG8gdHJlYXQgYWxsIG9mIGEgc2l0ZVxcJ3MgaW5zZWN1cmUgVVJMcyAodGhvc2Ugc2VydmVkIG92ZXIgSFRUUCkgYXMgdGhvdWdoIHRoZXkgaGF2ZSBiZWVuIHJlcGxhY2VkIHdpdGggc2VjdXJlIFVSTHMgKHRob3NlIHNlcnZlZCBvdmVyIEhUVFBTKS4gVGhpcyBkaXJlY3RpdmUgaXMgaW50ZW5kZWQgZm9yIHdlYiBzaXRlcyB3aXRoIGxhcmdlIG51bWJlcnMgb2YgaW5zZWN1cmUgbGVnYWN5IFVSTHMgdGhhdCBuZWVkIHRvIGJlIHJld3JpdHRlbi4nXG4gIH0sXG4gICdyZXBvcnQtdXJpJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcmVwb3J0LXVyaScsXG4gICAgbm90ZTogJ2RpcmVjdGl2ZSBpcyBkZXByZWNhdGVkIGJ5IHJlcG9ydC10bywgd2hpY2ggaXMgYSBVUkkgdGhhdCB0aGUgcmVwb3J0cyBhcmUgc2VudCB0by4nLFxuICAgIGRlcHJlY2F0ZWQ6IHRydWVcbiAgfSxcbiAgJ3JlcG9ydC10byc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3JlcG9ydC10bycsXG4gICAgbm90ZTogJ3doaWNoIGlzIGEgZ3JvdXBuYW1lIGRlZmluZWQgaW4gdGhlIGhlYWRlciBpbiBhIGpzb24gZm9ybWF0dGVkIGhlYWRlciB2YWx1ZS4nXG4gIH0sXG59XG5jb25zdCBwb2xpY3kgPSB7XG4gICdub25lJyAgOiAnV29uXFwndCBhbGxvdyBsb2FkaW5nIG9mIGFueSByZXNvdXJjZXMuJyxcbiAgJ2Jsb2I6JyA6ICdSYXcgZGF0YSB0aGF0IGlzblxcJ3QgbmVjZXNzYXJpbHkgaW4gYSBKYXZhU2NyaXB0LW5hdGl2ZSBmb3JtYXQuJyxcbiAgJ2RhdGE6JyA6ICdPbmx5IGFsbG93IHJlc291cmNlcyBmcm9tIHRoZSBkYXRhIHNjaGVtZSAoaWU6IEJhc2U2NCBlbmNvZGVkIGltYWdlcykuJyxcbiAgXCInc2VsZidcIjogJ09ubHkgYWxsb3cgcmVzb3VyY2VzIGZyb20gdGhlIGN1cnJlbnQgb3JpZ2luLicsXG4gIFwiJ3Vuc2FmZS1pbmxpbmUnXCI6ICcnLFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3NwQXJyLFxuICBjc3BJbmZvLFxuICBjc3BGZXRjaCxcbiAgY3NwRUF0dHIsXG4gIHBvbGljeSxcbn0iLCI8c2NyaXB0PlxuaW1wb3J0IHtvbk1vdW50fSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHtcbiAgY3NwQXJyLFxuICBjc3BJbmZvLFxuICBjc3BGZXRjaCxcbiAgY3NwRUF0dHIsXG59IGZyb20gJy4vX2NzcC1kaXJlY3RpdmUnXG5sZXQgY3NwID0gd2luZG93Lm1pdG0uaW5mby5jc3BcbmxldCByZXBvcnRUbyA9IGNzcC5yZXBvcnRUb1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc3QgZmFsbGJhY2sgPSB0cnVlXG4gIGNvbnN0IHtwb2xpY3l9ID0gY3NwWydkZWZhdWx0LXNyYyddIHx8IHt9XG4gIGlmIChwb2xpY3kgJiYgcG9saWN5Lmxlbmd0aD4wKSB7XG4gICAgZm9yIChjb25zdCBpZCBvZiBjc3BGZXRjaCkge1xuICAgICAgaWYgKCFjc3BbaWRdKSB7XG4gICAgICAgIGNzcFtpZF0gPSB7cG9saWN5LCBmYWxsYmFja31cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBpZCBvZiBjc3BFQXR0cikge1xuICAgIGNvbnN0IHBhciA9IGlkLnJlcGxhY2UoLy0uezR9JC8sICcnKVxuICAgIGNvbnN0IHtwb2xpY3l9ID0gY3NwW3Bhcl0gfHwge31cbiAgICBpZiAoIWNzcFtpZF0gJiYgcG9saWN5KSB7XG4gICAgICBjc3BbaWRdID0ge3BvbGljeSwgZmFsbGJhY2t9XG4gICAgfVxuICB9XG4gIGlmIChyZXBvcnRUbyE9PSdKU09OIEVycm9yIScgJiYgcmVwb3J0VG8/Lmxlbmd0aCA+IDE1KSB7XG4gICAgbGV0IGNiID0gcmVwb3J0VG8ucmVwbGFjZSgvXFxuL2csJycpLnRyaW0oKVxuICAgIGlmIChjYlswXT09PSd7JyAmJiBjYi5zbGljZSgtMSk9PT0nfScpIHtcbiAgICAgIGNiID0gSlNPTi5zdHJpbmdpZnkoSlNPTi5wYXJzZShgWyR7Y2J9XWApLCBudWxsLCAyKVxuICAgICAgcmVwb3J0VG8gPSBjYi5yZXBsYWNlKC9cXFt8XFxdL2csICcnKS5yZXBsYWNlKC9cXG4gIC9nLCAnXFxuJykudHJpbSgpXG4gICAgfVxuICB9XG59KVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxiPkNvbnRlbnQgU2VjdXJpdHkgUG9saWN5PC9iPlxuICA8cD5cbiAgICBDU1Agb246XG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0NTUFwiPk1vemlsbGE8L2E+LCBcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vY29udGVudC1zZWN1cml0eS1wb2xpY3kuY29tL1wiPmNvbnRlbnQtc2VjdXJpdHktcG9saWN5LmNvbTwvYT4sXG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2NoZWF0c2hlZXRzZXJpZXMub3dhc3Aub3JnL2NoZWF0c2hlZXRzL0NvbnRlbnRfU2VjdXJpdHlfUG9saWN5X0NoZWF0X1NoZWV0Lmh0bWxcIj5PV0FTUC1jaGVhdC1zaGVldDwvYT5cbiAgPC9wPlxuICA8ZGl2PlxuICAgIHsjZWFjaCBjc3BBcnIgYXMgaWQsIGl9XG4gICAgeyNpZiBjc3BbaWRdfSAgICAgIFxuICAgICAgPGRldGFpbHM+PHN1bW1hcnkgY2xhc3M9e2NzcFtpZF0uZmFsbGJhY2sgPyAnZmFsbGJhY2snIDogJyd9PlxuICAgICAgICB7I2lmIGNzcEluZm9baWRdLmxpbmt9XG4gICAgICAgICAge2krMX0ue2lkfTooe2NzcFtpZF0ucG9saWN5Lmxlbmd0aH0pPGEgdGFyZ2V0PWJsYW5rIGhyZWY9e2NzcEluZm9baWRdLmxpbmt9PjxzbWFsbD52e2NzcEluZm9baWRdLmxldmVsfTwvc21hbGw+PC9hPlxuICAgICAgICB7OmVsc2V9XG4gICAgICAgICAge2krMX0ue2lkfTooe2NzcFtpZF0ucG9saWN5Lmxlbmd0aH0pPHNtYWxsPnZ7Y3NwSW5mb1tpZF0ubGV2ZWx9PC9zbWFsbD5cbiAgICAgICAgey9pZn1cbiAgICAgIDwvc3VtbWFyeT5cbiAgICAgICAgeyNpZiBjc3BJbmZvW2lkXS5ub3RlfVxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPVwibm90ZVwiPjxzdW1tYXJ5PmV4cGFuZC4uLjwvc3VtbWFyeT5cbiAgICAgICAgICAgIDxzbWFsbD57QGh0bWwgY3NwSW5mb1tpZF0ubm90ZX08L3NtYWxsPlxuICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgey9pZn1cbiAgICAgICAgeyNlYWNoIGNzcFtpZF0ucG9saWN5IGFzIGl0ZW0sIHh9XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW1cIj57eCsxfTp7aXRlbX08L2Rpdj5cbiAgICAgICAgey9lYWNofVxuICAgICAgPC9kZXRhaWxzPlxuICAgIHsvaWZ9XG4gICAgey9lYWNofVxuICAgIDxociAvPlxuICAgIDxkZXRhaWxzPjxzdW1tYXJ5IGNsYXNzPVwicmVwb3J0XCI+PGI+cmVwb3J0LXRvPC9iPjo8L3N1bW1hcnk+XG4gICAgICA8ZGV0YWlscyBjbGFzcz1cIm5vdGVcIj48c3VtbWFyeT5leHBhbmQuLi48L3N1bW1hcnk+XG4gICAgICAgIDxzbWFsbD57QGh0bWwgJ3VzZWQgdG8gc3BlY2lmeSBkZXRhaWxzIGFib3V0IHRoZSBkaWZmZXJlbnQgZW5kcG9pbnRzIHRoYXQgYSB1c2VyLWFnZW50IGhhcyBhdmFpbGFibGUgdG8gaXQgZm9yIGRlbGl2ZXJpbmcgcmVwb3J0cyB0by4gWW91IGNhbiB0aGVuIHJldHJpZXZlIHJlcG9ydHMgYnkgbWFraW5nIGEgcmVxdWVzdCB0byB0aG9zZSBVUkxzLid9PC9zbWFsbD5cbiAgICAgIDwvZGV0YWlscz5cbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtXCI+e3JlcG9ydFRvfTwvZGl2PlxuICAgIDwvZGV0YWlscz5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cbmRldGFpbHMubm90ZSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgc3VtbWFyeSB7XG4gICAgY29sb3I6IHJlZDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgZm9udC1zaXplOiB4LXNtYWxsO1xuICAgIG1hcmdpbi1sZWZ0OiAtMTRweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICAmOjotd2Via2l0LWRldGFpbHMtbWFya2VyIHtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG4gICAgfVxuICB9XG59IFxuc3VtbWFyeSwuaXRlbSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC1mYW1pbHk6ICdDb3VyaWVyIE5ldycsIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogc21hbGw7XG4gICY6aG92ZXIge1xuICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Ymx1ZTtcbiAgfVxufVxuc3VtbWFyeS5mYWxsYmFjayB7XG4gIGNvbG9yOiBkYXJrcmVkO1xufVxuLml0ZW0ge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG4gIGZvbnQtc2l6ZTogc21hbGxlcjtcbiAgY29sb3I6ICM5MTAwY2Q7XG59XG48L3N0eWxlPiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xuY29uc3QgX2MgPSAnY29sb3I6IGJsdWV2aW9sZXQnXG5cbmxldCBrZXlzID0gW11cbiQ6IF9rZXlzID0ga2V5c1xuXG5mdW5jdGlvbiByZWxvYWRLZXlzKCkge1xuICBjb25zb2xlLmxvZygnJWNSZWxvYWQgaG90a2V5cy4nLCBfYyk7XG4gIGNvbnN0IHttYWNyb2tleXM6IG1rZXl9ID0gd2luZG93Lm1pdG1cbiAga2V5cyA9IFtdXG4gIGZvciAoY29uc3QgaWQgaW4gbWtleSkge1xuICAgIGtleXMucHVzaCh7aWQsIHRpdGxlOiBta2V5W2lkXS5fdGl0bGV9KVxuICB9XG59XG5cbmxldCBvYnNlcnZlclxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHFyeSA9ICcubWl0bS1jb250YWluZXIuY2VudGVyJ1xuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxcnkpXG4gIGNvbnN0IG5vZGVWaXNpYmxlID0gb2JzID0+IHtcbiAgICBpZiAobm9kZS5hdHRyaWJ1dGVzLnN0eWxlKSB7XG4gICAgICByZWxvYWRLZXlzKClcbiAgICB9XG4gIH1cbiAgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihub2RlVmlzaWJsZSk7XG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2F0dHJpYnV0ZXM6IHRydWV9KVxuICBzZXRUaW1lb3V0KHJlbG9hZEtleXMsIDEwMDApXG59KTtcblxub25EZXN0cm95KCgpID0+IHtcbiAgaWYgKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgb2JzZXJ2ZXIgPSB1bmRlZmluZWRcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIGhhbmRsZUNsaWNrKGUpIHtcbiAgY29uc3Qga2V5ID0gZS50YXJnZXQuZGF0YXNldC5pZFxuICBjb25zdCBmbiA9IG1pdG0ubWFjcm9rZXlzW2tleV1cbiAgbGV0IFt0eXAsIC4uLmFycl0gPSBrZXkuc3BsaXQoJzonKVxuICBjb25zdCBvcHQgPSB7fVxuICBpZiAodHlwPT09J2tleScpIHtcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXG4gICAgbGV0IGtcbiAgICBpZiAocWN0bCkge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIGsgPSBxY3RsWzFdLnN1YnN0cigtMSlcbiAgICB9IGVsc2UgaWYgKHFhbHQpIHtcbiAgICAgIGsuY3RybEtleSA9IHRydWVcbiAgICAgIGsgPSBxYWx0WzFdLnN1YnN0cigtMSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxuICAgICAgayA9IGFyci5wb3AoKS5zdWJzdHIoLTEpXG4gICAgfVxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcbiAgICBvcHQuY29kZSA9IGBLZXkke2sudG9VcHBlckNhc2UoKX1gXG4gICAgb3B0LmtleSA9IG1pdG0uZm4uY29kZVRvQ2hhcihvcHQpXG4gIH0gZWxzZSBpZiAodHlwPT09J2NvZGUnKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGlmIChxY3RsKSB7XG4gICAgICBvcHQuY3RybEtleSA9IHRydWVcbiAgICAgIGFyciA9IHFjdGxbMV0uc3BsaXQoJzonKVxuICAgIH0gZWxzZSBpZiAocWFsdCkge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIGFyciA9IHFhbHRbMV0uc3BsaXQoJzonKVxuICAgIH0gZWxzZSB7XG4gICAgICBvcHQuY3RybEtleSA9IHRydWVcbiAgICAgIG9wdC5hbHRLZXkgID0gdHJ1ZVxuICAgIH1cbiAgICBvcHQuY29kZSA9IGFyci5wb3AoKVxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcbiAgICBvcHQua2V5ID0gbWl0bS5mbi5jb2RlVG9DaGFyKG9wdClcbiAgfVxuICBpZiAoZm4pIHtcbiAgICBjb25zdCBtYWNybyA9IGZuKG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgb3B0KSlcbiAgICBtaXRtLmZuLm1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIGt0b1Nob3coaykge1xuICByZXR1cm4gay5zcGxpdCgnJykubWFwKHg9PmAke3h9YCkuam9pbignICcpXG59XG5cbmZ1bmN0aW9uIGtjb2RlKG9iaikge1xuICBjb25zdCBrZXkgPSBvYmouaWRcbiAgY29uc3Qge2NvZGVUb0NoYXI6IGNoYXJ9ID0gbWl0bS5mblxuICBsZXQgW3R5cCwgLi4uYXJyXSA9IGtleS5zcGxpdCgnOicpXG4gIGNvbnN0IG9wdCA9IHt9XG4gIGxldCBtc2dcbiAgaWYgKHR5cD09PSdrZXknKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGlmICAgICAgKHFjdGwpIHsgbXNnID0gYGN0bCAuIC4uLiDih74gJHtrdG9TaG93KHFjdGxbMV0pfWAgIH1cbiAgICBlbHNlIGlmIChxYWx0KSB7IG1zZyA9IGBhbHQgLiAuLi4g4oe+ICR7a3RvU2hvdyhxYWx0WzFdKX1gICB9XG4gICAgZWxzZSAgICAgICAgICAgeyBtc2cgPSBgY3RsICsgYWx0IOKHviAke2t0b1Nob3coYXJyLnBvcCgpKX1gfVxuICB9IGVsc2UgaWYgKHR5cD09PSdjb2RlJykge1xuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcbiAgICBpZiAgICAgIChxY3RsKSB7IG1zZyA9ICdjdGwgLiAuLi4g4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KHFjdGxbMV0pfVxuICAgIGVsc2UgaWYgKHFhbHQpIHsgbXNnID0gJ2FsdCAuIC4uLiDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3cocWFsdFsxXSl9XG4gICAgZWxzZSAgICAgICAgICAgeyBtc2cgPSAnY3RsICsgYWx0IOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhhcnIuam9pbignOicpKX1cbiAgfVxuICByZXR1cm4gbXNnXG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInZib3hcIj5cbiAgPGI+SG90LWtleXM6PC9iPlxuICA8dGFibGU+XG4gICAgeyNlYWNoIF9rZXlzIGFzIG9iaixpfVxuICAgICAgPHRyPlxuICAgICAgICA8dGQgY2xhc3M9XCJub1wiPntpKzF9PC90ZD5cbiAgICAgICAgPHRkIGNsYXNzPVwia2NvZGVcIiBkYXRhLWlkPXtvYmouaWR9IG9uOmNsaWNrPXtoYW5kbGVDbGlja30+XG4gICAgICAgICAge2tjb2RlKG9iail9XG4gICAgICAgIDwvdGQ+XG4gICAgICAgIDx0ZCBjbGFzcz1cInRpdGxlXCI+e29iai50aXRsZX08L3RkPlxuICAgICAgPC90cj5cbiAgICB7L2VhY2h9XG4gIDwvdGFibGU+XG48L2Rpdj5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cbiAgLnZib3gge1xuICAgIGNvbG9yOmJsdWU7XG4gICAgbGVmdDogMDtcbiAgICByaWdodDogMDtcbiAgfVxuICB0YWJsZSB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgY29sb3I6IG1hcm9vbjtcbiAgICBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xuICAgIHRyOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTk5LCAxNjYsIDExNiwgMC40NTIpO1xuICAgICAgLmtjb2RlIHtcbiAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG4gICAgICAgICY6aG92ZXIge1xuICAgICAgICAgIGNvbG9yOiByZWQ7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRkIHtcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDVweDtcbiAgICB9XG4gICAgLm5vIHtcbiAgICAgIHBhZGRpbmc6IDA7XG4gICAgICB3aWR0aDogMjVweDtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICB9XG4gICAgLmtjb2RlIHtcbiAgICAgIGZvbnQtZmFtaWx5OiAnQ291cmllciBOZXcnLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICB9XG4gICAgLnRpdGxlIHtcbiAgICAgIGZvbnQtZmFtaWx5OiAnR2lsbCBTYW5zJywgJ0dpbGwgU2FucyBNVCcsIENhbGlicmksICdUcmVidWNoZXQgTVMnLCBzYW5zLXNlcmlmO1xuICAgICAgd2lkdGg6IDUwJTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIE5vdGU6IFRoaXMgcmVnZXggbWF0Y2hlcyBldmVuIGludmFsaWQgSlNPTiBzdHJpbmdzLCBidXQgc2luY2Ugd2XigJlyZVxuLy8gd29ya2luZyBvbiB0aGUgb3V0cHV0IG9mIGBKU09OLnN0cmluZ2lmeWAgd2Uga25vdyB0aGF0IG9ubHkgdmFsaWQgc3RyaW5nc1xuLy8gYXJlIHByZXNlbnQgKHVubGVzcyB0aGUgdXNlciBzdXBwbGllZCBhIHdlaXJkIGBvcHRpb25zLmluZGVudGAgYnV0IGluXG4vLyB0aGF0IGNhc2Ugd2UgZG9u4oCZdCBjYXJlIHNpbmNlIHRoZSBvdXRwdXQgd291bGQgYmUgaW52YWxpZCBhbnl3YXkpLlxudmFyIHN0cmluZ09yQ2hhciA9IC8oXCIoPzpbXlxcXFxcIl18XFxcXC4pKlwiKXxbOixdL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5naWZ5KHBhc3NlZE9iaiwgb3B0aW9ucykge1xuICB2YXIgaW5kZW50LCBtYXhMZW5ndGgsIHJlcGxhY2VyO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpbmRlbnQgPSBKU09OLnN0cmluZ2lmeShcbiAgICBbMV0sXG4gICAgdW5kZWZpbmVkLFxuICAgIG9wdGlvbnMuaW5kZW50ID09PSB1bmRlZmluZWQgPyAyIDogb3B0aW9ucy5pbmRlbnRcbiAgKS5zbGljZSgyLCAtMyk7XG4gIG1heExlbmd0aCA9XG4gICAgaW5kZW50ID09PSBcIlwiXG4gICAgICA/IEluZmluaXR5XG4gICAgICA6IG9wdGlvbnMubWF4TGVuZ3RoID09PSB1bmRlZmluZWRcbiAgICAgID8gODBcbiAgICAgIDogb3B0aW9ucy5tYXhMZW5ndGg7XG4gIHJlcGxhY2VyID0gb3B0aW9ucy5yZXBsYWNlcjtcblxuICByZXR1cm4gKGZ1bmN0aW9uIF9zdHJpbmdpZnkob2JqLCBjdXJyZW50SW5kZW50LCByZXNlcnZlZCkge1xuICAgIC8vIHByZXR0aWVyLWlnbm9yZVxuICAgIHZhciBlbmQsIGluZGV4LCBpdGVtcywga2V5LCBrZXlQYXJ0LCBrZXlzLCBsZW5ndGgsIG5leHRJbmRlbnQsIHByZXR0aWZpZWQsIHN0YXJ0LCBzdHJpbmcsIHZhbHVlO1xuXG4gICAgaWYgKG9iaiAmJiB0eXBlb2Ygb2JqLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBvYmogPSBvYmoudG9KU09OKCk7XG4gICAgfVxuXG4gICAgc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkob2JqLCByZXBsYWNlcik7XG5cbiAgICBpZiAoc3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgbGVuZ3RoID0gbWF4TGVuZ3RoIC0gY3VycmVudEluZGVudC5sZW5ndGggLSByZXNlcnZlZDtcblxuICAgIGlmIChzdHJpbmcubGVuZ3RoIDw9IGxlbmd0aCkge1xuICAgICAgcHJldHRpZmllZCA9IHN0cmluZy5yZXBsYWNlKFxuICAgICAgICBzdHJpbmdPckNoYXIsXG4gICAgICAgIGZ1bmN0aW9uIChtYXRjaCwgc3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgIHJldHVybiBzdHJpbmdMaXRlcmFsIHx8IG1hdGNoICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICBpZiAocHJldHRpZmllZC5sZW5ndGggPD0gbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBwcmV0dGlmaWVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXBsYWNlciAhPSBudWxsKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKHN0cmluZyk7XG4gICAgICByZXBsYWNlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogIT09IG51bGwpIHtcbiAgICAgIG5leHRJbmRlbnQgPSBjdXJyZW50SW5kZW50ICsgaW5kZW50O1xuICAgICAgaXRlbXMgPSBbXTtcbiAgICAgIGluZGV4ID0gMDtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICBzdGFydCA9IFwiW1wiO1xuICAgICAgICBlbmQgPSBcIl1cIjtcbiAgICAgICAgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChcbiAgICAgICAgICAgIF9zdHJpbmdpZnkob2JqW2luZGV4XSwgbmV4dEluZGVudCwgaW5kZXggPT09IGxlbmd0aCAtIDEgPyAwIDogMSkgfHxcbiAgICAgICAgICAgICAgXCJudWxsXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IFwie1wiO1xuICAgICAgICBlbmQgPSBcIn1cIjtcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgICBrZXlQYXJ0ID0gSlNPTi5zdHJpbmdpZnkoa2V5KSArIFwiOiBcIjtcbiAgICAgICAgICB2YWx1ZSA9IF9zdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIG5leHRJbmRlbnQsXG4gICAgICAgICAgICBrZXlQYXJ0Lmxlbmd0aCArIChpbmRleCA9PT0gbGVuZ3RoIC0gMSA/IDAgOiAxKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2goa2V5UGFydCArIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtzdGFydCwgaW5kZW50ICsgaXRlbXMuam9pbihcIixcXG5cIiArIG5leHRJbmRlbnQpLCBlbmRdLmpvaW4oXG4gICAgICAgICAgXCJcXG5cIiArIGN1cnJlbnRJbmRlbnRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9KShwYXNzZWRPYmosIFwiXCIsIDApO1xufTtcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgc3RyaW5naWZ5IGZyb20gXCJqc29uLXN0cmluZ2lmeS1wcmV0dHktY29tcGFjdFwiO1xuXG5leHBvcnQgbGV0IGdlbmVyYWwgPSB7fVxuZXhwb3J0IGxldCBqc29uID0ge31cblxubGV0IGtleXMgPSBPYmplY3Qua2V5cyhqc29uKSBcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPXN2LWl0ZW0+XG57I2VhY2gga2V5cyBhcyBrZXl9XG48ZGV0YWlscyBjbGFzcz0nc3YtZGF0YSBzdi17a2V5fSBzdHtNYXRoLnRydW5jKGdlbmVyYWwuc3RhdHVzLzEwMCl9eCc+XG4gIDxzdW1tYXJ5IGNsYXNzPXN2LXRpdGxlPntrZXl9PC9zdW1tYXJ5PlxuICA8cHJlIGNsYXNzPXN2LXtnZW5lcmFsLmV4dH0+e3N0cmluZ2lmeShqc29uW2tleV0pfTwvcHJlPlxuPC9kZXRhaWxzPlxuey9lYWNofVxuPC9kaXY+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuLnN2LWl0ZW0ge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG59XG4uc3YtdGl0bGUsIHByZSB7XG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogc21hbGw7XG4gIG1hcmdpbjogMDtcbiAgJi5zdi1odG1sIHtcbiAgICBmb250LXNpemU6IHgtc21hbGw7XG4gIH1cbn1cbi5zdi10aXRsZTpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xufVxuLnN2LXJlc3BCb2R5IHtcbiAgY29sb3I6IGJsdWV2aW9sZXQ7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICY6aXMoLnN0NHgsLnN0NXgpIHtcbiAgICBjb2xvcjogcmVkO1xuICB9XG59XG4uc3YtcmVxc0JvZHkge1xuICBjb2xvcjogbWVkaXVtdmlvbGV0cmVkO1xuICBmb250LXdlaWdodDogNjAwO1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XG4gIGltcG9ydCBKc29uIGZyb20gJy4vanNvbi5zdmVsdGUnO1xuXG4gIGxldCBsc3QgPSB7fVxuICBsZXQgb2JqID0ge3Jvd3M6IFtdfVxuICBsZXQgcXVlcnk9IGZhbHNlO1xuICBsZXQgcGF0aCA9IHRydWU7XG4gIGxldCBib2R5ID0gdHJ1ZTtcbiAgXG4gIG9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJvd3MgPSAod2luZG93LmlubmVySGVpZ2h0LTEwMCkvMTcuNVxuICAgIGNvbnNvbGUubG9nKHtyb3dzfSlcbiAgICBjb25zdCBfbGltaXRfID0gcm93c1xuICAgIGNvbnN0IF9jb3VudF8gPSB7dG90YWw6J2lkJ31cbiAgICBjb25zdCBfZGlzdGluY3RfID0gWydzZXNzaW9uJ11cbiAgICBjb25zdCBfd2hlcmVfPSAnaWQ+MCBvcmRlcmJ5IGlkOmQnXG4gICAgb2JqID0gYXdhaXQgbWl0bS5mbi5zcWxMaXN0KHtfY291bnRfLCBfZGlzdGluY3RfLCBfd2hlcmVfLCBfbGltaXRffSwgJ2xvZycpXG4gICAgb2JqLnJvd3MuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGxzdFtpdGVtLnNlc3Npb25dID0gW11cbiAgICB9KTtcbiAgfSlcblxuICBhc3luYyBmdW5jdGlvbiBkZXRhaWxDbGljayhlKSB7XG4gICAgY29uc3Qgc3MgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zc1xuICAgIGlmICghbHN0W3NzXT8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBvYmogPSBhd2FpdCBtaXRtLmZuLnNxbExpc3Qoe193aGVyZV86IGBzZXNzaW9uPSR7c3N9IG9yZGVyYnkgaWRgfSwgJ2xvZycpXG4gICAgICBsc3Rbc3NdID0gb2JqLnJvd3MubWFwKHggPT4ge1xuICAgICAgICB4Lm1ldGEgPSBKU09OLnBhcnNlKHgubWV0YSlcbiAgICAgICAgaWYgKHgubWV0YS5nZW5lcmFsLmV4dD09PSdqc29uJykge1xuICAgICAgICAgIHguZGF0YSA9IEpTT04ucGFyc2UoeC5kYXRhKVxuICAgICAgICAgIGRlbGV0ZSB4LmRhdGEuZ2VuZXJhbFxuICAgICAgICAgIGlmICh4Lm1ldGEuZ2VuZXJhbC5tZXRob2Q9PT0nR0VUJykge1xuICAgICAgICAgICAgZGVsZXRlIHguZGF0YS5yZXFzQm9keVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geFxuICAgICAgfSlcbiAgICAgIGNvbnNvbGUubG9nKHNzLCBvYmoucm93cylcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBleHBDbGljayhlKSB7XG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBlLmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChkZXRhaWxzLmF0dHJpYnV0ZXMub3Blbikge1xuICAgICAgICAgIGRldGFpbHMuY2hpbGRyZW5bMl0uc2V0QXR0cmlidXRlKCdvcGVuJywnJylcbiAgICAgICAgICBjb25zdCBhcnIxID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtR0VULC5tdC1ERUxFVEUpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5LC5zdi1yZXNwSGVhZGVyKScpXG4gICAgICAgICAgY29uc3QgYXJyMiA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LVBVVCwubXQtUE9TVCkgZGV0YWlsczppcyguc3YtcmVxc0JvZHkpJylcbiAgICAgICAgICBjb25zdCBhcnIzID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtUkVESVJFQ1QpIGRldGFpbHM6aXMoLnN2LXJlc3BIZWFkZXIpJylcbiAgICAgICAgICBjb25zdCBhcnI0ID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtRVJST1IpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5KScpXG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjEpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIyKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMykgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjQpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICB9XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBob3N0KHVybCkge1xuICAgIGNvbnN0IG9iaiA9IG5ldyBVUkwodXJsKVxuICAgIGxldCBtc2cgPSBwYXRoID8gb2JqLnBhdGhuYW1lIDogb2JqLm9yaWdpbiArIG9iai5wYXRobmFtZVxuICAgIGlmIChxdWVyeSkge1xuICAgICAgbXNnICs9IG9iai5zZWFyY2hcbiAgICB9XG4gICAgcmV0dXJuIG1zZy5sZW5ndGg+OTAgPyBtc2cuc2xpY2UoMCwgOTApKycuLi4nIDogbXNnXG4gIH1cblxuICBmdW5jdGlvbiBlcnJfbWV0aG9kKGkyKSB7XG4gICAgY29uc3Qge21ldGhvZCwgc3RhdHVzfSA9IGkyLm1ldGEuZ2VuZXJhbFxuICAgIGNvbnN0IHN0ID0gTWF0aC50cnVuYyhzdGF0dXMvMTAwKVxuICAgIGlmIChzdD09PTMpIHtcbiAgICAgIHJldHVybiAnbXQtUkVESVJFQ1QnXG4gICAgfSBlbHNlIGlmIChzdD4zKSB7XG4gICAgICByZXR1cm4gJ210LUVSUk9SJ1xuICAgIH1cbiAgICByZXR1cm4gYG10LSR7bWV0aG9kfWAgXG4gIH1cbjwvc2NyaXB0PlxuXG48ZGl2PlxuPGI+U3FsaXRlIExvZ3MhPC9iPlxuPGxhYmVsIGZvcj1zdi1ib2R5PlxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1ib2R5IGJpbmQ6Y2hlY2tlZD17Ym9keX0gLz5leHAtYm9keVxuPC9sYWJlbD5cbjxsYWJlbCBmb3I9c3Ytbm8taG9zdD5cbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3Ytbm8taG9zdCBiaW5kOmNoZWNrZWQ9e3BhdGh9IC8+bm8taG9zdFxuPC9sYWJlbD5cbjxsYWJlbCBmb3I9c3YtcXVlcnk+XG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LXF1ZXJ5IGJpbmQ6Y2hlY2tlZD17cXVlcnl9IC8+cXVlcnlcbjwvbGFiZWw+XG57I2VhY2ggb2JqLnJvd3MgYXMgaXRlbX1cbiAgPGRldGFpbHMgY2xhc3M9c3Ytc2Vzc2lvbiBkYXRhLXNzPXtpdGVtLnNlc3Npb259IG9uOmNsaWNrPXtkZXRhaWxDbGlja30+XG4gICAgPHN1bW1hcnkgY2xhc3M9c3YtbWFpbj5cbiAgICAgIHtpdGVtLnNlc3Npb259PHNwYW4gY2xhc3M9c3YtdG90YWw+KHtpdGVtLnRvdGFsfSk8L3NwYW4+XG4gICAgPC9zdW1tYXJ5PlxuICAgIHsjaWYgbHN0W2l0ZW0uc2Vzc2lvbl0ubGVuZ3RofVxuICAgICAgeyNlYWNoIGxzdFtpdGVtLnNlc3Npb25dIGFzIGkyfVxuICAgICAgICA8ZGV0YWlscyBjbGFzcz0nc3Ytcm93cyc+XG4gICAgICAgICAgPHN1bW1hcnkgXG4gICAgICAgICAgZGF0YS1pZD17aTIuaWR9XG4gICAgICAgICAgZGF0YS1zcz17aXRlbS5zZXNzaW9ufVxuICAgICAgICAgIGNsYXNzPSdzdi10aXRsZSBzdHtNYXRoLnRydW5jKGkyLm1ldGEuZ2VuZXJhbC5zdGF0dXMvMTAwKX14J1xuICAgICAgICAgIG9uOmNsaWNrPXtleHBDbGlja30+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLnN0YXR1c30+e2kyLm1ldGEuZ2VuZXJhbC5zdGF0dXN9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5tZXRob2R9PntpMi5tZXRhLmdlbmVyYWwubWV0aG9kLnBhZEVuZCg0LCcuJyl9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte3BhdGg/J3BhdGgnOidmdWxscGF0aCd9Pntob3N0KGkyLnVybCwgcGF0aCwgcXVlcnkpfTwvc3Bhbj5cbiAgICAgICAgICA8L3N1bW1hcnk+XG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvdy1kYXRhIHN2LWhlYWRlcic+XG4gICAgICAgICAgICA8c3VtbWFyeSBjbGFzcz0nc3YtdGl0bGUgc3YtaGVhZGVyJz5oZWFkZXI8L3N1bW1hcnk+XG4gICAgICAgICAgICA8SnNvbiBqc29uPXtpMi5tZXRhfS8+XG4gICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3ctZGF0YSBzdi1jb250ZW50IHtlcnJfbWV0aG9kKGkyKX0nPlxuICAgICAgICAgICAgPHN1bW1hcnkgY2xhc3M9J3N2LXRpdGxlIHN2LWNvbnRlbnQnPmNvbnRlbnQ8L3N1bW1hcnk+XG4gICAgICAgICAgICB7I2lmIGkyLm1ldGEuZ2VuZXJhbC5leHQ9PT0nanNvbid9XG4gICAgICAgICAgICAgIDxKc29uIGpzb249e2kyLmRhdGF9IGdlbmVyYWw9e2kyLm1ldGEuZ2VuZXJhbH0gLz5cbiAgICAgICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICAgICAgPHByZSBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLmV4dH0+e2kyLmRhdGF9PC9wcmU+XG4gICAgICAgICAgICB7L2lmfVxuICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgPC9kZXRhaWxzPiAgICAgICAgXG4gICAgICB7L2VhY2h9XG4gICAgezplbHNlfVxuICAgICAgbG9hZGluZy0xLi4uICAgICAgICAgIFxuICAgIHsvaWZ9XG4gIDwvZGV0YWlscz5cbnsvZWFjaH1cbjwvZGl2PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cblt0eXBlPWNoZWNrYm94XSB7XG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG59XG4uc3Ytc2Vzc2lvbiB7XG4gIHN1bW1hcnkge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAmLnN2LW1haW46aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG4gICAgfVxuICB9XG59XG4uc3Ytcm93cyB7XG4gIHBhZGRpbmctbGVmdDogMTZweDtcbn1cbi5zdi1yb3ctZGF0YSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbn1cbi5zdi10b3RhbCB7XG4gIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgdmVydGljYWwtYWxpZ246IHRleHQtdG9wO1xuICBjb2xvcjogZGFya21hZ2VudGE7XG59XG4uc3YtdGl0bGUsIC5zdi1yb3ctZGF0YSBwcmUge1xuICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBzbWFsbDtcbiAgbWFyZ2luOiAwO1xuICAmLnN2LWh0bWwge1xuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgfVxufVxuc3VtbWFyeTppcyguc3QyeCkge1xuICBjb2xvcjojMzAwNDdlO1xufVxuc3VtbWFyeTppcyguc3QzeCwuc3Q0eCwuc3Q1eCkge1xuICBjb2xvcjogI2I0MDAwMDtcbn1cbi5zdi1QT1NULC5zdi1QVVQge1xuICBjb2xvcjogY3JpbXNvbjtcbn1cbi5zdi1ERUxFVEUge1xuICBjb2xvcjogcmVkXG59XG4uc3YtcGF0aCB7XG4gIGNvbG9yOiBkYXJrZ3JlZW47XG59XG4uc3YtZnVsbHBhdGgge1xuICBjb2xvcjogZGFya21hZ2VudGE7XG59XG4uc3YtdGl0bGU6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcbn1cbjwvc3R5bGU+XG4iLCIvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxuY29uc3Qge2RlZmF1bHQ6IEExMXlQb3B1cH0gPSByZXF1aXJlKCcuL2ExMXktcG9wdXAuc3ZlbHRlJylcbmNvbnN0IHtkZWZhdWx0OiBDc3BoZWFkZXJ9ID0gcmVxdWlyZSgnLi9jc3AtaGVhZGVyLnN2ZWx0ZScpXG5jb25zdCB7ZGVmYXVsdDogSG90a2V5c30gICA9IHJlcXVpcmUoJy4vaG90a2V5cy5zdmVsdGUnKVxuY29uc3Qge2RlZmF1bHQ6IFNxbGl0ZX0gICAgPSByZXF1aXJlKCcuL3NxbGl0ZS5zdmVsdGUnKVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEExMXlQb3B1cCxcbiAgQ3NwaGVhZGVyLFxuICBIb3RrZXlzLFxuICBTcWxpdGVcbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX3Bvc3RtZXNzYWdlID0gcmVxdWlyZSgnLi9fd3NfcG9zdG1lc3NhZ2UnKVxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxuY29uc3QgX3dzX2xvY2F0aW9uID0gcmVxdWlyZSgnLi9fd3NfbG9jYXRpb24nKVxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcbmNvbnN0IF93c19jc3BFcnIgPSByZXF1aXJlKCcuL193c19jc3AtZXJyJylcbmNvbnN0IF93c19tYWNyb3MgPSByZXF1aXJlKCcuL193c19tYWNyb3MnKVxuY29uc3QgX2MgPSAnY29sb3I6IHJlZCdcblxuX3dzX3Bvc3RtZXNzYWdlKClcbl93c19pbml0U29ja2V0KClcbl93c19zY3JlZW5zaG90KClcbl93c19sb2NhdGlvbigpXG5fd3Nfb2JzZXJ2ZXIoKVxuX3dzX2dlbmVyYWwoKVxuX3dzX2NzcEVycigpXG5fd3NfbWFjcm9zKClcbmNvbnNvbGUubG9nKCclY1dzOiB3cy1jbGllbnQgbG9hZGVkLi4uJywgX2MpXG53aW5kb3cubWl0bS5zdmVsdGUgPSByZXF1aXJlKCcuLi9fc3ZlbHRlJylcbiJdLCJuYW1lcyI6WyJfd3NfcG9zdG1lc3NhZ2UiLCJfYyIsIl93c19jbGllbnQiLCJyZXF1aXJlJCQwIiwiX3dzX21zZ1BhcnNlciIsIl93c19pbklmcmFtZSIsIl93c192ZW5kb3IiLCJyZXF1aXJlJCQxIiwicmVxdWlyZSQkMiIsIl93c19pbml0U29ja2V0IiwiX3NjcmVlbnNob3QiLCJfd3NfbmFtZXNwYWNlIiwiX3dzX3NjcmVlbnNob3QiLCJwbGF5Iiwic3FsaXRlIiwic3R5bGUiLCJkZWZhdWx0SG90S2V5cyIsImhvdGtleXMiLCJyZXF1aXJlJCQzIiwicmVxdWlyZSQkNCIsInJlcXVpcmUkJDUiLCJyZXF1aXJlJCQ2IiwibG9jYXRpb24iLCJpbml0IiwiX3dzX2xvY2F0aW9uIiwiX3dzX2RlYm91bmNlIiwiX3dzX3JvdXRlIiwiX3dzX29ic2VydmVyIiwiX3dzX2dlbmVyYWwiLCJfd3NfY3NwRXJyIiwiX3dzX21hY3JvcyIsImNzcEluZm8iLCJjc3BBcnIiLCJjc3BGZXRjaCIsImNzcEVBdHRyIiwic3RyaW5naWZ5IiwicmVxdWlyZSQkNyIsInJlcXVpcmUkJDgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0FDQUEsaUJBQWMsR0FBRyxNQUFNO0NBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0NBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7Q0FDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztDQUM3RixLQUFLO0NBQ0wsR0FBRztDQUNILEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDO0NBQzNEOztDQ1JBLE1BQU1DLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7S0FDQUMsWUFBYyxHQUFHLE1BQU07Q0FDdkIsRUFBRSxJQUFJLFVBQVM7Q0FDZixFQUFFLE9BQU87Q0FDVDtDQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtDQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0NBQ3ZCLEtBQUs7Q0FDTDtDQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtDQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0NBQ3ZCLEtBQUs7Q0FDTDtDQUNBLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtDQUNy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SSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUM7Q0FDckMsR0FBRztDQUNILEVBQUUsT0FBTyxFQUFFO0NBQ1gsRUFBQztBQUNEO0tBQ0EyQixhQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFNO0FBQ3hCO0NBQ0E7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0NBQy9DLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDL0MsSUFBRztBQUNIO0NBQ0E7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0NBQzdDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRTtDQUNyQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDOUMsSUFBRztBQUNIO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztDQUM1QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7Q0FDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQzVDLElBQUc7QUFDSDtDQUNBO0NBQ0EsRUFBRSxNQUFN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
