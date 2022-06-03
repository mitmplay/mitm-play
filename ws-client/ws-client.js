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

	const _c$7 = 'color: #bada55';

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
	    _saveTags ({ routes, __tag1 }) {
	      if (!location.origin.match('chrome-extension')) {
	        console.log('%cWs: Update routes', _c$7);
	        window.mitm.routes = routes;
	        window.mitm.__tag1 = __tag1; //# __tag1 in-sync
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
	const _c$6 = 'color: #bada55';

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
	    const vendor = ['firefox', 'webkit'].includes(_ws_vendor$4());
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
	var _keyboard = {
	  codeToChar,
	  kcode1,
	  kcode2,
	  kcode3,
	  kshow
	};

	const _ws_vendor$2 = _ws_vendor$5;
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

	async function play$1 (autofill) {
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

	var _ws_play = play$1;

	/* global location, history, chrome, Event, CssSelectorGenerator */

	/* eslint-disable camelcase */
	const {codeToChar:_key} = _keyboard;
	const _ws_namespace$3 = _ws_namespace$5;
	const _ws_vendor$1 = _ws_vendor$5;
	const play = _ws_play;
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
	        await play(arr);
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
	  const qry  = '.mitm-container.popup'; 
	  const keys = {
	    'code:KeyC'(_e) {fn.svelte(Cspheader, 'LightPastelGreen');},
	    'code:KeyQ'(_e) {fn.svelte(Sqlite   , 'LightPastelGreen');},
	    'key:y'    (_e) {fn.axerun(                             );},
	    'key:yaa'  (_e) {fn.axerun(['wcag2a','wcag2aa']         );},
	    'key:yaaa' (_e) {fn.axerun(['wcag2a','wcag2aa','wcag2aaa','best-practice']);},
	    'key:yc'   (_e) {document.querySelector(qry).innerText = '';                },
	  };
	  keys['code:KeyC']._title = 'Show CSP Header';
	  keys['code:KeyQ']._title = 'Show Sqlite';
	  keys['key:y'    ]._title = 'Execs a11y check';
	  keys['key:yaa'  ]._title = 'Execs a11y wcag:aa';
	  keys['key:yaaa' ]._title = 'Execs a11y strict';
	  keys['key:yc'   ]._title = 'Clear a11y result';
	  mitm.macrokeys = keys;
	}

	let debunk;
	let intervId;
	let onces = {}; // feat: onetime fn call

	async function urlChange (event) {
	  const namespace = _ws_namespace$3();
	  const {mitm} = window;

	  if (mitm.argv.a11y && mitm.fn.axerun) {
	    mitm.fn.axerun();
	  }

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
	  const body     = document.body;
	  const divRight = document.createElement('div'  );
	  const divTopR  = document.createElement('div'  );
	  const divLeft  = document.createElement('div'  );
	  const divPopup = document.createElement('div'  );
	  const divCenter= document.createElement('div'  );
	  const html     = document.querySelector('html' );
	  const styleBtn = document.createElement('style');
	  const htmlref  = html.firstElementChild;
	  const bodyref  = body.firstElementChild;
	  divRight.style = styleRight;
	  divTopR .style = styleTopR;
	  divLeft .style = styleLeft;

	  styleBtn .innerHTML = style;
	  styleBtn .className = 'mitm-class';
	  divRight .innerHTML = `<span class="bgroup-right"></span>`;
	  divTopR  .innerHTML = `<span class="bgroup-topr"></span>`;
	  divLeft  .innerHTML = `<span class="bgroup-left"></span><span class="bgroup-left2"></span>`;
	  divLeft  .className = 'mitm-container left';
	  divTopR  .className = 'mitm-container topr';
	  divRight .className = 'mitm-container right';
	  divPopup .className = 'mitm-container popup';
	  divCenter.className = 'mitm-container center';

	  html.insertBefore(styleBtn , htmlref);
	  html.insertBefore(divRight , htmlref);
	  html.insertBefore(divTopR  , htmlref);
	  html.insertBefore(divLeft  , htmlref);
	  html.insertBefore(divCenter, htmlref);
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

	function svelte$1(Svelt, bg='PostIt') { // feat: svelte related
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

	function hotKeys(obj) {
	  window.mitm.macrokeys = {
	    ...window.mitm.macrokeys,
	    ...obj
	  };
	}

	window.mitm.fn.macroAutomation = macroAutomation;
	window.mitm.fn.hotKeys = hotKeys;
	window.mitm.fn.svelte = svelte$1;
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
	  const {_subns: s} = route._childns;
	  if (s && mitm.routes[s]) {
	    route= mitm.routes[s];
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
	    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
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

	/* ws-client/svelte/A11yPopup.svelte generated by Svelte v3.46.4 */

	const file$4 = "ws-client/svelte/A11yPopup.svelte";

	function create_fragment$4(ctx) {
		let div2;
		let h4;
		let t1;
		let p0;
		let t3;
		let p1;
		let b0;
		let t5;
		let t6;
		let t7;
		let p2;
		let b1;
		let t9;
		let a;
		let t10;
		let t11;
		let details;
		let summary;
		let b2;
		let t13;
		let t14;
		let t15;
		let hr0;
		let t16;
		let div0;
		let t17;
		let hr1;
		let t18;
		let div1;
		let pre;
		let code;

		const block = {
			c: function create() {
				div2 = element("div");
				h4 = element("h4");
				h4.textContent = `${/*help*/ ctx[6]}`;
				t1 = space();
				p0 = element("p");
				p0.textContent = `${/*description*/ ctx[2]}`;
				t3 = space();
				p1 = element("p");
				b0 = element("b");
				b0.textContent = "tags:";
				t5 = space();
				t6 = text(/*tgs*/ ctx[7]);
				t7 = space();
				p2 = element("p");
				b1 = element("b");
				b1.textContent = "link:";
				t9 = space();
				a = element("a");
				t10 = text(/*grp*/ ctx[8]);
				t11 = space();
				details = element("details");
				summary = element("summary");
				b2 = element("b");
				b2.textContent = "impact:";
				t13 = space();
				t14 = text(/*impact*/ ctx[4]);
				t15 = space();
				hr0 = element("hr");
				t16 = space();
				div0 = element("div");
				t17 = space();
				hr1 = element("hr");
				t18 = space();
				div1 = element("div");
				pre = element("pre");
				code = element("code");
				code.textContent = `${/*html*/ ctx[5]}`;
				attr_dev(h4, "class", "svelte-d572or");
				add_location(h4, file$4, 37, 2, 805);
				attr_dev(p0, "class", "svelte-d572or");
				add_location(p0, file$4, 38, 2, 823);
				add_location(b0, file$4, 39, 5, 849);
				attr_dev(p1, "class", "svelte-d572or");
				add_location(p1, file$4, 39, 2, 846);
				add_location(b1, file$4, 40, 5, 877);
				attr_dev(a, "href", /*helpUrl*/ ctx[3]);
				add_location(a, file$4, 40, 18, 890);
				attr_dev(p2, "class", "svelte-d572or");
				add_location(p2, file$4, 40, 2, 874);
				add_location(b2, file$4, 42, 13, 949);
				attr_dev(summary, "class", "svelte-d572or");
				add_location(summary, file$4, 42, 4, 940);
				add_location(hr0, file$4, 43, 4, 987);
				attr_dev(div0, "class", "pre svelte-d572or");
				add_location(div0, file$4, 44, 4, 997);
				add_location(hr1, file$4, 45, 4, 1035);
				attr_dev(code, "class", "language-html svelte-d572or");
				add_location(code, file$4, 47, 11, 1072);
				attr_dev(pre, "class", "svelte-d572or");
				add_location(pre, file$4, 47, 6, 1067);
				attr_dev(div1, "class", "pre svelte-d572or");
				add_location(div1, file$4, 46, 4, 1045);
				attr_dev(details, "class", "svelte-d572or");
				add_location(details, file$4, 41, 2, 926);
				attr_dev(div2, "class", "a11y-popup svelte-d572or");
				attr_dev(div2, "style", /*style*/ ctx[0]);
				add_location(div2, file$4, 36, 0, 770);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, h4);
				append_dev(div2, t1);
				append_dev(div2, p0);
				append_dev(div2, t3);
				append_dev(div2, p1);
				append_dev(p1, b0);
				append_dev(p1, t5);
				append_dev(p1, t6);
				append_dev(div2, t7);
				append_dev(div2, p2);
				append_dev(p2, b1);
				append_dev(p2, t9);
				append_dev(p2, a);
				append_dev(a, t10);
				append_dev(div2, t11);
				append_dev(div2, details);
				append_dev(details, summary);
				append_dev(summary, b2);
				append_dev(summary, t13);
				append_dev(summary, t14);
				append_dev(details, t15);
				append_dev(details, hr0);
				append_dev(details, t16);
				append_dev(details, div0);
				div0.innerHTML = /*note*/ ctx[1];
				append_dev(details, t17);
				append_dev(details, hr1);
				append_dev(details, t18);
				append_dev(details, div1);
				append_dev(div1, pre);
				append_dev(pre, code);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*note*/ 2) div0.innerHTML = /*note*/ ctx[1];
				if (dirty & /*style*/ 1) {
					attr_dev(div2, "style", /*style*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(div2);
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

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('A11yPopup', slots, []);
		let { node } = $$props;
		const rect = node.getBoundingClientRect();
		const { x, y } = document.body.getBoundingClientRect();
		const { top: t, left: l, height: h } = rect;
		const top = -y + t + h + 2;
		const left = -x + l;
		const { failureSummary, description, helpUrl, target, impact, html, help, tgs, grp } = node._axe_;
		let style;

		if (grp.match(/page-/)) {
			style = `top:${top}px;left:0;right:0;margin:auto;`;
		} else {
			style = `top:${top}px;left:${left}px;`;
		}

		let note = failureSummary;
		const rst = note.match(/([\d.#:]+)( |\w+)/g);

		rst && rst.filter(x => x.length > 2).forEach(element => {
			$$invalidate(1, note = note.replace(element, `<b>${element}</b>`));
		});

		setTimeout(
			() => {
				hljs.highlightAll();
			},
			0
		);

		const writable_props = ['node'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<A11yPopup> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('node' in $$props) $$invalidate(9, node = $$props.node);
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
			failureSummary,
			description,
			helpUrl,
			target,
			impact,
			html,
			help,
			tgs,
			grp,
			style,
			note,
			rst
		});

		$$self.$inject_state = $$props => {
			if ('node' in $$props) $$invalidate(9, node = $$props.node);
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('note' in $$props) $$invalidate(1, note = $$props.note);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, note, description, helpUrl, impact, html, help, tgs, grp, node];
	}

	class A11yPopup$1 extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { node: 9 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "A11yPopup",
				options,
				id: create_fragment$4.name
			});

			const { ctx } = this.$$;
			const props = options.props || {};

			if (/*node*/ ctx[9] === undefined && !('node' in props)) {
				console.warn("<A11yPopup> was created without expected prop 'node'");
			}
		}

		get node() {
			throw new Error("<A11yPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set node(value) {
			throw new Error("<A11yPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	var A11yPopup$2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': A11yPopup$1
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(A11yPopup$2);

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

	/* ws-client/svelte/Cspheader.svelte generated by Svelte v3.46.4 */
	const file$3 = "ws-client/svelte/Cspheader.svelte";

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
				add_location(summary, file$3, 49, 15, 1383);
				add_location(details, file$3, 49, 6, 1374);
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
				add_location(small, file$3, 53, 46, 1655);
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
				add_location(small, file$3, 51, 86, 1553);
				attr_dev(a, "target", "blank");
				attr_dev(a, "href", Cspdirective.cspInfo[/*id*/ ctx[2]].link);
				add_location(a, file$3, 51, 46, 1513);
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
				add_location(summary, file$3, 57, 32, 1785);
				add_location(small, file$3, 58, 12, 1826);
				attr_dev(details, "class", "note svelte-ws3cmd");
				add_location(details, file$3, 57, 10, 1763);
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
				add_location(div, file$3, 62, 10, 1953);
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
				add_location(b0, file$3, 39, 2, 923);
				attr_dev(a0, "target", "blank");
				attr_dev(a0, "href", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP");
				add_location(a0, file$3, 42, 4, 976);
				attr_dev(a1, "target", "blank");
				attr_dev(a1, "href", "https://content-security-policy.com/");
				add_location(a1, file$3, 43, 4, 1071);
				attr_dev(a2, "target", "blank");
				attr_dev(a2, "href", "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html");
				add_location(a2, file$3, 44, 4, 1168);
				add_location(p, file$3, 40, 2, 956);
				add_location(hr, file$3, 67, 4, 2049);
				add_location(b1, file$3, 68, 37, 2093);
				attr_dev(summary0, "class", "report svelte-ws3cmd");
				add_location(summary0, file$3, 68, 13, 2069);
				attr_dev(summary1, "class", "svelte-ws3cmd");
				add_location(summary1, file$3, 69, 28, 2149);
				add_location(small, file$3, 70, 8, 2186);
				attr_dev(details0, "class", "note svelte-ws3cmd");
				add_location(details0, file$3, 69, 6, 2127);
				attr_dev(div0, "class", "item svelte-ws3cmd");
				add_location(div0, file$3, 72, 6, 2418);
				add_location(details1, file$3, 68, 4, 2060);
				add_location(div1, file$3, 46, 2, 1310);
				attr_dev(div2, "class", "vbox");
				add_location(div2, file$3, 38, 0, 902);
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

	var require$$1 = /*@__PURE__*/getAugmentedNamespace(Cspheader$2);

	/* ws-client/svelte/Hotkeys.svelte generated by Svelte v3.46.4 */

	const { console: console_1$1 } = globals;
	const file$2 = "ws-client/svelte/Hotkeys.svelte";

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

	var Hotkeys$2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': Hotkeys$1
	});

	var require$$2 = /*@__PURE__*/getAugmentedNamespace(Hotkeys$2);

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

	/* ws-client/svelte/Json.svelte generated by Svelte v3.46.4 */

	const { Object: Object_1 } = globals;
	const file$1 = "ws-client/svelte/Json.svelte";

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

	/* ws-client/svelte/sqlite.svelte generated by Svelte v3.46.4 */

	const { console: console_1 } = globals;
	const file = "ws-client/svelte/sqlite.svelte";

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
	var svelte = {
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
	window.mitm.svelte = svelte;

	return wsClient;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfc3JjL193c19wb3N0bWVzc2FnZS5qcyIsIl9zcmMvX3dzX2NsaWVudC5qcyIsIl9zcmMvX3dzX21zZy1wYXJzZXIuanMiLCJfc3JjL193c19pbi1pZnJhbWUuanMiLCJfc3JjL193c192ZW5kb3IuanMiLCJfc3JjL193c19pbml0LXNvY2tldC5qcyIsIl9zcmMvX3NjcmVlbnNob3QuanMiLCJfc3JjL193c19uYW1lc3BhY2UuanMiLCJfc3JjL193c19zY3JlZW5zaG90LmpzIiwiX3NyYy9fa2V5Ym9hcmQuanMiLCJfc3JjL193c19wbGF5LmpzIiwiX3NyYy9fd3NfbG9jYXRpb24uanMiLCJfc3JjL193c19kZWJvdW5jZS5qcyIsIl9zcmMvX3dzX3JvdXRlLmpzIiwiX3NyYy9fd3Nfb2JzZXJ2ZXIuanMiLCJfc3JjL193c19nZW5lcmFsLmpzIiwiX3NyYy9fd3NfY3NwLWVyci5qcyIsIl9zcmMvX3dzX21hY3Jvcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwic3ZlbHRlL0ExMXlQb3B1cC5zdmVsdGUiLCJzdmVsdGUvQ3NwZGlyZWN0aXZlLmpzIiwic3ZlbHRlL0NzcGhlYWRlci5zdmVsdGUiLCJzdmVsdGUvSG90a2V5cy5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvanNvbi1zdHJpbmdpZnktcHJldHR5LWNvbXBhY3QvaW5kZXguanMiLCJzdmVsdGUvSnNvbi5zdmVsdGUiLCJzdmVsdGUvc3FsaXRlLnN2ZWx0ZSIsInN2ZWx0ZS9pbmRleC5qcyIsIl9zcmMvd3MtY2xpZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlIChldmVudCkge1xuICAgIGlmICh3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKGA+Pj4gUG9zdG1lc3NhZ2U6ICR7ZXZlbnQub3JpZ2lufSA9PiBodHRwczovLyR7bG9jYXRpb24uaG9zdH1gLCBldmVudC5kYXRhKVxuICAgIH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcbn1cbiIsImNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgbGV0IHdpbmRvd1JlZlxuICByZXR1cm4ge1xuICAgIC8vIGV4OiB3c19faGVscCgpXG4gICAgX2hlbHAgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19waW5nKFwidGhlcmVcIilcbiAgICBfcGluZyAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgfSxcbiAgICAvLyBleDogd3NfX29wZW4oe3VybDogXCJodHRwczovL2dvb2dsZS5jb21cIn0pXG4gICAgX29wZW4gKHsgZGF0YSB9KSB7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9ICdkaXJlY3Rvcmllcz0wLHRpdGxlYmFyPTAsdG9vbGJhcj0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wLHdpZHRoPTgwMCxoZWlnaHQ9NjAwJ1xuICAgICAgd2luZG93UmVmID0gd2luZG93Lm9wZW4oZGF0YS51cmwsICdfbG9ncycsIGZlYXR1cmVzKVxuICAgICAgd2luZG93UmVmLmJsdXIoKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19zdHlsZSgnLmludHJvPT5iYWNrZ3JvdW5kOnJlZDsnKVxuICAgIF9zdHlsZSAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnN0IHsgcSwgY3NzIH0gPSBkYXRhXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHEpLmZvckVhY2goXG4gICAgICAgIG5vZGUgPT4gKG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzcylcbiAgICAgIClcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fXG4gICAgX3NhdmVUYWdzICh7IHJvdXRlcywgX190YWcxIH0pIHtcbiAgICAgIGlmICghbG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IFVwZGF0ZSByb3V0ZXMnLCBfYylcbiAgICAgICAgd2luZG93Lm1pdG0ucm91dGVzID0gcm91dGVzXG4gICAgICAgIHdpbmRvdy5taXRtLl9fdGFnMSA9IF9fdGFnMSAvLyMgX190YWcxIGluLXN5bmNcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIGV4OiB3c19fXG4gICAgX2ZpbGVzICh7IGRhdGEsIHR5cCB9KSB7XG4gICAgICBjb25zdCB7IGZpbGVzIH0gPSB3aW5kb3cubWl0bVxuICAgICAgY29uc29sZS53YXJuKGByZWNlaXZlIGJyb2RjYXN0ICR7dHlwfWApXG4gICAgICAvKipcbiAgICAgICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxuICAgICAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cbiAgICAgICAqL1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gZmlsZXNbYCR7dHlwfV9ldmVudHNgXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oZmlsZXNbYCR7dHlwfV9ldmVudHNgXVtrZXldICsgJycpXG4gICAgICAgIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF1ba2V5XShkYXRhKVxuICAgICAgfVxuICAgIH0sXG4gICAgX3NldENsaWVudCAoeyBkYXRhIH0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBfc2V0Q2xpZW50JywgX2MsIGRhdGEpXG4gICAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhXG4gICAgfVxuICB9XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19jbGllbnQgPSByZXF1aXJlKCcuL193c19jbGllbnQnKVxuY29uc3QgX3dzX3djY21kID0gX3dzX2NsaWVudCgpXG5cbm1vZHVsZS5leHBvcnRzID0gKGV2ZW50LCBtc2cpID0+IHtcbiAgaWYgKHdpbmRvdy5taXRtLmFyZ3YuZGVidWc/LmluY2x1ZGVzKCdXJykpIHtcbiAgICBpZiAobXNnLmxlbmd0aCA+IDQwKSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlcy4uLmAnLCBtc2cuc2xpY2UoMCwgNDApKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IHdzLW1lc3NhZ2U6IGAlc2AnLCBtc2cpXG4gICAgfVxuICB9XG4gIGNvbnN0IGFyciA9IG1zZy5yZXBsYWNlKC9cXHMrJC8sICcnKS5tYXRjaCgvXiAqKFtcXHc6XSspICooXFx7LiopLylcbiAgaWYgKGFycikge1xuICAgIGxldCBbLCBjbWQsIGpzb25dID0gYXJyXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgKGpzb24pID09PSAnc3RyaW5nJykge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGpzb24sIGVycm9yKVxuICAgIH1cbiAgICBpZiAod2luZG93Ll93c19xdWV1ZVtjbWRdKSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gd2luZG93Ll93c19xdWV1ZVtjbWRdXG4gICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtjbWRdXG4gICAgICBoYW5kbGVyKGpzb24uZGF0YSlcbiAgICB9IGVsc2UgaWYgKF93c193Y2NtZFtjbWRdKSB7XG4gICAgICBfd3Nfd2NjbWRbY21kXS5jYWxsKGV2ZW50LCBqc29uKVxuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCBpZnJtXG4gIHRyeSB7XG4gICAgaWZybSA9IHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZnJtID0gdHJ1ZVxuICB9XG4gIHJldHVybiBpZnJtID8gJ2lmcmFtZScgOiAnd2luZG93J1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IHsgdmVuZG9yIH0gPSBuYXZpZ2F0b3JcbiAgY29uc3QgYnJvd3NlciA9IHtcbiAgICAnJzogJ2ZpcmVmb3gnLFxuICAgICdHb29nbGUgSW5jLic6ICdjaHJvbWl1bScsXG4gICAgJ0FwcGxlIENvbXB1dGVyLCBJbmMuJzogJ3dlYmtpdCdcbiAgfVt2ZW5kb3JdXG4gIHJldHVybiBicm93c2VyXG59XG4iLCIvKiBnbG9iYWwgV2ViU29ja2V0ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19tc2dQYXJzZXIgPSByZXF1aXJlKCcuL193c19tc2ctcGFyc2VyJylcbmNvbnN0IF93c19pbklmcmFtZSA9IHJlcXVpcmUoJy4vX3dzX2luLWlmcmFtZScpXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgd2luZG93Ll93c19xdWV1ZSA9IHt9XG4gIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gZmFsc2VcbiAgY29uc3Qge19fYXJncywgX19mbGFnfSA9IHdpbmRvdy5taXRtXG5cbiAgaWYgKHdpbmRvdy5fd3NfY29ubmVjdD09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG4gIH1cblxuICBjb25zdCBvbm9wZW4gPSBkYXRhID0+IHtcbiAgICBmdW5jdGlvbiB3c19zZW5kKCkge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gd2luZG93Ll93c19jb25uZWN0KSB7XG4gICAgICAgIGNvbnN0IGZuID0gd2luZG93Ll93c19jb25uZWN0W2tleV1cbiAgICAgICAgd2luZG93Ll93c19jb25uZWN0ZWRfc2VuZCA9IHRydWVcbiAgICAgICAgY29uc29sZS5sb2coYCVjV3M6ICR7Zm4rJyd9YCwgX2MpXG4gICAgICAgIGZuKGRhdGEpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogb3BlbiBjb25uZWN0aW9uJywgX2MpXG4gICAgfVxuXG4gICAgY29uc29sZS50aW1lRW5kKCd3cycpXG4gICAgd2luZG93Ll93c19jb25uZWN0ZWQgPSB0cnVlXG5cbiAgICBzZXRUaW1lb3V0KHdzX3NlbmQsIDEpIC8vIG1pbmltaXplIGludGVybWl0dGVuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIXdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignUkVUUlkuLi4uLi4uLi4uJylcbiAgICAgICAgd3Nfc2VuZCgpXG4gICAgICB9XG4gICAgfSwgMTApIC8vIG1pbmltaXplIGludGVybWl0dGVuICAgICBcbiAgfVxuXG4gIGNvbnN0IG9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogY2xvc2UgY29ubmVjdGlvbicsIF9jKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKF9fZmxhZ1snb24tbWVzc2FnZSddKSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogb24tbWVzc2FnZTonLCBfYywgZS5kYXRhKVxuICAgIH1cbiAgICBfd3NfbXNnUGFyc2VyKGUsIGUuZGF0YSlcbiAgfVxuICBcbiAgY29uc3QgY29ubmVjdCA9IF9fYXJncy5ub3NvY2tldD09PXVuZGVmaW5lZFxuICBpZiAoY29ubmVjdCB8fCAod2luZG93LmNocm9tZSAmJiBjaHJvbWUudGFicykpIHtcbiAgICBjb25zdCB2ZW5kb3IgPSBbJ2ZpcmVmb3gnLCAnd2Via2l0J10uaW5jbHVkZXMoX3dzX3ZlbmRvcigpKVxuICAgIGNvbnN0IHByZSA9IHZlbmRvciA/ICd3cycgOiAnd3NzJ1xuICAgIGNvbnN0IHBydCA9IHZlbmRvciA/ICczMDAyJyA6ICczMDAxJ1xuICAgIGNvbnN0IHVybCA9IGAke3ByZX06Ly9sb2NhbGhvc3Q6JHtwcnR9L3dzP3BhZ2U9JHtfd3NfaW5JZnJhbWUoKX0mdXJsPSR7ZG9jdW1lbnQuVVJMLnNwbGl0KCc/JylbMF19YFxuICAgIGxldCB3c1xuICAgIHRyeSB7XG4gICAgICB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKSAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICB9XG4gICAgY29uc29sZS50aW1lKCd3cycpXG4gICAgd2luZG93Ll93cyA9IHdzXG4gIFxuICAgIHdzLm9ub3BlbiA9IG9ub3BlblxuICAgIHdzLm9uY2xvc2UgPSBvbmNsb3NlXG4gICAgd3Mub25tZXNzYWdlID0gb25tZXNzYWdlICBcbiAgfVxuICBpZiAoX19mbGFnWyd3cy1jb25uZWN0J10pIHtcbiAgICBjb25zb2xlLmxvZyhgJWNXczogJHtjb25uZWN0ID8gJ2luaXQnIDogJ29mZid9IGNvbm5lY3Rpb25gLCBfYylcbiAgfVxufVxuIiwiYXN5bmMgZnVuY3Rpb24gc2NyZW5zaG90KGpzb24pIHtcbiAgY29uc3Qge19fYXJnc30gPSB3aW5kb3cubWl0bVxuICBpZiAoW3RydWUsICdvZmYnXS5pbmNsdWRlcyhfX2FyZ3Mubm9zb2NrZXQpKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGpzb24pXG4gICAgICAgIH1cbiAgICAgICAgZmV0Y2goJy9taXRtLXBsYXkvc2NyZW5zaG90Lmpzb24nLCBjb25maWcpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEgICAgKSB7IHJlc29sdmUoZGF0YSkgICAgICAgICAgIH0pXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7ICBcbiAgICAgIHRyeSB7XG4gICAgICAgIHdpbmRvdy53c19fc2VuZCgnc2NyZWVuc2hvdCcsIGpzb24sIHJlc29sdmUpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICB9XG4gICAgfSkgIFxuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHNjcmVuc2hvdCIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXG4gIGxldCBuYW1lc3BhY2VcblxuICBmdW5jdGlvbiB0b1JlZ2V4IChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JylcbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5taXRtLnJvdXRlcykge1xuICAgIGlmIChob3N0Lm1hdGNoKHRvUmVnZXgoa2V5LnJlcGxhY2UoL34vZywgJ1teLl0qJykpKSkge1xuICAgICAgbmFtZXNwYWNlID0ga2V5XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlXG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIG1pdG0gKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubGV0IGFjdFxuZnVuY3Rpb24gc2NyZWVuc2hvdCAoZSkge1xuICBpZiAobWl0bS5hcmd2LmxhenljbGljaykge1xuICAgIGlmIChtaXRtLnNjcmVlbnNob3QpIHtcbiAgICAgIHdpbmRvdy5taXRtLnNjcmVlbnNob3QgPSB1bmRlZmluZWRcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gZGVsYXkgYWN0aW9uJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoYWN0KSB7XG4gICAgICBhY3QgPSB1bmRlZmluZWRcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxuICBjb25zdCBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoJzovLycgLCd+ficpXG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW25hbWVzcGFjZV1cbiAgY29uc3QgeyBzZWxlY3RvciB9ID0gcm91dGUuc2NyZWVuc2hvdFxuXG4gIGNvbnN0IGFyciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgY29uc3QgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvL2csICd+JylcbiAgY29uc3QgZGVsYXkgPSBtaXRtLmFyZ3YubGF6eWNsaWNrID09PSB0cnVlID8gNzAwIDogbWl0bS5hcmd2LmxhenljbGlja1xuICBmb3IgKGNvbnN0IGVsIG9mIGFycikge1xuICAgIGxldCBub2RlID0gZS50YXJnZXRcbiAgICB3aGlsZSAoZWwgIT09IG5vZGUgJiYgbm9kZSAhPT0gbnVsbCAmJiBub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG4gICAgfVxuICAgIGlmIChub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXG4gICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGJyb3dzZXIgfVxuICAgICAgcGFyYW1zLmZuYW1lID0gZm5hbWU9PT0nficgPyAnfl8nIDogZm5hbWVcbiAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcbiAgICAgIGlmIChtaXRtLmFyZ3YubGF6eWNsaWNrKSB7XG4gICAgICAgIC8vIGRlbGF5IGFjdGlvbiB0byBmaW5pc2ggc2NyZWVuc2hvdFxuICAgICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gZS50YXJnZXRcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBtaXRtLmxhc3RFdmVudCA9IGVcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgYWN0ID0gd2luZG93Lm1pdG0uc2NyZWVuc2hvdFxuICAgICAgICAgIGlmIChhY3QpIHtcbiAgICAgICAgICAgIGFjdC5jbGljaygpXG4gICAgICAgICAgICBhY3QgPSB1bmRlZmluZWRcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IGRlbGF5IGFjdGlvbiB1bmRlZmluZWQnLCBfYyk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBkZWxheSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1pdG0ubGFzdEV2ZW50ID0gZVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50Y2xpY2soZSkge1xuICBtaXRtLmxhc3RFdmVudCA9IGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IHJvdXRlID0gd2luZG93Lm1pdG0ucm91dGVzW193c19uYW1lc3BhY2UoKV1cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gICAgY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKVxuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2NyZWVuc2hvdClcbiAgICB9IGVsc2Uge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50Y2xpY2spXG4gICAgfVxuICB9KVxufVxuIiwiY29uc3Qga2NvZGUxID0ge1xuICBCYWNrcXVvdGUgICA6ICdgJyxcbiAgQnJhY2tldExlZnQgOiAnWycsXG4gIEJyYWNrZXRSaWdodDogJ10nLFxuICBCYWNrc2xhc2g6ICdcXFxcJyxcbiAgQ29tbWEgICAgOiAnLCcsXG4gIFBlcmlvZCAgIDogJy4nLFxuICBRdW90ZSAgICA6IFwiJ1wiLFxuICBTZW1pY29sb246ICc7JyxcbiAgU2xhc2ggICAgOiAnLycsXG4gIFNwYWNlICAgIDogJyAnLFxuICBNaW51cyAgICA6ICctJyxcbiAgRXF1YWwgICAgOiAnPScsXG59XG5cbmNvbnN0IGtjb2RlMiA9IHtcbiAgQmFja3F1b3RlICAgOiAnficsXG4gIEJyYWNrZXRMZWZ0IDogJ3snLFxuICBCcmFja2V0UmlnaHQ6ICd9JyxcbiAgQmFja3NsYXNoOiAnfCcsXG4gIENvbW1hICAgIDogJzwnLFxuICBQZXJpb2QgICA6ICc+JyxcbiAgUXVvdGUgICAgOiAnXCInLFxuICBTZW1pY29sb246ICc6JyxcbiAgU2xhc2ggICAgOiAnPycsXG4gIFNwYWNlICAgIDogJyAnLFxuICBNaW51cyAgICA6ICdfJyxcbiAgRXF1YWwgICAgOiAnKycsXG59XG5cbmNvbnN0IGtjb2RlMyA9IHtcbiAgMTogJyEnLFxuICAyOiAnQCcsXG4gIDM6ICcjJyxcbiAgNDogJyQnLFxuICA1OiAnJScsXG4gIDY6ICdeJyxcbiAgNzogJyYnLFxuICA4OiAnKicsXG4gIDk6ICcoJyxcbiAgMTA6ICcpJ1xufVxuXG5jb25zdCBrc2hvdyA9IHtcbiAgLi4ua2NvZGUxLFxuICBFbnRlcjogJ0VudGVyJyxcbiAgQ2Fwc0xvY2s6ICdDYXBzJyxcbiAgQmFja3NwYWNlOiAnQlMnLFxuICBFc2NhcGU6ICdFc2MnLFxuICBEaWdpdDE6ICcxJyxcbiAgRGlnaXQyOiAnMicsXG4gIERpZ2l0MzogJzMnLFxuICBEaWdpdDQ6ICc0JyxcbiAgRGlnaXQ1OiAnNScsXG4gIERpZ2l0NjogJzYnLFxuICBEaWdpdDc6ICc3JyxcbiAgRGlnaXQ4OiAnOCcsXG4gIERpZ2l0OTogJzknLFxuICBEaWdpdDA6ICcwJyxcbiAgVGFiOiAnVGFiJyxcbiAgS2V5QTogJ2EnLFxuICBLZXlCOiAnYicsXG4gIEtleUM6ICdjJyxcbiAgS2V5RDogJ2QnLFxuICBLZXlFOiAnZScsXG4gIEtleUY6ICdmJyxcbiAgS2V5RzogJ2cnLFxuICBLZXlIOiAnaCcsXG4gIEtleUk6ICdpJyxcbiAgS2V5SjogJ2onLFxuICBLZXlLOiAnaycsXG4gIEtleUw6ICdsJyxcbiAgS2V5TTogJ20nLFxuICBLZXlOOiAnbicsXG4gIEtleU86ICdvJyxcbiAgS2V5UDogJ3AnLFxuICBLZXlROiAncScsXG4gIEtleVI6ICdyJyxcbiAgS2V5UzogJ3MnLFxuICBLZXlUOiAndCcsXG4gIEtleVU6ICd1JyxcbiAgS2V5VjogJ3YnLFxuICBLZXlXOiAndycsXG4gIEtleVg6ICd4JyxcbiAgS2V5WTogJ3knLFxuICBLZXlaOiAneicsXG4gIEYxOiAgJ0YxJyxcbiAgRjI6ICAnRjInLFxuICBGMzogICdGMycsXG4gIEY0OiAgJ0Y0JyxcbiAgRjU6ICAnRjUnLFxuICBGNjogICdGNicsXG4gIEY3OiAgJ0Y3JyxcbiAgRjg6ICAnRjgnLFxuICBGOTogICdGOScsXG4gIEYxMDogJ0YxMCcsXG4gIEYxMTogJ0YxMScsXG4gIEYxMjogJ0YxMicsXG4gIEVuZDogJ0VuZCcsXG4gIEhvbWU6ICdIb21lJyxcbiAgQXJyb3dVcDogICAgJ+KGkScsXG4gIEFycm93RG93bjogICfihpMnLFxuICBBcnJvd0xlZnQ6ICAn4oaQJyxcbiAgQXJyb3dSaWdodDogJ+KGkicsXG4gIERlbGV0ZTogICAnRGVsJyxcbiAgUGFnZVVwOiAgICdQZ1VwJyxcbiAgUGFnZURvd246ICdQZ0RuJyxcbn1cblxuZnVuY3Rpb24gY29kZVRvQ2hhcihldm4sIG9wdD17Y29kZU9ubHk6ZmFsc2V9KSB7XG4gIGNvbnN0IHtjb2RlLCBzaGlmdEtleX0gPSBldm5cbiAgY29uc3Qge2NvZGVPbmx5fSA9IG9wdFxuICBsZXQgbWF0Y2hcbiAgbGV0IGNoYXIgPSAnJ1xuICBtYXRjaCA9IGNvZGUubWF0Y2goL0tleSguKS8pXG4gIGlmIChtYXRjaCkge1xuICAgIGNoYXIgPSBtYXRjaC5wb3AoKVxuICAgIGlmICghY29kZU9ubHkgJiYgIXNoaWZ0S2V5KSB7XG4gICAgICBjaGFyID0gY2hhci50b0xvd2VyQ2FzZSgpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG1hdGNoID0gY29kZS5tYXRjaCgvKERpZ2l0fE51bXBhZCkoLikvKVxuICAgIGlmIChtYXRjaCkge1xuICAgICAgY2hhciA9IG1hdGNoLnBvcCgpXG4gICAgICBpZiAoIWNvZGVPbmx5ICYmIHNoaWZ0S2V5KSB7XG4gICAgICAgIGNoYXIgPSBrY29kZTNbY2hhcl1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xuICAgICAgICBjaGFyID0ga2NvZGUyW2NvZGVdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFyID0ga2NvZGUxW2NvZGVdXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBjaGFyXG59XG5cbmZ1bmN0aW9uIGNvZGVUb1Nob3coY29kZXMpIHtcbiAgcmV0dXJuIGNvZGVzLnNwbGl0KCc6JykubWFwKHg9PntcbiAgICByZXR1cm4gYCR7a3Nob3dbeF19YFxuICB9KS5qb2luKCfinKcnKVxufVxuXG53aW5kb3cubWl0bS5mbi5jb2RlVG9DaGFyID0gY29kZVRvQ2hhclxud2luZG93Lm1pdG0uZm4uY29kZVRvU2hvdyA9IGNvZGVUb1Nob3dcbm1vZHVsZS5leHBvcnRzID0ge1xuICBjb2RlVG9DaGFyLFxuICBrY29kZTEsXG4gIGtjb2RlMixcbiAga2NvZGUzLFxuICBrc2hvd1xufSIsImNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmZ1bmN0aW9uIF9wb3N0KGpzb24pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoanNvbilcbiAgICAgIH1cbiAgICAgIGZldGNoKCcvbWl0bS1wbGF5L3BsYXkuanNvbicsIGNvbmZpZylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJlc29sdmUocmVzcG9uc2UuanNvbigpKX0pXG4gICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBfcGxheShqc29uKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgd2luZG93LndzX19zZW5kKCdhdXRvZmlsbCcsIGpzb24sIHJlc29sdmUpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9XG4gIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBsYXkgKGF1dG9maWxsKSB7XG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgaWYgKGF1dG9maWxsKSB7XG4gICAgaWYgKHR5cGVvZiAoYXV0b2ZpbGwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcbiAgICB9XG4gICAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxuICAgIGNvbnN0IGxlbnRoID0gYXV0b2ZpbGwubGVuZ3RoXG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgIGNvbnN0IF9mcmFtZSA9IHdpbmRvd1sneHBsYXktZnJhbWUnXVxuICAgIGNvbnN0IF9qc29uID0ge2F1dG9maWxsLCBicm93c2VyLCBfcGFnZSwgX2ZyYW1lfVxuICAgIGNvbnN0IG1zZyA9IGxlbnRoID09PSAxID8gYCAgJHthdXRvZmlsbH1gIDogSlNPTi5zdHJpbmdpZnkoYXV0b2ZpbGwsIG51bGwsIDIpXG4gICAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAke21zZ31gLCBfYylcbiAgICBsZXQgcmVzdWx0XG4gICAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgX3Bvc3QoX2pzb24pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IF9wbGF5KF9qc29uKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuZnVuY3Rpb24gc3FsaXRlKCkge1xuICBjb25zdCBbY21kLCBxLCB0YmxdID0gYXJndW1lbnRzXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IHtxfVxuICAgICAgaWYgKHRibCkge1xuICAgICAgICBkYXRhLnRibCA9IHRibFxuICAgICAgfVxuICAgICAgd2luZG93LndzX19zZW5kKGNtZCwgZGF0YSwgcmVzb2x2ZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKVxuICAgIH1cbiAgfSlcbn1cblxud2luZG93Lm1pdG0uZm4uc3FsTGlzdCA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsTGlzdCcsIHEsIHRibClcbndpbmRvdy5taXRtLmZuLnNxbERlbCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbERlbCcgLCBxLCB0YmwpXG53aW5kb3cubWl0bS5mbi5zcWxJbnMgID0gKHEsIHRibCkgPT4gc3FsaXRlKCdzcWxJbnMnICwgcSwgdGJsKVxud2luZG93Lm1pdG0uZm4uc3FsVXBkICA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsVXBkJyAsIHEsIHRibClcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIGhpc3RvcnksIGNocm9tZSwgRXZlbnQsIENzc1NlbGVjdG9yR2VuZXJhdG9yICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IHtjb2RlVG9DaGFyOl9rZXl9ID0gcmVxdWlyZSgnLi9fa2V5Ym9hcmQnKVxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcbmNvbnN0IHBsYXkgPSByZXF1aXJlKCcuL193c19wbGF5JylcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuY29uc3Qgc3R5bGVMZWZ0ICA9ICd0b3A6IC0ycHg7IGxlZnQ6ICAzcHg7J1xuY29uc3Qgc3R5bGVUb3BSICA9ICd0b3A6ICAwcHg7IHJpZ2h0OiAzcHg7J1xuY29uc3Qgc3R5bGVSaWdodCA9ICd0b3A6IDE0cHg7IHJpZ2h0OiAzcHg7J1xuY29uc3QgYnV0dG9uU3R5bGU9ICcnXG5jb25zdCBzdHlsZSA9IGBcbi5taXRtLWNvbnRhaW5lciB7XG4gIHotaW5kZXg6IDk5OTk5O1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDE0cHg7XG59XG4ubWl0bS1jb250YWluZXIuY2VudGVyIHtcbiAgYmFja2dyb3VuZDogI2ZjZmZkY2IwO1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIC8qIGNlbnRlciB0aGUgZWxlbWVudCAqL1xuICByaWdodDogMDtcbiAgbGVmdDogMDtcbiAgdG9wOiAyMHB4O1xuICBtYXJnaW4tcmlnaHQ6IGF1dG87XG4gIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAvKiBnaXZlIGl0IGRpbWVuc2lvbnMgKi9cbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XG4gIHBhZGRpbmc6IDVweCAxMHB4O1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2lkdGg6IDkwJTtcbiAgZGlzcGxheTogbm9uZTtcbn1cbi5taXRtLWJ0biB7XG4gIGNvbG9yOiBibGFjaztcbiAgYm9yZGVyOiBub25lO1xuICBmb250LXNpemU6IDhweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAxcHggNnB4O1xuICBib3JkZXItcmFkaXVzOiAzcHg7XG4gIGZvbnQtZmFtaWx5OiBtb25hY28sIENvbnNvbGFzLCBcIkx1Y2lkYSBDb25zb2xlXCIsIG1vbm9zcGFjZTtcbn1cbi5taXRtLWJ0bjpob3ZlcntcbiAgdGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtcbn1cbi5taXRtLWJ0bi5sZWZ0LFxuLm1pdG0tYnRuLnJpZ2h0IHtcbiAgZGlzcGxheTogYmxvY2s7XG59XG4ubWl0bS1idG4ucmlnaHQge1xuICBmbG9hdDogcmlnaHQ7XG4gIG1hcmdpbi10b3A6IDJweDtcbn1cbi5iZ3JvdXAtbGVmdCxcbi5iZ3JvdXAtcmlnaHQge1xuICBkaXNwbGF5OiB0YWJsZTtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLmJncm91cC1sZWZ0MiB7XG4gIGRpc3BsYXk6IHRhYmxlO1xuICBtYXJnaW4tdG9wOiAwO1xufVxuLmJncm91cC1sZWZ0PmRpdixcbi5iZ3JvdXAtbGVmdDI+ZGl2LFxuLmJncm91cC1yaWdodD5kaXYge1xuICBwYWRkaW5nLWJvdHRvbTogMnB4O1xufVxuLmJncm91cC10b3ByLFxuLmJncm91cC10b3ByIHNwYW4ge1xuICBmb250LXNpemU6IDE0cHg7XG59YFxuXG5sZXQgY29udGFpbmVyID0ge1xuICB0b3ByOiB7fSxcbiAgbGVmdDoge30sXG4gIHJpZ2h0OiB7fSxcbiAgdGFyZ2V0OiB7fSxcbn1cbmxldCBidXR0b24gPSB7fVxubGV0IGJncm91cCA9IHtcbiAgcmlnaHQ6IHt9LFxuICB0b3ByOiB7fSxcbiAgbGVmdDoge30sXG59XG5cbmZ1bmN0aW9uIHdhaXQobXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXG59O1xuXG5mdW5jdGlvbiB0b1JlZ2V4IChwYXRoTXNnKSB7XG4gIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXG4gIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JylcbiAgcmV0dXJuIHsgcGF0aCwgbXNnIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvcykge1xuICBmb3IgKGNvbnN0IGlkIGluIGJ1dHRvbnMpIHtcbiAgICBjb25zdCBbY2FwdGlvbiwgY29sb3IsIGtsYXNdID0gaWQuc3BsaXQoJ3wnKS5tYXAoeD0+eC50cmltKCkpXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICBjb25zdCBmbiAgPSBidXR0b25zW2lkXVxuICAgIGJ0bi5vbmNsaWNrID0gYXN5bmMgZSA9PiB7XG4gICAgICBsZXQgYXJyID0gZm4oZSlcbiAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIGFyciA9IGF3YWl0IGFyclxuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkge1xuICAgICAgICBhd2FpdCBwbGF5KGFycilcbiAgICAgIH1cbiAgICB9XG4gICAgYnRuLmlubmVyVGV4dCA9IGNhcHRpb25cbiAgICBidG4uY2xhc3NMaXN0LmFkZCgnbWl0bS1idG4nKVxuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGAke3Bvc31gKVxuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGtsYXMgfHwgY2FwdGlvbilcbiAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXG4gICAgaWYgKHBvcz09PSd0b3ByJykge1xuICAgICAgY29uc3QgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChicilcbiAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJ0bilcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChidG4pXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChkaXYpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldEJ1dHRvbnMgKGJ1dHRvbnMsIHBvc2l0aW9uKSB7XG4gIGlmIChiZ3JvdXBbcG9zaXRpb25dKSB7XG4gICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xuICAgIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3NpdGlvbilcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZhdWx0SG90S2V5cygpIHtcbiAgY29uc3Qge21pdG06IHtzdmVsdGU6IHtDc3BoZWFkZXIsIFNxbGl0ZX0sIGZufX0gPSB3aW5kb3dcbiAgY29uc3QgcXJ5ICA9ICcubWl0bS1jb250YWluZXIucG9wdXAnIFxuICBjb25zdCBrZXlzID0ge1xuICAgICdjb2RlOktleUMnKF9lKSB7Zm4uc3ZlbHRlKENzcGhlYWRlciwgJ0xpZ2h0UGFzdGVsR3JlZW4nKX0sXG4gICAgJ2NvZGU6S2V5UScoX2UpIHtmbi5zdmVsdGUoU3FsaXRlICAgLCAnTGlnaHRQYXN0ZWxHcmVlbicpfSxcbiAgICAna2V5OnknICAgIChfZSkge2ZuLmF4ZXJ1biggICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9LFxuICAgICdrZXk6eWFhJyAgKF9lKSB7Zm4uYXhlcnVuKFsnd2NhZzJhJywnd2NhZzJhYSddICAgICAgICAgKX0sXG4gICAgJ2tleTp5YWFhJyAoX2UpIHtmbi5heGVydW4oWyd3Y2FnMmEnLCd3Y2FnMmFhJywnd2NhZzJhYWEnLCdiZXN0LXByYWN0aWNlJ10pfSxcbiAgICAna2V5OnljJyAgIChfZSkge2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXJ5KS5pbm5lclRleHQgPSAnJyAgICAgICAgICAgICAgICB9LFxuICB9XG4gIGtleXNbJ2NvZGU6S2V5QyddLl90aXRsZSA9ICdTaG93IENTUCBIZWFkZXInXG4gIGtleXNbJ2NvZGU6S2V5USddLl90aXRsZSA9ICdTaG93IFNxbGl0ZSdcbiAga2V5c1sna2V5OnknICAgIF0uX3RpdGxlID0gJ0V4ZWNzIGExMXkgY2hlY2snXG4gIGtleXNbJ2tleTp5YWEnICBdLl90aXRsZSA9ICdFeGVjcyBhMTF5IHdjYWc6YWEnXG4gIGtleXNbJ2tleTp5YWFhJyBdLl90aXRsZSA9ICdFeGVjcyBhMTF5IHN0cmljdCdcbiAga2V5c1sna2V5OnljJyAgIF0uX3RpdGxlID0gJ0NsZWFyIGExMXkgcmVzdWx0J1xuICBtaXRtLm1hY3Jva2V5cyA9IGtleXNcbn1cblxubGV0IGRlYnVua1xubGV0IGludGVydklkXG5sZXQgb25jZXMgPSB7fSAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcblxuYXN5bmMgZnVuY3Rpb24gdXJsQ2hhbmdlIChldmVudCkge1xuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgY29uc3Qge21pdG19ID0gd2luZG93XG5cbiAgaWYgKG1pdG0uYXJndi5hMTF5ICYmIG1pdG0uZm4uYXhlcnVuKSB7XG4gICAgbWl0bS5mbi5heGVydW4oKVxuICB9XG5cbiAgY2xlYXJJbnRlcnZhbChpbnRlcnZJZClcbiAgaWYgKG1pdG0uYXV0b2ludGVydmFsKSB7ZGVsZXRlIG1pdG0uYXV0b2ludGVydmFsfVxuICBpZiAobWl0bS5hdXRvZmlsbCkgICAgIHtkZWxldGUgbWl0bS5hdXRvZmlsbCAgICB9XG4gIGlmIChtaXRtLmF1dG9idXR0b25zKSAge2RlbGV0ZSBtaXRtLmF1dG9idXR0b25zIH1cbiAgaWYgKG1pdG0ubGVmdGJ1dHRvbnMpICB7ZGVsZXRlIG1pdG0ubGVmdGJ1dHRvbnMgfVxuICBpZiAobWl0bS5yaWdodGJ1dHRvbnMpIHtkZWxldGUgbWl0bS5yaWdodGJ1dHRvbnN9XG4gIGlmIChtaXRtLm1hY3Jva2V5cykgICAge2RlZmF1bHRIb3RLZXlzKCkgICAgICAgIH1cbiAgaWYgKG5hbWVzcGFjZSkge1xuICAgIGNvbnN0IHtocmVmLCBvcmlnaW59ID0gbG9jYXRpb25cbiAgICBjb25zdCBfaHJlZiA9IGhyZWYucmVwbGFjZShvcmlnaW4sICcnKVxuICAgIG9ic2VydmVyZm4gPSBbXVxuICAgIGxldCBub25lID0gdHJ1ZVxuICAgIGZvciAoY29uc3Qga2V5IGluIG1pdG0ubWFjcm9zKSB7XG4gICAgICBjb25zdCB7IHBhdGgsIG1zZyB9ID0gdG9SZWdleChrZXkpXG4gICAgICBpZiAoX2hyZWYubWF0Y2gocGF0aCkpIHtcbiAgICAgICAgbm9uZSA9IGZhbHNlXG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBtc2cgfHwgJ0VudHJ5J1xuICAgICAgICBsZXQgZm5zID0gbWl0bS5tYWNyb3Nba2V5XSgpXG4gICAgICAgIGlmIChmbnMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgZm5zID0gYXdhaXQgZm5zXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvYnNlcnZlcmZuLnB1c2goZm5zKVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZm5zKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgZm4yIG9mIGZucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmbjIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZuMilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZGVidW5rICYmIGNsZWFyVGltZW91dChkZWJ1bmspXG4gICAgICAgIGRlYnVuayA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXG4gICAgICAgICAgZGVidW5rID0gdW5kZWZpbmVkXG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYXV0b2J1dHRvbnMsXG4gICAgICAgICAgICByaWdodGJ1dHRvbnMsXG4gICAgICAgICAgICBsZWZ0YnV0dG9ucyxcbiAgICAgICAgICAgIGxlZnQyYnV0dG9uc1xuICAgICAgICAgIH0gPSB3aW5kb3cubWl0bVxuICAgICAgICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xuICAgICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XG4gICAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxuICAgICAgICAgICAgICAnRW50cnknKCkge1xuICAgICAgICAgICAgICAgIGxldCB7YXV0b2ZpbGx9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF1dG9maWxsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGxheShhdXRvZmlsbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgJ3RvcHInKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodCcpXG4gICAgICAgICAgbGVmdDJidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdDJidXR0b25zLCAnbGVmdDInKVxuICAgICAgICAgIGxlZnRidXR0b25zICAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zICwgJ2xlZnQnIClcbiAgICAgICAgfSwgMClcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vbmUpIHtcbiAgICAgIHNldEJ1dHRvbnMoe30sICdyaWdodCcpXG4gICAgICBzZXRCdXR0b25zKHt9LCAnbGVmdCcpXG4gICAgICBzZXRCdXR0b25zKHt9LCAndG9wcicpXG4gICAgICBjb25zdCB7bGVmdDJidXR0b25zfSA9IHdpbmRvdy5taXRtXG4gICAgICBsZWZ0MmJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhsZWZ0MmJ1dHRvbnMsICdsZWZ0MicpXG4gICAgfVxuICB9XG4gIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcbiAgY29udGFpbmVyLnRvcHIuc3R5bGUgID0gc3R5bGVUb3BSXG4gIGNvbnRhaW5lci5sZWZ0LnN0eWxlICA9IHN0eWxlTGVmdFxuICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxuICBidXR0b24uc3R5bGUgPSBidXR0b25TdHlsZSArICh2aXNpYmxlID8gJ2JhY2tncm91bmQtY29sb3I6IGF6dXJlOycgOiAnZGlzcGxheTogbm9uZTsnKVxuICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcbiAgfVxuICBjdHJsID0gZmFsc2Vcbn1cblxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XG53aW5kb3cub2JzZXJ2ZXIgPSBvYnNlcnZlclxuZnVuY3Rpb24gb2JzZXJ2ZWQoKSB7XG4gIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZVxuICB9KVxufVxuXG5jb25zdCBfdXJsQ2hhbmdlZCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXG5mdW5jdGlvbiBpbml0KCkge1xuICBjb25zdCBib2R5ICAgICA9IGRvY3VtZW50LmJvZHlcbiAgY29uc3QgZGl2UmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdlRvcFIgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZMZWZ0ICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgZGl2UG9wdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdkNlbnRlcj0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBodG1sICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnIClcbiAgY29uc3Qgc3R5bGVCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gIGNvbnN0IGh0bWxyZWYgID0gaHRtbC5maXJzdEVsZW1lbnRDaGlsZFxuICBjb25zdCBib2R5cmVmICA9IGJvZHkuZmlyc3RFbGVtZW50Q2hpbGRcbiAgZGl2UmlnaHQuc3R5bGUgPSBzdHlsZVJpZ2h0XG4gIGRpdlRvcFIgLnN0eWxlID0gc3R5bGVUb3BSXG4gIGRpdkxlZnQgLnN0eWxlID0gc3R5bGVMZWZ0XG5cbiAgc3R5bGVCdG4gLmlubmVySFRNTCA9IHN0eWxlXG4gIHN0eWxlQnRuIC5jbGFzc05hbWUgPSAnbWl0bS1jbGFzcydcbiAgZGl2UmlnaHQgLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1yaWdodFwiPjwvc3Bhbj5gXG4gIGRpdlRvcFIgIC5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtdG9wclwiPjwvc3Bhbj5gXG4gIGRpdkxlZnQgIC5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJiZ3JvdXAtbGVmdFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cImJncm91cC1sZWZ0MlwiPjwvc3Bhbj5gXG4gIGRpdkxlZnQgIC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgbGVmdCdcbiAgZGl2VG9wUiAgLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciB0b3ByJ1xuICBkaXZSaWdodCAuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIHJpZ2h0J1xuICBkaXZQb3B1cCAuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIHBvcHVwJ1xuICBkaXZDZW50ZXIuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIGNlbnRlcidcblxuICBodG1sLmluc2VydEJlZm9yZShzdHlsZUJ0biAsIGh0bWxyZWYpXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdlJpZ2h0ICwgaHRtbHJlZilcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2VG9wUiAgLCBodG1scmVmKVxuICBodG1sLmluc2VydEJlZm9yZShkaXZMZWZ0ICAsIGh0bWxyZWYpXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdkNlbnRlciwgaHRtbHJlZilcbiAgYm9keS5pbnNlcnRCZWZvcmUoZGl2UG9wdXAgLCBib2R5cmVmKVxuICAvLyBib2R5LmFwcGVuZENoaWxkIChkaXZQb3B1cClcbiAgY29uc3QgaG90a2V5ID0gbmV3IG1pdG0uc3ZlbHRlLkhvdGtleXMoe3RhcmdldDpkaXZDZW50ZXJ9KVxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb250YWluZXIudG9wciA9IGRpdlRvcFJcbiAgICBjb250YWluZXIubGVmdCA9IGRpdkxlZnRcbiAgICBjb250YWluZXIucmlnaHQ9IGRpdlJpZ2h0XG4gICAgY29udGFpbmVyLmhvdGtleSA9IGhvdGtleVxuICAgIGNvbnRhaW5lci5wb3B1cCAgPSBkaXZQb3B1cFxuICAgIGNvbnRhaW5lci50YXJnZXQgPSBkaXZDZW50ZXJcbiAgICBjb250YWluZXIubm9kZWtleT0gZGl2Q2VudGVyLmNoaWxkcmVuWzBdXG4gICAgYnV0dG9uLnN0eWxlID0gYCR7YnV0dG9uU3R5bGV9YmFja2dyb3VuZC1jb2xvcjogYXp1cmU7YFxuICAgIGJncm91cC5yaWdodCA9IGRpdlJpZ2h0LmNoaWxkcmVuWzBdXG4gICAgYmdyb3VwLnRvcHIgID0gZGl2VG9wUiAuY2hpbGRyZW5bMF1cbiAgICBiZ3JvdXAubGVmdCAgPSBkaXZMZWZ0IC5jaGlsZHJlblswXVxuICAgIGJncm91cC5sZWZ0MiA9IGRpdkxlZnQgLmNoaWxkcmVuWzFdXG4gICAgdXJsQ2hhbmdlKF91cmxDaGFuZ2VkKVxuICAgIG9ic2VydmVkKClcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoY2VudGVyICYmICFkaXZDZW50ZXIuY29udGFpbnMoZXZlbnQudGFyZ2V0KSkge1xuICAgICAgICBkaXZDZW50ZXIuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcbiAgICAgICAgY2VudGVyID0gZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgMClcbn1cblxuZnVuY3Rpb24gbWFjcm9BdXRvbWF0aW9uKG1hY3JvKSB7XG4gIGlmIChjZW50ZXIpIHtcbiAgICBjb250YWluZXIudGFyZ2V0LmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXG4gICAgY2VudGVyID0gZmFsc2VcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcbiAgICBsZXQgbWFjcm9JbmRleCA9IDBcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXG4gICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcbiAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG4gICAgICAgIHNlbGVjdG9yID0gYCR7YWN0aXZlRWxlbWVudH0gJHtzZWxlY3Rvcn1gXG4gICAgICB9XG4gICAgICBwbGF5KFtzZWxlY3Rvcl0pXG5cbiAgICAgIG1hY3JvSW5kZXggKz0gMVxuICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXG4gICAgICB9XG4gICAgfSwgMTAwKVxuICB9XG59XG5cbmxldCBzdGREYmwgPSBbXVxubGV0IGhnaERibCA9IFtdXG5sZXQgc3RkQ3RsID0gW11cbmxldCBoZ2hDdGwgPSBbXVxubGV0IHN0ZEFsdCA9IFtdXG5sZXQgaGdoQWx0ID0gW11cbmxldCBzYXZlS2V5ID0gJydcbmNvbnN0IGtkZWxheSA9IDEwMDBcblxubGV0IGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG5mdW5jdGlvbiBtYWNyb0RibCgpIHtcbiAgY29uc3Qga2V5MSA9IGBrZXk6JHtzdGREYmwuam9pbignJyl9YFxuICBjb25zdCBrZXkyID0gYGNvZGU6JHtoZ2hEYmwuam9pbignOicpfWBcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXG5cbiAgc3RkRGJsID0gW11cbiAgaGdoRGJsID0gW11cbiAgc2F2ZUtleSA9ICcnXG4gIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiBjdHJsICsgYWx0ICArICAke2tleTF9ICB8ICAke2tleTJ9YCwgX2MpXG4gIGlmIChtYWNybykge1xuICAgIG1hY3JvID0gbWFjcm8oZSlcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5sZXQgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcbmZ1bmN0aW9uIG1hY3JvQ3RsKCkge1xuICBjb25zdCBrZXkxID0gYGtleTo8JHtzdGRDdGwuam9pbignJyl9PmBcbiAgY29uc3Qga2V5MiA9IGBjb2RlOjwke2hnaEN0bC5qb2luKCc6Jyl9PmBcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXG5cbiAgc3RkQ3RsID0gW11cbiAgaGdoQ3RsID0gW11cbiAgc2F2ZUtleSA9ICcnXG4gIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAuLi4uICsgY3RybCArICR7a2V5MX0gfCAke2tleTJ9YCwgJ2NvbG9yOiAjYmFlYWYxJylcbiAgaWYgKG1hY3JvKSB7XG4gICAgbWFjcm8gPSBtYWNybyhlKVxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmxldCBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuZnVuY3Rpb24gbWFjcm9BbHQoKSB7XG4gIGNvbnN0IGtleTEgPSBga2V5Onske3N0ZEFsdC5qb2luKCcnKX19YFxuICBjb25zdCBrZXkyID0gYGNvZGU6eyR7aGdoQWx0LmpvaW4oJzonKX19YFxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cblxuICBzdGRBbHQgPSBbXVxuICBoZ2hBbHQgPSBbXVxuICBzYXZlS2V5ID0gJydcbiAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBhbHQgICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWRhZjEnKVxuICBpZiAobWFjcm8pIHtcbiAgICBtYWNybyA9IG1hY3JvKGUpXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5YlVwIChlKSB7XG4gIGlmICghZS5hbHRLZXkpIHtcbiAgICBpZiAoZGVib3VuY2VEYmwgfHwgKGRlYm91bmNlQ3RsICYmICFlLmN0cmxLZXkpIHx8IGRlYm91bmNlQWx0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXG4gICAgICBpZiAoZGVib3VuY2VEYmwpIHtcbiAgICAgICAgbWFjcm9EYmwoKVxuICAgICAgfSBlbHNlIFxuICAgICAgaWYgKGRlYm91bmNlQ3RsKSB7XG4gICAgICAgIG1hY3JvQ3RsKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hY3JvQWx0KClcbiAgICAgIH1cbiAgICAgIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG4gICAgICBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxuICAgICAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcbiAgICB9XG4gIH1cbn1cbnZhciBjdHJsID0gZmFsc2VcbnZhciBjZW50ZXIgPSBmYWxzZVxuZnVuY3Rpb24ga2V5YkN0cmwgKGUpIHtcbiAgaWYgKCFlLmNvZGUgfHwgWydBbHQnLCAnQ29udHJvbCcsICdNZXRhJ10uaW5jbHVkZXMoZS5rZXkpKSB7XG4gICAgcmV0dXJuXG4gIH0gZWxzZSB7XG4gICAgaWYgKGUua2V5PT09J1NoaWZ0Jykge1xuICAgICAgaWYgKGUuY3RybEtleSAmJiAhZS5hbHRLZXkpIHtcbiAgICAgICAgY29uc3Qge25vZGVrZXksIHRhcmdldCwgcmlnaHQsIHRvcHIsIGxlZnR9ID0gY29udGFpbmVyXG4gICAgICAgIGlmIChlLmNvZGU9PT0nU2hpZnRSaWdodCcpIHtcbiAgICAgICAgICBjdHJsID0gIWN0cmxcbiAgICAgICAgICByaWdodC5zdHlsZSA9IHN0eWxlUmlnaHQrICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICAgICAgICB0b3ByLnN0eWxlICA9IHN0eWxlVG9wUiArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICAgICAgICBsZWZ0LnN0eWxlICA9IHN0eWxlTGVmdCArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JykgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0YXJnZXQuY2hpbGRyZW5bMF0hPT1ub2Rla2V5KSB7XG4gICAgICAgICAgICB0YXJnZXQucmVwbGFjZUNoaWxkcmVuKG5vZGVrZXkpXG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUgPSAnZGlzcGxheTogYmxvY2s7J1xuICAgICAgICAgICAgY2VudGVyID0gdHJ1ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZW50ZXIgPSAhY2VudGVyXG4gICAgICAgICAgICBpZiAoY2VudGVyKSB7XG4gICAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXQuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcbiAgICAgICAgICAgIH0gIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgY2hhciA9IF9rZXkoZSlcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcbiAgICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgICBjaGFyID0gX2tleShlLCB7Y29kZU9ubHk6IHRydWV9KVxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICAgIHNhdmVLZXkgKz0gY2hhclxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9IFxuICAgICAgICBzdGREYmwucHVzaChjaGFyKVxuICAgICAgICBoZ2hEYmwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgZGVib3VuY2VEYmwgPSBzZXRUaW1lb3V0KG1hY3JvRGJsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuY3RybEtleSkge1xuICAgICAgICBzdGRDdGwucHVzaChjaGFyKVxuICAgICAgICBoZ2hDdGwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgICAgZGVib3VuY2VDdGwgPSBzZXRUaW1lb3V0KG1hY3JvQ3RsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIHN0ZEFsdC5wdXNoKGNoYXIpXG4gICAgICAgIGhnaEFsdC5wdXNoKGUuY29kZSlcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICBkZWJvdW5jZUFsdCA9IHNldFRpbWVvdXQobWFjcm9BbHQsIGtkZWxheSlcbiAgICAgIH1cbiAgICAgIGUuX2tleXMgPSBzYXZlS2V5XG4gICAgICBtaXRtLmxhc3RLZXkgPSBlICAgICAgICBcbiAgICB9IFxuICB9XG59XG5cbmNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxubGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXG5sZXQgb0RlYnVuayA9IHVuZGVmaW5lZFxubGV0IG9ic2VydmVyZm4gPSBbXVxuXG5mdW5jdGlvbiBjb21wYXJlSHJlZihub2Rlcykge1xuICAvLyBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IERPTSBtdXRhdGVkIWAsIF9jKVxuICBpZiAob2xkSHJlZiAhPSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQoX3VybENoYW5nZWQpXG4gICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcbiAgfSBlbHNlIHtcbiAgICBpZiAob2JzZXJ2ZXJmbi5sZW5ndGgpIHtcbiAgICAgIG9EZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KG9EZWJ1bmspXG4gICAgICBvRGVidW5rID0gc2V0VGltZW91dCgoKT0+IHtcbiAgICAgICAgb0RlYnVuayA9IHVuZGVmaW5lZFxuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIG9ic2VydmVyZm4pIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZm4ubmFtZVxuICAgICAgICAgIGlmIChuYW1lICYmIG5hbWUubWF0Y2goL09uY2UkLykpIHtcbiAgICAgICAgICAgIGlmIChvbmNlc1tuYW1lXSkgeyAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9uY2VzW25hbWVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmbihub2RlcylcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7YXV0b2J1dHRvbnMsIHJpZ2h0YnV0dG9ucywgbGVmdGJ1dHRvbnN9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxuICAgICAgICBsZWZ0YnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zLCAnbGVmdCcpXG4gICAgICAgIGNvbnN0IHsgYXV0b2ZpbGwgfSA9IHdpbmRvdy5taXRtXG4gICAgICAgIGlmIChhdXRvZmlsbCkge1xuICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xuICAgICAgICAgICAgLi4uYXV0b2J1dHRvbnMsXG4gICAgICAgICAgICAnRW50cnknKCkge3BsYXkoYXV0b2ZpbGwpfVxuICAgICAgICAgIH0sICd0b3ByJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicpXG4gICAgICAgIH1cblxuICAgICAgfSwgMTAwKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB3c0xvY2F0aW9uKCkge1xuICBjb25zdCB2ZW5kb3IgPSBfd3NfdmVuZG9yKClcbiAgaWYgKFsnZmlyZWZveCcsICd3ZWJraXQnXS5pbmNsdWRlcyh2ZW5kb3IpIHx8IChjaHJvbWUgJiYgIWNocm9tZS50YWJzKSkge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5YkN0cmwpXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5YlVwKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxuICAgIGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdsb2FkaW5nJykge1xuICAgICAgaW5pdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQpXG4gICAgfSAgICBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGVcbiAgaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxuICAgIGNvbXBhcmVIcmVmKClcbiAgfVxufVxuXG5jb25zdCBwYXN0ZWwgPSB7XG4gIFBvc3RJdDogICAgICAgICAgJyNmY2ZmZGNkNicsXG4gIFBhc3RlbEdyZWVuOiAgICAgJyM3N2RkNzdkNicsXG4gIFBhc3RlbEJyb3duOiAgICAgJyM4MzY5NTNkNicsXG4gIEJhYnlCbHVlOiAgICAgICAgJyM4OWNmZjBkNicsXG4gIFBhc3RlbFR1cnF1b2lzZTogJyM5OWM1YzRkNicsXG4gIEJsdWVHcmVlblBhc3RlbDogJyM5YWRlZGJkNicsXG4gIFBlcnNpYW5QYXN0ZWw6ICAgJyNhYTk0OTlkNicsXG4gIE1hZ2ljTWludDogICAgICAgJyNhYWYwZDFkNicsXG4gIExpZ2h0UGFzdGVsR3JlZW46JyNiMmZiYTVkNicsXG4gIFBhc3RlbFB1cnBsZTogICAgJyNiMzllYjVkNicsXG4gIFBhc3RlbExpbGFjOiAgICAgJyNiZGIwZDBkNicsXG4gIFBhc3RlbFBlYTogICAgICAgJyNiZWU3YTVkNicsXG4gIExpZ2h0TGltZTogICAgICAgJyNiZWZkNzNkNicsXG4gIExpZ2h0UGVyaXdpbmtsZTogJyNjMWM2ZmNkNicsXG4gIFBhbGVNYXV2ZTogICAgICAgJyNjNmE0YTRkNicsXG4gIExpZ2h0TGlnaHRHcmVlbjogJyNjOGZmYjBkNicsXG4gIFBhc3RlbFZpb2xldDogICAgJyNjYjk5YzlkNicsXG4gIFBhc3RlbE1pbnQ6ICAgICAgJyNjZWYwY2NkNicsXG4gIFBhc3RlbEdyZXk6ICAgICAgJyNjZmNmYzRkNicsXG4gIFBhbGVCbHVlOiAgICAgICAgJyNkNmZmZmVkNicsXG4gIFBhc3RlbExhdmVuZGVyOiAgJyNkOGExYzRkNicsXG4gIFBhc3RlbFBpbms6ICAgICAgJyNkZWE1YTRkNicsXG4gIFBhc3RlbFNtaXJrOiAgICAgJyNkZWVjZTFkNicsXG4gIFBhc3RlbERheTogICAgICAgJyNkZmQ4ZTFkNicsXG4gIFBhc3RlbFBhcmNobWVudDogJyNlNWQ5ZDNkNicsXG4gIFBhc3RlbFJvc2VUYW46ICAgJyNlOWQxYmZkNicsXG4gIFBhc3RlbE1hZ2VudGE6ICAgJyNmNDlhYzJkNicsXG4gIEVsZWN0cmljTGF2ZW5kZXI6JyNmNGJmZmZkNicsXG4gIFBhc3RlbFllbGxvdzogICAgJyNmZGZkOTZkNicsXG4gIFBhc3RlbFJlZDogICAgICAgJyNmZjY5NjFkNicsXG4gIFBhc3RlbE9yYW5nZTogICAgJyNmZjk2NGZkNicsXG4gIEFtZXJpY2FuUGluazogICAgJyNmZjk4OTlkNicsXG4gIEJhYnlQaW5rOiAgICAgICAgJyNmZmI3Y2VkNicsXG4gIEJhYnlQdXJwbGU6ICAgICAgJyNjYTliZjdkNicsXG59XG5cbmZ1bmN0aW9uIHN2ZWx0ZShTdmVsdCwgYmc9J1Bvc3RJdCcpIHsgLy8gZmVhdDogc3ZlbHRlIHJlbGF0ZWRcbiAgY29uc3Qge3RhcmdldCwgcG9wdXB9ID0gY29udGFpbmVyXG4gIHRhcmdldC5yZXBsYWNlQ2hpbGRyZW4oJycpXG4gIC8vIHBvcHVwIC5yZXBsYWNlQ2hpbGRyZW4oJycpXG4gIGlmICh0eXBlb2YoYmcpIT09J3N0cmluZycgJiYgYmcucG9wdXApIHtcbiAgICBjb25zdCBwcm9wcyA9IHtub2RlOiBiZy5ub2RlfVxuICAgIHdpbmRvdy5taXRtLnNhcHAgPSBuZXcgU3ZlbHQoe3RhcmdldDogcG9wdXAsIHByb3BzfSlcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cubWl0bS5zYXBwID0gbmV3IFN2ZWx0KHt0YXJnZXR9KVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgYmNvbG9yID0gcGFzdGVsW2JnXVxuICAgICAgdGFyZ2V0LnN0eWxlID0gYGRpc3BsYXk6IGJsb2NrJHtiY29sb3IgPyAnO2JhY2tncm91bmQ6JytiY29sb3IgOiAnJ307YFxuICAgICAgY2VudGVyID0gdHJ1ZVxuICAgIH0sIDApICBcbiAgfVxufVxuXG5mdW5jdGlvbiBob3RLZXlzKG9iaikge1xuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxuICAgIC4uLm9ialxuICB9XG59XG5cbndpbmRvdy5taXRtLmZuLm1hY3JvQXV0b21hdGlvbiA9IG1hY3JvQXV0b21hdGlvblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IGhvdEtleXNcbndpbmRvdy5taXRtLmZuLnN2ZWx0ZSA9IHN2ZWx0ZVxud2luZG93Lm1pdG0uZm4ucGxheSA9IHBsYXlcbndpbmRvdy5taXRtLmZuLndhaXQgPSB3YWl0XG5cbm1vZHVsZS5leHBvcnRzID0gd3NMb2NhdGlvblxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xuICBsZXQgX3RpbWVvdXRcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcbiAgICB9LCBkZWxheSlcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBsZXQgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXVxuICBjb25zdCB7X3N1Ym5zOiBzfSA9IHJvdXRlLl9jaGlsZG5zXG4gIGlmIChzICYmIG1pdG0ucm91dGVzW3NdKSB7XG4gICAgcm91dGU9IG1pdG0ucm91dGVzW3NdXG4gIH1cbiAgcmV0dXJuIHJvdXRlXG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24sIE11dGF0aW9uT2JzZXJ2ZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL19zY3JlZW5zaG90JylcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX2RlYm91bmNlID0gcmVxdWlyZSgnLi9fd3NfZGVib3VuY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfd3Nfcm91dGUgPSByZXF1aXJlKCcuL193c19yb3V0ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBpZiAobG9jYXRpb24ub3JpZ2luLm1hdGNoKCdjaHJvbWUtZXh0ZW5zaW9uJykpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoJzovLycgLCd+ficpXG4gIGNvbnN0IHNzaG90ID0ge31cbiAgY29uc3Qgbm9kZXMgPSB7fVxuXG4gIGxldCByb3V0ZSA9IF93c19yb3V0ZSgpXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgY29uc3QgeyBvYnNlcnZlcjogb2IgfSA9IHJvdXRlLnNjcmVlbnNob3RcbiAgICBmb3IgKGNvbnN0IGlkIGluIG9iKSB7XG4gICAgICBsZXQgZWwgPSB7fVxuICAgICAgaWYgKG9iW2lkXSA9PT0gdHJ1ZSkge1xuICAgICAgICBlbCA9IHtcbiAgICAgICAgICB0aXRsZTogJ25vdGl0bGUnLFxuICAgICAgICAgIGluc2VydDogdHJ1ZSxcbiAgICAgICAgICByZW1vdmU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSBpZiAodHlwZW9mIG9iW2lkXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgZWwgPSB7XG4gICAgICAgICAgdGl0bGU6ICdub2NhcHR1cmUnLFxuICAgICAgICAgIGluc2VydDogZmFsc2UsXG4gICAgICAgICAgcmVtb3ZlOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhcnIgPSBvYltpZF0uc3BsaXQoJzonKVxuICAgICAgICBhcnJbMV0uc3BsaXQoJywnKS5tYXAoZSA9PiB7XG4gICAgICAgICAgZWxbZV0gPSB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGVsLnRpdGxlID0gYXJyWzBdXG4gICAgICB9XG4gICAgICBzc2hvdFtpZF0gPSBlbFxuICAgICAgbm9kZXNbaWRdID0ge1xuICAgICAgICBpbnNlcnQ6IGZhbHNlLFxuICAgICAgICByZW1vdmU6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgb2JcbiAgbGV0IGZuYW1lXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCBicm93c2VyID0gX3dzX3ZlbmRvcigpXG4gIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgICBvYiA9IHJvdXRlLnNjcmVlbnNob3Qub2JzZXJ2ZXJcbiAgICB9XG4gICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgIGZvciAoY29uc3QgaWQgaW4gbm9kZXMpIHtcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yQWxsKGlkKVxuICAgICAgaWYgKGVsLmxlbmd0aCkge1xuICAgICAgICBpZiAoIW5vZGVzW2lkXS5pbnNlcnQpIHtcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gdHJ1ZVxuICAgICAgICAgIGlmIChub2Rlc1tpZF0ucmVtb3ZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob2IgJiYgdHlwZW9mIG9iW2lkXT09PSdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZCA9IGVsWzBdIHx8IGVsXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudD09PXVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBub2QuX3dzX2NvdW50ID0gMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kLl93c19jb3VudCArPSAxXG4gICAgICAgICAgICBpZiAobm9kLl93c19jb3VudDwyKSB7XG4gICAgICAgICAgICAgIG9iW2lkXShub2QpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLmluc2VydCkge1xuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LWluc2VydGBcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0ucmVtb3ZlKSB7XG4gICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IHRydWVcbiAgICAgICAgICBub2Rlc1tpZF0uaW5zZXJ0ID0gZmFsc2VcbiAgICAgICAgICBpZiAoc3Nob3RbaWRdLnJlbW92ZSkge1xuICAgICAgICAgICAgZm5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgICAgICAgICBmbmFtZSA9IGB+JHtmbmFtZX0tJHtzc2hvdFtpZF0udGl0bGV9LXJlbW92ZWBcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHsgbmFtZXNwYWNlLCBfcGFnZSwgaG9zdCwgZm5hbWUsIGJyb3dzZXIgfVxuICAgICAgICAgICAgX3NjcmVlbnNob3QocGFyYW1zKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS5zY3JlZW5zaG90KSB7XG4gICAgY29uc3Qge29ic2VydmVyOiBvYn0gPSByb3V0ZS5zY3JlZW5zaG90XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGF0dHJpYnV0ZXM6IG9iID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihfd3NfZGVib3VuY2UoY2FsbGJhY2ssIDI4MCkpXG4gICAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIG9wdGlvbnMpXG4gICAgfSlcbiAgfVxufVxuIiwiY29uc3QgdDY0ID0gJ1dhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmgnXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxuY29uc3QgbmFub2lkID0gKHNpemUgPSA4KSA9PiB7XG4gIGxldCBpZCA9ICcnXG4gIHdoaWxlIChzaXplLS0gPiAwKSB7XG4gICAgaWQgKz0gdDY0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdXG4gIH1cbiAgcmV0dXJuIGlkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IF93cyB9ID0gd2luZG93XG5cbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcbiAgLy8gZXg6IHdzX2Jyb2FkY2FzdCgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfYnJvYWRjYXN0ID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgYnJvYWRjYXN0JHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3Bpbmd7XCJkYXRhXCI6XCJIaSFcIn0nKVxuICB3aW5kb3cud3NfZW1pdHBhZ2UgPSAoanNvbiwgcmVnZXggPSAnJykgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgcmVnZXggfVxuICAgIF93cy5zZW5kKGBlbWl0cGFnZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19zdHlsZSh7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9KVxuICB3aW5kb3cud3NfX3N0eWxlID0gKGpzb24sIF9hbGwgPSB0cnVlKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCBfYWxsIH1cbiAgICBfd3Muc2VuZChgX3N0eWxlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX3BpbmcoJ0hpIScpXG4gIHdpbmRvdy53c19fcGluZyA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX3Bpbmcke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19faGVscCgpXG4gIHdpbmRvdy53c19faGVscCA9ICgpID0+IHtcbiAgICBfd3Muc2VuZCgnX2hlbHB7fScpXG4gIH1cblxuICAvLyBleDogd3NfX29wZW4oe3VybDonaHR0cHM6Ly9nb29nbGUuY29tJ30pXG4gIHdpbmRvdy53c19fb3BlbiA9IChqc29uKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uIH1cbiAgICBfd3Muc2VuZChgX29wZW4ke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIHdpbmRvdy53c19fc2VuZCA9IChjbWQsIGRhdGEsIGhhbmRsZXIpID0+IHtcbiAgICBjb25zdCB7IF9fZmxhZyB9ID0gd2luZG93Lm1pdG1cbiAgICBjb25zdCBpZCA9IG5hbm9pZCgpXG4gICAgY29uc3Qga2V5ID0gYCR7Y21kfToke2lkfWBcbiAgICB3aW5kb3cuX3dzX3F1ZXVlW2tleV0gPSBoYW5kbGVyIHx8ICh3ID0+IHt9KVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAod2luZG93Ll93c19xdWV1ZVtrZXldKSB7XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cuX3dzX3F1ZXVlW2tleV1cbiAgICAgICAgY29uc29sZS5sb2coJyVjV3M6IHdzIHRpbWVvdXQhJywgX2MsIGtleSlcbiAgICAgIH1cbiAgICB9LCA1MDAwKVxuICAgIFxuICAgIGNvbnN0IHBhcmFtcyA9IGAke2tleX0ke0pTT04uc3RyaW5naWZ5KHsgZGF0YSB9KX1gXG4gICAgY29uc3QgZmxhZyA9IHdpbmRvdy5taXRtLl9fZmxhZ1snd3MtbWVzc2FnZSddXG4gICAgaWYgKGZsYWcgPiAxKSB7XG4gICAgICBjb25zb2xlLmxvZyhgX3dzLnNlbmQ6ICR7cGFyYW1zfWApXG4gICAgfVxuICAgIF93cy5zZW5kKHBhcmFtcylcbiAgfVxuICBjb25zdCB3c3J1biA9IHt9XG4gIGNvbnN0IGFyciA9IHdpbmRvdy5taXRtLndzcnVuXG4gIGZvciAoY29uc3QgayBvZiBhcnIpIHtcbiAgICBjb25zdCBjbWQgID0gay5yZXBsYWNlKCckJywgJycpXG4gICAgd3NydW5bY21kXSA9IChkYXRhLCBoYW5kbGVyKSA9PiB3aW5kb3cud3NfX3NlbmQoY21kLCBkYXRhLCBoYW5kbGVyKVxuICB9XG4gIHdpbmRvdy5taXRtLndzcnVuID0gd3NydW5cbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubGV0IF90aW1lb3V0XG5sZXQgX2NzcCA9IHt9XG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgY3NwRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgIGNvbnN0IHsgaG9zdG5hbWU6IGhvc3QgfSA9IGxvY2F0aW9uXG4gICAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gICAgY29uc3QgcGF0aCA9IGxvY2F0aW9uLnBhdGhuYW1lXG4gICAgICAucmVwbGFjZSgvXlxcLy8sICcnKVxuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLScpXG4gICAgY29uc3Qge1xuICAgICAgYmxvY2tlZFVSSSxcbiAgICAgIGRpc3Bvc2l0aW9uLFxuICAgICAgZG9jdW1lbnRVUkksXG4gICAgICBlZmZlY3RpdmVEaXJlY3RpdmUsXG4gICAgICBvcmlnaW5hbFBvbGljeSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGUsXG4gICAgICB2aW9sYXRlZERpcmVjdGl2ZVxuICAgIH0gPSBlXG4gICAgY29uc3QgdHlwID0gYFske2Rpc3Bvc2l0aW9ufV0gJHtkb2N1bWVudFVSSX1gXG4gICAgaWYgKCFfY3NwW3R5cF0pIHtcbiAgICAgIF9jc3BbdHlwXSA9IHt9XG4gICAgfVxuICAgIGlmICghX2NzcFt0eXBdLl9nZW5lcmFsXykge1xuICAgICAgX2NzcFt0eXBdLl9nZW5lcmFsXyA9IHtcbiAgICAgICAgcG9saWN5OiBvcmlnaW5hbFBvbGljeSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBob3N0LFxuICAgICAgICBwYXRoXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IF9kb2MgPSBfY3NwW3R5cF1cbiAgICBpZiAoIV9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdKSB7XG4gICAgICBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSA9IHt9XG4gICAgfVxuXG4gICAgY29uc3QgX2VyciA9IF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdXG4gICAgaWYgKCFfZXJyW2Jsb2NrZWRVUkldKSB7XG4gICAgICBfZXJyW2Jsb2NrZWRVUkldID0ge31cbiAgICB9XG4gICAgY29uc3QgX21hdGNoID0gb3JpZ2luYWxQb2xpY3kubWF0Y2goYCR7dmlvbGF0ZWREaXJlY3RpdmV9IFteO10rO2ApXG4gICAgY29uc3QgZGlyZWN0aXZlID0gX21hdGNoID8gX21hdGNoWzBdIDogZWZmZWN0aXZlRGlyZWN0aXZlXG4gICAgX2VycltibG9ja2VkVVJJXSA9IHtcbiAgICAgIGRpcmVjdGl2ZSxcbiAgICAgIHRpbWVTdGFtcCxcbiAgICAgIHR5cGVcbiAgICB9XG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IENTUDonLCBfY3NwKVxuICAgICAgLy8gd2luZG93LndzX19zZW5kKCdjc3BfZXJyb3InLCB7XG4gICAgICAvLyAgIG5hbWVzcGFjZSxcbiAgICAgIC8vICAgaG9zdCxcbiAgICAgIC8vICAgcGF0aCxcbiAgICAgIC8vICAgX2NzcCxcbiAgICAgIC8vIH0pO1xuICAgICAgX2NzcCA9IHt9XG4gICAgfSwgNDAwMClcbiAgfVxuXG4gIGlmICh3aW5kb3cubWl0bS5jbGllbnQuY3NwKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VjdXJpdHlwb2xpY3l2aW9sYXRpb24nLCBjc3BFcnJvcilcbiAgfVxufVxuLy8gZGlzcG9zaXRpb246IFwicmVwb3J0XCJcbi8vIGRvY3VtZW50VVJJOiBcImh0dHBzOi8vd2hhdC9odG1sL2NvbnRhaW4vY3NwXCJcbi8vIHZpb2xhdGVkRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuXG4vLyBibG9ja2VkVVJJOiBcImh0dHBzOi8vd2hhdC91cmwvZ2V0dGluZy9ibG9ja2VkXCJcbi8vIGVmZmVjdGl2ZURpcmVjdGl2ZTogXCJpbWctc3JjXCJcbi8vIG9yaWdpbmFsUG9saWN5OiBcInNjcmlwdC1zcmMgbnVsbDsgZnJhbWUtc3JjIG51bGw7IHN0eWxlLXNyYyBudWxsOyBzdHlsZS1zcmMtZWxlbSBudWxsOyBpbWctc3JjIG51bGw7XCJcbi8vIHRpbWVTdGFtcDogMTkzMy44MjAwMDAwMDU2NTMxXG4vLyB0eXBlOiBcInNlY3VyaXR5cG9saWN5dmlvbGF0aW9uXCJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICBpZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gICAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbiAgfVxuICBcbiAgd2luZG93Lm1pdG0uZm4uYXV0b2NsaWNrID0gKCkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ0bi1hdXRvZmlsbCcpLmNsaWNrKClcbiAgICB9LCAxMDAwKVxuICB9XG4gIFxuICB3aW5kb3cubWl0bS5mbi5nZXRDb29raWUgPSBuYW1lID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGA7ICR7ZG9jdW1lbnQuY29va2llfWA7XG4gICAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdChgOyAke25hbWV9PWApO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHJldHVybiBwYXJ0cy5wb3AoKS5zcGxpdCgnOycpLnNoaWZ0KCk7XG4gIH1cblxuICBjb25zdCBvbk1vdW50ID0gZSA9PiBjb25zb2xlLmxvZygnJWNNYWNyb3M6IGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCAnY29sb3I6ICM1YWRhNTUnLCBlKVxuICB3aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IG9uTW91bnRcbn1cbiIsImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmxldCBzcmNfdXJsX2VxdWFsX2FuY2hvcjtcbmZ1bmN0aW9uIHNyY191cmxfZXF1YWwoZWxlbWVudF9zcmMsIHVybCkge1xuICAgIGlmICghc3JjX3VybF9lcXVhbF9hbmNob3IpIHtcbiAgICAgICAgc3JjX3VybF9lcXVhbF9hbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgfVxuICAgIHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWYgPSB1cmw7XG4gICAgcmV0dXJuIGVsZW1lbnRfc3JjID09PSBzcmNfdXJsX2VxdWFsX2FuY2hvci5ocmVmO1xufVxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cbmZ1bmN0aW9uIGlzX2VtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG4gICAgaWYgKHN0b3JlICE9IG51bGwgJiYgdHlwZW9mIHN0b3JlLnN1YnNjcmliZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke25hbWV9JyBpcyBub3QgYSBzdG9yZSB3aXRoIGEgJ3N1YnNjcmliZScgbWV0aG9kYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3Vic2NyaWJlKHN0b3JlLCAuLi5jYWxsYmFja3MpIHtcbiAgICBpZiAoc3RvcmUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoLi4uY2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdW5zdWIudW5zdWJzY3JpYmUgPyAoKSA9PiB1bnN1Yi51bnN1YnNjcmliZSgpIDogdW5zdWI7XG59XG5mdW5jdGlvbiBnZXRfc3RvcmVfdmFsdWUoc3RvcmUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgc3Vic2NyaWJlKHN0b3JlLCBfID0+IHZhbHVlID0gXykoKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiBjb21wb25lbnRfc3Vic2NyaWJlKGNvbXBvbmVudCwgc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kucHVzaChzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBjcmVhdGVfc2xvdChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jdHggPSBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pO1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvblswXShzbG90X2N0eCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKSB7XG4gICAgcmV0dXJuIGRlZmluaXRpb25bMV0gJiYgZm5cbiAgICAgICAgPyBhc3NpZ24oJCRzY29wZS5jdHguc2xpY2UoKSwgZGVmaW5pdGlvblsxXShmbihjdHgpKSlcbiAgICAgICAgOiAkJHNjb3BlLmN0eDtcbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NoYW5nZXMoZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGZuKSB7XG4gICAgaWYgKGRlZmluaXRpb25bMl0gJiYgZm4pIHtcbiAgICAgICAgY29uc3QgbGV0cyA9IGRlZmluaXRpb25bMl0oZm4oZGlydHkpKTtcbiAgICAgICAgaWYgKCQkc2NvcGUuZGlydHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGxldHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsZXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gW107XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1heCgkJHNjb3BlLmRpcnR5Lmxlbmd0aCwgbGV0cy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZFtpXSA9ICQkc2NvcGUuZGlydHlbaV0gfCBsZXRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJCRzY29wZS5kaXJ0eSB8IGxldHM7XG4gICAgfVxuICAgIHJldHVybiAkJHNjb3BlLmRpcnR5O1xufVxuZnVuY3Rpb24gdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKSB7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIHVwZGF0ZV9zbG90X2Jhc2Uoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIHNsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG59XG5mdW5jdGlvbiBnZXRfYWxsX2RpcnR5X2Zyb21fc2NvcGUoJCRzY29wZSkge1xuICAgIGlmICgkJHNjb3BlLmN0eC5sZW5ndGggPiAzMikge1xuICAgICAgICBjb25zdCBkaXJ0eSA9IFtdO1xuICAgICAgICBjb25zdCBsZW5ndGggPSAkJHNjb3BlLmN0eC5sZW5ndGggLyAzMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGlydHlbaV0gPSAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9yZXN0X3Byb3BzKHByb3BzLCBrZXlzKSB7XG4gICAgY29uc3QgcmVzdCA9IHt9O1xuICAgIGtleXMgPSBuZXcgU2V0KGtleXMpO1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKCFrZXlzLmhhcyhrKSAmJiBrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3Q7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Nsb3RzKHNsb3RzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gc2xvdHMpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIFRyYWNrIHdoaWNoIG5vZGVzIGFyZSBjbGFpbWVkIGR1cmluZyBoeWRyYXRpb24uIFVuY2xhaW1lZCBub2RlcyBjYW4gdGhlbiBiZSByZW1vdmVkIGZyb20gdGhlIERPTVxuLy8gYXQgdGhlIGVuZCBvZiBoeWRyYXRpb24gd2l0aG91dCB0b3VjaGluZyB0aGUgcmVtYWluaW5nIG5vZGVzLlxubGV0IGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xuZnVuY3Rpb24gc3RhcnRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IHRydWU7XG59XG5mdW5jdGlvbiBlbmRfaHlkcmF0aW5nKCkge1xuICAgIGlzX2h5ZHJhdGluZyA9IGZhbHNlO1xufVxuZnVuY3Rpb24gdXBwZXJfYm91bmQobG93LCBoaWdoLCBrZXksIHZhbHVlKSB7XG4gICAgLy8gUmV0dXJuIGZpcnN0IGluZGV4IG9mIHZhbHVlIGxhcmdlciB0aGFuIGlucHV0IHZhbHVlIGluIHRoZSByYW5nZSBbbG93LCBoaWdoKVxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICAgIGNvbnN0IG1pZCA9IGxvdyArICgoaGlnaCAtIGxvdykgPj4gMSk7XG4gICAgICAgIGlmIChrZXkobWlkKSA8PSB2YWx1ZSkge1xuICAgICAgICAgICAgbG93ID0gbWlkICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhpZ2ggPSBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbn1cbmZ1bmN0aW9uIGluaXRfaHlkcmF0ZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0Lmh5ZHJhdGVfaW5pdClcbiAgICAgICAgcmV0dXJuO1xuICAgIHRhcmdldC5oeWRyYXRlX2luaXQgPSB0cnVlO1xuICAgIC8vIFdlIGtub3cgdGhhdCBhbGwgY2hpbGRyZW4gaGF2ZSBjbGFpbV9vcmRlciB2YWx1ZXMgc2luY2UgdGhlIHVuY2xhaW1lZCBoYXZlIGJlZW4gZGV0YWNoZWQgaWYgdGFyZ2V0IGlzIG5vdCA8aGVhZD5cbiAgICBsZXQgY2hpbGRyZW4gPSB0YXJnZXQuY2hpbGROb2RlcztcbiAgICAvLyBJZiB0YXJnZXQgaXMgPGhlYWQ+LCB0aGVyZSBtYXkgYmUgY2hpbGRyZW4gd2l0aG91dCBjbGFpbV9vcmRlclxuICAgIGlmICh0YXJnZXQubm9kZU5hbWUgPT09ICdIRUFEJykge1xuICAgICAgICBjb25zdCBteUNoaWxkcmVuID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChub2RlLmNsYWltX29yZGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBteUNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW4gPSBteUNoaWxkcmVuO1xuICAgIH1cbiAgICAvKlxuICAgICogUmVvcmRlciBjbGFpbWVkIGNoaWxkcmVuIG9wdGltYWxseS5cbiAgICAqIFdlIGNhbiByZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5IGJ5IGZpbmRpbmcgdGhlIGxvbmdlc3Qgc3Vic2VxdWVuY2Ugb2ZcbiAgICAqIG5vZGVzIHRoYXQgYXJlIGFscmVhZHkgY2xhaW1lZCBpbiBvcmRlciBhbmQgb25seSBtb3ZpbmcgdGhlIHJlc3QuIFRoZSBsb25nZXN0XG4gICAgKiBzdWJzZXF1ZW5jZSBzdWJzZXF1ZW5jZSBvZiBub2RlcyB0aGF0IGFyZSBjbGFpbWVkIGluIG9yZGVyIGNhbiBiZSBmb3VuZCBieVxuICAgICogY29tcHV0aW5nIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgLmNsYWltX29yZGVyIHZhbHVlcy5cbiAgICAqXG4gICAgKiBUaGlzIGFsZ29yaXRobSBpcyBvcHRpbWFsIGluIGdlbmVyYXRpbmcgdGhlIGxlYXN0IGFtb3VudCBvZiByZW9yZGVyIG9wZXJhdGlvbnNcbiAgICAqIHBvc3NpYmxlLlxuICAgICpcbiAgICAqIFByb29mOlxuICAgICogV2Uga25vdyB0aGF0LCBnaXZlbiBhIHNldCBvZiByZW9yZGVyaW5nIG9wZXJhdGlvbnMsIHRoZSBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlXG4gICAgKiBhbHdheXMgZm9ybSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLCBzaW5jZSB0aGV5IGRvIG5vdCBtb3ZlIGFtb25nIGVhY2ggb3RoZXJcbiAgICAqIG1lYW5pbmcgdGhhdCB0aGV5IG11c3QgYmUgYWxyZWFkeSBvcmRlcmVkIGFtb25nIGVhY2ggb3RoZXIuIFRodXMsIHRoZSBtYXhpbWFsXG4gICAgKiBzZXQgb2Ygbm9kZXMgdGhhdCBkbyBub3QgbW92ZSBmb3JtIGEgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlLlxuICAgICovXG4gICAgLy8gQ29tcHV0ZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICAvLyBtOiBzdWJzZXF1ZW5jZSBsZW5ndGggaiA9PiBpbmRleCBrIG9mIHNtYWxsZXN0IHZhbHVlIHRoYXQgZW5kcyBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGxlbmd0aCBqXG4gICAgY29uc3QgbSA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCArIDEpO1xuICAgIC8vIFByZWRlY2Vzc29yIGluZGljZXMgKyAxXG4gICAgY29uc3QgcCA9IG5ldyBJbnQzMkFycmF5KGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgbVswXSA9IC0xO1xuICAgIGxldCBsb25nZXN0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBjaGlsZHJlbltpXS5jbGFpbV9vcmRlcjtcbiAgICAgICAgLy8gRmluZCB0aGUgbGFyZ2VzdCBzdWJzZXF1ZW5jZSBsZW5ndGggc3VjaCB0aGF0IGl0IGVuZHMgaW4gYSB2YWx1ZSBsZXNzIHRoYW4gb3VyIGN1cnJlbnQgdmFsdWVcbiAgICAgICAgLy8gdXBwZXJfYm91bmQgcmV0dXJucyBmaXJzdCBncmVhdGVyIHZhbHVlLCBzbyB3ZSBzdWJ0cmFjdCBvbmVcbiAgICAgICAgLy8gd2l0aCBmYXN0IHBhdGggZm9yIHdoZW4gd2UgYXJlIG9uIHRoZSBjdXJyZW50IGxvbmdlc3Qgc3Vic2VxdWVuY2VcbiAgICAgICAgY29uc3Qgc2VxTGVuID0gKChsb25nZXN0ID4gMCAmJiBjaGlsZHJlblttW2xvbmdlc3RdXS5jbGFpbV9vcmRlciA8PSBjdXJyZW50KSA/IGxvbmdlc3QgKyAxIDogdXBwZXJfYm91bmQoMSwgbG9uZ2VzdCwgaWR4ID0+IGNoaWxkcmVuW21baWR4XV0uY2xhaW1fb3JkZXIsIGN1cnJlbnQpKSAtIDE7XG4gICAgICAgIHBbaV0gPSBtW3NlcUxlbl0gKyAxO1xuICAgICAgICBjb25zdCBuZXdMZW4gPSBzZXFMZW4gKyAxO1xuICAgICAgICAvLyBXZSBjYW4gZ3VhcmFudGVlIHRoYXQgY3VycmVudCBpcyB0aGUgc21hbGxlc3QgdmFsdWUuIE90aGVyd2lzZSwgd2Ugd291bGQgaGF2ZSBnZW5lcmF0ZWQgYSBsb25nZXIgc2VxdWVuY2UuXG4gICAgICAgIG1bbmV3TGVuXSA9IGk7XG4gICAgICAgIGxvbmdlc3QgPSBNYXRoLm1heChuZXdMZW4sIGxvbmdlc3QpO1xuICAgIH1cbiAgICAvLyBUaGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIG5vZGVzIChpbml0aWFsbHkgcmV2ZXJzZWQpXG4gICAgY29uc3QgbGlzID0gW107XG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIG5vZGVzLCBub2RlcyB0aGF0IHdpbGwgYmUgbW92ZWRcbiAgICBjb25zdCB0b01vdmUgPSBbXTtcbiAgICBsZXQgbGFzdCA9IGNoaWxkcmVuLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgY3VyID0gbVtsb25nZXN0XSArIDE7IGN1ciAhPSAwOyBjdXIgPSBwW2N1ciAtIDFdKSB7XG4gICAgICAgIGxpcy5wdXNoKGNoaWxkcmVuW2N1ciAtIDFdKTtcbiAgICAgICAgZm9yICg7IGxhc3QgPj0gY3VyOyBsYXN0LS0pIHtcbiAgICAgICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0LS07XG4gICAgfVxuICAgIGZvciAoOyBsYXN0ID49IDA7IGxhc3QtLSkge1xuICAgICAgICB0b01vdmUucHVzaChjaGlsZHJlbltsYXN0XSk7XG4gICAgfVxuICAgIGxpcy5yZXZlcnNlKCk7XG4gICAgLy8gV2Ugc29ydCB0aGUgbm9kZXMgYmVpbmcgbW92ZWQgdG8gZ3VhcmFudGVlIHRoYXQgdGhlaXIgaW5zZXJ0aW9uIG9yZGVyIG1hdGNoZXMgdGhlIGNsYWltIG9yZGVyXG4gICAgdG9Nb3ZlLnNvcnQoKGEsIGIpID0+IGEuY2xhaW1fb3JkZXIgLSBiLmNsYWltX29yZGVyKTtcbiAgICAvLyBGaW5hbGx5LCB3ZSBtb3ZlIHRoZSBub2Rlc1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHRvTW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB3aGlsZSAoaiA8IGxpcy5sZW5ndGggJiYgdG9Nb3ZlW2ldLmNsYWltX29yZGVyID49IGxpc1tqXS5jbGFpbV9vcmRlcikge1xuICAgICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFuY2hvciA9IGogPCBsaXMubGVuZ3RoID8gbGlzW2pdIDogbnVsbDtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZSh0b01vdmVbaV0sIGFuY2hvcik7XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXModGFyZ2V0LCBzdHlsZV9zaGVldF9pZCwgc3R5bGVzKSB7XG4gICAgY29uc3QgYXBwZW5kX3N0eWxlc190byA9IGdldF9yb290X2Zvcl9zdHlsZSh0YXJnZXQpO1xuICAgIGlmICghYXBwZW5kX3N0eWxlc190by5nZXRFbGVtZW50QnlJZChzdHlsZV9zaGVldF9pZCkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9IHN0eWxlX3NoZWV0X2lkO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHN0eWxlcztcbiAgICAgICAgYXBwZW5kX3N0eWxlc2hlZXQoYXBwZW5kX3N0eWxlc190bywgc3R5bGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9yb290X2Zvcl9zdHlsZShub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgY29uc3Qgcm9vdCA9IG5vZGUuZ2V0Um9vdE5vZGUgPyBub2RlLmdldFJvb3ROb2RlKCkgOiBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgaWYgKHJvb3QgJiYgcm9vdC5ob3N0KSB7XG4gICAgICAgIHJldHVybiByb290O1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5vd25lckRvY3VtZW50O1xufVxuZnVuY3Rpb24gYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQobm9kZSkge1xuICAgIGNvbnN0IHN0eWxlX2VsZW1lbnQgPSBlbGVtZW50KCdzdHlsZScpO1xuICAgIGFwcGVuZF9zdHlsZXNoZWV0KGdldF9yb290X2Zvcl9zdHlsZShub2RlKSwgc3R5bGVfZWxlbWVudCk7XG4gICAgcmV0dXJuIHN0eWxlX2VsZW1lbnQuc2hlZXQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfc3R5bGVzaGVldChub2RlLCBzdHlsZSkge1xuICAgIGFwcGVuZChub2RlLmhlYWQgfHwgbm9kZSwgc3R5bGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpIHtcbiAgICBpZiAoaXNfaHlkcmF0aW5nKSB7XG4gICAgICAgIGluaXRfaHlkcmF0ZSh0YXJnZXQpO1xuICAgICAgICBpZiAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID09PSB1bmRlZmluZWQpIHx8ICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5wYXJlbnRFbGVtZW50ICE9PSB0YXJnZXQpKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuZmlyc3RDaGlsZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBTa2lwIG5vZGVzIG9mIHVuZGVmaW5lZCBvcmRlcmluZ1xuICAgICAgICB3aGlsZSAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkICE9PSBudWxsKSAmJiAodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQuY2xhaW1fb3JkZXIgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkKSB7XG4gICAgICAgICAgICAvLyBXZSBvbmx5IGluc2VydCBpZiB0aGUgb3JkZXJpbmcgb2YgdGhpcyBub2RlIHNob3VsZCBiZSBtb2RpZmllZCBvciB0aGUgcGFyZW50IG5vZGUgaXMgbm90IHRhcmdldFxuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCB8fCBub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGlmIChpc19oeWRyYXRpbmcgJiYgIWFuY2hvcikge1xuICAgICAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT0gYW5jaG9yKSB7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRydXN0ZWQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LmlzVHJ1c3RlZClcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19fdmFsdWUnKSB7XG4gICAgICAgICAgICBub2RlLnZhbHVlID0gbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdHlwZW9mIG5vZGVbcHJvcF0gPT09ICdib29sZWFuJyAmJiB2YWx1ZSA9PT0gJycgPyB0cnVlIDogdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCwgX192YWx1ZSwgY2hlY2tlZCkge1xuICAgIGNvbnN0IHZhbHVlID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIGlmICghY2hlY2tlZCkge1xuICAgICAgICB2YWx1ZS5kZWxldGUoX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGluaXRfY2xhaW1faW5mbyhub2Rlcykge1xuICAgIGlmIChub2Rlcy5jbGFpbV9pbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZXMuY2xhaW1faW5mbyA9IHsgbGFzdF9pbmRleDogMCwgdG90YWxfY2xhaW1lZDogMCB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsYWltX25vZGUobm9kZXMsIHByZWRpY2F0ZSwgcHJvY2Vzc05vZGUsIGNyZWF0ZU5vZGUsIGRvbnRVcGRhdGVMYXN0SW5kZXggPSBmYWxzZSkge1xuICAgIC8vIFRyeSB0byBmaW5kIG5vZGVzIGluIGFuIG9yZGVyIHN1Y2ggdGhhdCB3ZSBsZW5ndGhlbiB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCByZXN1bHROb2RlID0gKCgpID0+IHtcbiAgICAgICAgLy8gV2UgZmlyc3QgdHJ5IHRvIGZpbmQgYW4gZWxlbWVudCBhZnRlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAgIGZvciAobGV0IGkgPSBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXg7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcHJvY2Vzc05vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNbaV0gPSByZXBsYWNlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkb250VXBkYXRlTGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgdHJ5IHRvIGZpbmQgb25lIGJlZm9yZVxuICAgICAgICAvLyBXZSBpdGVyYXRlIGluIHJldmVyc2Ugc28gdGhhdCB3ZSBkb24ndCBnbyB0b28gZmFyIGJhY2tcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBzcGxpY2VkIGJlZm9yZSB0aGUgbGFzdF9pbmRleCwgd2UgZGVjcmVhc2UgaXRcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4LS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGNhbid0IGZpbmQgYW55IG1hdGNoaW5nIG5vZGUsIHdlIGNyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoKTtcbiAgICB9KSgpO1xuICAgIHJlc3VsdE5vZGUuY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkICs9IDE7XG4gICAgcmV0dXJuIHJlc3VsdE5vZGU7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGNyZWF0ZV9lbGVtZW50KSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVOYW1lID09PSBuYW1lLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCByZW1vdmUgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlLmZvckVhY2godiA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSh2KSk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSwgKCkgPT4gY3JlYXRlX2VsZW1lbnQobmFtZSkpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3ZnX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmdfZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAzLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhU3RyID0gJycgKyBkYXRhO1xuICAgICAgICBpZiAobm9kZS5kYXRhLnN0YXJ0c1dpdGgoZGF0YVN0cikpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmRhdGEubGVuZ3RoICE9PSBkYXRhU3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnNwbGl0VGV4dChkYXRhU3RyLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSBkYXRhU3RyO1xuICAgICAgICB9XG4gICAgfSwgKCkgPT4gdGV4dChkYXRhKSwgdHJ1ZSAvLyBUZXh0IG5vZGVzIHNob3VsZCBub3QgdXBkYXRlIGxhc3QgaW5kZXggc2luY2UgaXQgaXMgbGlrZWx5IG5vdCB3b3J0aCBpdCB0byBlbGltaW5hdGUgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBhY3R1YWwgZWxlbWVudHNcbiAgICApO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIGZpbmRfY29tbWVudChub2RlcywgdGV4dCwgc3RhcnQpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIGNvbW1lbnQgbm9kZSAqLyAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGNsYWltX2h0bWxfdGFnKG5vZGVzKSB7XG4gICAgLy8gZmluZCBodG1sIG9wZW5pbmcgdGFnXG4gICAgY29uc3Qgc3RhcnRfaW5kZXggPSBmaW5kX2NvbW1lbnQobm9kZXMsICdIVE1MX1RBR19TVEFSVCcsIDApO1xuICAgIGNvbnN0IGVuZF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX0VORCcsIHN0YXJ0X2luZGV4KTtcbiAgICBpZiAoc3RhcnRfaW5kZXggPT09IGVuZF9pbmRleCkge1xuICAgICAgICByZXR1cm4gbmV3IEh0bWxUYWdIeWRyYXRpb24oKTtcbiAgICB9XG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCBodG1sX3RhZ19ub2RlcyA9IG5vZGVzLnNwbGljZShzdGFydF9pbmRleCwgZW5kX2luZGV4IC0gc3RhcnRfaW5kZXggKyAxKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbMF0pO1xuICAgIGRldGFjaChodG1sX3RhZ19ub2Rlc1todG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxXSk7XG4gICAgY29uc3QgY2xhaW1lZF9ub2RlcyA9IGh0bWxfdGFnX25vZGVzLnNsaWNlKDEsIGh0bWxfdGFnX25vZGVzLmxlbmd0aCAtIDEpO1xuICAgIGZvciAoY29uc3QgbiBvZiBjbGFpbWVkX25vZGVzKSB7XG4gICAgICAgIG4uY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgICAgIG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZCArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEh0bWxUYWdIeWRyYXRpb24oY2xhaW1lZF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZWxlY3Quc2VsZWN0ZWRJbmRleCA9IC0xOyAvLyBubyBvcHRpb24gc2hvdWxkIGJlIHNlbGVjdGVkXG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIobm9kZSwgZm4pIHtcbiAgICBjb25zdCBjb21wdXRlZF9zdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKGNvbXB1dGVkX3N0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG4gICAgY29uc3QgaWZyYW1lID0gZWxlbWVudCgnaWZyYW1lJyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogYmxvY2s7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBsZWZ0OiAwOyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyAnICtcbiAgICAgICAgJ292ZXJmbG93OiBoaWRkZW47IGJvcmRlcjogMDsgb3BhY2l0eTogMDsgcG9pbnRlci1ldmVudHM6IG5vbmU7IHotaW5kZXg6IC0xOycpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBpZnJhbWUudGFiSW5kZXggPSAtMTtcbiAgICBjb25zdCBjcm9zc29yaWdpbiA9IGlzX2Nyb3Nzb3JpZ2luKCk7XG4gICAgbGV0IHVuc3Vic2NyaWJlO1xuICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICBpZnJhbWUuc3JjID0gXCJkYXRhOnRleHQvaHRtbCw8c2NyaXB0Pm9ucmVzaXplPWZ1bmN0aW9uKCl7cGFyZW50LnBvc3RNZXNzYWdlKDAsJyonKX08L3NjcmlwdD5cIjtcbiAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4od2luZG93LCAnbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PT0gaWZyYW1lLmNvbnRlbnRXaW5kb3cpXG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJztcbiAgICAgICAgaWZyYW1lLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKGlmcmFtZS5jb250ZW50V2luZG93LCAncmVzaXplJywgZm4pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBhcHBlbmQobm9kZSwgaWZyYW1lKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodW5zdWJzY3JpYmUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGV0YWNoKGlmcmFtZSk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lLCB0b2dnbGUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cbmZ1bmN0aW9uIGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwsIGJ1YmJsZXMgPSBmYWxzZSkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBidWJibGVzLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICB9XG4gICAgYyhodG1sKSB7XG4gICAgICAgIHRoaXMuaChodG1sKTtcbiAgICB9XG4gICAgbShodG1sLCB0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmUpIHtcbiAgICAgICAgICAgIHRoaXMuZSA9IGVsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuYyhodG1sKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmkoYW5jaG9yKTtcbiAgICB9XG4gICAgaChodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwKGh0bWwpIHtcbiAgICAgICAgdGhpcy5kKCk7XG4gICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgdGhpcy5pKHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuY2xhc3MgSHRtbFRhZ0h5ZHJhdGlvbiBleHRlbmRzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGNsYWltZWRfbm9kZXMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICAgICAgdGhpcy5sID0gY2xhaW1lZF9ub2RlcztcbiAgICB9XG4gICAgYyhodG1sKSB7XG4gICAgICAgIGlmICh0aGlzLmwpIHtcbiAgICAgICAgICAgIHRoaXMubiA9IHRoaXMubDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydF9oeWRyYXRpb24odGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhdHRyaWJ1dGVfdG9fb2JqZWN0KGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJlc3VsdFthdHRyaWJ1dGUubmFtZV0gPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzKGVsZW1lbnQpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICByZXN1bHRbbm9kZS5zbG90IHx8ICdkZWZhdWx0J10gPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIHdlIG5lZWQgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGZvciBtdWx0aXBsZSBkb2N1bWVudHMgYmVjYXVzZSBhIFN2ZWx0ZSBhcHBsaWNhdGlvbiBjb3VsZCBhbHNvIGNvbnRhaW4gaWZyYW1lc1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvMzYyNFxuY29uc3QgbWFuYWdlZF9zdHlsZXMgPSBuZXcgTWFwKCk7XG5sZXQgYWN0aXZlID0gMDtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfc3R5bGVfaW5mb3JtYXRpb24oZG9jLCBub2RlKSB7XG4gICAgY29uc3QgaW5mbyA9IHsgc3R5bGVzaGVldDogYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQobm9kZSksIHJ1bGVzOiB7fSB9O1xuICAgIG1hbmFnZWRfc3R5bGVzLnNldChkb2MsIGluZm8pO1xuICAgIHJldHVybiBpbmZvO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBjb25zdCBkb2MgPSBnZXRfcm9vdF9mb3Jfc3R5bGUobm9kZSk7XG4gICAgY29uc3QgeyBzdHlsZXNoZWV0LCBydWxlcyB9ID0gbWFuYWdlZF9zdHlsZXMuZ2V0KGRvYykgfHwgY3JlYXRlX3N0eWxlX2luZm9ybWF0aW9uKGRvYywgbm9kZSk7XG4gICAgaWYgKCFydWxlc1tuYW1lXSkge1xuICAgICAgICBydWxlc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIHN0eWxlc2hlZXQuaW5zZXJ0UnVsZShgQGtleWZyYW1lcyAke25hbWV9ICR7cnVsZX1gLCBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnO1xuICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gYCR7YW5pbWF0aW9uID8gYCR7YW5pbWF0aW9ufSwgYCA6ICcnfSR7bmFtZX0gJHtkdXJhdGlvbn1tcyBsaW5lYXIgJHtkZWxheX1tcyAxIGJvdGhgO1xuICAgIGFjdGl2ZSArPSAxO1xuICAgIHJldHVybiBuYW1lO1xufVxuZnVuY3Rpb24gZGVsZXRlX3J1bGUobm9kZSwgbmFtZSkge1xuICAgIGNvbnN0IHByZXZpb3VzID0gKG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnKS5zcGxpdCgnLCAnKTtcbiAgICBjb25zdCBuZXh0ID0gcHJldmlvdXMuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKTtcbiAgICBjb25zdCBkZWxldGVkID0gcHJldmlvdXMubGVuZ3RoIC0gbmV4dC5sZW5ndGg7XG4gICAgaWYgKGRlbGV0ZWQpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBuZXh0LmpvaW4oJywgJyk7XG4gICAgICAgIGFjdGl2ZSAtPSBkZWxldGVkO1xuICAgICAgICBpZiAoIWFjdGl2ZSlcbiAgICAgICAgICAgIGNsZWFyX3J1bGVzKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xlYXJfcnVsZXMoKSB7XG4gICAgcmFmKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbWFuYWdlZF9zdHlsZXMuZm9yRWFjaChpbmZvID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3R5bGVzaGVldCB9ID0gaW5mbztcbiAgICAgICAgICAgIGxldCBpID0gc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuZGVsZXRlUnVsZShpKTtcbiAgICAgICAgICAgIGluZm8ucnVsZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hbmFnZWRfc3R5bGVzLmNsZWFyKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbmZ1bmN0aW9uIGdldEFsbENvbnRleHRzKCkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0O1xufVxuZnVuY3Rpb24gaGFzQ29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5oYXMoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4uY2FsbCh0aGlzLCBldmVudCkpO1xuICAgIH1cbn1cblxuY29uc3QgZGlydHlfY29tcG9uZW50cyA9IFtdO1xuY29uc3QgaW50cm9zID0geyBlbmFibGVkOiBmYWxzZSB9O1xuY29uc3QgYmluZGluZ19jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHNjaGVkdWxlX3VwZGF0ZSgpIHtcbiAgICBpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcbiAgICAgICAgdXBkYXRlX3NjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHJlc29sdmVkX3Byb21pc2UudGhlbihmbHVzaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdGljaygpIHtcbiAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICByZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcbiAgICByZW5kZXJfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG4gICAgZmx1c2hfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuLy8gZmx1c2goKSBjYWxscyBjYWxsYmFja3MgaW4gdGhpcyBvcmRlcjpcbi8vIDEuIEFsbCBiZWZvcmVVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW5cbi8vIDIuIEFsbCBiaW5kOnRoaXMgY2FsbGJhY2tzLCBpbiByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIDMuIEFsbCBhZnRlclVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlbi4gRVhDRVBUXG4vLyAgICBmb3IgYWZ0ZXJVcGRhdGVzIGNhbGxlZCBkdXJpbmcgdGhlIGluaXRpYWwgb25Nb3VudCwgd2hpY2ggYXJlIGNhbGxlZCBpblxuLy8gICAgcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyBTaW5jZSBjYWxsYmFja3MgbWlnaHQgdXBkYXRlIGNvbXBvbmVudCB2YWx1ZXMsIHdoaWNoIGNvdWxkIHRyaWdnZXIgYW5vdGhlclxuLy8gY2FsbCB0byBmbHVzaCgpLCB0aGUgZm9sbG93aW5nIHN0ZXBzIGd1YXJkIGFnYWluc3QgdGhpczpcbi8vIDEuIER1cmluZyBiZWZvcmVVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBiZSBhZGRlZCB0byB0aGVcbi8vICAgIGRpcnR5X2NvbXBvbmVudHMgYXJyYXkgYW5kIHdpbGwgY2F1c2UgYSByZWVudHJhbnQgY2FsbCB0byBmbHVzaCgpLiBCZWNhdXNlXG4vLyAgICB0aGUgZmx1c2ggaW5kZXggaXMga2VwdCBvdXRzaWRlIHRoZSBmdW5jdGlvbiwgdGhlIHJlZW50cmFudCBjYWxsIHdpbGwgcGlja1xuLy8gICAgdXAgd2hlcmUgdGhlIGVhcmxpZXIgY2FsbCBsZWZ0IG9mZiBhbmQgZ28gdGhyb3VnaCBhbGwgZGlydHkgY29tcG9uZW50cy4gVGhlXG4vLyAgICBjdXJyZW50X2NvbXBvbmVudCB2YWx1ZSBpcyBzYXZlZCBhbmQgcmVzdG9yZWQgc28gdGhhdCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbFxuLy8gICAgbm90IGludGVyZmVyZSB3aXRoIHRoZSBcInBhcmVudFwiIGZsdXNoKCkgY2FsbC5cbi8vIDIuIGJpbmQ6dGhpcyBjYWxsYmFja3MgY2Fubm90IHRyaWdnZXIgbmV3IGZsdXNoKCkgY2FsbHMuXG4vLyAzLiBEdXJpbmcgYWZ0ZXJVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBOT1QgaGF2ZSB0aGVpciBhZnRlclVwZGF0ZVxuLy8gICAgY2FsbGJhY2sgY2FsbGVkIGEgc2Vjb25kIHRpbWU7IHRoZSBzZWVuX2NhbGxiYWNrcyBzZXQsIG91dHNpZGUgdGhlIGZsdXNoKClcbi8vICAgIGZ1bmN0aW9uLCBndWFyYW50ZWVzIHRoaXMgYmVoYXZpb3IuXG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmxldCBmbHVzaGlkeCA9IDA7IC8vIERvICpub3QqIG1vdmUgdGhpcyBpbnNpZGUgdGhlIGZsdXNoKCkgZnVuY3Rpb25cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNhdmVkX2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGZsdXNoaWR4IDwgZGlydHlfY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbZmx1c2hpZHhdO1xuICAgICAgICAgICAgZmx1c2hpZHgrKztcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZsdXNoaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHNlZW5fY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHNhdmVkX2NvbXBvbmVudCk7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSAocHJvZ3JhbS5iIC0gdCk7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5ibG9ja3NbaV0gPT09IGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2goaW5mbywgY3R4LCBkaXJ0eSkge1xuICAgIGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuICAgIGNvbnN0IHsgcmVzb2x2ZWQgfSA9IGluZm87XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby50aGVuKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLnZhbHVlXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLmNhdGNoKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLmVycm9yXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpbmZvLmJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBhdHRyc190b19hZGQpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG4gICAgaWYgKGF0dHJzX3RvX2FkZCkge1xuICAgICAgICBjb25zdCBjbGFzc2VzX3RvX2FkZCA9IGF0dHJzX3RvX2FkZC5jbGFzc2VzO1xuICAgICAgICBjb25zdCBzdHlsZXNfdG9fYWRkID0gYXR0cnNfdG9fYWRkLnN0eWxlcztcbiAgICAgICAgaWYgKGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlcy5jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3R5bGVzX3RvX2FkZCkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMuc3R5bGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuc3R5bGUgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKHN0eWxlc190b19hZGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcy5zdHlsZSA9IHN0eWxlX29iamVjdF90b19zdHJpbmcobWVyZ2Vfc3NyX3N0eWxlcyhhdHRyaWJ1dGVzLnN0eWxlLCBzdHlsZXNfdG9fYWRkKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICBlbHNlIGlmIChib29sZWFuX2F0dHJpYnV0ZXMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gYCAke25hbWV9PVwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuZnVuY3Rpb24gbWVyZ2Vfc3NyX3N0eWxlcyhzdHlsZV9hdHRyaWJ1dGUsIHN0eWxlX2RpcmVjdGl2ZSkge1xuICAgIGNvbnN0IHN0eWxlX29iamVjdCA9IHt9O1xuICAgIGZvciAoY29uc3QgaW5kaXZpZHVhbF9zdHlsZSBvZiBzdHlsZV9hdHRyaWJ1dGUuc3BsaXQoJzsnKSkge1xuICAgICAgICBjb25zdCBjb2xvbl9pbmRleCA9IGluZGl2aWR1YWxfc3R5bGUuaW5kZXhPZignOicpO1xuICAgICAgICBjb25zdCBuYW1lID0gaW5kaXZpZHVhbF9zdHlsZS5zbGljZSgwLCBjb2xvbl9pbmRleCkudHJpbSgpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGluZGl2aWR1YWxfc3R5bGUuc2xpY2UoY29sb25faW5kZXggKyAxKS50cmltKCk7XG4gICAgICAgIGlmICghbmFtZSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBzdHlsZV9vYmplY3RbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBuYW1lIGluIHN0eWxlX2RpcmVjdGl2ZSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHN0eWxlX2RpcmVjdGl2ZVtuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBzdHlsZV9vYmplY3RbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzdHlsZV9vYmplY3RbbmFtZV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0eWxlX29iamVjdDtcbn1cbmNvbnN0IGVzY2FwZWQgPSB7XG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnXG59O1xuZnVuY3Rpb24gZXNjYXBlKGh0bWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKGh0bWwpLnJlcGxhY2UoL1tcIicmPD5dL2csIG1hdGNoID0+IGVzY2FwZWRbbWF0Y2hdKTtcbn1cbmZ1bmN0aW9uIGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IGVzY2FwZSh2YWx1ZSkgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGVzY2FwZV9vYmplY3Qob2JqKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZShvYmpba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHN0ciArPSBmbihpdGVtc1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcbiAgICAkJHJlbmRlcjogKCkgPT4gJydcbn07XG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG4gICAgaWYgKCFjb21wb25lbnQgfHwgIWNvbXBvbmVudC4kJHJlbmRlcikge1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKVxuICAgICAgICAgICAgbmFtZSArPSAnIHRoaXM9ey4uLn0nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDwke25hbWV9PiBpcyBub3QgYSB2YWxpZCBTU1IgY29tcG9uZW50LiBZb3UgbWF5IG5lZWQgdG8gcmV2aWV3IHlvdXIgYnVpbGQgY29uZmlnIHRvIGVuc3VyZSB0aGF0IGRlcGVuZGVuY2llcyBhcmUgY29tcGlsZWQsIHJhdGhlciB0aGFuIGltcG9ydGVkIGFzIHByZS1jb21waWxlZCBtb2R1bGVzYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBkZWJ1ZyhmaWxlLCBsaW5lLCBjb2x1bW4sIHZhbHVlcykge1xuICAgIGNvbnNvbGUubG9nKGB7QGRlYnVnfSAke2ZpbGUgPyBmaWxlICsgJyAnIDogJyd9KCR7bGluZX06JHtjb2x1bW59KWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gJyc7XG59XG5sZXQgb25fZGVzdHJveTtcbmZ1bmN0aW9uIGNyZWF0ZV9zc3JfY29tcG9uZW50KGZuKSB7XG4gICAgZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzLCBjb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICAgICAgY29uc3QgJCQgPSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LFxuICAgICAgICAgICAgY29udGV4dDogbmV3IE1hcChjb250ZXh0IHx8IChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgeyAkJHNsb3RzID0ge30sIGNvbnRleHQgPSBuZXcgTWFwKCkgfSA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IHRpdGxlOiAnJywgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sICQkc2xvdHMsIGNvbnRleHQpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC50aXRsZSArIHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlICYmIGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZSkgPyAnJyA6IGA9JHt0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkoZXNjYXBlKHZhbHVlKSkgOiBgXCIke3ZhbHVlfVwiYH1gfWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuZnVuY3Rpb24gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoc3R5bGVfb2JqZWN0KVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBzdHlsZV9vYmplY3Rba2V5XSlcbiAgICAgICAgLm1hcChrZXkgPT4gYCR7a2V5fTogJHtzdHlsZV9vYmplY3Rba2V5XX07YClcbiAgICAgICAgLmpvaW4oJyAnKTtcbn1cbmZ1bmN0aW9uIGFkZF9zdHlsZXMoc3R5bGVfb2JqZWN0KSB7XG4gICAgY29uc3Qgc3R5bGVzID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpO1xuICAgIHJldHVybiBzdHlsZXMgPyBgIHN0eWxlPVwiJHtzdHlsZXN9XCJgIDogJyc7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yLCBjdXN0b21FbGVtZW50KSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIGlmICghY3VzdG9tRWxlbWVudCkge1xuICAgICAgICAvLyBvbk1vdW50IGhhcHBlbnMgYmVmb3JlIHRoZSBpbml0aWFsIGFmdGVyVXBkYXRlXG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgaWYgKG9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgICAgIHJ1bl9hbGwobmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGFwcGVuZF9zdHlsZXMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogbnVsbCxcbiAgICAgICAgLy8gc3RhdGVcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHVwZGF0ZTogbm9vcCxcbiAgICAgICAgbm90X2VxdWFsLFxuICAgICAgICBib3VuZDogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIC8vIGxpZmVjeWNsZVxuICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgIG9uX2Rlc3Ryb3k6IFtdLFxuICAgICAgICBvbl9kaXNjb25uZWN0OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAob3B0aW9ucy5jb250ZXh0IHx8IChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZSxcbiAgICAgICAgcm9vdDogb3B0aW9ucy50YXJnZXQgfHwgcGFyZW50X2NvbXBvbmVudC4kJC5yb290XG4gICAgfTtcbiAgICBhcHBlbmRfc3R5bGVzICYmIGFwcGVuZF9zdHlsZXMoJCQucm9vdCk7XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIG9wdGlvbnMucHJvcHMgfHwge30sIChpLCByZXQsIC4uLnJlc3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcmVzdC5sZW5ndGggPyByZXN0WzBdIDogcmV0O1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoISQkLnNraXBfYm91bmQgJiYgJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICBzdGFydF9oeWRyYXRpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50Lmwobm9kZXMpO1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChkZXRhY2gpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yLCBvcHRpb25zLmN1c3RvbUVsZW1lbnQpO1xuICAgICAgICBlbmRfaHlkcmF0aW5nKCk7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICBjb25zdCB7IG9uX21vdW50IH0gPSB0aGlzLiQkO1xuICAgICAgICAgICAgdGhpcy4kJC5vbl9kaXNjb25uZWN0ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLiQkLnNsb3R0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy4kJC5zbG90dGVkW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyLCBfb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzW2F0dHJdID0gbmV3VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICBydW5fYWxsKHRoaXMuJCQub25fZGlzY29ubmVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgJGRlc3Ryb3koKSB7XG4gICAgICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgICAgICB9XG4gICAgICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gVE9ETyBzaG91bGQgdGhpcyBkZWxlZ2F0ZSB0byBhZGRFdmVudExpc3RlbmVyP1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzLiBVc2VkIHdoZW4gZGV2PWZhbHNlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaF9kZXYodHlwZSwgZGV0YWlsKSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQodHlwZSwgT2JqZWN0LmFzc2lnbih7IHZlcnNpb246ICczLjQ2LjQnIH0sIGRldGFpbCksIHRydWUpKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9oeWRyYXRpb25fZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbl9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZScsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFsnY2FwdHVyZSddIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUgfSk7XG4gICAgZWxzZVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldEF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRQcm9wZXJ0eScsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YXNldCcsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YScsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9hcmd1bWVudChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycgJiYgIShhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJnKSkge1xuICAgICAgICBsZXQgbXNnID0gJ3sjZWFjaH0gb25seSBpdGVyYXRlcyBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cy4nO1xuICAgICAgICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBhcmcgJiYgU3ltYm9sLml0ZXJhdG9yIGluIGFyZykge1xuICAgICAgICAgICAgbXNnICs9ICcgWW91IGNhbiB1c2UgYSBzcHJlYWQgdG8gY29udmVydCB0aGlzIGl0ZXJhYmxlIGludG8gYW4gYXJyYXkuJztcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zbG90cyhuYW1lLCBzbG90LCBrZXlzKSB7XG4gICAgZm9yIChjb25zdCBzbG90X2tleSBvZiBPYmplY3Qua2V5cyhzbG90KSkge1xuICAgICAgICBpZiAoIX5rZXlzLmluZGV4T2Yoc2xvdF9rZXkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYDwke25hbWV9PiByZWNlaXZlZCBhbiB1bmV4cGVjdGVkIHNsb3QgXCIke3Nsb3Rfa2V5fVwiLmApO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cyB3aXRoIHNvbWUgbWlub3IgZGV2LWVuaGFuY2VtZW50cy4gVXNlZCB3aGVuIGRldj10cnVlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJGNhcHR1cmVfc3RhdGUoKSB7IH1cbiAgICAkaW5qZWN0X3N0YXRlKCkgeyB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgdG8gY3JlYXRlIHN0cm9uZ2x5IHR5cGVkIFN2ZWx0ZSBjb21wb25lbnRzLlxuICogVGhpcyBvbmx5IGV4aXN0cyBmb3IgdHlwaW5nIHB1cnBvc2VzIGFuZCBzaG91bGQgYmUgdXNlZCBpbiBgLmQudHNgIGZpbGVzLlxuICpcbiAqICMjIyBFeGFtcGxlOlxuICpcbiAqIFlvdSBoYXZlIGNvbXBvbmVudCBsaWJyYXJ5IG9uIG5wbSBjYWxsZWQgYGNvbXBvbmVudC1saWJyYXJ5YCwgZnJvbSB3aGljaFxuICogeW91IGV4cG9ydCBhIGNvbXBvbmVudCBjYWxsZWQgYE15Q29tcG9uZW50YC4gRm9yIFN2ZWx0ZStUeXBlU2NyaXB0IHVzZXJzLFxuICogeW91IHdhbnQgdG8gcHJvdmlkZSB0eXBpbmdzLiBUaGVyZWZvcmUgeW91IGNyZWF0ZSBhIGBpbmRleC5kLnRzYDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBTdmVsdGVDb21wb25lbnRUeXBlZCB9IGZyb20gXCJzdmVsdGVcIjtcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkPHtmb286IHN0cmluZ30+IHt9XG4gKiBgYGBcbiAqIFR5cGluZyB0aGlzIG1ha2VzIGl0IHBvc3NpYmxlIGZvciBJREVzIGxpa2UgVlMgQ29kZSB3aXRoIHRoZSBTdmVsdGUgZXh0ZW5zaW9uXG4gKiB0byBwcm92aWRlIGludGVsbGlzZW5zZSBhbmQgdG8gdXNlIHRoZSBjb21wb25lbnQgbGlrZSB0aGlzIGluIGEgU3ZlbHRlIGZpbGVcbiAqIHdpdGggVHlwZVNjcmlwdDpcbiAqIGBgYHN2ZWx0ZVxuICogPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAqIFx0aW1wb3J0IHsgTXlDb21wb25lbnQgfSBmcm9tIFwiY29tcG9uZW50LWxpYnJhcnlcIjtcbiAqIDwvc2NyaXB0PlxuICogPE15Q29tcG9uZW50IGZvbz17J2Jhcid9IC8+XG4gKiBgYGBcbiAqXG4gKiAjIyMjIFdoeSBub3QgbWFrZSB0aGlzIHBhcnQgb2YgYFN2ZWx0ZUNvbXBvbmVudChEZXYpYD9cbiAqIEJlY2F1c2VcbiAqIGBgYHRzXG4gKiBjbGFzcyBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogY29uc3QgY29tcG9uZW50OiB0eXBlb2YgU3ZlbHRlQ29tcG9uZW50ID0gQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQ7XG4gKiBgYGBcbiAqIHdpbGwgdGhyb3cgYSB0eXBlIGVycm9yLCBzbyB3ZSBuZWVkIHRvIHNlcGFyYXRlIHRoZSBtb3JlIHN0cmljdGx5IHR5cGVkIGNsYXNzLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnRUeXBlZCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudERldiB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgbG9vcCBkZXRlY3RlZCcpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgSHRtbFRhZ0h5ZHJhdGlvbiwgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUNvbXBvbmVudFR5cGVkLCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF9zdHlsZXMsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0LCBhcHBlbmRfaHlkcmF0aW9uLCBhcHBlbmRfaHlkcmF0aW9uX2RldiwgYXBwZW5kX3N0eWxlcywgYXNzaWduLCBhdHRyLCBhdHRyX2RldiwgYXR0cmlidXRlX3RvX29iamVjdCwgYmVmb3JlVXBkYXRlLCBiaW5kLCBiaW5kaW5nX2NhbGxiYWNrcywgYmxhbmtfb2JqZWN0LCBidWJibGUsIGNoZWNrX291dHJvcywgY2hpbGRyZW4sIGNsYWltX2NvbXBvbmVudCwgY2xhaW1fZWxlbWVudCwgY2xhaW1faHRtbF90YWcsIGNsYWltX3NwYWNlLCBjbGFpbV9zdmdfZWxlbWVudCwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNvbXB1dGVfcmVzdF9wcm9wcywgY29tcHV0ZV9zbG90cywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlbmRfaHlkcmF0aW5nLCBlc2NhcGUsIGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUsIGVzY2FwZV9vYmplY3QsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0QWxsQ29udGV4dHMsIGdldENvbnRleHQsIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Jvb3RfZm9yX3N0eWxlLCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzQ29udGV4dCwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGluc2VydF9oeWRyYXRpb24sIGluc2VydF9oeWRyYXRpb25fZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWVyZ2Vfc3NyX3N0eWxlcywgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHNyY191cmxfZXF1YWwsIHN0YXJ0X2h5ZHJhdGluZywgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdHJ1c3RlZCwgdXBkYXRlX2F3YWl0X2Jsb2NrX2JyYW5jaCwgdXBkYXRlX2tleWVkX2VhY2gsIHVwZGF0ZV9zbG90LCB1cGRhdGVfc2xvdF9iYXNlLCB2YWxpZGF0ZV9jb21wb25lbnQsIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQsIHZhbGlkYXRlX2VhY2hfa2V5cywgdmFsaWRhdGVfc2xvdHMsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCI8c2NyaXB0PlxuICBleHBvcnQgbGV0IG5vZGU7XG4gIGNvbnN0IHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gIGNvbnN0IHt4LHl9PSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gIGNvbnN0IHt0b3A6dCwgbGVmdDpsLCBoZWlnaHQ6aH0gPSByZWN0XG4gIGNvbnN0IHRvcCAgPSAteSArIHQgKyBoICsgMlxuICBjb25zdCBsZWZ0ID0gLXggKyBsXG4gIGNvbnN0IHtcbiAgICBmYWlsdXJlU3VtbWFyeSxcbiAgICBkZXNjcmlwdGlvbixcbiAgICBoZWxwVXJsLFxuICAgIHRhcmdldCxcbiAgICBpbXBhY3QsXG4gICAgaHRtbCxcbiAgICBoZWxwLFxuICAgIHRncyxcbiAgICBncnBcbiAgfSA9IG5vZGUuX2F4ZV9cblxuICBsZXQgc3R5bGVcbiAgaWYgKGdycC5tYXRjaCgvcGFnZS0vKSkge1xuICAgIHN0eWxlID0gYHRvcDoke3RvcH1weDtsZWZ0OjA7cmlnaHQ6MDttYXJnaW46YXV0bztgXG4gIH0gZWxzZSB7XG4gICAgc3R5bGUgPSBgdG9wOiR7dG9wfXB4O2xlZnQ6JHtsZWZ0fXB4O2BcbiAgfVxuXG4gIGxldCBub3RlICA9IGZhaWx1cmVTdW1tYXJ5XG4gIGNvbnN0IHJzdCA9IG5vdGUubWF0Y2goLyhbXFxkLiM6XSspKCB8XFx3KykvZylcbiAgcnN0ICYmIHJzdC5maWx0ZXIoeD0+eC5sZW5ndGg+MikuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICBub3RlID0gbm90ZS5yZXBsYWNlKGVsZW1lbnQsIGA8Yj4ke2VsZW1lbnR9PC9iPmApICBcbiAgfSk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGhsanMuaGlnaGxpZ2h0QWxsKClcbiAgfSwgMCk7XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImExMXktcG9wdXBcIiB7c3R5bGV9PlxuICA8aDQ+e2hlbHB9PC9oND5cbiAgPHA+e2Rlc2NyaXB0aW9ufTwvcD5cbiAgPHA+PGI+dGFnczo8L2I+IHt0Z3N9PC9wPlxuICA8cD48Yj5saW5rOjwvYj4gPGEgaHJlZj1cIntoZWxwVXJsfVwiPntncnB9PC9hPjwvcD5cbiAgPGRldGFpbHM+XG4gICAgPHN1bW1hcnk+PGI+aW1wYWN0OjwvYj4ge2ltcGFjdH08L3N1bW1hcnk+XG4gICAgPGhyLz5cbiAgICA8ZGl2IGNsYXNzPXByZT57QGh0bWwgbm90ZX08L2Rpdj5cbiAgICA8aHIvPlxuICAgIDxkaXYgY2xhc3M9cHJlPlxuICAgICAgPHByZT48Y29kZSBjbGFzcz1cImxhbmd1YWdlLWh0bWxcIj57aHRtbH08L2NvZGU+PC9wcmU+XG4gICAgPC9kaXY+XG4gIDwvZGV0YWlscz5cbjwvZGl2PlxuXG48c3R5bGU+XG4uYTExeS1wb3B1cCB7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LCAyMjgsIDE5NiwgMC42NSk7XG4gIGJhY2tkcm9wLWZpbHRlcjogYmx1cig0cHgpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luLXRvcDogMnB4O1xuICBwYWRkaW5nOiAwIDEwcHg7XG4gIGhlaWdodDogYXV0bztcbiAgd2lkdGg6IDMwMHB4O1xuICBib3gtc2hhZG93OiBcbiAgICByZ2IoMCAwIDAgLyAyNSUpIDBweCAgNTRweCA1NXB4LCBcbiAgICByZ2IoMCAwIDAgLyAxMiUpIDBweCAtMTJweCAzMHB4LCBcbiAgICByZ2IoMCAwIDAgLyAxMiUpIDBweCAgIDRweCAgNnB4LCBcbiAgICByZ2IoMCAwIDAgLyAxNyUpIDBweCAgMTJweCAxM3B4LCBcbiAgICByZ2IoMCAwIDAgLyAgOSUpIDBweCAgLTNweCAgNXB4O1xufVxuaDQge1xuICBtYXJnaW46IDEwcHggMDtcbn1cbnAge1xuICBtYXJnaW46IDAuMnJlbSAwO1xufVxuZGV0YWlscyB7XG4gIG1hcmdpbi1ib3R0b206IDhweDtcbn1cbmRldGFpbHMgc3VtbWFyeSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cbi5wcmUge1xuICBmb250LXNpemU6IDExLjVweDtcbn1cbnByZSB7XG4gIGZvbnQtZmFtaWx5OiB1aS1tb25vc3BhY2UsIG1vbm9zcGFjZTtcbiAgd2hpdGUtc3BhY2U6IGJyZWFrLXNwYWNlcztcbiAgZm9udC1zaXplOiAxMXB4O1xuICBtYXJnaW46IDA7XG59XG5wcmUgY29kZSB7XG4gIHBhZGRpbmc6IDVweDtcbn1cbjwvc3R5bGU+XG4iLCJjb25zdCBjc3BBcnIgPSBbXG4gICdkZWZhdWx0LXNyYycsXG4gICdjaGlsZC1zcmMnLFxuICAnY29ubmVjdC1zcmMnLFxuICAnZm9udC1zcmMnLFxuICAnZnJhbWUtc3JjJyxcbiAgJ2ltZy1zcmMnLFxuICAnbWFuaWZlc3Qtc3JjJyxcbiAgJ21lZGlhLXNyYycsXG4gICdvYmplY3Qtc3JjJyxcbiAgJ3ByZWZldGNoLXNyYycsXG4gICdzY3JpcHQtc3JjJyxcbiAgJ3NjcmlwdC1zcmMtZWxlbScsXG4gICdzY3JpcHQtc3JjLWF0dHInLFxuICAnc3R5bGUtc3JjJyxcbiAgJ3N0eWxlLXNyYy1lbGVtJyxcbiAgJ3N0eWxlLXNyYy1hdHRyJyxcbiAgJ3dvcmtlci1zcmMnLFxuICAnYmFzZS11cmknLFxuICAncGx1Z2luLXR5cGVzJyxcbiAgJ3NhbmRib3gnLFxuICAnbmF2aWdhdGUtdG8nLFxuICAnZm9ybS1hY3Rpb24nLFxuICAnZnJhbWUtYW5jZXN0b3JzJyxcbiAgJ3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnLFxuICAncmVwb3J0LXVyaScsXG4gICdyZXBvcnQtdG8nLFxuXVxuY29uc3QgY3NwRmV0Y2ggPSBbXG4gICdkZWZhdWx0LXNyYycsXG4gICdjaGlsZC1zcmMnLFxuICAnY29ubmVjdC1zcmMnLFxuICAnZm9udC1zcmMnLFxuICAnZnJhbWUtc3JjJyxcbiAgJ2ltZy1zcmMnLFxuICAnbWFuaWZlc3Qtc3JjJyxcbiAgJ21lZGlhLXNyYycsXG4gICdvYmplY3Qtc3JjJyxcbiAgJ3ByZWZldGNoLXNyYycsXG4gICdzY3JpcHQtc3JjJyxcbiAgJ3N0eWxlLXNyYycsXG4gICd3b3JrZXItc3JjJyxcbl1cbmNvbnN0IGNzcEVBdHRyID0gW1xuICAnc2NyaXB0LXNyYy1lbGVtJyxcbiAgJ3NjcmlwdC1zcmMtYXR0cicsXG4gICdzdHlsZS1zcmMtZWxlbScsXG4gICdzdHlsZS1zcmMtYXR0cicsXG5dXG5jb25zdCBjc3BJbmZvID0ge1xuICAnZGVmYXVsdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9kZWZhdWx0LXNyYycsXG4gICAgbm90ZTogJ2lzIGEgZmFsbGJhY2sgZGlyZWN0aXZlIGZvciB0aGUgb3RoZXIgZmV0Y2ggZGlyZWN0aXZlczogPGI+Y2hpbGQtc3JjPC9iPiwgPGI+Y29ubmVjdC1zcmM8L2I+LCA8Yj5mb250LXNyYzwvYj4sIDxiPmltZy1zcmM8L2I+LCA8Yj5tYW5pZmVzdC1zcmM8L2I+LCA8Yj5tZWRpYS1zcmM8L2I+LCA8Yj5wcmVmZXRjaC1zcmM8L2I+LCA8Yj5vYmplY3Qtc3JjPC9iPiwgPGI+c2NyaXB0LXNyYyhzY3JpcHQtc3JjLWVsZW0sIHNjcmlwdC1zcmMtYXR0cik8L2I+LCA8Yj5zdHlsZS1zcmMoc3R5bGUtc3JjLWVsZW0sIHN0eWxlLXNyYy1hdHRyKTwvYj4uJ1xuICB9LFxuICAnY2hpbGQtc3JjJzoge1xuICAgIGxldmVsOiAyLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvY2hpbGQtc3JjJyxcbiAgICBub3RlOiAnYWxsb3dzIHRoZSBkZXZlbG9wZXIgdG8gY29udHJvbCBuZXN0ZWQgYnJvd3NpbmcgY29udGV4dHMgYW5kIHdvcmtlciBleGVjdXRpb24gY29udGV4dHMuJ1xuICB9LFxuICAnY29ubmVjdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9jb25uZWN0LXNyYycsXG4gICAgbm90ZTogJ3Byb3ZpZGVzIGNvbnRyb2wgb3ZlciBmZXRjaCByZXF1ZXN0cywgWEhSLCBldmVudHNvdXJjZSwgYmVhY29uIGFuZCB3ZWJzb2NrZXRzIGNvbm5lY3Rpb25zLidcbiAgfSxcbiAgJ2ZvbnQtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZm9udC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgd2hpY2ggVVJMcyB0byBsb2FkIGZvbnRzIGZyb20uJ1xuICB9LFxuICAnZnJhbWUtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZnJhbWUtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIG5lc3RlZCBicm93c2luZyBjb250ZXh0cyBsb2FkaW5nIHVzaW5nIGVsZW1lbnRzIHN1Y2ggYXMgJmx0O2ZyYW1lJmd0OyBhbmQgJmx0O2lmcmFtZSZndDsuJ1xuICB9LFxuICAnaW1nLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ltZy1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgdGhhdCBpbWFnZXMgY2FuIGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ21hbmlmZXN0LXNyYyc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L21hbmlmZXN0LXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyB0aGF0IGFwcGxpY2F0aW9uIG1hbmlmZXN0cyBtYXkgYmUgbG9hZGVkIGZyb20uJ1xuICB9LFxuICAnbWVkaWEtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvbWVkaWEtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggdmlkZW8sIGF1ZGlvIGFuZCB0ZXh0IHRyYWNrIHJlc291cmNlcyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xuICB9LFxuICAnb2JqZWN0LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L29iamVjdC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgZnJvbSB3aGljaCBwbHVnaW5zIGNhbiBiZSBsb2FkZWQgZnJvbS4nXG4gIH0sXG4gICdwcmVmZXRjaC1zcmMnOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9wcmVmZXRjaC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgZnJvbSB3aGljaCByZXNvdXJjZXMgY2FuIGJlIHByZWZldGNoZWQgZnJvbS4nXG4gIH0sXG4gICdzY3JpcHQtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2NyaXB0LXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgbG9jYXRpb25zIGZyb20gd2hpY2ggYSBzY3JpcHQgY2FuIGJlIGV4ZWN1dGVkIGZyb20uIEl0IGlzIGEgZmFsbGJhY2sgZGlyZWN0aXZlIGZvciBvdGhlciBzY3JpcHQtbGlrZSBkaXJlY3RpdmVzOiA8Yj5zY3JpcHQtc3JjLWVsZW08L2I+LCA8Yj5zY3JpcHQtc3JjLWF0dHI8L2I+J1xuICB9LFxuICAnc2NyaXB0LXNyYy1lbGVtJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2NyaXB0LXNyYy1lbGVtJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIEphdmFTY3JpcHQgJmx0O3NjcmlwdCZndDsgZWxlbWVudHMsIGJ1dCBub3QgaW5saW5lIHNjcmlwdCBldmVudCBoYW5kbGVycyBsaWtlIG9uY2xpY2suJ1xuICB9LFxuICAnc2NyaXB0LXNyYy1hdHRyJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2NyaXB0LXNyYy1hdHRyJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIEphdmFTY3JpcHQgaW5saW5lIGV2ZW50IGhhbmRsZXJzLiBUaGlzIGluY2x1ZGVzIG9ubHkgaW5saW5lIHNjcmlwdCBldmVudCBoYW5kbGVycyBsaWtlIG9uY2xpY2ssIGJ1dCBub3QgVVJMcyBsb2FkZWQgZGlyZWN0bHkgaW50byAmbHQ7c2NyaXB0Jmd0OyBlbGVtZW50cy4nXG4gIH0sXG4gICdzdHlsZS1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxuICAgIG5vdGU6ICdjb250cm9scyBmcm9tIHdoZXJlIHN0eWxlcyBnZXQgYXBwbGllZCB0byBhIGRvY3VtZW50LiBUaGlzIGluY2x1ZGVzIDxsaW5rPiBlbGVtZW50cywgQGltcG9ydCBydWxlcywgYW5kIHJlcXVlc3RzIG9yaWdpbmF0aW5nIGZyb20gYSBMaW5rIEhUVFAgcmVzcG9uc2UgaGVhZGVyIGZpZWxkOiA8Yj5zdHlsZS1zcmMtZWxlbTwvYj4sIDxiPnN0eWxlLXNyYy1hdHRyPC9iPidcbiAgfSxcbiAgJ3N0eWxlLXNyYy1lbGVtJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIHN0eWxlc2hlZXRzICZsdDtzdHlsZSZndDsgZWxlbWVudHMgYW5kICZsdDtsaW5rJmd0OyBlbGVtZW50cyB3aXRoIHJlbD1cInN0eWxlc2hlZXRcIi4nXG4gIH0sXG4gICdzdHlsZS1zcmMtYXR0cic6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBpbmxpbmUgc3R5bGVzIGFwcGxpZWQgdG8gaW5kaXZpZHVhbCBET00gZWxlbWVudHMuJ1xuICB9LFxuICAnd29ya2VyLXNyYyc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3dvcmtlci1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgV29ya2VyLCBTaGFyZWRXb3JrZXIsIG9yIFNlcnZpY2VXb3JrZXIgc2NyaXB0cy4nXG4gIH0sXG4gICdiYXNlLXVyaSc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Jhc2UtdXJpJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBwb3NzaWJsZSBVUkxzIHRoYXQgdGhlICZsdDtiYXNlJmd0OyBlbGVtZW50IGNhbiB1c2UuJ1xuICB9LFxuICAncGx1Z2luLXR5cGVzJzoge1xuICAgIGxldmVsOiAyLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcGx1Z2luLXR5cGVzJyxcbiAgICBub3RlOiAnbGltaXRzIHRoZSB0eXBlcyBvZiByZXNvdXJjZXMgdGhhdCBjYW4gYmUgbG9hZGVkIGludG8gdGhlIGRvY3VtZW50IChlLmcuIGFwcGxpY2F0aW9uL3BkZikuIDMgcnVsZXMgYXBwbHkgdG8gdGhlIGFmZmVjdGVkIGVsZW1lbnRzLCAmbHQ7ZW1iZWQmZ3Q7IGFuZCAmbHQ7b2JqZWN0Jmd0OycsXG4gICAgZGVwcmVjYXRlZDogdHJ1ZVxuICB9LFxuICAnc2FuZGJveCc6IHtcbiAgICBsZXZlbDogJzEuMS8yJyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NhbmRib3gnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIHBvc3NpYmxlIFVSTHMgdGhhdCB0aGUgJmx0O2Jhc2UmZ3Q7IGVsZW1lbnQgY2FuIHVzZS4nXG4gIH0sXG4gICduYXZpZ2F0ZS10byc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L25hdmlnYXRlLXRvJyxcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHdoaWNoIGEgZG9jdW1lbnQgY2FuIG5hdmlnYXRlIHRvIGJ5IGFueSBtZWFuIChub3QgeWV0IHN1cHBvcnRlZCBieSBtb2Rlcm4gYnJvd3NlcnMgaW4gSmFuIDIwMjEpLidcbiAgfSxcbiAgJ2Zvcm0tYWN0aW9uJzoge1xuICAgIGxldmVsOiAyLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZm9ybS1hY3Rpb24nLFxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgd2hpY2ggdGhlIGZvcm1zIGNhbiBzdWJtaXQgdG8uJ1xuICB9LFxuICAnZnJhbWUtYW5jZXN0b3JzJzoge1xuICAgIGxldmVsOiAyLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZnJhbWUtYW5jZXN0b3JzJyxcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHRoYXQgY2FuIGVtYmVkIHRoZSByZXF1ZXN0ZWQgcmVzb3VyY2UgaW5zaWRlIG9mICZsdDtmcmFtZSZndDssICZsdDtpZnJhbWUmZ3Q7LCAmbHQ7b2JqZWN0Jmd0OywgJmx0O2VtYmVkJmd0Oywgb3IgJmx0O2FwcGxldCZndDsgZWxlbWVudHMuJ1xuICB9LFxuICAndXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cyc6IHtcbiAgICBsZXZlbDogJz8nLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvdXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cycsXG4gICAgbm90ZTogJ2luc3RydWN0cyB1c2VyIGFnZW50cyB0byB0cmVhdCBhbGwgb2YgYSBzaXRlXFwncyBpbnNlY3VyZSBVUkxzICh0aG9zZSBzZXJ2ZWQgb3ZlciBIVFRQKSBhcyB0aG91Z2ggdGhleSBoYXZlIGJlZW4gcmVwbGFjZWQgd2l0aCBzZWN1cmUgVVJMcyAodGhvc2Ugc2VydmVkIG92ZXIgSFRUUFMpLiBUaGlzIGRpcmVjdGl2ZSBpcyBpbnRlbmRlZCBmb3Igd2ViIHNpdGVzIHdpdGggbGFyZ2UgbnVtYmVycyBvZiBpbnNlY3VyZSBsZWdhY3kgVVJMcyB0aGF0IG5lZWQgdG8gYmUgcmV3cml0dGVuLidcbiAgfSxcbiAgJ3JlcG9ydC11cmknOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9yZXBvcnQtdXJpJyxcbiAgICBub3RlOiAnZGlyZWN0aXZlIGlzIGRlcHJlY2F0ZWQgYnkgcmVwb3J0LXRvLCB3aGljaCBpcyBhIFVSSSB0aGF0IHRoZSByZXBvcnRzIGFyZSBzZW50IHRvLicsXG4gICAgZGVwcmVjYXRlZDogdHJ1ZVxuICB9LFxuICAncmVwb3J0LXRvJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcmVwb3J0LXRvJyxcbiAgICBub3RlOiAnd2hpY2ggaXMgYSBncm91cG5hbWUgZGVmaW5lZCBpbiB0aGUgaGVhZGVyIGluIGEganNvbiBmb3JtYXR0ZWQgaGVhZGVyIHZhbHVlLidcbiAgfSxcbn1cbmNvbnN0IHBvbGljeSA9IHtcbiAgJ25vbmUnICA6ICdXb25cXCd0IGFsbG93IGxvYWRpbmcgb2YgYW55IHJlc291cmNlcy4nLFxuICAnYmxvYjonIDogJ1JhdyBkYXRhIHRoYXQgaXNuXFwndCBuZWNlc3NhcmlseSBpbiBhIEphdmFTY3JpcHQtbmF0aXZlIGZvcm1hdC4nLFxuICAnZGF0YTonIDogJ09ubHkgYWxsb3cgcmVzb3VyY2VzIGZyb20gdGhlIGRhdGEgc2NoZW1lIChpZTogQmFzZTY0IGVuY29kZWQgaW1hZ2VzKS4nLFxuICBcIidzZWxmJ1wiOiAnT25seSBhbGxvdyByZXNvdXJjZXMgZnJvbSB0aGUgY3VycmVudCBvcmlnaW4uJyxcbiAgXCIndW5zYWZlLWlubGluZSdcIjogJycsXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjc3BBcnIsXG4gIGNzcEluZm8sXG4gIGNzcEZldGNoLFxuICBjc3BFQXR0cixcbiAgcG9saWN5LFxufSIsIjxzY3JpcHQ+XG5pbXBvcnQge29uTW91bnR9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQge1xuICBjc3BBcnIsXG4gIGNzcEluZm8sXG4gIGNzcEZldGNoLFxuICBjc3BFQXR0cixcbn0gZnJvbSAnLi9Dc3BkaXJlY3RpdmUnXG5sZXQgY3NwID0gd2luZG93Lm1pdG0uaW5mby5jc3BcbmxldCByZXBvcnRUbyA9IGNzcC5yZXBvcnRUb1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc3QgZmFsbGJhY2sgPSB0cnVlXG4gIGNvbnN0IHtwb2xpY3l9ID0gY3NwWydkZWZhdWx0LXNyYyddIHx8IHt9XG4gIGlmIChwb2xpY3kgJiYgcG9saWN5Lmxlbmd0aD4wKSB7XG4gICAgZm9yIChjb25zdCBpZCBvZiBjc3BGZXRjaCkge1xuICAgICAgaWYgKCFjc3BbaWRdKSB7XG4gICAgICAgIGNzcFtpZF0gPSB7cG9saWN5LCBmYWxsYmFja31cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBpZCBvZiBjc3BFQXR0cikge1xuICAgIGNvbnN0IHBhciA9IGlkLnJlcGxhY2UoLy0uezR9JC8sICcnKVxuICAgIGNvbnN0IHtwb2xpY3l9ID0gY3NwW3Bhcl0gfHwge31cbiAgICBpZiAoIWNzcFtpZF0gJiYgcG9saWN5KSB7XG4gICAgICBjc3BbaWRdID0ge3BvbGljeSwgZmFsbGJhY2t9XG4gICAgfVxuICB9XG4gIGlmIChyZXBvcnRUbyE9PSdKU09OIEVycm9yIScgJiYgcmVwb3J0VG8/Lmxlbmd0aCA+IDE1KSB7XG4gICAgbGV0IGNiID0gcmVwb3J0VG8ucmVwbGFjZSgvXFxuL2csJycpLnRyaW0oKVxuICAgIGlmIChjYlswXT09PSd7JyAmJiBjYi5zbGljZSgtMSk9PT0nfScpIHtcbiAgICAgIGNiID0gSlNPTi5zdHJpbmdpZnkoSlNPTi5wYXJzZShgWyR7Y2J9XWApLCBudWxsLCAyKVxuICAgICAgcmVwb3J0VG8gPSBjYi5yZXBsYWNlKC9cXFt8XFxdL2csICcnKS5yZXBsYWNlKC9cXG4gIC9nLCAnXFxuJykudHJpbSgpXG4gICAgfVxuICB9XG59KVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxiPkNvbnRlbnQgU2VjdXJpdHkgUG9saWN5PC9iPlxuICA8cD5cbiAgICBDU1Agb246XG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0NTUFwiPk1vemlsbGE8L2E+LCBcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vY29udGVudC1zZWN1cml0eS1wb2xpY3kuY29tL1wiPmNvbnRlbnQtc2VjdXJpdHktcG9saWN5LmNvbTwvYT4sXG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2NoZWF0c2hlZXRzZXJpZXMub3dhc3Aub3JnL2NoZWF0c2hlZXRzL0NvbnRlbnRfU2VjdXJpdHlfUG9saWN5X0NoZWF0X1NoZWV0Lmh0bWxcIj5PV0FTUC1jaGVhdC1zaGVldDwvYT5cbiAgPC9wPlxuICA8ZGl2PlxuICAgIHsjZWFjaCBjc3BBcnIgYXMgaWQsIGl9XG4gICAgeyNpZiBjc3BbaWRdfSAgICAgIFxuICAgICAgPGRldGFpbHM+PHN1bW1hcnkgY2xhc3M9e2NzcFtpZF0uZmFsbGJhY2sgPyAnZmFsbGJhY2snIDogJyd9PlxuICAgICAgICB7I2lmIGNzcEluZm9baWRdLmxpbmt9XG4gICAgICAgICAge2krMX0ue2lkfTooe2NzcFtpZF0ucG9saWN5Lmxlbmd0aH0pPGEgdGFyZ2V0PWJsYW5rIGhyZWY9e2NzcEluZm9baWRdLmxpbmt9PjxzbWFsbD52e2NzcEluZm9baWRdLmxldmVsfTwvc21hbGw+PC9hPlxuICAgICAgICB7OmVsc2V9XG4gICAgICAgICAge2krMX0ue2lkfTooe2NzcFtpZF0ucG9saWN5Lmxlbmd0aH0pPHNtYWxsPnZ7Y3NwSW5mb1tpZF0ubGV2ZWx9PC9zbWFsbD5cbiAgICAgICAgey9pZn1cbiAgICAgIDwvc3VtbWFyeT5cbiAgICAgICAgeyNpZiBjc3BJbmZvW2lkXS5ub3RlfVxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPVwibm90ZVwiPjxzdW1tYXJ5PmV4cGFuZC4uLjwvc3VtbWFyeT5cbiAgICAgICAgICAgIDxzbWFsbD57QGh0bWwgY3NwSW5mb1tpZF0ubm90ZX08L3NtYWxsPlxuICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgey9pZn1cbiAgICAgICAgeyNlYWNoIGNzcFtpZF0ucG9saWN5IGFzIGl0ZW0sIHh9XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW1cIj57eCsxfTp7aXRlbX08L2Rpdj5cbiAgICAgICAgey9lYWNofVxuICAgICAgPC9kZXRhaWxzPlxuICAgIHsvaWZ9XG4gICAgey9lYWNofVxuICAgIDxociAvPlxuICAgIDxkZXRhaWxzPjxzdW1tYXJ5IGNsYXNzPVwicmVwb3J0XCI+PGI+cmVwb3J0LXRvPC9iPjo8L3N1bW1hcnk+XG4gICAgICA8ZGV0YWlscyBjbGFzcz1cIm5vdGVcIj48c3VtbWFyeT5leHBhbmQuLi48L3N1bW1hcnk+XG4gICAgICAgIDxzbWFsbD57QGh0bWwgJ3VzZWQgdG8gc3BlY2lmeSBkZXRhaWxzIGFib3V0IHRoZSBkaWZmZXJlbnQgZW5kcG9pbnRzIHRoYXQgYSB1c2VyLWFnZW50IGhhcyBhdmFpbGFibGUgdG8gaXQgZm9yIGRlbGl2ZXJpbmcgcmVwb3J0cyB0by4gWW91IGNhbiB0aGVuIHJldHJpZXZlIHJlcG9ydHMgYnkgbWFraW5nIGEgcmVxdWVzdCB0byB0aG9zZSBVUkxzLid9PC9zbWFsbD5cbiAgICAgIDwvZGV0YWlscz5cbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtXCI+e3JlcG9ydFRvfTwvZGl2PlxuICAgIDwvZGV0YWlscz5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cbmRldGFpbHMubm90ZSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgc3VtbWFyeSB7XG4gICAgY29sb3I6IHJlZDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgZm9udC1zaXplOiB4LXNtYWxsO1xuICAgIG1hcmdpbi1sZWZ0OiAtMTRweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICAmOjotd2Via2l0LWRldGFpbHMtbWFya2VyIHtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG4gICAgfVxuICB9XG59IFxuc3VtbWFyeSwuaXRlbSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC1mYW1pbHk6ICdDb3VyaWVyIE5ldycsIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogc21hbGw7XG4gICY6aG92ZXIge1xuICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Ymx1ZTtcbiAgfVxufVxuc3VtbWFyeS5mYWxsYmFjayB7XG4gIGNvbG9yOiBkYXJrcmVkO1xufVxuLml0ZW0ge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG4gIGZvbnQtc2l6ZTogc21hbGxlcjtcbiAgY29sb3I6ICM5MTAwY2Q7XG59XG48L3N0eWxlPiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xuY29uc3QgX2MgPSAnY29sb3I6IGJsdWV2aW9sZXQnXG5cbmxldCBrZXlzID0gW11cbiQ6IF9rZXlzID0ga2V5c1xuXG5mdW5jdGlvbiByZWxvYWRLZXlzKCkge1xuICBjb25zb2xlLmxvZygnJWNSZWxvYWQgaG90a2V5cy4nLCBfYyk7XG4gIGNvbnN0IHttYWNyb2tleXM6IG1rZXl9ID0gd2luZG93Lm1pdG1cbiAga2V5cyA9IFtdXG4gIGZvciAoY29uc3QgaWQgaW4gbWtleSkge1xuICAgIGtleXMucHVzaCh7aWQsIHRpdGxlOiBta2V5W2lkXS5fdGl0bGV9KVxuICB9XG59XG5cbmxldCBvYnNlcnZlclxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHFyeSA9ICcubWl0bS1jb250YWluZXIuY2VudGVyJ1xuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxcnkpXG4gIGNvbnN0IG5vZGVWaXNpYmxlID0gb2JzID0+IHtcbiAgICBpZiAobm9kZS5hdHRyaWJ1dGVzLnN0eWxlKSB7XG4gICAgICByZWxvYWRLZXlzKClcbiAgICB9XG4gIH1cbiAgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihub2RlVmlzaWJsZSk7XG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2F0dHJpYnV0ZXM6IHRydWV9KVxuICBzZXRUaW1lb3V0KHJlbG9hZEtleXMsIDEwMDApXG59KTtcblxub25EZXN0cm95KCgpID0+IHtcbiAgaWYgKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgb2JzZXJ2ZXIgPSB1bmRlZmluZWRcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIGhhbmRsZUNsaWNrKGUpIHtcbiAgY29uc3Qga2V5ID0gZS50YXJnZXQuZGF0YXNldC5pZFxuICBjb25zdCBmbiA9IG1pdG0ubWFjcm9rZXlzW2tleV1cbiAgbGV0IFt0eXAsIC4uLmFycl0gPSBrZXkuc3BsaXQoJzonKVxuICBjb25zdCBvcHQgPSB7fVxuICBpZiAodHlwPT09J2tleScpIHtcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXG4gICAgbGV0IGtcbiAgICBpZiAocWN0bCkge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIGsgPSBxY3RsWzFdLnN1YnN0cigtMSlcbiAgICB9IGVsc2UgaWYgKHFhbHQpIHtcbiAgICAgIGsuY3RybEtleSA9IHRydWVcbiAgICAgIGsgPSBxYWx0WzFdLnN1YnN0cigtMSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxuICAgICAgayA9IGFyci5wb3AoKS5zdWJzdHIoLTEpXG4gICAgfVxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcbiAgICBvcHQuY29kZSA9IGBLZXkke2sudG9VcHBlckNhc2UoKX1gXG4gICAgb3B0LmtleSA9IG1pdG0uZm4uY29kZVRvQ2hhcihvcHQpXG4gIH0gZWxzZSBpZiAodHlwPT09J2NvZGUnKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGlmIChxY3RsKSB7XG4gICAgICBvcHQuY3RybEtleSA9IHRydWVcbiAgICAgIGFyciA9IHFjdGxbMV0uc3BsaXQoJzonKVxuICAgIH0gZWxzZSBpZiAocWFsdCkge1xuICAgICAgb3B0LmFsdEtleSA9IHRydWVcbiAgICAgIGFyciA9IHFhbHRbMV0uc3BsaXQoJzonKVxuICAgIH0gZWxzZSB7XG4gICAgICBvcHQuY3RybEtleSA9IHRydWVcbiAgICAgIG9wdC5hbHRLZXkgID0gdHJ1ZVxuICAgIH1cbiAgICBvcHQuY29kZSA9IGFyci5wb3AoKVxuICAgIG9wdC5zaGlmdEtleSA9IGUuc2hpZnRLZXlcbiAgICBvcHQua2V5ID0gbWl0bS5mbi5jb2RlVG9DaGFyKG9wdClcbiAgfVxuICBpZiAoZm4pIHtcbiAgICBjb25zdCBtYWNybyA9IGZuKG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgb3B0KSlcbiAgICBtaXRtLmZuLm1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIGt0b1Nob3coaykge1xuICByZXR1cm4gay5zcGxpdCgnJykubWFwKHg9PmAke3h9YCkuam9pbignICcpXG59XG5cbmZ1bmN0aW9uIGtjb2RlKG9iaikge1xuICBjb25zdCBrZXkgPSBvYmouaWRcbiAgY29uc3Qge2NvZGVUb0NoYXI6IGNoYXJ9ID0gbWl0bS5mblxuICBsZXQgW3R5cCwgLi4uYXJyXSA9IGtleS5zcGxpdCgnOicpXG4gIGNvbnN0IG9wdCA9IHt9XG4gIGxldCBtc2dcbiAgaWYgKHR5cD09PSdrZXknKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGlmICAgICAgKHFjdGwpIHsgbXNnID0gYGN0bCAuIC4uLiDih74gJHtrdG9TaG93KHFjdGxbMV0pfWAgIH1cbiAgICBlbHNlIGlmIChxYWx0KSB7IG1zZyA9IGBhbHQgLiAuLi4g4oe+ICR7a3RvU2hvdyhxYWx0WzFdKX1gICB9XG4gICAgZWxzZSAgICAgICAgICAgeyBtc2cgPSBgY3RsICsgYWx0IOKHviAke2t0b1Nob3coYXJyLnBvcCgpKX1gfVxuICB9IGVsc2UgaWYgKHR5cD09PSdjb2RlJykge1xuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcbiAgICBpZiAgICAgIChxY3RsKSB7IG1zZyA9ICdjdGwgLiAuLi4g4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KHFjdGxbMV0pfVxuICAgIGVsc2UgaWYgKHFhbHQpIHsgbXNnID0gJ2FsdCAuIC4uLiDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3cocWFsdFsxXSl9XG4gICAgZWxzZSAgICAgICAgICAgeyBtc2cgPSAnY3RsICsgYWx0IOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhhcnIuam9pbignOicpKX1cbiAgfVxuICByZXR1cm4gbXNnXG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInZib3hcIj5cbiAgPGI+SG90LWtleXM6PC9iPlxuICA8dGFibGU+XG4gICAgeyNlYWNoIF9rZXlzIGFzIG9iaixpfVxuICAgICAgPHRyPlxuICAgICAgICA8dGQgY2xhc3M9XCJub1wiPntpKzF9PC90ZD5cbiAgICAgICAgPHRkIGNsYXNzPVwia2NvZGVcIiBkYXRhLWlkPXtvYmouaWR9IG9uOmNsaWNrPXtoYW5kbGVDbGlja30+XG4gICAgICAgICAge2tjb2RlKG9iail9XG4gICAgICAgIDwvdGQ+XG4gICAgICAgIDx0ZCBjbGFzcz1cInRpdGxlXCI+e29iai50aXRsZX08L3RkPlxuICAgICAgPC90cj5cbiAgICB7L2VhY2h9XG4gIDwvdGFibGU+XG48L2Rpdj5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5cbiAgLnZib3gge1xuICAgIGNvbG9yOmJsdWU7XG4gICAgbGVmdDogMDtcbiAgICByaWdodDogMDtcbiAgfVxuICB0YWJsZSB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgY29sb3I6IG1hcm9vbjtcbiAgICBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xuICAgIHRyOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTk5LCAxNjYsIDExNiwgMC40NTIpO1xuICAgICAgLmtjb2RlIHtcbiAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG4gICAgICAgICY6aG92ZXIge1xuICAgICAgICAgIGNvbG9yOiByZWQ7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRkIHtcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDVweDtcbiAgICB9XG4gICAgLm5vIHtcbiAgICAgIHBhZGRpbmc6IDA7XG4gICAgICB3aWR0aDogMjVweDtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICB9XG4gICAgLmtjb2RlIHtcbiAgICAgIGZvbnQtZmFtaWx5OiAnQ291cmllciBOZXcnLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICB9XG4gICAgLnRpdGxlIHtcbiAgICAgIGZvbnQtZmFtaWx5OiAnR2lsbCBTYW5zJywgJ0dpbGwgU2FucyBNVCcsIENhbGlicmksICdUcmVidWNoZXQgTVMnLCBzYW5zLXNlcmlmO1xuICAgICAgd2lkdGg6IDUwJTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIE5vdGU6IFRoaXMgcmVnZXggbWF0Y2hlcyBldmVuIGludmFsaWQgSlNPTiBzdHJpbmdzLCBidXQgc2luY2Ugd2XigJlyZVxuLy8gd29ya2luZyBvbiB0aGUgb3V0cHV0IG9mIGBKU09OLnN0cmluZ2lmeWAgd2Uga25vdyB0aGF0IG9ubHkgdmFsaWQgc3RyaW5nc1xuLy8gYXJlIHByZXNlbnQgKHVubGVzcyB0aGUgdXNlciBzdXBwbGllZCBhIHdlaXJkIGBvcHRpb25zLmluZGVudGAgYnV0IGluXG4vLyB0aGF0IGNhc2Ugd2UgZG9u4oCZdCBjYXJlIHNpbmNlIHRoZSBvdXRwdXQgd291bGQgYmUgaW52YWxpZCBhbnl3YXkpLlxudmFyIHN0cmluZ09yQ2hhciA9IC8oXCIoPzpbXlxcXFxcIl18XFxcXC4pKlwiKXxbOixdL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5naWZ5KHBhc3NlZE9iaiwgb3B0aW9ucykge1xuICB2YXIgaW5kZW50LCBtYXhMZW5ndGgsIHJlcGxhY2VyO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpbmRlbnQgPSBKU09OLnN0cmluZ2lmeShcbiAgICBbMV0sXG4gICAgdW5kZWZpbmVkLFxuICAgIG9wdGlvbnMuaW5kZW50ID09PSB1bmRlZmluZWQgPyAyIDogb3B0aW9ucy5pbmRlbnRcbiAgKS5zbGljZSgyLCAtMyk7XG4gIG1heExlbmd0aCA9XG4gICAgaW5kZW50ID09PSBcIlwiXG4gICAgICA/IEluZmluaXR5XG4gICAgICA6IG9wdGlvbnMubWF4TGVuZ3RoID09PSB1bmRlZmluZWRcbiAgICAgID8gODBcbiAgICAgIDogb3B0aW9ucy5tYXhMZW5ndGg7XG4gIHJlcGxhY2VyID0gb3B0aW9ucy5yZXBsYWNlcjtcblxuICByZXR1cm4gKGZ1bmN0aW9uIF9zdHJpbmdpZnkob2JqLCBjdXJyZW50SW5kZW50LCByZXNlcnZlZCkge1xuICAgIC8vIHByZXR0aWVyLWlnbm9yZVxuICAgIHZhciBlbmQsIGluZGV4LCBpdGVtcywga2V5LCBrZXlQYXJ0LCBrZXlzLCBsZW5ndGgsIG5leHRJbmRlbnQsIHByZXR0aWZpZWQsIHN0YXJ0LCBzdHJpbmcsIHZhbHVlO1xuXG4gICAgaWYgKG9iaiAmJiB0eXBlb2Ygb2JqLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBvYmogPSBvYmoudG9KU09OKCk7XG4gICAgfVxuXG4gICAgc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkob2JqLCByZXBsYWNlcik7XG5cbiAgICBpZiAoc3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgbGVuZ3RoID0gbWF4TGVuZ3RoIC0gY3VycmVudEluZGVudC5sZW5ndGggLSByZXNlcnZlZDtcblxuICAgIGlmIChzdHJpbmcubGVuZ3RoIDw9IGxlbmd0aCkge1xuICAgICAgcHJldHRpZmllZCA9IHN0cmluZy5yZXBsYWNlKFxuICAgICAgICBzdHJpbmdPckNoYXIsXG4gICAgICAgIGZ1bmN0aW9uIChtYXRjaCwgc3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgIHJldHVybiBzdHJpbmdMaXRlcmFsIHx8IG1hdGNoICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICBpZiAocHJldHRpZmllZC5sZW5ndGggPD0gbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBwcmV0dGlmaWVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXBsYWNlciAhPSBudWxsKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKHN0cmluZyk7XG4gICAgICByZXBsYWNlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogIT09IG51bGwpIHtcbiAgICAgIG5leHRJbmRlbnQgPSBjdXJyZW50SW5kZW50ICsgaW5kZW50O1xuICAgICAgaXRlbXMgPSBbXTtcbiAgICAgIGluZGV4ID0gMDtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICBzdGFydCA9IFwiW1wiO1xuICAgICAgICBlbmQgPSBcIl1cIjtcbiAgICAgICAgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChcbiAgICAgICAgICAgIF9zdHJpbmdpZnkob2JqW2luZGV4XSwgbmV4dEluZGVudCwgaW5kZXggPT09IGxlbmd0aCAtIDEgPyAwIDogMSkgfHxcbiAgICAgICAgICAgICAgXCJudWxsXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IFwie1wiO1xuICAgICAgICBlbmQgPSBcIn1cIjtcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgICBrZXlQYXJ0ID0gSlNPTi5zdHJpbmdpZnkoa2V5KSArIFwiOiBcIjtcbiAgICAgICAgICB2YWx1ZSA9IF9zdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIG5leHRJbmRlbnQsXG4gICAgICAgICAgICBrZXlQYXJ0Lmxlbmd0aCArIChpbmRleCA9PT0gbGVuZ3RoIC0gMSA/IDAgOiAxKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2goa2V5UGFydCArIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtzdGFydCwgaW5kZW50ICsgaXRlbXMuam9pbihcIixcXG5cIiArIG5leHRJbmRlbnQpLCBlbmRdLmpvaW4oXG4gICAgICAgICAgXCJcXG5cIiArIGN1cnJlbnRJbmRlbnRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9KShwYXNzZWRPYmosIFwiXCIsIDApO1xufTtcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgc3RyaW5naWZ5IGZyb20gXCJqc29uLXN0cmluZ2lmeS1wcmV0dHktY29tcGFjdFwiO1xuXG5leHBvcnQgbGV0IGdlbmVyYWwgPSB7fVxuZXhwb3J0IGxldCBqc29uID0ge31cblxubGV0IGtleXMgPSBPYmplY3Qua2V5cyhqc29uKSBcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPXN2LWl0ZW0+XG57I2VhY2gga2V5cyBhcyBrZXl9XG48ZGV0YWlscyBjbGFzcz0nc3YtZGF0YSBzdi17a2V5fSBzdHtNYXRoLnRydW5jKGdlbmVyYWwuc3RhdHVzLzEwMCl9eCc+XG4gIDxzdW1tYXJ5IGNsYXNzPXN2LXRpdGxlPntrZXl9PC9zdW1tYXJ5PlxuICA8cHJlIGNsYXNzPXN2LXtnZW5lcmFsLmV4dH0+e3N0cmluZ2lmeShqc29uW2tleV0pfTwvcHJlPlxuPC9kZXRhaWxzPlxuey9lYWNofVxuPC9kaXY+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuLnN2LWl0ZW0ge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG59XG4uc3YtdGl0bGUsIHByZSB7XG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogc21hbGw7XG4gIG1hcmdpbjogMDtcbiAgJi5zdi1odG1sIHtcbiAgICBmb250LXNpemU6IHgtc21hbGw7XG4gIH1cbn1cbi5zdi10aXRsZTpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xufVxuLnN2LXJlc3BCb2R5IHtcbiAgY29sb3I6IGJsdWV2aW9sZXQ7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICY6aXMoLnN0NHgsLnN0NXgpIHtcbiAgICBjb2xvcjogcmVkO1xuICB9XG59XG4uc3YtcmVxc0JvZHkge1xuICBjb2xvcjogbWVkaXVtdmlvbGV0cmVkO1xuICBmb250LXdlaWdodDogNjAwO1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XG4gIGltcG9ydCBKc29uIGZyb20gJy4vSnNvbi5zdmVsdGUnO1xuXG4gIGxldCBsc3QgPSB7fVxuICBsZXQgb2JqID0ge3Jvd3M6IFtdfVxuICBsZXQgcXVlcnk9IGZhbHNlO1xuICBsZXQgcGF0aCA9IHRydWU7XG4gIGxldCBib2R5ID0gdHJ1ZTtcbiAgXG4gIG9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJvd3MgPSAod2luZG93LmlubmVySGVpZ2h0LTEwMCkvMTcuNVxuICAgIGNvbnNvbGUubG9nKHtyb3dzfSlcbiAgICBjb25zdCBfbGltaXRfID0gcm93c1xuICAgIGNvbnN0IF9jb3VudF8gPSB7dG90YWw6J2lkJ31cbiAgICBjb25zdCBfZGlzdGluY3RfID0gWydzZXNzaW9uJ11cbiAgICBjb25zdCBfd2hlcmVfPSAnaWQ+MCBvcmRlcmJ5IGlkOmQnXG4gICAgb2JqID0gYXdhaXQgbWl0bS5mbi5zcWxMaXN0KHtfY291bnRfLCBfZGlzdGluY3RfLCBfd2hlcmVfLCBfbGltaXRffSwgJ2xvZycpXG4gICAgb2JqLnJvd3MuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGxzdFtpdGVtLnNlc3Npb25dID0gW11cbiAgICB9KTtcbiAgfSlcblxuICBhc3luYyBmdW5jdGlvbiBkZXRhaWxDbGljayhlKSB7XG4gICAgY29uc3Qgc3MgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zc1xuICAgIGlmICghbHN0W3NzXT8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBvYmogPSBhd2FpdCBtaXRtLmZuLnNxbExpc3Qoe193aGVyZV86IGBzZXNzaW9uPSR7c3N9IG9yZGVyYnkgaWRgfSwgJ2xvZycpXG4gICAgICBsc3Rbc3NdID0gb2JqLnJvd3MubWFwKHggPT4ge1xuICAgICAgICB4Lm1ldGEgPSBKU09OLnBhcnNlKHgubWV0YSlcbiAgICAgICAgaWYgKHgubWV0YS5nZW5lcmFsLmV4dD09PSdqc29uJykge1xuICAgICAgICAgIHguZGF0YSA9IEpTT04ucGFyc2UoeC5kYXRhKVxuICAgICAgICAgIGRlbGV0ZSB4LmRhdGEuZ2VuZXJhbFxuICAgICAgICAgIGlmICh4Lm1ldGEuZ2VuZXJhbC5tZXRob2Q9PT0nR0VUJykge1xuICAgICAgICAgICAgZGVsZXRlIHguZGF0YS5yZXFzQm9keVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geFxuICAgICAgfSlcbiAgICAgIGNvbnNvbGUubG9nKHNzLCBvYmoucm93cylcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBleHBDbGljayhlKSB7XG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBlLmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChkZXRhaWxzLmF0dHJpYnV0ZXMub3Blbikge1xuICAgICAgICAgIGRldGFpbHMuY2hpbGRyZW5bMl0uc2V0QXR0cmlidXRlKCdvcGVuJywnJylcbiAgICAgICAgICBjb25zdCBhcnIxID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtR0VULC5tdC1ERUxFVEUpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5LC5zdi1yZXNwSGVhZGVyKScpXG4gICAgICAgICAgY29uc3QgYXJyMiA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LVBVVCwubXQtUE9TVCkgZGV0YWlsczppcyguc3YtcmVxc0JvZHkpJylcbiAgICAgICAgICBjb25zdCBhcnIzID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtUkVESVJFQ1QpIGRldGFpbHM6aXMoLnN2LXJlc3BIZWFkZXIpJylcbiAgICAgICAgICBjb25zdCBhcnI0ID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtRVJST1IpIGRldGFpbHM6aXMoLnN2LXJlc3BCb2R5KScpXG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjEpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIyKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMykgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjQpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICB9XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBob3N0KHVybCkge1xuICAgIGNvbnN0IG9iaiA9IG5ldyBVUkwodXJsKVxuICAgIGxldCBtc2cgPSBwYXRoID8gb2JqLnBhdGhuYW1lIDogb2JqLm9yaWdpbiArIG9iai5wYXRobmFtZVxuICAgIGlmIChxdWVyeSkge1xuICAgICAgbXNnICs9IG9iai5zZWFyY2hcbiAgICB9XG4gICAgcmV0dXJuIG1zZy5sZW5ndGg+OTAgPyBtc2cuc2xpY2UoMCwgOTApKycuLi4nIDogbXNnXG4gIH1cblxuICBmdW5jdGlvbiBlcnJfbWV0aG9kKGkyKSB7XG4gICAgY29uc3Qge21ldGhvZCwgc3RhdHVzfSA9IGkyLm1ldGEuZ2VuZXJhbFxuICAgIGNvbnN0IHN0ID0gTWF0aC50cnVuYyhzdGF0dXMvMTAwKVxuICAgIGlmIChzdD09PTMpIHtcbiAgICAgIHJldHVybiAnbXQtUkVESVJFQ1QnXG4gICAgfSBlbHNlIGlmIChzdD4zKSB7XG4gICAgICByZXR1cm4gJ210LUVSUk9SJ1xuICAgIH1cbiAgICByZXR1cm4gYG10LSR7bWV0aG9kfWAgXG4gIH1cbjwvc2NyaXB0PlxuXG48ZGl2PlxuPGI+U3FsaXRlIExvZ3MhPC9iPlxuPGxhYmVsIGZvcj1zdi1ib2R5PlxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1ib2R5IGJpbmQ6Y2hlY2tlZD17Ym9keX0gLz5leHAtYm9keVxuPC9sYWJlbD5cbjxsYWJlbCBmb3I9c3Ytbm8taG9zdD5cbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3Ytbm8taG9zdCBiaW5kOmNoZWNrZWQ9e3BhdGh9IC8+bm8taG9zdFxuPC9sYWJlbD5cbjxsYWJlbCBmb3I9c3YtcXVlcnk+XG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LXF1ZXJ5IGJpbmQ6Y2hlY2tlZD17cXVlcnl9IC8+cXVlcnlcbjwvbGFiZWw+XG57I2VhY2ggb2JqLnJvd3MgYXMgaXRlbX1cbiAgPGRldGFpbHMgY2xhc3M9c3Ytc2Vzc2lvbiBkYXRhLXNzPXtpdGVtLnNlc3Npb259IG9uOmNsaWNrPXtkZXRhaWxDbGlja30+XG4gICAgPHN1bW1hcnkgY2xhc3M9c3YtbWFpbj5cbiAgICAgIHtpdGVtLnNlc3Npb259PHNwYW4gY2xhc3M9c3YtdG90YWw+KHtpdGVtLnRvdGFsfSk8L3NwYW4+XG4gICAgPC9zdW1tYXJ5PlxuICAgIHsjaWYgbHN0W2l0ZW0uc2Vzc2lvbl0ubGVuZ3RofVxuICAgICAgeyNlYWNoIGxzdFtpdGVtLnNlc3Npb25dIGFzIGkyfVxuICAgICAgICA8ZGV0YWlscyBjbGFzcz0nc3Ytcm93cyc+XG4gICAgICAgICAgPHN1bW1hcnkgXG4gICAgICAgICAgZGF0YS1pZD17aTIuaWR9XG4gICAgICAgICAgZGF0YS1zcz17aXRlbS5zZXNzaW9ufVxuICAgICAgICAgIGNsYXNzPSdzdi10aXRsZSBzdHtNYXRoLnRydW5jKGkyLm1ldGEuZ2VuZXJhbC5zdGF0dXMvMTAwKX14J1xuICAgICAgICAgIG9uOmNsaWNrPXtleHBDbGlja30+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLnN0YXR1c30+e2kyLm1ldGEuZ2VuZXJhbC5zdGF0dXN9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5tZXRob2R9PntpMi5tZXRhLmdlbmVyYWwubWV0aG9kLnBhZEVuZCg0LCcuJyl9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte3BhdGg/J3BhdGgnOidmdWxscGF0aCd9Pntob3N0KGkyLnVybCwgcGF0aCwgcXVlcnkpfTwvc3Bhbj5cbiAgICAgICAgICA8L3N1bW1hcnk+XG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvdy1kYXRhIHN2LWhlYWRlcic+XG4gICAgICAgICAgICA8c3VtbWFyeSBjbGFzcz0nc3YtdGl0bGUgc3YtaGVhZGVyJz5oZWFkZXI8L3N1bW1hcnk+XG4gICAgICAgICAgICA8SnNvbiBqc29uPXtpMi5tZXRhfS8+XG4gICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3ctZGF0YSBzdi1jb250ZW50IHtlcnJfbWV0aG9kKGkyKX0nPlxuICAgICAgICAgICAgPHN1bW1hcnkgY2xhc3M9J3N2LXRpdGxlIHN2LWNvbnRlbnQnPmNvbnRlbnQ8L3N1bW1hcnk+XG4gICAgICAgICAgICB7I2lmIGkyLm1ldGEuZ2VuZXJhbC5leHQ9PT0nanNvbid9XG4gICAgICAgICAgICAgIDxKc29uIGpzb249e2kyLmRhdGF9IGdlbmVyYWw9e2kyLm1ldGEuZ2VuZXJhbH0gLz5cbiAgICAgICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICAgICAgPHByZSBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLmV4dH0+e2kyLmRhdGF9PC9wcmU+XG4gICAgICAgICAgICB7L2lmfVxuICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgPC9kZXRhaWxzPiAgICAgICAgXG4gICAgICB7L2VhY2h9XG4gICAgezplbHNlfVxuICAgICAgbG9hZGluZy0xLi4uICAgICAgICAgIFxuICAgIHsvaWZ9XG4gIDwvZGV0YWlscz5cbnsvZWFjaH1cbjwvZGl2PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cblt0eXBlPWNoZWNrYm94XSB7XG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG59XG4uc3Ytc2Vzc2lvbiB7XG4gIHN1bW1hcnkge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAmLnN2LW1haW46aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG4gICAgfVxuICB9XG59XG4uc3Ytcm93cyB7XG4gIHBhZGRpbmctbGVmdDogMTZweDtcbn1cbi5zdi1yb3ctZGF0YSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbn1cbi5zdi10b3RhbCB7XG4gIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgdmVydGljYWwtYWxpZ246IHRleHQtdG9wO1xuICBjb2xvcjogZGFya21hZ2VudGE7XG59XG4uc3YtdGl0bGUsIC5zdi1yb3ctZGF0YSBwcmUge1xuICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBzbWFsbDtcbiAgbWFyZ2luOiAwO1xuICAmLnN2LWh0bWwge1xuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgfVxufVxuc3VtbWFyeTppcyguc3QyeCkge1xuICBjb2xvcjojMzAwNDdlO1xufVxuc3VtbWFyeTppcyguc3QzeCwuc3Q0eCwuc3Q1eCkge1xuICBjb2xvcjogI2I0MDAwMDtcbn1cbi5zdi1QT1NULC5zdi1QVVQge1xuICBjb2xvcjogY3JpbXNvbjtcbn1cbi5zdi1ERUxFVEUge1xuICBjb2xvcjogcmVkXG59XG4uc3YtcGF0aCB7XG4gIGNvbG9yOiBkYXJrZ3JlZW47XG59XG4uc3YtZnVsbHBhdGgge1xuICBjb2xvcjogZGFya21hZ2VudGE7XG59XG4uc3YtdGl0bGU6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcbn1cbjwvc3R5bGU+XG4iLCIvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxuY29uc3Qge2RlZmF1bHQ6IEExMXlQb3B1cH0gPSByZXF1aXJlKCcuL0ExMXlQb3B1cC5zdmVsdGUnKVxuY29uc3Qge2RlZmF1bHQ6IENzcGhlYWRlcn0gPSByZXF1aXJlKCcuL0NzcGhlYWRlci5zdmVsdGUnKVxuY29uc3Qge2RlZmF1bHQ6IEhvdGtleXN9ICAgPSByZXF1aXJlKCcuL0hvdGtleXMuc3ZlbHRlJylcbmNvbnN0IHtkZWZhdWx0OiBTcWxpdGV9ICAgID0gcmVxdWlyZSgnLi9zcWxpdGUuc3ZlbHRlJylcbm1vZHVsZS5leHBvcnRzID0ge1xuICBBMTF5UG9wdXAsXG4gIENzcGhlYWRlcixcbiAgSG90a2V5cyxcbiAgU3FsaXRlXG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19wb3N0bWVzc2FnZSA9IHJlcXVpcmUoJy4vX3dzX3Bvc3RtZXNzYWdlJylcbmNvbnN0IF93c19pbml0U29ja2V0ID0gcmVxdWlyZSgnLi9fd3NfaW5pdC1zb2NrZXQnKVxuY29uc3QgX3dzX3NjcmVlbnNob3QgPSByZXF1aXJlKCcuL193c19zY3JlZW5zaG90JylcbmNvbnN0IF93c19sb2NhdGlvbiA9IHJlcXVpcmUoJy4vX3dzX2xvY2F0aW9uJylcbmNvbnN0IF93c19vYnNlcnZlciA9IHJlcXVpcmUoJy4vX3dzX29ic2VydmVyJylcbmNvbnN0IF93c19nZW5lcmFsID0gcmVxdWlyZSgnLi9fd3NfZ2VuZXJhbCcpXG5jb25zdCBfd3NfY3NwRXJyID0gcmVxdWlyZSgnLi9fd3NfY3NwLWVycicpXG5jb25zdCBfd3NfbWFjcm9zID0gcmVxdWlyZSgnLi9fd3NfbWFjcm9zJylcbmNvbnN0IF9jID0gJ2NvbG9yOiByZWQnXG5cbl93c19wb3N0bWVzc2FnZSgpXG5fd3NfaW5pdFNvY2tldCgpXG5fd3Nfc2NyZWVuc2hvdCgpXG5fd3NfbG9jYXRpb24oKVxuX3dzX29ic2VydmVyKClcbl93c19nZW5lcmFsKClcbl93c19jc3BFcnIoKVxuX3dzX21hY3JvcygpXG5jb25zb2xlLmxvZygnJWNXczogd3MtY2xpZW50IGxvYWRlZC4uLicsIF9jKVxud2luZG93Lm1pdG0uc3ZlbHRlID0gcmVxdWlyZSgnLi4vc3ZlbHRlJylcbiJdLCJuYW1lcyI6WyJfd3NfcG9zdG1lc3NhZ2UiLCJfYyIsIl93c19jbGllbnQiLCJyZXF1aXJlJCQwIiwiX3dzX21zZ1BhcnNlciIsIl93c19pbklmcmFtZSIsIl93c192ZW5kb3IiLCJyZXF1aXJlJCQxIiwicmVxdWlyZSQkMiIsIl93c19pbml0U29ja2V0IiwiX3NjcmVlbnNob3QiLCJfd3NfbmFtZXNwYWNlIiwiX3dzX3NjcmVlbnNob3QiLCJwbGF5Iiwic3FsaXRlIiwicmVxdWlyZSQkMyIsImxvY2F0aW9uIiwiaW5pdCIsInN2ZWx0ZSIsIl93c19sb2NhdGlvbiIsIl93c19kZWJvdW5jZSIsIl93c19yb3V0ZSIsInJlcXVpcmUkJDQiLCJfd3Nfb2JzZXJ2ZXIiLCJfd3NfZ2VuZXJhbCIsIl93c19jc3BFcnIiLCJfd3NfbWFjcm9zIiwiY3NwSW5mbyIsImNzcEFyciIsImNzcEZldGNoIiwiY3NwRUF0dHIiLCJzdHJpbmdpZnkiLCJyZXF1aXJlJCQ1IiwicmVxdWlyZSQkNiIsInJlcXVpcmUkJDciLCJyZXF1aXJlJCQ4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBQ0FBLGlCQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLFNBQVMsY0FBYyxFQUFFLEtBQUssRUFBRTtDQUNsQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0NBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUM7Q0FDN0YsS0FBSztDQUNMLEdBQUc7Q0FDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBQztDQUMzRDs7Q0NSQSxNQUFNQyxJQUFFLEdBQUcsaUJBQWdCO0FBQzNCO0tBQ0FDLFlBQWMsR0FBRyxNQUFNO0NBQ3ZCLEVBQUUsSUFBSSxVQUFTO0NBQ2YsRUFBRSxPQUFPO0NBQ1Q7Q0FDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQztDQUN2QixLQUFLO0NBQ0w7Q0FDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQztDQUN2QixLQUFLO0NBQ0w7Q0FDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDckIsTUFBTSxNQUFNLFFBQVEsR0FBRyx3RkFBdUY7Q0FDOUcsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUM7Q0FDMUQsTUFBTSxTQUFTLENBQUMsSUFBSSxHQUFFO0NBQ3RCLEtBQUs7Q0FDTDtDQUNBLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtDQUN0QixNQUFNLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSTtDQUM3QixNQUFNLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0NBQzFDLFFBQVEsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztDQUMxQyxRQUFPO0NBQ1AsS0FBSztDQUNMO0NBQ0EsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtDQUNuQyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO0NBQ3RELFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRUQsSUFBRSxFQUFDO0NBQzlDLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTTtDQUNuQyxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU07Q0FDbkMsT0FBTztDQUNQLEtBQUs7Q0FDTDtDQUNBLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7Q0FDM0IsTUFBTSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUk7Q0FDbkMsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBQztDQUM3QztDQUNBO0NBQ0E7Q0FDQTtDQUNBLE1BQU0sS0FBSyxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFO0NBQ2hELFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBQztDQUN0RCxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDO0NBQ3pDLE9BQU87Q0FDUCxLQUFLO0NBQ0wsSUFBSSxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO0NBQzFCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRUEsSUFBRSxFQUFFLElBQUksRUFBQztDQUMvQyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUk7Q0FDL0IsS0FBSztDQUNMLEdBQUc7Q0FDSDs7OztDQ25EQSxNQUFNLFVBQVUsR0FBR0UsYUFBdUI7Q0FDMUMsTUFBTSxTQUFTLEdBQUcsVUFBVSxHQUFFO0FBQzlCO0tBQ0FDLGVBQWMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUs7Q0FDakMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7Q0FDN0MsSUFBSSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFO0NBQ3pCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztDQUM5RCxLQUFLLE1BQU07Q0FDWCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFDO0NBQzlDLEtBQUs7Q0FDTCxHQUFHO0NBQ0gsRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUM7Q0FDbEUsRUFBRSxJQUFJLEdBQUcsRUFBRTtDQUNYLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFHO0NBQzNCLElBQUksSUFBSTtDQUNSLE1BQU0sSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtDQUN0QyxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztDQUMvQixPQUFPO0NBQ1AsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0NBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFDO0NBQ2hDLEtBQUs7Q0FDTCxJQUFJLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtDQUMvQixNQUFNLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDO0NBQzNDLE1BQU0sT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQztDQUNsQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0NBQ3hCLEtBQUssTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtDQUMvQixNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBQztDQUN0QyxLQUFLO0NBQ0wsR0FBRztDQUNIOztLQzlCQUMsY0FBYyxHQUFHLE1BQU07Q0FDdkIsRUFBRSxJQUFJLEtBQUk7Q0FDVixFQUFFLElBQUk7Q0FDTixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFHO0NBQ3JDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtDQUNkLElBQUksSUFBSSxHQUFHLEtBQUk7Q0FDZixHQUFHO0NBQ0gsRUFBRSxPQUFPLElBQUksR0FBRyxRQUFRLEdBQUcsUUFBUTtDQUNuQzs7S0NSQUMsWUFBYyxHQUFHLE1BQU07Q0FDdkIsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsVUFBUztDQUM5QixFQUFFLE1BQU0sT0FBTyxHQUFHO0NBQ2xCLElBQUksRUFBRSxFQUFFLFNBQVM7Q0FDakIsSUFBSSxhQUFhLEVBQUUsVUFBVTtDQUM3QixJQUFJLHNCQUFzQixFQUFFLFFBQVE7Q0FDcEMsR0FBRyxDQUFDLE1BQU0sRUFBQztDQUNYLEVBQUUsT0FBTyxPQUFPO0NBQ2hCOzs7O0NDUEE7Q0FDQSxNQUFNLGFBQWEsR0FBR0gsZ0JBQTJCO0NBQ2pELE1BQU0sWUFBWSxHQUFHSSxlQUEwQjtDQUMvQyxNQUFNRCxZQUFVLEdBQUdFLGFBQXVCO0NBQzFDLE1BQU1QLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7S0FDQVEsZ0JBQWMsR0FBRyxNQUFNO0NBQ3ZCLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxHQUFFO0NBQ3ZCLEVBQUUsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFLO0NBQzlCLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUN0QztDQUNBLEVBQUUsSUFBSSxNQUFNLENBQUMsV0FBVyxHQUFHLFNBQVMsRUFBRTtDQUN0QyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEdBQUcsR0FBRTtDQUMzQixHQUFHO0FBQ0g7Q0FDQSxFQUFFLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSTtDQUN6QixJQUFJLFNBQVMsT0FBTyxHQUFHO0NBQ3ZCLE1BQU0sS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO0NBQzVDLFFBQVEsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUM7Q0FDMUMsUUFBUSxNQUFNLENBQUMsa0JBQWtCLEdBQUcsS0FBSTtDQUN4QyxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUVSLElBQUUsRUFBQztDQUN6QyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUM7Q0FDaEIsT0FBTztDQUNQLEtBQUs7QUFDTDtDQUNBLElBQUksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7Q0FDOUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFQSxJQUFFLEVBQUM7Q0FDOUMsS0FBSztBQUNMO0NBQ0EsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBQztDQUN6QixJQUFJLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSTtBQUMvQjtDQUNBLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUM7Q0FDMUIsSUFBSSxVQUFVLENBQUMsTUFBTTtDQUNyQixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUU7Q0FDdEMsUUFBUSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFDO0NBQ3hDLFFBQVEsT0FBTyxHQUFFO0NBQ2pCLE9BQU87Q0FDUCxLQUFLLEVBQUUsRUFBRSxFQUFDO0NBQ1YsSUFBRztBQUNIO0NBQ0EsRUFBRSxNQUFNLE9BQU8sR0FBRyxZQUFZO0NBQzlCLElBQUksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7Q0FDOUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFQSxJQUFFLEVBQUM7Q0FDL0MsS0FBSztDQUNMLElBQUc7QUFDSDtDQUNBLEVBQUUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLEVBQUU7Q0FDakMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRTtDQUM5QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUVBLElBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFDO0NBQ2xELEtBQUs7Q0FDTCxJQUFJLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBQztDQUM1QixJQUFHO0NBQ0g7Q0FDQSxFQUFFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsVUFBUztDQUM3QyxFQUFFLElBQUksT0FBTyxLQUFLLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO0NBQ2pELElBQUksTUFBTSxNQUFNLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDSyxZQUFVLEVBQUUsRUFBQztDQUMvRCxJQUFJLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLEdBQUcsTUFBSztDQUNyQyxJQUFJLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsT0FBTTtDQUN4QyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDdkcsSUFBSSxJQUFJLEdBQUU7Q0FDVixJQUFJLElBQUk7Q0FDUixNQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUM7Q0FDN0IsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0NBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUM7Q0FDMUIsS0FBSztDQUNMLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7Q0FDdEIsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUU7Q0FDbkI7Q0FDQSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsT0FBTTtDQUN0QixJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsUUFBTztDQUN4QixJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsVUFBUztDQUM1QixHQUFHO0NBQ0gsRUFBRSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRTtDQUM1QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUVMLElBQUUsRUFBQztDQUNuRSxHQUFHO0NBQ0g7O0NDN0VBLGVBQWUsU0FBUyxDQUFDLElBQUksRUFBRTtDQUMvQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtDQUM5QixFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtDQUMvQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0NBQ2pELE1BQU0sSUFBSTtDQUNWLFFBQVEsTUFBTSxNQUFNLEdBQUc7Q0FDdkIsVUFBVSxNQUFNLEVBQUUsTUFBTTtDQUN4QixVQUFVLE9BQU8sRUFBRTtDQUNuQixjQUFjLFFBQVEsRUFBRSxrQkFBa0I7Q0FDMUMsY0FBYyxjQUFjLEVBQUUsa0JBQWtCO0NBQ2hELFdBQVc7Q0FDWCxVQUFVLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztDQUNwQyxVQUFTO0NBQ1QsUUFBUSxLQUFLLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDO0NBQ2xELFNBQVMsSUFBSSxDQUFDLFNBQVMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDLENBQUM7Q0FDN0QsU0FBUyxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFDLFlBQVksRUFBQztDQUM3RCxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUU7Q0FDdEIsUUFBUSxNQUFNLENBQUMsS0FBSyxFQUFDO0NBQ3JCLE9BQU87Q0FDUCxLQUFLLENBQUM7Q0FDTixHQUFHLE1BQU07Q0FDVCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0NBQ2pELE1BQU0sSUFBSTtDQUNWLFFBQVEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztDQUNwRCxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUU7Q0FDdEIsUUFBUSxNQUFNLENBQUMsS0FBSyxFQUFDO0NBQ3JCLE9BQU87Q0FDUCxLQUFLLENBQUM7Q0FDTixHQUFHO0NBQ0gsQ0FBQztLQUNEUyxhQUFjLEdBQUc7Ozs7S0M3QmpCQyxlQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsU0FBUTtDQUNyQyxFQUFFLElBQUksVUFBUztBQUNmO0NBQ0EsRUFBRSxTQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUU7Q0FDekIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0NBQzFELEdBQUc7QUFDSDtDQUNBLEVBQUUsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtDQUN4QyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO0NBQ3pELE1BQU0sU0FBUyxHQUFHLElBQUc7Q0FDckIsTUFBTSxLQUFLO0NBQ1gsS0FBSztDQUNMLEdBQUc7Q0FDSCxFQUFFLE9BQU8sU0FBUztDQUNsQjs7OztDQ2ZBO0NBQ0EsTUFBTUQsYUFBVyxHQUFHUCxjQUF3QjtDQUM1QyxNQUFNUSxlQUFhLEdBQUdKLGdCQUEwQjtDQUNoRCxNQUFNRCxZQUFVLEdBQUdFLGFBQXVCO0NBQzFDLE1BQU1QLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7Q0FDQSxJQUFJLElBQUc7Q0FDUCxTQUFTLFVBQVUsRUFBRSxDQUFDLEVBQUU7Q0FDeEIsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO0NBQzNCLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0NBQ3pCLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBUztDQUN4QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUM7Q0FDckMsTUFBTSxNQUFNO0NBQ1osS0FBSztDQUNMLElBQUksSUFBSSxHQUFHLEVBQUU7Q0FDYixNQUFNLEdBQUcsR0FBRyxVQUFTO0NBQ3JCLE1BQU0sTUFBTTtDQUNaLEtBQUs7Q0FDTCxHQUFHO0NBQ0gsRUFBRSxNQUFNLFNBQVMsR0FBR1UsZUFBYSxHQUFFO0NBQ25DLEVBQUUsTUFBTSxPQUFPLEdBQUdMLFlBQVUsR0FBRTtDQUM5QixFQUFFLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUM7Q0FDbkQsRUFBRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUM7Q0FDN0MsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVU7QUFDdkM7Q0FDQSxFQUFFLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFDO0NBQ3RELEVBQUUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQztDQUN0RCxFQUFFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFTO0NBQ3hFLEVBQUUsS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUU7Q0FDeEIsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTTtDQUN2QixJQUFJLE9BQU8sRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxFQUFFO0NBQ25FLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFVO0NBQzVCLEtBQUs7Q0FDTCxJQUFJLElBQUksSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUU7Q0FDaEMsTUFBTSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFDO0NBQ3hDLE1BQU0sTUFBTSxNQUFNLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEdBQUU7Q0FDeEQsTUFBTSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLE1BQUs7Q0FDL0MsTUFBTUksYUFBVyxDQUFDLE1BQU0sRUFBQztDQUN6QixNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7Q0FDL0I7Q0FDQSxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFNO0NBQ3pDLFFBQVEsQ0FBQyxDQUFDLHdCQUF3QixHQUFFO0NBQ3BDLFFBQVEsQ0FBQyxDQUFDLGVBQWUsR0FBRTtDQUMzQixRQUFRLENBQUMsQ0FBQyxjQUFjLEdBQUU7Q0FDMUIsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUM7Q0FDMUIsUUFBUSxVQUFVLENBQUMsTUFBTTtDQUN6QixVQUFVLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVU7Q0FDdEMsVUFBVSxJQUFJLEdBQUcsRUFBRTtDQUNuQixZQUFZLEdBQUcsQ0FBQyxLQUFLLEdBQUU7Q0FDdkIsWUFBWSxHQUFHLEdBQUcsVUFBUztDQUMzQixXQUFXLE1BQU07Q0FDakIsWUFBWSxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFVCxJQUFFLENBQUMsQ0FBQztDQUM1RCxXQUFXO0NBQ1gsU0FBUyxFQUFFLEtBQUssRUFBQztDQUNqQixPQUFPLE1BQU07Q0FDYixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBQztDQUMxQixPQUFPO0NBQ1AsTUFBTSxNQUFNO0NBQ1osS0FBSztDQUNMLEdBQUc7Q0FDSCxDQUFDO0FBQ0Q7Q0FDQSxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUU7Q0FDdkIsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUM7Q0FDcEIsQ0FBQztBQUNEO0tBQ0FXLGdCQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDRCxlQUFhLEVBQUUsRUFBQztDQUNuRCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNO0NBQ3BELElBQUksTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7Q0FDL0MsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO0NBQ25DLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUM7Q0FDaEQsS0FBSyxNQUFNO0NBQ1gsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQztDQUNoRCxLQUFLO0NBQ0wsR0FBRyxFQUFDO0NBQ0o7O0NDN0VBLE1BQU0sTUFBTSxHQUFHO0NBQ2YsRUFBRSxTQUFTLEtBQUssR0FBRztDQUNuQixFQUFFLFdBQVcsR0FBRyxHQUFHO0NBQ25CLEVBQUUsWUFBWSxFQUFFLEdBQUc7Q0FDbkIsRUFBRSxTQUFTLEVBQUUsSUFBSTtDQUNqQixFQUFFLEtBQUssTUFBTSxHQUFHO0NBQ2hCLEVBQUUsTUFBTSxLQUFLLEdBQUc7Q0FDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztDQUNoQixFQUFFLFNBQVMsRUFBRSxHQUFHO0NBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7Q0FDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztDQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0NBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7Q0FDaEIsRUFBQztBQUNEO0NBQ0EsTUFBTSxNQUFNLEdBQUc7Q0FDZixFQUFFLFNBQVMsS0FBSyxHQUFHO0NBQ25CLEVBQUUsV0FBVyxHQUFHLEdBQUc7Q0FDbkIsRUFBRSxZQUFZLEVBQUUsR0FBRztDQUNuQixFQUFFLFNBQVMsRUFBRSxHQUFHO0NBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7Q0FDaEIsRUFBRSxNQUFNLEtBQUssR0FBRztDQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0NBQ2hCLEVBQUUsU0FBUyxFQUFFLEdBQUc7Q0FDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztDQUNoQixFQUFFLEtBQUssTUFBTSxHQUFHO0NBQ2hCLEVBQUUsS0FBSyxNQUFNLEdBQUc7Q0FDaEIsRUFBRSxLQUFLLE1BQU0sR0FBRztDQUNoQixFQUFDO0FBQ0Q7Q0FDQSxNQUFNLE1BQU0sR0FBRztDQUNmLEVBQUUsQ0FBQyxFQUFFLEdBQUc7Q0FDUixFQUFFLENBQUMsRUFBRSxHQUFHO0NBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztDQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7Q0FDUixFQUFFLENBQUMsRUFBRSxHQUFHO0NBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztDQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7Q0FDUixFQUFFLENBQUMsRUFBRSxHQUFHO0NBQ1IsRUFBRSxDQUFDLEVBQUUsR0FBRztDQUNSLEVBQUUsRUFBRSxFQUFFLEdBQUc7Q0FDVCxFQUFDO0FBQ0Q7Q0FDQSxNQUFNLEtBQUssR0FBRztDQUNkLEVBQUUsR0FBRyxNQUFNO0NBQ1gsRUFBRSxLQUFLLEVBQUUsT0FBTztDQUNoQixFQUFFLFFBQVEsRUFBRSxNQUFNO0NBQ2xCLEVBQUUsU0FBUyxFQUFFLElBQUk7Q0FDakIsRUFBRSxNQUFNLEVBQUUsS0FBSztDQUNmLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLEdBQUcsRUFBRSxLQUFLO0NBQ1osRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdB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SSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsT0FBTyxFQUFDO0NBQ3ZDO0NBQ0EsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFDO0NBQzVELEVBQUUsVUFBVSxDQUFDLE1BQU07Q0FDbkIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87Q0FDNUIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87Q0FDNUIsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVE7Q0FDN0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLE9BQU07Q0FDN0IsSUFBSSxTQUFTLENBQUMsS0FBSyxJQUFJLFNBQVE7Q0FDL0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVM7Q0FDaEMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0NBRTVDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQztDQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUM7Q0FDdkMsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFDO0NBQ3ZDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBQztDQUN2QyxJQUFJLFNBQVMsQ0FBWSxFQUFDO0NBQzFCLElBQUksUUFBUSxHQUFFO0NBQ2QsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFNBQVMsS0FBSyxFQUFFO0NBQ3ZELE1BQU0sSUFBSSxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtDQUN2RCxRQUFRLFNBQVMsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFD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QUFJLEVBQUUsS0FBSyxHQUFFO0NBQ3JDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztDQUM5QyxJQUFHO0FBQ0g7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLO0NBQzVDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDNUMsSUFBRztBQUNIO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7Q0FDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7Q0FDOUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQzNDLElBQUc7QUFDSDtDQUNBO0NBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU07Q0FDMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQztDQUN2QixJQUFHO0FBQ0g7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztDQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDM0MsSUFBRztBQUNIO0NBQ0EsRUFBRSxNQUFNLENBQUMsUUFB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
