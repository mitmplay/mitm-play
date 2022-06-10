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
	const styleLeft  = '';
	const styleTopR  = '';
	const styleRight = '';
	const buttonStyle= '';
	const style = `
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
	  const keys = {
	    'code:KeyC'(_e) {fn.svelte(Cspheader, 'LightPastelGreen');},
	    'code:KeyQ'(_e) {fn.svelte(Sqlite   , 'LightPastelGreen');},
	    'key:yyy'  (_e) {fn.axerun(wcag3, rulesObj              );},
	    'key:yy'   (_e) {fn.axerun(wcag2                        );},
	    'key:y'    (_e) {fn.axerun(                             );},
	    'key:c'    (_e) {document.querySelector(qry).innerText='';},
	  };
	  keys['code:KeyC']._title = 'Show CSP Header';
	  keys['code:KeyQ']._title = 'Show Sqlite';
	  keys['key:yyy'  ]._title = 'Execs a11y strict';
	  keys['key:yy'   ]._title = 'Execs a11y wcag:aa';
	  keys['key:y'    ]._title = 'Execs a11y check';
	  keys['key:c'    ]._title = 'Clear a11y result';
	  mitm.macrokeys = keys;
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
	  } else {
	    setButtons({}, 'right');
	    setButtons({}, 'left');
	    setButtons({}, 'topr');
	    const {left2buttons} = window.mitm;
	    left2buttons && setButtons(left2buttons, 'left2');
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
	  divRight.style = styleRight;
	  divTopR .style = styleTopR;
	  divLeft .style = styleLeft;

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

	function hotKeys(obj) {
	  window.mitm.macrokeys = {
	    ...window.mitm.macrokeys,
	    ...obj
	  };
	}

	window.mitm.fn.macroAutomation = macroAutomation;
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
	function custom_event(type, detail, bubbles = false) {
	    const e = document.createEvent('CustomEvent');
	    e.initCustomEvent(type, bubbles, false, detail);
	    return e;
	}
	class HtmlTag {
	    constructor() {
	        this.e = this.n = null;
	    }
	    c(html) {
	        this.h(html);
	    }
	    m(html, target, anchor = null) {
	        if (!this.e) {
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

	/* ws-client/_svelte/A11yPopup.svelte generated by Svelte v3.46.4 */

	const { Object: Object_1$1 } = globals;
	const file$4 = "ws-client/_svelte/A11yPopup.svelte";

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

	// (120:6) {#if criterion1}
	function create_if_block_6(ctx) {
		let a;
		let t0_value = /*criterion1*/ ctx[5].name + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				a = element("a");
				t0 = text(t0_value);
				t1 = text(",");
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*criterion1*/ ctx[5].link);
				add_location(a, file$4, 120, 8, 3580);
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
			id: create_if_block_6.name,
			type: "if",
			source: "(120:6) {#if criterion1}",
			ctx
		});

		return block;
	}

	// (123:6) {#each Object.entries(criterion2) as [key, value]}
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
				add_location(a, file$4, 123, 8, 3751);
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
			source: "(123:6) {#each Object.entries(criterion2) as [key, value]}",
			ctx
		});

		return block;
	}

	// (130:6) {#if all.length||any.length}
	function create_if_block$2(ctx) {
		let hr0;
		let t0;
		let div;
		let t1;
		let t2;
		let hr1;

		function select_block_type(ctx, dirty) {
			if (/*all*/ ctx[0].length > 1) return create_if_block_2$1;
			if (/*all*/ ctx[0].length === 1) return create_if_block_3;
			if (/*any*/ ctx[1].length > 1) return create_if_block_4;
			if (/*any*/ ctx[1].length === 1) return create_if_block_5;
		}

		let current_block_type = select_block_type(ctx);
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
				add_location(hr0, file$4, 130, 8, 4047);
				attr_dev(div, "class", "pre svelte-tj161o");
				add_location(div, file$4, 131, 8, 4061);
				add_location(hr1, file$4, 155, 8, 4728);
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
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
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
			source: "(130:6) {#if all.length||any.length}",
			ctx
		});

		return block;
	}

	// (149:35) 
	function create_if_block_5(ctx) {
		let html_tag;
		let raw_value = /*any*/ ctx[1][0] + "";
		let html_anchor;

		const block = {
			c: function create() {
				html_tag = new HtmlTag();
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
			source: "(149:35) ",
			ctx
		});

		return block;
	}

	// (142:33) 
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

				add_location(b, file$4, 142, 12, 4381);
				attr_dev(ol, "class", "svelte-tj161o");
				add_location(ol, file$4, 143, 12, 4426);
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
			source: "(142:33) ",
			ctx
		});

		return block;
	}

	// (140:35) 
	function create_if_block_3(ctx) {
		let html_tag;
		let raw_value = /*all*/ ctx[0][0] + "";
		let html_anchor;

		const block = {
			c: function create() {
				html_tag = new HtmlTag();
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
			source: "(140:35) ",
			ctx
		});

		return block;
	}

	// (133:10) {#if all.length>1}
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

				add_location(b, file$4, 133, 12, 4118);
				attr_dev(ol, "class", "svelte-tj161o");
				add_location(ol, file$4, 134, 12, 4163);
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
			source: "(133:10) {#if all.length>1}",
			ctx
		});

		return block;
	}

	// (145:12) {#each any as cat}
	function create_each_block_1$2(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 145, 14, 4476);
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
			source: "(145:12) {#each any as cat}",
			ctx
		});

		return block;
	}

	// (136:12) {#each all as cat}
	function create_each_block$4(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 136, 14, 4213);
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
			source: "(136:12) {#each all as cat}",
			ctx
		});

		return block;
	}

	// (152:10) {#if incomplete && grp==='color-contrast'}
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
			source: "(152:10) {#if incomplete && grp==='color-contrast'}",
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
		let div1;
		let h4;
		let t4;
		let p0;
		let t6;
		let p1;
		let b0;
		let t8;
		let t9;
		let t10;
		let p2;
		let b1;
		let t12;
		let t13;
		let t14;
		let a;
		let t15;
		let t16;
		let details;
		let summary;
		let b2;
		let t18;
		let t19;
		let t20;
		let t21;
		let div0;
		let pre;
		let code;
		let mounted;
		let dispose;
		let if_block0 = /*criterion1*/ ctx[5] && create_if_block_6(ctx);
		let each_value_2 = Object.entries(/*criterion2*/ ctx[6]);
		validate_each_argument(each_value_2);
		let each_blocks = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		let if_block1 = (/*all*/ ctx[0].length || /*any*/ ctx[1].length) && create_if_block$2(ctx);

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
				div1 = element("div");
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
				t9 = text(/*tgs*/ ctx[11]);
				t10 = space();
				p2 = element("p");
				b1 = element("b");
				b1.textContent = "criteria:";
				t12 = space();
				if (if_block0) if_block0.c();
				t13 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t14 = space();
				a = element("a");
				t15 = text(/*grp*/ ctx[12]);
				t16 = space();
				details = element("details");
				summary = element("summary");
				b2 = element("b");
				b2.textContent = "impact:";
				t18 = space();
				t19 = text(/*impact*/ ctx[8]);
				t20 = space();
				if (if_block1) if_block1.c();
				t21 = space();
				div0 = element("div");
				pre = element("pre");
				code = element("code");
				code.textContent = `${/*html*/ ctx[9]}`;
				set_style(path, "stroke", "none");
				set_style(path, "fill-rule", "nonzero");
				set_style(path, "fill", "rgb(0%,0%,0%)");
				set_style(path, "fill-opacity", "1");
				attr_dev(path, "d", "M 10.882812 4.027344 L 10.882812 0 L 1.730469 0 L 1.730469 12.269531 L 5.117188 12.269531 L 5.117188 16 L 14.269531 16 L 14.269531 7.417969 Z M 10.882812 5.464844 L 12.535156 7.117188 L 10.882812 7.117188 Z M 2.746094 11.253906 L 2.746094 1.015625 L 9.863281 1.015625 L 9.863281 3.730469 L 5.117188 3.730469 L 5.117188 11.253906 Z M 6.136719 14.984375 L 6.136719 4.746094 L 9.863281 4.746094 L 9.863281 8.136719 L 13.253906 8.136719 L 13.253906 14.984375 Z M 6.136719 14.984375 ");
				add_location(path, file$4, 108, 6, 2754);
				attr_dev(g, "id", "surface1");
				add_location(g, file$4, 107, 6, 2730);
				attr_dev(svg, "width", "16px");
				attr_dev(svg, "height", "16px");
				attr_dev(svg, "viewBox", "0 0 16 16");
				attr_dev(svg, "version", "1.1");
				add_location(svg, file$4, 106, 4, 2657);
				attr_dev(span0, "class", "icopied svelte-tj161o");
				add_location(span0, file$4, 111, 4, 3345);
				attr_dev(span1, "class", "icopy svelte-tj161o");
				add_location(span1, file$4, 105, 2, 2614);
				attr_dev(h4, "class", "svelte-tj161o");
				add_location(h4, file$4, 114, 4, 3437);
				attr_dev(p0, "class", "svelte-tj161o");
				add_location(p0, file$4, 115, 4, 3457);
				add_location(b0, file$4, 116, 17, 3495);
				attr_dev(p1, "class", "tgs svelte-tj161o");
				add_location(p1, file$4, 116, 4, 3482);
				add_location(b1, file$4, 118, 6, 3532);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*helpUrl*/ ctx[7]);
				add_location(a, file$4, 125, 6, 3855);
				attr_dev(p2, "class", "svelte-tj161o");
				add_location(p2, file$4, 117, 4, 3522);
				add_location(b2, file$4, 128, 15, 3970);
				attr_dev(summary, "class", "svelte-tj161o");
				add_location(summary, file$4, 128, 6, 3961);
				attr_dev(code, "class", "language-html svelte-tj161o");
				add_location(code, file$4, 158, 13, 4781);
				attr_dev(pre, "class", "svelte-tj161o");
				add_location(pre, file$4, 158, 8, 4776);
				attr_dev(div0, "class", "pre svelte-tj161o");
				add_location(div0, file$4, 157, 6, 4752);
				details.open = true;
				attr_dev(details, "class", "svelte-tj161o");
				add_location(details, file$4, 127, 4, 3940);
				attr_dev(div1, "class", "a11y-content");
				add_location(div1, file$4, 113, 2, 3406);
				attr_dev(div2, "class", "a11y-popup svelte-tj161o");
				attr_dev(div2, "style", /*style*/ ctx[2]);
				add_location(div2, file$4, 104, 0, 2579);
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
				append_dev(div2, div1);
				append_dev(div1, h4);
				append_dev(div1, t4);
				append_dev(div1, p0);
				append_dev(div1, t6);
				append_dev(div1, p1);
				append_dev(p1, b0);
				append_dev(p1, t8);
				append_dev(p1, t9);
				append_dev(div1, t10);
				append_dev(div1, p2);
				append_dev(p2, b1);
				append_dev(p2, t12);
				if (if_block0) if_block0.m(p2, null);
				append_dev(p2, t13);

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(p2, null);
				}

				append_dev(p2, t14);
				append_dev(p2, a);
				append_dev(a, t15);
				append_dev(div1, t16);
				append_dev(div1, details);
				append_dev(details, summary);
				append_dev(summary, b2);
				append_dev(summary, t18);
				append_dev(summary, t19);
				append_dev(details, t20);
				if (if_block1) if_block1.m(details, null);
				append_dev(details, t21);
				append_dev(details, div0);
				append_dev(div0, pre);
				append_dev(pre, code);

				if (!mounted) {
					dispose = listen_dev(span1, "click", copyto, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (/*criterion1*/ ctx[5]) if_block0.p(ctx, dirty);

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
							each_blocks[i].m(p2, t14);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_2.length;
				}

				if (/*all*/ ctx[0].length || /*any*/ ctx[1].length) {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block$2(ctx);
						if_block1.c();
						if_block1.m(details, t21);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty[0] & /*style*/ 4) {
					attr_dev(div2, "style", /*style*/ ctx[2]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(div2);
				if (if_block0) if_block0.d();
				destroy_each(each_blocks, detaching);
				if (if_block1) if_block1.d();
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
		const el = document.querySelector('.icopied');
		const text = document.querySelector('.a11y-content').innerHTML;

		setTimeout(
			() => {
				el.style = '';
			},
			3000
		);

		navigator.clipboard.writeText(text);
		el.style = 'display:block;';
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('A11yPopup', slots, []);
		let { node } = $$props;
		const rect = node.getBoundingClientRect();
		const { x, y } = document.body.getBoundingClientRect();
		const { top: t, left: l, height: h } = rect;
		let top = -y + t + h + 3;
		let left = -x + l - 5;
		let { description, incomplete, criterion1, criterion2, helpUrl, impact, html, all, any, help, tgs, grp, el } = node._axe_;
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

		setTimeout(
			() => {
				hljs.highlightAll();
			},
			0
		);

		const writable_props = ['node'];

		Object_1$1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<A11yPopup> was created with unknown prop '${key}'`);
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
			tgs,
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
			if ('tgs' in $$props) $$invalidate(11, tgs = $$props.tgs);
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
			tgs,
			grp,
			ratio,
			node
		];
	}

	class A11yPopup$1 extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { node: 14 }, null, [-1, -1]);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "A11yPopup",
				options,
				id: create_fragment$4.name
			});

			const { ctx } = this.$$;
			const props = options.props || {};

			if (/*node*/ ctx[14] === undefined && !('node' in props)) {
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

	/* ws-client/_svelte/Cspheader.svelte generated by Svelte v3.46.4 */
	const file$3 = "ws-client/_svelte/Cspheader.svelte";

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

	/* ws-client/_svelte/Hotkeys.svelte generated by Svelte v3.46.4 */

	const { console: console_1$1 } = globals;
	const file$2 = "ws-client/_svelte/Hotkeys.svelte";

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

	/* ws-client/_svelte/Json.svelte generated by Svelte v3.46.4 */

	const { Object: Object_1 } = globals;
	const file$1 = "ws-client/_svelte/Json.svelte";

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

	/* ws-client/_svelte/sqlite.svelte generated by Svelte v3.46.4 */

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfY2xpZW50L193c19wb3N0bWVzc2FnZS5qcyIsIl9jbGllbnQvX3dzX2NsaWVudC5qcyIsIl9jbGllbnQvX3dzX21zZy1wYXJzZXIuanMiLCJfY2xpZW50L193c19pbi1pZnJhbWUuanMiLCJfY2xpZW50L193c192ZW5kb3IuanMiLCJfY2xpZW50L193c19pbml0LXNvY2tldC5qcyIsIl9jbGllbnQvX3NjcmVlbnNob3QuanMiLCJfY2xpZW50L193c19uYW1lc3BhY2UuanMiLCJfY2xpZW50L193c19zY3JlZW5zaG90LmpzIiwiX2NsaWVudC9fa2V5Ym9hcmQuanMiLCJfY2xpZW50L193c19wbGF5LmpzIiwiX2NsaWVudC9fd3NfbG9jYXRpb24uanMiLCJfY2xpZW50L193c19kZWJvdW5jZS5qcyIsIl9jbGllbnQvX3dzX3JvdXRlLmpzIiwiX2NsaWVudC9fd3Nfb2JzZXJ2ZXIuanMiLCJfY2xpZW50L193c19nZW5lcmFsLmpzIiwiX2NsaWVudC9fd3NfY3NwLWVyci5qcyIsIl9jbGllbnQvX3dzX21hY3Jvcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwiX3N2ZWx0ZS9BMTF5UG9wdXAuc3ZlbHRlIiwiX3N2ZWx0ZS9Dc3BkaXJlY3RpdmUuanMiLCJfc3ZlbHRlL0NzcGhlYWRlci5zdmVsdGUiLCJfc3ZlbHRlL0hvdGtleXMuc3ZlbHRlIiwiLi4vbm9kZV9tb2R1bGVzL2pzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0L2luZGV4LmpzIiwiX3N2ZWx0ZS9Kc29uLnN2ZWx0ZSIsIl9zdmVsdGUvc3FsaXRlLnN2ZWx0ZSIsIl9zdmVsdGUvaW5kZXguanMiLCJfY2xpZW50L3dzLWNsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgPj4+IFBvc3RtZXNzYWdlOiAke2V2ZW50Lm9yaWdpbn0gPT4gaHR0cHM6Ly8ke2xvY2F0aW9uLmhvc3R9YCwgZXZlbnQuZGF0YSlcbiAgICB9XG4gIH1cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpXG59XG4iLCJjb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCB3aW5kb3dSZWZcbiAgcmV0dXJuIHtcbiAgICAvLyBleDogd3NfX2hlbHAoKVxuICAgIF9oZWxwICh7IGRhdGEgfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fcGluZyhcInRoZXJlXCIpXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxuICAgIF9vcGVuICh7IGRhdGEgfSkge1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSAnZGlyZWN0b3JpZXM9MCx0aXRsZWJhcj0wLHRvb2xiYXI9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCx3aWR0aD04MDAsaGVpZ2h0PTYwMCdcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcbiAgICAgIHdpbmRvd1JlZi5ibHVyKClcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcbiAgICBfc3R5bGUgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zdCB7IHEsIGNzcyB9ID0gZGF0YVxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxuICAgICAgICBub2RlID0+IChub2RlLnN0eWxlLmNzc1RleHQgPSBjc3MpXG4gICAgICApXG4gICAgfSxcbiAgICAvLyBleDogd3NfX1xuICAgIF9zYXZlVGFncyAoeyByb3V0ZXMsIF9fdGFnMSB9KSB7XG4gICAgICBpZiAoIWxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBVcGRhdGUgcm91dGVzJywgX2MpXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xuICAgICAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBfX3RhZzEgLy8jIF9fdGFnMSBpbi1zeW5jXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBleDogd3NfX1xuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cbiAgICAgIGNvbnNvbGUud2FybihgcmVjZWl2ZSBicm9kY2FzdCAke3R5cH1gKVxuICAgICAgLyoqXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcbiAgICAgICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAgICAgKi9cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgY29uc29sZS53YXJuKGZpbGVzW2Ake3R5cH1fZXZlbnRzYF1ba2V5XSArICcnKVxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcbiAgICAgIH1cbiAgICB9LFxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxuICAgIH1cbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnPy5pbmNsdWRlcygnVycpKSB7XG4gICAgaWYgKG1zZy5sZW5ndGggPiA0MCkge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKVxuICAgIH1cbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pXG4gIGlmIChhcnIpIHtcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgaWZybVxuICB0cnkge1xuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxuICB9IGNhdGNoIChlKSB7XG4gICAgaWZybSA9IHRydWVcbiAgfVxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IHZlbmRvciB9ID0gbmF2aWdhdG9yXG4gIGNvbnN0IGJyb3dzZXIgPSB7XG4gICAgJyc6ICdmaXJlZm94JyxcbiAgICAnR29vZ2xlIEluYy4nOiAnY2hyb21pdW0nLFxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXG4gIH1bdmVuZG9yXVxuICByZXR1cm4gYnJvd3NlclxufVxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fVxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXG4gIGNvbnN0IHtfX2FyZ3MsIF9fZmxhZ30gPSB3aW5kb3cubWl0bVxuXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxuICB9XG5cbiAgY29uc3Qgb25vcGVuID0gZGF0YSA9PiB7XG4gICAgZnVuY3Rpb24gd3Nfc2VuZCgpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xuICAgICAgICBjb25zdCBmbiA9IHdpbmRvdy5fd3NfY29ubmVjdFtrZXldXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxuICAgICAgICBmbihkYXRhKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxuICAgIH1cblxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxuICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gdHJ1ZVxuXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXG4gICAgICAgIHdzX3NlbmQoKVxuICAgICAgfVxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXG4gIH1cblxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IGNsb3NlIGNvbm5lY3Rpb24nLCBfYylcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChfX2ZsYWdbJ29uLW1lc3NhZ2UnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9uLW1lc3NhZ2U6JywgX2MsIGUuZGF0YSlcbiAgICB9XG4gICAgX3dzX21zZ1BhcnNlcihlLCBlLmRhdGEpXG4gIH1cbiAgXG4gIGNvbnN0IGNvbm5lY3QgPSBfX2FyZ3Mubm9zb2NrZXQ9PT11bmRlZmluZWRcbiAgaWYgKGNvbm5lY3QgfHwgKHdpbmRvdy5jaHJvbWUgJiYgY2hyb21lLnRhYnMpKSB7XG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcbiAgICBjb25zdCBwcmUgPSB2ZW5kb3IgPyAnd3MnIDogJ3dzcydcbiAgICBjb25zdCBwcnQgPSB2ZW5kb3IgPyAnMzAwMicgOiAnMzAwMSdcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcbiAgICBsZXQgd3NcbiAgICB0cnkge1xuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICAgIGNvbnNvbGUudGltZSgnd3MnKVxuICAgIHdpbmRvdy5fd3MgPSB3c1xuICBcbiAgICB3cy5vbm9wZW4gPSBvbm9wZW5cbiAgICB3cy5vbmNsb3NlID0gb25jbG9zZVxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXG4gIH1cbiAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXG4gIH1cbn1cbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShqc29uKVxuICAgICAgICB9XG4gICAgICAgIGZldGNoKCcvbWl0bS1wbGF5L3NjcmVuc2hvdC5qc29uJywgY29uZmlnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXNvbHZlKHJlc3BvbnNlLmpzb24oKSl9KVxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBqc29uLCByZXNvbHZlKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pICBcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICBsZXQgbmFtZXNwYWNlXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcbiAgICBpZiAoaG9zdC5tYXRjaCh0b1JlZ2V4KGtleS5yZXBsYWNlKC9+L2csICdbXi5dKicpKSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hbWVzcGFjZVxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBtaXRtICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF9zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmxldCBhY3RcbmZ1bmN0aW9uIHNjcmVlbnNob3QgKGUpIHtcbiAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XG4gICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gdW5kZWZpbmVkXG4gICAgICBjb25zb2xlLmxvZygnPj4+IGRlbGF5IGFjdGlvbicpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGFjdCkge1xuICAgICAgYWN0ID0gdW5kZWZpbmVkXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXG4gIGNvbnN0IHsgc2VsZWN0b3IgfSA9IHJvdXRlLnNjcmVlbnNob3RcblxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gIGNvbnN0IGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy9nLCAnficpXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcbiAgZm9yIChjb25zdCBlbCBvZiBhcnIpIHtcbiAgICBsZXQgbm9kZSA9IGUudGFyZ2V0XG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuICAgIH1cbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBicm93c2VyIH1cbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXG4gICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXG4gICAgICBpZiAobWl0bS5hcmd2LmxhenljbGljaykge1xuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgbWl0bS5sYXN0RXZlbnQgPSBlXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcbiAgICAgICAgICBpZiAoYWN0KSB7XG4gICAgICAgICAgICBhY3QuY2xpY2soKVxuICAgICAgICAgICAgYWN0ID0gdW5kZWZpbmVkXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBkZWxheSBhY3Rpb24gdW5kZWZpbmVkJywgX2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVsYXkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXRtLmxhc3RFdmVudCA9IGVcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudGNsaWNrKGUpIHtcbiAgbWl0bS5sYXN0RXZlbnQgPSBlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcbiAgICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNjcmVlbnNob3QpXG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudGNsaWNrKVxuICAgIH1cbiAgfSlcbn1cbiIsImNvbnN0IGtjb2RlMSA9IHtcbiAgQmFja3F1b3RlICAgOiAnYCcsXG4gIEJyYWNrZXRMZWZ0IDogJ1snLFxuICBCcmFja2V0UmlnaHQ6ICddJyxcbiAgQmFja3NsYXNoOiAnXFxcXCcsXG4gIENvbW1hICAgIDogJywnLFxuICBQZXJpb2QgICA6ICcuJyxcbiAgUXVvdGUgICAgOiBcIidcIixcbiAgU2VtaWNvbG9uOiAnOycsXG4gIFNsYXNoICAgIDogJy8nLFxuICBTcGFjZSAgICA6ICcgJyxcbiAgTWludXMgICAgOiAnLScsXG4gIEVxdWFsICAgIDogJz0nLFxufVxuXG5jb25zdCBrY29kZTIgPSB7XG4gIEJhY2txdW90ZSAgIDogJ34nLFxuICBCcmFja2V0TGVmdCA6ICd7JyxcbiAgQnJhY2tldFJpZ2h0OiAnfScsXG4gIEJhY2tzbGFzaDogJ3wnLFxuICBDb21tYSAgICA6ICc8JyxcbiAgUGVyaW9kICAgOiAnPicsXG4gIFF1b3RlICAgIDogJ1wiJyxcbiAgU2VtaWNvbG9uOiAnOicsXG4gIFNsYXNoICAgIDogJz8nLFxuICBTcGFjZSAgICA6ICcgJyxcbiAgTWludXMgICAgOiAnXycsXG4gIEVxdWFsICAgIDogJysnLFxufVxuXG5jb25zdCBrY29kZTMgPSB7XG4gIDE6ICchJyxcbiAgMjogJ0AnLFxuICAzOiAnIycsXG4gIDQ6ICckJyxcbiAgNTogJyUnLFxuICA2OiAnXicsXG4gIDc6ICcmJyxcbiAgODogJyonLFxuICA5OiAnKCcsXG4gIDEwOiAnKSdcbn1cblxuY29uc3Qga3Nob3cgPSB7XG4gIC4uLmtjb2RlMSxcbiAgRW50ZXI6ICdFbnRlcicsXG4gIENhcHNMb2NrOiAnQ2FwcycsXG4gIEJhY2tzcGFjZTogJ0JTJyxcbiAgRXNjYXBlOiAnRXNjJyxcbiAgRGlnaXQxOiAnMScsXG4gIERpZ2l0MjogJzInLFxuICBEaWdpdDM6ICczJyxcbiAgRGlnaXQ0OiAnNCcsXG4gIERpZ2l0NTogJzUnLFxuICBEaWdpdDY6ICc2JyxcbiAgRGlnaXQ3OiAnNycsXG4gIERpZ2l0ODogJzgnLFxuICBEaWdpdDk6ICc5JyxcbiAgRGlnaXQwOiAnMCcsXG4gIFRhYjogJ1RhYicsXG4gIEtleUE6ICdhJyxcbiAgS2V5QjogJ2InLFxuICBLZXlDOiAnYycsXG4gIEtleUQ6ICdkJyxcbiAgS2V5RTogJ2UnLFxuICBLZXlGOiAnZicsXG4gIEtleUc6ICdnJyxcbiAgS2V5SDogJ2gnLFxuICBLZXlJOiAnaScsXG4gIEtleUo6ICdqJyxcbiAgS2V5SzogJ2snLFxuICBLZXlMOiAnbCcsXG4gIEtleU06ICdtJyxcbiAgS2V5TjogJ24nLFxuICBLZXlPOiAnbycsXG4gIEtleVA6ICdwJyxcbiAgS2V5UTogJ3EnLFxuICBLZXlSOiAncicsXG4gIEtleVM6ICdzJyxcbiAgS2V5VDogJ3QnLFxuICBLZXlVOiAndScsXG4gIEtleVY6ICd2JyxcbiAgS2V5VzogJ3cnLFxuICBLZXlYOiAneCcsXG4gIEtleVk6ICd5JyxcbiAgS2V5WjogJ3onLFxuICBGMTogICdGMScsXG4gIEYyOiAgJ0YyJyxcbiAgRjM6ICAnRjMnLFxuICBGNDogICdGNCcsXG4gIEY1OiAgJ0Y1JyxcbiAgRjY6ICAnRjYnLFxuICBGNzogICdGNycsXG4gIEY4OiAgJ0Y4JyxcbiAgRjk6ICAnRjknLFxuICBGMTA6ICdGMTAnLFxuICBGMTE6ICdGMTEnLFxuICBGMTI6ICdGMTInLFxuICBFbmQ6ICdFbmQnLFxuICBIb21lOiAnSG9tZScsXG4gIEFycm93VXA6ICAgICfihpEnLFxuICBBcnJvd0Rvd246ICAn4oaTJyxcbiAgQXJyb3dMZWZ0OiAgJ+KGkCcsXG4gIEFycm93UmlnaHQ6ICfihpInLFxuICBEZWxldGU6ICAgJ0RlbCcsXG4gIFBhZ2VVcDogICAnUGdVcCcsXG4gIFBhZ2VEb3duOiAnUGdEbicsXG59XG5cbmZ1bmN0aW9uIGNvZGVUb0NoYXIoZXZuLCBvcHQ9e2NvZGVPbmx5OmZhbHNlfSkge1xuICBjb25zdCB7Y29kZSwgc2hpZnRLZXl9ID0gZXZuXG4gIGNvbnN0IHtjb2RlT25seX0gPSBvcHRcbiAgbGV0IG1hdGNoXG4gIGxldCBjaGFyID0gJydcbiAgbWF0Y2ggPSBjb2RlLm1hdGNoKC9LZXkoLikvKVxuICBpZiAobWF0Y2gpIHtcbiAgICBjaGFyID0gbWF0Y2gucG9wKClcbiAgICBpZiAoIWNvZGVPbmx5ICYmICFzaGlmdEtleSkge1xuICAgICAgY2hhciA9IGNoYXIudG9Mb3dlckNhc2UoKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtYXRjaCA9IGNvZGUubWF0Y2goLyhEaWdpdHxOdW1wYWQpKC4pLylcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNoYXIgPSBtYXRjaC5wb3AoKVxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xuICAgICAgICBjaGFyID0ga2NvZGUzW2NoYXJdXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghY29kZU9ubHkgJiYgc2hpZnRLZXkpIHtcbiAgICAgICAgY2hhciA9IGtjb2RlMltjb2RlXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhciA9IGtjb2RlMVtjb2RlXVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gY2hhclxufVxuXG5mdW5jdGlvbiBjb2RlVG9TaG93KGNvZGVzKSB7XG4gIHJldHVybiBjb2Rlcy5zcGxpdCgnOicpLm1hcCh4PT57XG4gICAgcmV0dXJuIGAke2tzaG93W3hdfWBcbiAgfSkuam9pbign4pynJylcbn1cblxud2luZG93Lm1pdG0uZm4uY29kZVRvQ2hhciA9IGNvZGVUb0NoYXJcbndpbmRvdy5taXRtLmZuLmNvZGVUb1Nob3cgPSBjb2RlVG9TaG93XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29kZVRvQ2hhcixcbiAga2NvZGUxLFxuICBrY29kZTIsXG4gIGtjb2RlMyxcbiAga3Nob3dcbn0iLCJjb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5mdW5jdGlvbiBfcG9zdChqc29uKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGpzb24pXG4gICAgICB9XG4gICAgICBmZXRjaCgnL21pdG0tcGxheS9wbGF5Lmpzb24nLCBjb25maWcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXNvbHZlKHJlc3BvbnNlLmpzb24oKSl9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSAgICApIHsgcmVzb2x2ZShkYXRhKSAgICAgICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gX3BsYXkoanNvbikge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCBqc29uLCByZXNvbHZlKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfVxuICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBwbGF5IChhdXRvZmlsbCkge1xuICBjb25zdCB7X19hcmdzfSA9IHdpbmRvdy5taXRtXG4gIGlmIChhdXRvZmlsbCkge1xuICAgIGlmICh0eXBlb2YgKGF1dG9maWxsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXG4gICAgfVxuICAgIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICBjb25zdCBfZnJhbWUgPSB3aW5kb3dbJ3hwbGF5LWZyYW1lJ11cbiAgICBjb25zdCBfanNvbiA9IHthdXRvZmlsbCwgYnJvd3NlciwgX3BhZ2UsIF9mcmFtZX1cbiAgICBjb25zdCBtc2cgPSBsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKVxuICAgIGNvbnNvbGUubG9nKGAlY01hY3JvczogJHttc2d9YCwgX2MpXG4gICAgbGV0IHJlc3VsdFxuICAgIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IF9wb3N0KF9qc29uKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCBfcGxheShfanNvbilcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmZ1bmN0aW9uIHNxbGl0ZSgpIHtcbiAgY29uc3QgW2NtZCwgcSwgdGJsXSA9IGFyZ3VtZW50c1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB7cX1cbiAgICAgIGlmICh0YmwpIHtcbiAgICAgICAgZGF0YS50YmwgPSB0YmxcbiAgICAgIH1cbiAgICAgIHdpbmRvdy53c19fc2VuZChjbWQsIGRhdGEsIHJlc29sdmUpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9XG4gIH0pXG59XG5cbndpbmRvdy5taXRtLmZuLnNxbExpc3QgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbExpc3QnLCBxLCB0YmwpXG53aW5kb3cubWl0bS5mbi5zcWxEZWwgID0gKHEsIHRibCkgPT4gc3FsaXRlKCdzcWxEZWwnICwgcSwgdGJsKVxud2luZG93Lm1pdG0uZm4uc3FsSW5zICA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsSW5zJyAsIHEsIHRibClcbndpbmRvdy5taXRtLmZuLnNxbFVwZCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbFVwZCcgLCBxLCB0YmwpXG5cbm1vZHVsZS5leHBvcnRzID0gcGxheVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCB7Y29kZVRvQ2hhcjpfa2V5fSA9IHJlcXVpcmUoJy4vX2tleWJvYXJkJylcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBwbGF5ID0gcmVxdWlyZSgnLi9fd3NfcGxheScpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcbmNvbnN0IHN0eWxlTGVmdCAgPSAnJ1xuY29uc3Qgc3R5bGVUb3BSICA9ICcnXG5jb25zdCBzdHlsZVJpZ2h0ID0gJydcbmNvbnN0IGJ1dHRvblN0eWxlPSAnJ1xuY29uc3Qgc3R5bGUgPSBgXG4ubWl0bS1hcHAge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7ICBcbn1cbi5taXRtLWNvbnRhaW5lciB7XG4gIHotaW5kZXg6IDk5OTk5O1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDE0cHg7XG59XG4ubWl0bS1jb250YWluZXIudG9wciAge3RvcDogIDBweDsgcmlnaHQ6IDNweDt9XG4ubWl0bS1jb250YWluZXIubGVmdCAge3RvcDogLTJweDsgbGVmdCA6IDNweDt9XG4ubWl0bS1jb250YWluZXIucmlnaHQge3RvcDogMTRweDsgcmlnaHQ6IDNweDt9XG4ubWl0bS1jb250YWluZXIuY2VudGVyIHtcbiAgYmFja2dyb3VuZDogI2ZjZmZkY2IwO1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIC8qIGNlbnRlciB0aGUgZWxlbWVudCAqL1xuICByaWdodDogMDtcbiAgbGVmdDogMDtcbiAgdG9wOiAyMHB4O1xuICBtYXJnaW4tcmlnaHQ6IGF1dG87XG4gIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAvKiBnaXZlIGl0IGRpbWVuc2lvbnMgKi9cbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XG4gIHBhZGRpbmc6IDVweCAxMHB4O1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2lkdGg6IDkwJTtcbiAgZGlzcGxheTogbm9uZTtcbn1cbi5taXRtLWJ0biB7XG4gIGNvbG9yOiBibGFjaztcbiAgYm9yZGVyOiBub25lO1xuICBmb250LXNpemU6IDhweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAxcHggNnB4O1xuICBib3JkZXItcmFkaXVzOiAzcHg7XG4gIGZvbnQtZmFtaWx5OiBtb25hY28sIENvbnNvbGFzLCBcIkx1Y2lkYSBDb25zb2xlXCIsIG1vbm9zcGFjZTtcbn1cbi5taXRtLWJ0bjpob3ZlcntcbiAgdGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtcbn1cbi5taXRtLWJ0bi5sZWZ0LFxuLm1pdG0tYnRuLnJpZ2h0IHtcbiAgZGlzcGxheTogYmxvY2s7XG59XG4ubWl0bS1idG4ucmlnaHQge1xuICBmbG9hdDogcmlnaHQ7XG4gIG1hcmdpbi10b3A6IDJweDtcbn1cbi5iZ3JvdXAtbGVmdCxcbi5iZ3JvdXAtcmlnaHQge1xuICBkaXNwbGF5OiB0YWJsZTtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLmJncm91cC1sZWZ0MiB7XG4gIGRpc3BsYXk6IHRhYmxlO1xuICBtYXJnaW4tdG9wOiAwO1xufVxuLmJncm91cC1sZWZ0PmRpdixcbi5iZ3JvdXAtbGVmdDI+ZGl2LFxuLmJncm91cC1yaWdodD5kaXYge1xuICBwYWRkaW5nLWJvdHRvbTogMnB4O1xufVxuLmJncm91cC10b3ByLFxuLmJncm91cC10b3ByIHNwYW4ge1xuICBmb250LXNpemU6IDE0cHg7XG59YFxuXG5sZXQgY29udGFpbmVyID0ge1xuICB0b3ByOiB7fSxcbiAgbGVmdDoge30sXG4gIHJpZ2h0OiB7fSxcbiAgdGFyZ2V0OiB7fSxcbn1cbmxldCBidXR0b24gPSB7fVxubGV0IGJncm91cCA9IHtcbiAgcmlnaHQ6IHt9LFxuICB0b3ByOiB7fSxcbiAgbGVmdDoge30sXG59XG5cbmZ1bmN0aW9uIHdhaXQobXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXG59O1xuXG5mdW5jdGlvbiB0b1JlZ2V4IChwYXRoTXNnKSB7XG4gIGxldCBbcGF0aCwgbXNnXSA9IHBhdGhNc2cuc3BsaXQoJz0+JykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpXG4gIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JylcbiAgcmV0dXJuIHsgcGF0aCwgbXNnIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIHBvcykge1xuICBmb3IgKGNvbnN0IGlkIGluIGJ1dHRvbnMpIHtcbiAgICBjb25zdCBbY2FwdGlvbiwgY29sb3IsIGtsYXNdID0gaWQuc3BsaXQoJ3wnKS5tYXAoeD0+eC50cmltKCkpXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICBjb25zdCBmbiAgPSBidXR0b25zW2lkXVxuICAgIGJ0bi5vbmNsaWNrID0gYXN5bmMgZSA9PiB7XG4gICAgICBsZXQgYXJyID0gZm4oZSlcbiAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIGFyciA9IGF3YWl0IGFyclxuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkge1xuICAgICAgICBhd2FpdCBwbGF5KGFycilcbiAgICAgIH1cbiAgICB9XG4gICAgYnRuLmlubmVyVGV4dCA9IGNhcHRpb25cbiAgICBidG4uY2xhc3NMaXN0LmFkZCgnbWl0bS1idG4nKVxuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGAke3Bvc31gKVxuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKGtsYXMgfHwgY2FwdGlvbilcbiAgICBidG4uc3R5bGUgPSBidXR0b25TdHlsZSArIChjb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbG9yfTtgIDogJycpXG4gICAgaWYgKHBvcz09PSd0b3ByJykge1xuICAgICAgY29uc3QgYnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgIGJyLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChicilcbiAgICAgIGJncm91cFtwb3NdLmFwcGVuZENoaWxkKGJ0bilcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChidG4pXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChkaXYpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldEJ1dHRvbnMgKGJ1dHRvbnMsIHBvc2l0aW9uKSB7XG4gIGlmIChiZ3JvdXBbcG9zaXRpb25dKSB7XG4gICAgYmdyb3VwW3Bvc2l0aW9uXS5pbm5lckhUTUwgPSAnJ1xuICAgIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3NpdGlvbilcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZhdWx0SG90S2V5cygpIHtcbiAgY29uc3Qge21pdG06IHtzdmVsdGU6IHtDc3BoZWFkZXIsIFNxbGl0ZX0sIGZufX0gPSB3aW5kb3dcbiAgY29uc3QgcXJ5ICA9ICcubWl0bS1jb250YWluZXIucG9wdXAnIFxuICBjb25zdCB3Y2FnMiA9IFtcbiAgICAnd2NhZzJhJyxcbiAgICAnd2NhZzJhYScsXG4gICAgJ3djYWcyMWEnLFxuICAgICd3Y2FnMjFhYScsXG4gIF1cbiAgY29uc3Qgd2NhZzMgPSBbXG4gICAgLy8gLi4ud2NhZzIsXG4gICAgJ3djYWcyYWFhJyxcbiAgICAnd2NhZzIxYWFhJyxcbiAgICAnYmVzdC1wcmFjdGljZScsXG4gIF1cbiAgY29uc3QgcnVsZXNPYmogPSB7XG4gICAgJ2NvbG9yLWNvbnRyYXN0JzogeyBlbmFibGVkOiB0cnVlIH0sXG4gIH1cbiAgY29uc3Qga2V5cyA9IHtcbiAgICAnY29kZTpLZXlDJyhfZSkge2ZuLnN2ZWx0ZShDc3BoZWFkZXIsICdMaWdodFBhc3RlbEdyZWVuJyl9LFxuICAgICdjb2RlOktleVEnKF9lKSB7Zm4uc3ZlbHRlKFNxbGl0ZSAgICwgJ0xpZ2h0UGFzdGVsR3JlZW4nKX0sXG4gICAgJ2tleTp5eXknICAoX2UpIHtmbi5heGVydW4od2NhZzMsIHJ1bGVzT2JqICAgICAgICAgICAgICApfSxcbiAgICAna2V5Onl5JyAgIChfZSkge2ZuLmF4ZXJ1bih3Y2FnMiAgICAgICAgICAgICAgICAgICAgICAgICl9LFxuICAgICdrZXk6eScgICAgKF9lKSB7Zm4uYXhlcnVuKCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX0sXG4gICAgJ2tleTpjJyAgICAoX2UpIHtkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHFyeSkuaW5uZXJUZXh0PScnfSxcbiAgfVxuICBrZXlzWydjb2RlOktleUMnXS5fdGl0bGUgPSAnU2hvdyBDU1AgSGVhZGVyJ1xuICBrZXlzWydjb2RlOktleVEnXS5fdGl0bGUgPSAnU2hvdyBTcWxpdGUnXG4gIGtleXNbJ2tleTp5eXknICBdLl90aXRsZSA9ICdFeGVjcyBhMTF5IHN0cmljdCdcbiAga2V5c1sna2V5Onl5JyAgIF0uX3RpdGxlID0gJ0V4ZWNzIGExMXkgd2NhZzphYSdcbiAga2V5c1sna2V5OnknICAgIF0uX3RpdGxlID0gJ0V4ZWNzIGExMXkgY2hlY2snXG4gIGtleXNbJ2tleTpjJyAgICBdLl90aXRsZSA9ICdDbGVhciBhMTF5IHJlc3VsdCdcbiAgbWl0bS5tYWNyb2tleXMgPSBrZXlzXG59XG5cbmxldCBkZWJ1bmtcbmxldCBpbnRlcnZJZFxubGV0IG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXG5cbmFzeW5jIGZ1bmN0aW9uIHVybENoYW5nZSAoZXZlbnQpIHtcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IHttaXRtfSA9IHdpbmRvd1xuICBjb25zdCB7Zm59ICAgPSBtaXRtXG4gIFxuICBpZiAobWl0bS5hcmd2LmExMXkgJiYgZm4uYXhlcnVuKSB7XG4gICAgZm4uYXhlcnVuKClcbiAgfVxuXG4gIGNsZWFySW50ZXJ2YWwoaW50ZXJ2SWQpXG4gIGlmIChtaXRtLmF1dG9pbnRlcnZhbCkge2RlbGV0ZSBtaXRtLmF1dG9pbnRlcnZhbH1cbiAgaWYgKG1pdG0uYXV0b2ZpbGwpICAgICB7ZGVsZXRlIG1pdG0uYXV0b2ZpbGwgICAgfVxuICBpZiAobWl0bS5hdXRvYnV0dG9ucykgIHtkZWxldGUgbWl0bS5hdXRvYnV0dG9ucyB9XG4gIGlmIChtaXRtLmxlZnRidXR0b25zKSAge2RlbGV0ZSBtaXRtLmxlZnRidXR0b25zIH1cbiAgaWYgKG1pdG0ucmlnaHRidXR0b25zKSB7ZGVsZXRlIG1pdG0ucmlnaHRidXR0b25zfVxuICBpZiAobWl0bS5tYWNyb2tleXMpICAgIHtkZWZhdWx0SG90S2V5cygpICAgICAgICB9XG5cbiAgaWYgKG5hbWVzcGFjZSkge1xuICAgIGNvbnN0IHtocmVmLCBvcmlnaW59ID0gbG9jYXRpb25cbiAgICBjb25zdCBfaHJlZiA9IGhyZWYucmVwbGFjZShvcmlnaW4sICcnKVxuICAgIG9ic2VydmVyZm4gPSBbXVxuICAgIGxldCBub25lID0gdHJ1ZVxuICAgIGZvciAoY29uc3Qga2V5IGluIG1pdG0ubWFjcm9zKSB7XG4gICAgICBjb25zdCB7IHBhdGgsIG1zZyB9ID0gdG9SZWdleChrZXkpXG4gICAgICBpZiAoX2hyZWYubWF0Y2gocGF0aCkpIHtcbiAgICAgICAgbm9uZSA9IGZhbHNlXG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBtc2cgfHwgJ0VudHJ5J1xuICAgICAgICBsZXQgZm5zID0gbWl0bS5tYWNyb3Nba2V5XSgpXG4gICAgICAgIGlmIChmbnMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgZm5zID0gYXdhaXQgZm5zXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvYnNlcnZlcmZuLnB1c2goZm5zKVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZm5zKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgZm4yIG9mIGZucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmbjIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgb2JzZXJ2ZXJmbi5wdXNoKGZuMilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZGVidW5rICYmIGNsZWFyVGltZW91dChkZWJ1bmspXG4gICAgICAgIGRlYnVuayA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIG9uY2VzID0ge30gLy8gZmVhdDogb25ldGltZSBmbiBjYWxsXG4gICAgICAgICAgZGVidW5rID0gdW5kZWZpbmVkXG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYXV0b2J1dHRvbnMsXG4gICAgICAgICAgICByaWdodGJ1dHRvbnMsXG4gICAgICAgICAgICBsZWZ0YnV0dG9ucyxcbiAgICAgICAgICAgIGxlZnQyYnV0dG9uc1xuICAgICAgICAgIH0gPSB3aW5kb3cubWl0bVxuICAgICAgICAgIGlmICh3aW5kb3cubWl0bS5hdXRvZmlsbCkge1xuICAgICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XG4gICAgICAgICAgICAgIC4uLmF1dG9idXR0b25zLFxuICAgICAgICAgICAgICAnRW50cnknKCkge1xuICAgICAgICAgICAgICAgIGxldCB7YXV0b2ZpbGx9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF1dG9maWxsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICBhdXRvZmlsbCA9IGF1dG9maWxsKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGxheShhdXRvZmlsbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgJ3RvcHInKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodCcpXG4gICAgICAgICAgbGVmdDJidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdDJidXR0b25zLCAnbGVmdDInKVxuICAgICAgICAgIGxlZnRidXR0b25zICAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zICwgJ2xlZnQnIClcbiAgICAgICAgfSwgMClcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vbmUpIHtcbiAgICAgIHNldEJ1dHRvbnMoe30sICdyaWdodCcpXG4gICAgICBzZXRCdXR0b25zKHt9LCAnbGVmdCcpXG4gICAgICBzZXRCdXR0b25zKHt9LCAndG9wcicpXG4gICAgICBjb25zdCB7bGVmdDJidXR0b25zfSA9IHdpbmRvdy5taXRtXG4gICAgICBsZWZ0MmJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhsZWZ0MmJ1dHRvbnMsICdsZWZ0MicpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNldEJ1dHRvbnMoe30sICdyaWdodCcpXG4gICAgc2V0QnV0dG9ucyh7fSwgJ2xlZnQnKVxuICAgIHNldEJ1dHRvbnMoe30sICd0b3ByJylcbiAgICBjb25zdCB7bGVmdDJidXR0b25zfSA9IHdpbmRvdy5taXRtXG4gICAgbGVmdDJidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdDJidXR0b25zLCAnbGVmdDInKVxuICB9XG4gIGNvbnRhaW5lci5yaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcbiAgY29udGFpbmVyLnRvcHIuc3R5bGUgID0gc3R5bGVUb3BSXG4gIGNvbnRhaW5lci5sZWZ0LnN0eWxlICA9IHN0eWxlTGVmdFxuICBjb25zdCB2aXNpYmxlID0gKHdpbmRvdy5taXRtLmF1dG9maWxsKVxuICBidXR0b24uc3R5bGUgPSBidXR0b25TdHlsZSArICh2aXNpYmxlID8gJ2JhY2tncm91bmQtY29sb3I6IGF6dXJlOycgOiAnZGlzcGxheTogbm9uZTsnKVxuICBpZiAodHlwZW9mICh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaW50ZXJ2SWQgPSBzZXRJbnRlcnZhbCh3aW5kb3cubWl0bS5hdXRvaW50ZXJ2YWwsIDUwMClcbiAgfVxuICBjdHJsID0gZmFsc2Vcbn1cblxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjb21wYXJlSHJlZik7XG53aW5kb3cub2JzZXJ2ZXIgPSBvYnNlcnZlclxuZnVuY3Rpb24gb2JzZXJ2ZWQoKSB7XG4gIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZVxuICB9KVxufVxuXG5jb25zdCBfdXJsQ2hhbmdlZCA9IG5ldyBFdmVudCgndXJsY2hhbmdlZCcpXG5mdW5jdGlvbiBpbml0KCkge1xuICBjb25zdCBib2R5ICAgICA9IGRvY3VtZW50LmJvZHlcbiAgY29uc3QgZGl2eCAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdlJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZUb3BSICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgZGl2TGVmdCAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdlBvcHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZDZW50ZXI9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgaHRtbCAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJyApXG4gIGNvbnN0IHN0eWxlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICBjb25zdCBodG1scmVmICA9IGh0bWwuZmlyc3RFbGVtZW50Q2hpbGRcbiAgY29uc3QgZGl2eHJlZiAgPSBkaXZ4LmZpcnN0RWxlbWVudENoaWxkXG4gIGNvbnN0IGJvZHlyZWYgID0gYm9keS5maXJzdEVsZW1lbnRDaGlsZFxuICBkaXZSaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcbiAgZGl2VG9wUiAuc3R5bGUgPSBzdHlsZVRvcFJcbiAgZGl2TGVmdCAuc3R5bGUgPSBzdHlsZUxlZnRcblxuICBzdHlsZUJ0biAuaW5uZXJIVE1MID0gc3R5bGVcbiAgc3R5bGVCdG4gLmNsYXNzTmFtZSA9ICdtaXRtLWNsYXNzJ1xuICBkaXZSaWdodCAuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXJpZ2h0XCI+PC9zcGFuPmBcbiAgZGl2VG9wUiAgLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC10b3ByXCI+PC9zcGFuPmBcbiAgZGl2TGVmdCAgLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1sZWZ0XCI+PC9zcGFuPjxzcGFuIGNsYXNzPVwiYmdyb3VwLWxlZnQyXCI+PC9zcGFuPmBcbiAgZGl2eCAgICAgLmNsYXNzTmFtZSA9ICdtaXRtLWFwcCdcbiAgZGl2TGVmdCAgLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciBsZWZ0J1xuICBkaXZUb3BSICAuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIHRvcHInXG4gIGRpdlJpZ2h0IC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcmlnaHQnXG4gIGRpdlBvcHVwIC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcG9wdXAnXG4gIGRpdkNlbnRlci5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgY2VudGVyJ1xuICBodG1sLmluc2VydEJlZm9yZShkaXZ4ICAgICAsIGh0bWxyZWYpXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKHN0eWxlQnRuICwgaHRtbHJlZilcbiAgZGl2eC5pbnNlcnRCZWZvcmUoZGl2UmlnaHQgLCBkaXZ4cmVmKVxuICBkaXZ4Lmluc2VydEJlZm9yZShkaXZUb3BSICAsIGRpdnhyZWYpXG4gIGRpdnguaW5zZXJ0QmVmb3JlKGRpdkxlZnQgICwgZGl2eHJlZilcbiAgZGl2eC5pbnNlcnRCZWZvcmUoZGl2Q2VudGVyLCBkaXZ4cmVmKVxuICBib2R5Lmluc2VydEJlZm9yZShkaXZQb3B1cCAsIGJvZHlyZWYpXG4gIC8vIGJvZHkuYXBwZW5kQ2hpbGQgKGRpdlBvcHVwKVxuICBjb25zdCBob3RrZXkgPSBuZXcgbWl0bS5zdmVsdGUuSG90a2V5cyh7dGFyZ2V0OmRpdkNlbnRlcn0pXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbnRhaW5lci50b3ByID0gZGl2VG9wUlxuICAgIGNvbnRhaW5lci5sZWZ0ID0gZGl2TGVmdFxuICAgIGNvbnRhaW5lci5yaWdodD0gZGl2UmlnaHRcbiAgICBjb250YWluZXIuaG90a2V5ID0gaG90a2V5XG4gICAgY29udGFpbmVyLnBvcHVwICA9IGRpdlBvcHVwXG4gICAgY29udGFpbmVyLnRhcmdldCA9IGRpdkNlbnRlclxuICAgIGNvbnRhaW5lci5ub2Rla2V5PSBkaXZDZW50ZXIuY2hpbGRyZW5bMF1cbiAgICBidXR0b24uc3R5bGUgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXG4gICAgYmdyb3VwLnJpZ2h0ID0gZGl2UmlnaHQuY2hpbGRyZW5bMF1cbiAgICBiZ3JvdXAudG9wciAgPSBkaXZUb3BSIC5jaGlsZHJlblswXVxuICAgIGJncm91cC5sZWZ0ICA9IGRpdkxlZnQgLmNoaWxkcmVuWzBdXG4gICAgYmdyb3VwLmxlZnQyID0gZGl2TGVmdCAuY2hpbGRyZW5bMV1cbiAgICB1cmxDaGFuZ2UoX3VybENoYW5nZWQpXG4gICAgb2JzZXJ2ZWQoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGNvbnN0IGVsID0gZXZlbnQudGFyZ2V0XG4gICAgICBpZiAoY2VudGVyICYmICFkaXZDZW50ZXIuY29udGFpbnMoZWwpKSB7XG4gICAgICAgIGRpdkNlbnRlci5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxuICAgICAgICBjZW50ZXIgPSBmYWxzZVxuICAgICAgfSBlbHNle1xuICAgICAgICBjb25zdCBhMTF5UG9wdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYTExeS1wb3B1cCcpXG4gICAgICAgIGlmIChhMTF5UG9wdXAgJiYgIWVsLmNsb3Nlc3QoJy5hMTF5LXBvcHVwJykpIHtcbiAgICAgICAgICBhMTF5UG9wdXAucmVtb3ZlKClcbiAgICAgICAgfVxuICAgICAgfSBcbiAgICB9KTtcbiAgfSwgMClcbn1cblxuZnVuY3Rpb24gbWFjcm9BdXRvbWF0aW9uKG1hY3JvKSB7XG4gIGlmIChjZW50ZXIpIHtcbiAgICBjb250YWluZXIudGFyZ2V0LmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKCdzdHlsZScpXG4gICAgY2VudGVyID0gZmFsc2VcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShtYWNybykpIHtcbiAgICBsZXQgbWFjcm9JbmRleCA9IDBcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGxldCBzZWxlY3RvciA9IG1hY3JvW21hY3JvSW5kZXhdXG4gICAgICBpZiAoc2VsZWN0b3IubWF0Y2goL14gKls9LV0+LykpIHtcbiAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IENzc1NlbGVjdG9yR2VuZXJhdG9yLmdldENzc1NlbGVjdG9yKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG4gICAgICAgIHNlbGVjdG9yID0gYCR7YWN0aXZlRWxlbWVudH0gJHtzZWxlY3Rvcn1gXG4gICAgICB9XG4gICAgICBwbGF5KFtzZWxlY3Rvcl0pXG5cbiAgICAgIG1hY3JvSW5kZXggKz0gMVxuICAgICAgaWYgKG1hY3JvSW5kZXggPj0gbWFjcm8ubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXG4gICAgICB9XG4gICAgfSwgMTAwKVxuICB9XG59XG5cbmxldCBzdGREYmwgPSBbXVxubGV0IGhnaERibCA9IFtdXG5sZXQgc3RkQ3RsID0gW11cbmxldCBoZ2hDdGwgPSBbXVxubGV0IHN0ZEFsdCA9IFtdXG5sZXQgaGdoQWx0ID0gW11cbmxldCBzYXZlS2V5ID0gJydcbmNvbnN0IGtkZWxheSA9IDEwMDBcblxubGV0IGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG5mdW5jdGlvbiBtYWNyb0RibCgpIHtcbiAgY29uc3Qga2V5MSA9IGBrZXk6JHtzdGREYmwuam9pbignJyl9YFxuICBjb25zdCBrZXkyID0gYGNvZGU6JHtoZ2hEYmwuam9pbignOicpfWBcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXG5cbiAgc3RkRGJsID0gW11cbiAgaGdoRGJsID0gW11cbiAgc2F2ZUtleSA9ICcnXG4gIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiBjdHJsICsgYWx0ICArICAke2tleTF9ICB8ICAke2tleTJ9YCwgX2MpXG4gIGlmIChtYWNybykge1xuICAgIG1hY3JvID0gbWFjcm8oZSlcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5sZXQgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcbmZ1bmN0aW9uIG1hY3JvQ3RsKCkge1xuICBjb25zdCBrZXkxID0gYGtleTo8JHtzdGRDdGwuam9pbignJyl9PmBcbiAgY29uc3Qga2V5MiA9IGBjb2RlOjwke2hnaEN0bC5qb2luKCc6Jyl9PmBcbiAgY29uc3QgeyBtYWNyb2tleXMsIGxhc3RLZXk6IGUgfSA9IHdpbmRvdy5taXRtXG5cbiAgc3RkQ3RsID0gW11cbiAgaGdoQ3RsID0gW11cbiAgc2F2ZUtleSA9ICcnXG4gIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXG4gIGxldCBtYWNybyA9IG1hY3Jva2V5c1trZXkxXSB8fCBtYWNyb2tleXNba2V5Ml1cbiAgY29uc29sZS5sb2coYCVjTWFjcm9zOiAuLi4uICsgY3RybCArICR7a2V5MX0gfCAke2tleTJ9YCwgJ2NvbG9yOiAjYmFlYWYxJylcbiAgaWYgKG1hY3JvKSB7XG4gICAgbWFjcm8gPSBtYWNybyhlKVxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmxldCBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuZnVuY3Rpb24gbWFjcm9BbHQoKSB7XG4gIGNvbnN0IGtleTEgPSBga2V5Onske3N0ZEFsdC5qb2luKCcnKX19YFxuICBjb25zdCBrZXkyID0gYGNvZGU6eyR7aGdoQWx0LmpvaW4oJzonKX19YFxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cblxuICBzdGRBbHQgPSBbXVxuICBoZ2hBbHQgPSBbXVxuICBzYXZlS2V5ID0gJydcbiAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBhbHQgICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWRhZjEnKVxuICBpZiAobWFjcm8pIHtcbiAgICBtYWNybyA9IG1hY3JvKGUpXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5YlVwIChlKSB7XG4gIGlmICghZS5hbHRLZXkpIHtcbiAgICBpZiAoZGVib3VuY2VEYmwgfHwgKGRlYm91bmNlQ3RsICYmICFlLmN0cmxLZXkpIHx8IGRlYm91bmNlQWx0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VEYmwpXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXG4gICAgICBpZiAoZGVib3VuY2VEYmwpIHtcbiAgICAgICAgbWFjcm9EYmwoKVxuICAgICAgfSBlbHNlIFxuICAgICAgaWYgKGRlYm91bmNlQ3RsKSB7XG4gICAgICAgIG1hY3JvQ3RsKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hY3JvQWx0KClcbiAgICAgIH1cbiAgICAgIGRlYm91bmNlRGJsID0gdW5kZWZpbmVkXG4gICAgICBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxuICAgICAgZGVib3VuY2VBbHQgPSB1bmRlZmluZWRcbiAgICB9XG4gIH1cbn1cbnZhciBjdHJsID0gZmFsc2VcbnZhciBjZW50ZXIgPSBmYWxzZVxuZnVuY3Rpb24ga2V5YkN0cmwgKGUpIHtcbiAgaWYgKCFlLmNvZGUgfHwgWydBbHQnLCAnQ29udHJvbCcsICdNZXRhJ10uaW5jbHVkZXMoZS5rZXkpKSB7XG4gICAgcmV0dXJuXG4gIH0gZWxzZSB7XG4gICAgaWYgKGUua2V5PT09J1NoaWZ0Jykge1xuICAgICAgaWYgKGUuY3RybEtleSAmJiAhZS5hbHRLZXkpIHtcbiAgICAgICAgY29uc3Qge25vZGVrZXksIHRhcmdldCwgcmlnaHQsIHRvcHIsIGxlZnR9ID0gY29udGFpbmVyXG4gICAgICAgIGlmIChlLmNvZGU9PT0nU2hpZnRSaWdodCcpIHtcbiAgICAgICAgICBjdHJsID0gIWN0cmxcbiAgICAgICAgICByaWdodC5zdHlsZSA9IHN0eWxlUmlnaHQrICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICAgICAgICB0b3ByLnN0eWxlICA9IHN0eWxlVG9wUiArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JylcbiAgICAgICAgICBsZWZ0LnN0eWxlICA9IHN0eWxlTGVmdCArICghY3RybCA/ICcnIDogJ2Rpc3BsYXk6IG5vbmU7JykgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0YXJnZXQuY2hpbGRyZW5bMF0hPT1ub2Rla2V5KSB7XG4gICAgICAgICAgICB0YXJnZXQucmVwbGFjZUNoaWxkcmVuKG5vZGVrZXkpXG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUgPSAnZGlzcGxheTogYmxvY2s7J1xuICAgICAgICAgICAgY2VudGVyID0gdHJ1ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZW50ZXIgPSAhY2VudGVyXG4gICAgICAgICAgICBpZiAoY2VudGVyKSB7XG4gICAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXQuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcbiAgICAgICAgICAgIH0gIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgY2hhciA9IF9rZXkoZSlcbiAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5hbHRLZXkpIHtcbiAgICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgICBjaGFyID0gX2tleShlLCB7Y29kZU9ubHk6IHRydWV9KVxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VDdGwpXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICAgIHNhdmVLZXkgKz0gY2hhclxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9IFxuICAgICAgICBzdGREYmwucHVzaChjaGFyKVxuICAgICAgICBoZ2hEYmwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgICAgZGVib3VuY2VEYmwgPSBzZXRUaW1lb3V0KG1hY3JvRGJsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuY3RybEtleSkge1xuICAgICAgICBzdGRDdGwucHVzaChjaGFyKVxuICAgICAgICBoZ2hDdGwucHVzaChlLmNvZGUpXG4gICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgICAgZGVib3VuY2VDdGwgPSBzZXRUaW1lb3V0KG1hY3JvQ3RsLCBrZGVsYXkpXG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIHN0ZEFsdC5wdXNoKGNoYXIpXG4gICAgICAgIGhnaEFsdC5wdXNoKGUuY29kZSlcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQWx0KVxuICAgICAgICBkZWJvdW5jZUFsdCA9IHNldFRpbWVvdXQobWFjcm9BbHQsIGtkZWxheSlcbiAgICAgIH1cbiAgICAgIGUuX2tleXMgPSBzYXZlS2V5XG4gICAgICBtaXRtLmxhc3RLZXkgPSBlICAgICAgICBcbiAgICB9IFxuICB9XG59XG5cbmNvbnN0IHtsb2NhdGlvbn0gPSBkb2N1bWVudFxubGV0IG9sZEhyZWYgPSBsb2NhdGlvbi5ocmVmXG5sZXQgb0RlYnVuayA9IHVuZGVmaW5lZFxubGV0IG9ic2VydmVyZm4gPSBbXVxuXG5mdW5jdGlvbiBjb21wYXJlSHJlZihub2Rlcykge1xuICAvLyBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IERPTSBtdXRhdGVkIWAsIF9jKVxuICBpZiAob2xkSHJlZiAhPSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQoX3VybENoYW5nZWQpXG4gICAgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcbiAgfSBlbHNlIHtcbiAgICBpZiAob2JzZXJ2ZXJmbi5sZW5ndGgpIHtcbiAgICAgIG9EZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KG9EZWJ1bmspXG4gICAgICBvRGVidW5rID0gc2V0VGltZW91dCgoKT0+IHtcbiAgICAgICAgb0RlYnVuayA9IHVuZGVmaW5lZFxuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIG9ic2VydmVyZm4pIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZm4ubmFtZVxuICAgICAgICAgIGlmIChuYW1lICYmIG5hbWUubWF0Y2goL09uY2UkLykpIHtcbiAgICAgICAgICAgIGlmIChvbmNlc1tuYW1lXSkgeyAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9uY2VzW25hbWVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmbihub2RlcylcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7YXV0b2J1dHRvbnMsIHJpZ2h0YnV0dG9ucywgbGVmdGJ1dHRvbnN9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgcmlnaHRidXR0b25zICYmIHNldEJ1dHRvbnMocmlnaHRidXR0b25zLCAncmlnaHQnKVxuICAgICAgICBsZWZ0YnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnRidXR0b25zLCAnbGVmdCcpXG4gICAgICAgIGNvbnN0IHsgYXV0b2ZpbGwgfSA9IHdpbmRvdy5taXRtXG4gICAgICAgIGlmIChhdXRvZmlsbCkge1xuICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoe1xuICAgICAgICAgICAgLi4uYXV0b2J1dHRvbnMsXG4gICAgICAgICAgICAnRW50cnknKCkge3BsYXkoYXV0b2ZpbGwpfVxuICAgICAgICAgIH0sICd0b3ByJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKGF1dG9idXR0b25zLCAndG9wcicpXG4gICAgICAgIH1cblxuICAgICAgfSwgMTAwKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB3c0xvY2F0aW9uKCkge1xuICBjb25zdCB2ZW5kb3IgPSBfd3NfdmVuZG9yKClcbiAgaWYgKFsnZmlyZWZveCcsICd3ZWJraXQnXS5pbmNsdWRlcyh2ZW5kb3IpIHx8IChjaHJvbWUgJiYgIWNocm9tZS50YWJzKSkge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5YkN0cmwpXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5YlVwKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1cmxjaGFuZ2VkJywgdXJsQ2hhbmdlKVxuICAgIGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdsb2FkaW5nJykge1xuICAgICAgaW5pdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQpXG4gICAgfSAgICBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IGZuID0gaGlzdG9yeS5wdXNoU3RhdGVcbiAgaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm4uYXBwbHkoaGlzdG9yeSwgYXJndW1lbnRzKVxuICAgIGNvbXBhcmVIcmVmKClcbiAgfVxufVxuXG5jb25zdCBwYXN0ZWwgPSB7XG4gIFBvc3RJdDogICAgICAgICAgJyNmY2ZmZGNkNicsXG4gIFBhc3RlbEdyZWVuOiAgICAgJyM3N2RkNzdkNicsXG4gIFBhc3RlbEJyb3duOiAgICAgJyM4MzY5NTNkNicsXG4gIEJhYnlCbHVlOiAgICAgICAgJyM4OWNmZjBkNicsXG4gIFBhc3RlbFR1cnF1b2lzZTogJyM5OWM1YzRkNicsXG4gIEJsdWVHcmVlblBhc3RlbDogJyM5YWRlZGJkNicsXG4gIFBlcnNpYW5QYXN0ZWw6ICAgJyNhYTk0OTlkNicsXG4gIE1hZ2ljTWludDogICAgICAgJyNhYWYwZDFkNicsXG4gIExpZ2h0UGFzdGVsR3JlZW46JyNiMmZiYTVkNicsXG4gIFBhc3RlbFB1cnBsZTogICAgJyNiMzllYjVkNicsXG4gIFBhc3RlbExpbGFjOiAgICAgJyNiZGIwZDBkNicsXG4gIFBhc3RlbFBlYTogICAgICAgJyNiZWU3YTVkNicsXG4gIExpZ2h0TGltZTogICAgICAgJyNiZWZkNzNkNicsXG4gIExpZ2h0UGVyaXdpbmtsZTogJyNjMWM2ZmNkNicsXG4gIFBhbGVNYXV2ZTogICAgICAgJyNjNmE0YTRkNicsXG4gIExpZ2h0TGlnaHRHcmVlbjogJyNjOGZmYjBkNicsXG4gIFBhc3RlbFZpb2xldDogICAgJyNjYjk5YzlkNicsXG4gIFBhc3RlbE1pbnQ6ICAgICAgJyNjZWYwY2NkNicsXG4gIFBhc3RlbEdyZXk6ICAgICAgJyNjZmNmYzRkNicsXG4gIFBhbGVCbHVlOiAgICAgICAgJyNkNmZmZmVkNicsXG4gIFBhc3RlbExhdmVuZGVyOiAgJyNkOGExYzRkNicsXG4gIFBhc3RlbFBpbms6ICAgICAgJyNkZWE1YTRkNicsXG4gIFBhc3RlbFNtaXJrOiAgICAgJyNkZWVjZTFkNicsXG4gIFBhc3RlbERheTogICAgICAgJyNkZmQ4ZTFkNicsXG4gIFBhc3RlbFBhcmNobWVudDogJyNlNWQ5ZDNkNicsXG4gIFBhc3RlbFJvc2VUYW46ICAgJyNlOWQxYmZkNicsXG4gIFBhc3RlbE1hZ2VudGE6ICAgJyNmNDlhYzJkNicsXG4gIEVsZWN0cmljTGF2ZW5kZXI6JyNmNGJmZmZkNicsXG4gIFBhc3RlbFllbGxvdzogICAgJyNmZGZkOTZkNicsXG4gIFBhc3RlbFJlZDogICAgICAgJyNmZjY5NjFkNicsXG4gIFBhc3RlbE9yYW5nZTogICAgJyNmZjk2NGZkNicsXG4gIEFtZXJpY2FuUGluazogICAgJyNmZjk4OTlkNicsXG4gIEJhYnlQaW5rOiAgICAgICAgJyNmZmI3Y2VkNicsXG4gIEJhYnlQdXJwbGU6ICAgICAgJyNjYTliZjdkNicsXG59XG5cbmZ1bmN0aW9uIHN2ZWx0ZShTdmVsdCwgYmc9J1Bvc3RJdCcpIHsgLy8gZmVhdDogc3ZlbHRlIHJlbGF0ZWRcbiAgY29uc3Qge3RhcmdldCwgcG9wdXB9ID0gY29udGFpbmVyXG4gIHRhcmdldC5yZXBsYWNlQ2hpbGRyZW4oJycpXG4gIC8vIHBvcHVwIC5yZXBsYWNlQ2hpbGRyZW4oJycpXG4gIGlmICh0eXBlb2YoYmcpIT09J3N0cmluZycgJiYgYmcucG9wdXApIHtcbiAgICBjb25zdCBwcm9wcyA9IHtub2RlOiBiZy5ub2RlfVxuICAgIHdpbmRvdy5taXRtLnNhcHAgPSBuZXcgU3ZlbHQoe3RhcmdldDogcG9wdXAsIHByb3BzfSlcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cubWl0bS5zYXBwID0gbmV3IFN2ZWx0KHt0YXJnZXR9KVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgYmNvbG9yID0gcGFzdGVsW2JnXVxuICAgICAgdGFyZ2V0LnN0eWxlID0gYGRpc3BsYXk6IGJsb2NrJHtiY29sb3IgPyAnO2JhY2tncm91bmQ6JytiY29sb3IgOiAnJ307YFxuICAgICAgY2VudGVyID0gdHJ1ZVxuICAgIH0sIDApICBcbiAgfVxufVxuXG5mdW5jdGlvbiBob3RLZXlzKG9iaikge1xuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxuICAgIC4uLm9ialxuICB9XG59XG5cbndpbmRvdy5taXRtLmZuLm1hY3JvQXV0b21hdGlvbiA9IG1hY3JvQXV0b21hdGlvblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IGhvdEtleXNcbndpbmRvdy5taXRtLmZuLnN2ZWx0ZSA9IHN2ZWx0ZVxud2luZG93Lm1pdG0uZm4ucGxheSA9IHBsYXlcbndpbmRvdy5taXRtLmZuLndhaXQgPSB3YWl0XG5cbm1vZHVsZS5leHBvcnRzID0gd3NMb2NhdGlvblxuIiwiZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBkZWxheSA9IDUwMCkge1xuICBsZXQgX3RpbWVvdXRcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzXG4gICAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KVxuICAgIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmbi5hcHBseShfdGhpcywgYXJncylcbiAgICB9LCBkZWxheSlcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBsZXQgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbbmFtZXNwYWNlXVxuICBpZiAocm91dGUpIHtcbiAgICBjb25zdCB7X3N1Ym5zOiBzfSA9IHJvdXRlLl9jaGlsZG5zXG4gICAgaWYgKHMgJiYgbWl0bS5yb3V0ZXNbc10pIHtcbiAgICAgIHJvdXRlPSBtaXRtLnJvdXRlc1tzXVxuICAgIH0gIFxuICB9XG4gIHJldHVybiByb3V0ZVxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBNdXRhdGlvbk9ic2VydmVyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF9zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c19kZWJvdW5jZSA9IHJlcXVpcmUoJy4vX3dzX2RlYm91bmNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX3dzX3JvdXRlID0gcmVxdWlyZSgnLi9fd3Nfcm91dGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgaWYgKGxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxuICBjb25zdCBzc2hvdCA9IHt9XG4gIGNvbnN0IG5vZGVzID0ge31cblxuICBsZXQgcm91dGUgPSBfd3Nfcm91dGUoKVxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgIGNvbnN0IHsgb2JzZXJ2ZXI6IG9iIH0gPSByb3V0ZS5zY3JlZW5zaG90XG4gICAgZm9yIChjb25zdCBpZCBpbiBvYikge1xuICAgICAgbGV0IGVsID0ge31cbiAgICAgIGlmIChvYltpZF0gPT09IHRydWUpIHtcbiAgICAgICAgZWwgPSB7XG4gICAgICAgICAgdGl0bGU6ICdub3RpdGxlJyxcbiAgICAgICAgICBpbnNlcnQ6IHRydWUsXG4gICAgICAgICAgcmVtb3ZlOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gaWYgKHR5cGVvZiBvYltpZF0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVsID0ge1xuICAgICAgICAgIHRpdGxlOiAnbm9jYXB0dXJlJyxcbiAgICAgICAgICBpbnNlcnQ6IGZhbHNlLFxuICAgICAgICAgIHJlbW92ZTogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYXJyID0gb2JbaWRdLnNwbGl0KCc6JylcbiAgICAgICAgYXJyWzFdLnNwbGl0KCcsJykubWFwKGUgPT4ge1xuICAgICAgICAgIGVsW2VdID0gdHJ1ZVxuICAgICAgICB9KVxuICAgICAgICBlbC50aXRsZSA9IGFyclswXVxuICAgICAgfVxuICAgICAgc3Nob3RbaWRdID0gZWxcbiAgICAgIG5vZGVzW2lkXSA9IHtcbiAgICAgICAgaW5zZXJ0OiBmYWxzZSxcbiAgICAgICAgcmVtb3ZlOiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IG9iXG4gIGxldCBmbmFtZVxuICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgY29uc3QgYnJvd3NlciA9IF93c192ZW5kb3IoKVxuICBjb25zdCBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgICAgb2IgPSByb3V0ZS5zY3JlZW5zaG90Lm9ic2VydmVyXG4gICAgfVxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICBmb3IgKGNvbnN0IGlkIGluIG5vZGVzKSB7XG4gICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvckFsbChpZClcbiAgICAgIGlmIChlbC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFub2Rlc1tpZF0uaW5zZXJ0KSB7XG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IHRydWVcbiAgICAgICAgICBpZiAobm9kZXNbaWRdLnJlbW92ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9iICYmIHR5cGVvZiBvYltpZF09PT0nZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCBub2QgPSBlbFswXSB8fCBlbFxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ9PT11bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgbm9kLl93c19jb3VudCA9IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZC5fd3NfY291bnQgKz0gMVxuICAgICAgICAgICAgaWYgKG5vZC5fd3NfY291bnQ8Mikge1xuICAgICAgICAgICAgICBvYltpZF0obm9kKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5pbnNlcnQpIHtcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxuICAgICAgICAgICAgZm5hbWUgPSBgfiR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1pbnNlcnRgXG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH1cbiAgICAgICAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghbm9kZXNbaWRdLnJlbW92ZSkge1xuICAgICAgICAgIG5vZGVzW2lkXS5yZW1vdmUgPSB0cnVlXG4gICAgICAgICAgbm9kZXNbaWRdLmluc2VydCA9IGZhbHNlXG4gICAgICAgICAgaWYgKHNzaG90W2lkXS5yZW1vdmUpIHtcbiAgICAgICAgICAgIGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy0nKVxuICAgICAgICAgICAgZm5hbWUgPSBgfiR7Zm5hbWV9LSR7c3Nob3RbaWRdLnRpdGxlfS1yZW1vdmVgXG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7IG5hbWVzcGFjZSwgX3BhZ2UsIGhvc3QsIGZuYW1lLCBicm93c2VyIH1cbiAgICAgICAgICAgIF9zY3JlZW5zaG90KHBhcmFtcylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgIGNvbnN0IHtvYnNlcnZlcjogb2J9ID0gcm91dGUuc2NyZWVuc2hvdFxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBhdHRyaWJ1dGVzOiBvYiA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWVcbiAgICB9XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoX3dzX2RlYm91bmNlKGNhbGxiYWNrLCAyODApKVxuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCBvcHRpb25zKVxuICAgIH0pXG4gIH1cbn1cbiIsImNvbnN0IHQ2NCA9ICdXYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpoJ1xuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmNvbnN0IG5hbm9pZCA9IChzaXplID0gOCkgPT4ge1xuICBsZXQgaWQgPSAnJ1xuICB3aGlsZSAoc2l6ZS0tID4gMCkge1xuICAgIGlkICs9IHQ2NFtNYXRoLnJhbmRvbSgpICogNjQgfCAwXVxuICB9XG4gIHJldHVybiBpZFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgeyBfd3MgfSA9IHdpbmRvd1xuXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19zdHlsZXtcImRhdGFcIjp7XCJxXCI6XCIqXCIsXCJjc3NcIjpcImNvbG9yOmJsdWU7XCJ9fScpXG4gIC8vIGV4OiB3c19icm9hZGNhc3QoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcbiAgd2luZG93LndzX2Jyb2FkY2FzdCA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XG4gICAgX3dzLnNlbmQoYGJyb2FkY2FzdCR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxuICAvLyBleDogd3NfZW1pdHBhZ2UoJ19waW5ne1wiZGF0YVwiOlwiSGkhXCJ9JylcbiAgd2luZG93LndzX2VtaXRwYWdlID0gKGpzb24sIHJlZ2V4ID0gJycpID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIHJlZ2V4IH1cbiAgICBfd3Muc2VuZChgZW1pdHBhZ2Uke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19fc3R5bGUoe1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifSlcbiAgd2luZG93LndzX19zdHlsZSA9IChqc29uLCBfYWxsID0gdHJ1ZSkgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiwgX2FsbCB9XG4gICAgX3dzLnNlbmQoYF9zdHlsZSR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19waW5nKCdIaSEnKVxuICB3aW5kb3cud3NfX3BpbmcgPSAoanNvbikgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XG4gICAgX3dzLnNlbmQoYF9waW5nJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX2hlbHAoKVxuICB3aW5kb3cud3NfX2hlbHAgPSAoKSA9PiB7XG4gICAgX3dzLnNlbmQoJ19oZWxwe30nKVxuICB9XG5cbiAgLy8gZXg6IHdzX19vcGVuKHt1cmw6J2h0dHBzOi8vZ29vZ2xlLmNvbSd9KVxuICB3aW5kb3cud3NfX29wZW4gPSAoanNvbikgPT4ge1xuICAgIGNvbnN0IG1zZyA9IHsgZGF0YToganNvbiB9XG4gICAgX3dzLnNlbmQoYF9vcGVuJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICB3aW5kb3cud3NfX3NlbmQgPSAoY21kLCBkYXRhLCBoYW5kbGVyKSA9PiB7XG4gICAgY29uc3QgeyBfX2ZsYWcgfSA9IHdpbmRvdy5taXRtXG4gICAgY29uc3QgaWQgPSBuYW5vaWQoKVxuICAgIGNvbnN0IGtleSA9IGAke2NtZH06JHtpZH1gXG4gICAgd2luZG93Ll93c19xdWV1ZVtrZXldID0gaGFuZGxlciB8fCAodyA9PiB7fSlcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHdpbmRvdy5fd3NfcXVldWVba2V5XSkge1xuICAgICAgICBkZWxldGUgd2luZG93Ll93c19xdWV1ZVtrZXldXG4gICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiB3cyB0aW1lb3V0IScsIF9jLCBrZXkpXG4gICAgICB9XG4gICAgfSwgNTAwMClcbiAgICBcbiAgICBjb25zdCBwYXJhbXMgPSBgJHtrZXl9JHtKU09OLnN0cmluZ2lmeSh7IGRhdGEgfSl9YFxuICAgIGNvbnN0IGZsYWcgPSB3aW5kb3cubWl0bS5fX2ZsYWdbJ3dzLW1lc3NhZ2UnXVxuICAgIGlmIChmbGFnID4gMSkge1xuICAgICAgY29uc29sZS5sb2coYF93cy5zZW5kOiAke3BhcmFtc31gKVxuICAgIH1cbiAgICBfd3Muc2VuZChwYXJhbXMpXG4gIH1cbiAgY29uc3Qgd3NydW4gPSB7fVxuICBjb25zdCBhcnIgPSB3aW5kb3cubWl0bS53c3J1blxuICBmb3IgKGNvbnN0IGsgb2YgYXJyKSB7XG4gICAgY29uc3QgY21kICA9IGsucmVwbGFjZSgnJCcsICcnKVxuICAgIHdzcnVuW2NtZF0gPSAoZGF0YSwgaGFuZGxlcikgPT4gd2luZG93LndzX19zZW5kKGNtZCwgZGF0YSwgaGFuZGxlcilcbiAgfVxuICB3aW5kb3cubWl0bS53c3J1biA9IHdzcnVuXG59XG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXG5cbmxldCBfdGltZW91dFxubGV0IF9jc3AgPSB7fVxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IGNzcEVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICAgIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICAgIGNvbnN0IHBhdGggPSBsb2NhdGlvbi5wYXRobmFtZVxuICAgICAgLnJlcGxhY2UoL15cXC8vLCAnJylcbiAgICAgIC5yZXBsYWNlKC9cXC8vZywgJy0nKVxuICAgIGNvbnN0IHtcbiAgICAgIGJsb2NrZWRVUkksXG4gICAgICBkaXNwb3NpdGlvbixcbiAgICAgIGRvY3VtZW50VVJJLFxuICAgICAgZWZmZWN0aXZlRGlyZWN0aXZlLFxuICAgICAgb3JpZ2luYWxQb2xpY3ksXG4gICAgICB0aW1lU3RhbXAsXG4gICAgICB0eXBlLFxuICAgICAgdmlvbGF0ZWREaXJlY3RpdmVcbiAgICB9ID0gZVxuICAgIGNvbnN0IHR5cCA9IGBbJHtkaXNwb3NpdGlvbn1dICR7ZG9jdW1lbnRVUkl9YFxuICAgIGlmICghX2NzcFt0eXBdKSB7XG4gICAgICBfY3NwW3R5cF0gPSB7fVxuICAgIH1cbiAgICBpZiAoIV9jc3BbdHlwXS5fZ2VuZXJhbF8pIHtcbiAgICAgIF9jc3BbdHlwXS5fZ2VuZXJhbF8gPSB7XG4gICAgICAgIHBvbGljeTogb3JpZ2luYWxQb2xpY3ksXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgaG9zdCxcbiAgICAgICAgcGF0aFxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBfZG9jID0gX2NzcFt0eXBdXG4gICAgaWYgKCFfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXSkge1xuICAgICAgX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0gPSB7fVxuICAgIH1cblxuICAgIGNvbnN0IF9lcnIgPSBfZG9jW3Zpb2xhdGVkRGlyZWN0aXZlXVxuICAgIGlmICghX2VycltibG9ja2VkVVJJXSkge1xuICAgICAgX2VycltibG9ja2VkVVJJXSA9IHt9XG4gICAgfVxuICAgIGNvbnN0IF9tYXRjaCA9IG9yaWdpbmFsUG9saWN5Lm1hdGNoKGAke3Zpb2xhdGVkRGlyZWN0aXZlfSBbXjtdKztgKVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IF9tYXRjaCA/IF9tYXRjaFswXSA6IGVmZmVjdGl2ZURpcmVjdGl2ZVxuICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7XG4gICAgICBkaXJlY3RpdmUsXG4gICAgICB0aW1lU3RhbXAsXG4gICAgICB0eXBlXG4gICAgfVxuICAgIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dClcbiAgICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJz4+PiBDU1A6JywgX2NzcClcbiAgICAgIC8vIHdpbmRvdy53c19fc2VuZCgnY3NwX2Vycm9yJywge1xuICAgICAgLy8gICBuYW1lc3BhY2UsXG4gICAgICAvLyAgIGhvc3QsXG4gICAgICAvLyAgIHBhdGgsXG4gICAgICAvLyAgIF9jc3AsXG4gICAgICAvLyB9KTtcbiAgICAgIF9jc3AgPSB7fVxuICAgIH0sIDQwMDApXG4gIH1cblxuICBpZiAod2luZG93Lm1pdG0uY2xpZW50LmNzcCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlY3VyaXR5cG9saWN5dmlvbGF0aW9uJywgY3NwRXJyb3IpXG4gIH1cbn1cbi8vIGRpc3Bvc2l0aW9uOiBcInJlcG9ydFwiXG4vLyBkb2N1bWVudFVSSTogXCJodHRwczovL3doYXQvaHRtbC9jb250YWluL2NzcFwiXG4vLyB2aW9sYXRlZERpcmVjdGl2ZTogXCJpbWctc3JjXCJcblxuLy8gYmxvY2tlZFVSSTogXCJodHRwczovL3doYXQvdXJsL2dldHRpbmcvYmxvY2tlZFwiXG4vLyBlZmZlY3RpdmVEaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG4vLyBvcmlnaW5hbFBvbGljeTogXCJzY3JpcHQtc3JjIG51bGw7IGZyYW1lLXNyYyBudWxsOyBzdHlsZS1zcmMgbnVsbDsgc3R5bGUtc3JjLWVsZW0gbnVsbDsgaW1nLXNyYyBudWxsO1wiXG4vLyB0aW1lU3RhbXA6IDE5MzMuODIwMDAwMDA1NjUzMVxuLy8gdHlwZTogXCJzZWN1cml0eXBvbGljeXZpb2xhdGlvblwiXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHdpbmRvdy5fd3NfY29ubmVjdD09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG4gIH1cbiAgXG4gIHdpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXG4gICAgfSwgMTAwMClcbiAgfVxuICBcbiAgd2luZG93Lm1pdG0uZm4uZ2V0Q29va2llID0gbmFtZSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBgOyAke2RvY3VtZW50LmNvb2tpZX1gO1xuICAgIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQoYDsgJHtuYW1lfT1gKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAyKSByZXR1cm4gcGFydHMucG9wKCkuc3BsaXQoJzsnKS5zaGlmdCgpO1xuICB9XG5cbiAgY29uc3Qgb25Nb3VudCA9IGUgPT4gY29uc29sZS5sb2coJyVjTWFjcm9zOiBleGVjdXRlZCBhZnRlciB3cyBvcGVuJywgJ2NvbG9yOiAjNWFkYTU1JywgZSlcbiAgd2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBvbk1vdW50XG59XG4iLCJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5sZXQgc3JjX3VybF9lcXVhbF9hbmNob3I7XG5mdW5jdGlvbiBzcmNfdXJsX2VxdWFsKGVsZW1lbnRfc3JjLCB1cmwpIHtcbiAgICBpZiAoIXNyY191cmxfZXF1YWxfYW5jaG9yKSB7XG4gICAgICAgIHNyY191cmxfZXF1YWxfYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIH1cbiAgICBzcmNfdXJsX2VxdWFsX2FuY2hvci5ocmVmID0gdXJsO1xuICAgIHJldHVybiBlbGVtZW50X3NyYyA9PT0gc3JjX3VybF9lcXVhbF9hbmNob3IuaHJlZjtcbn1cbmZ1bmN0aW9uIG5vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5mdW5jdGlvbiBpc19lbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuICAgIGlmIChzdG9yZSAhPSBudWxsICYmIHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICgkJHNjb3BlLmRpcnR5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBsZXRzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGV0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90X2Jhc2Uoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIHNsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGlmIChzbG90X2NoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jb250ZXh0ID0gZ2V0X3Nsb3RfY29udGV4dChzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG4gICAgICAgIHNsb3QucChzbG90X2NvbnRleHQsIHNsb3RfY2hhbmdlcyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdXBkYXRlX3Nsb3Qoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGRpcnR5LCBnZXRfc2xvdF9jaGFuZ2VzX2ZuLCBnZXRfc2xvdF9jb250ZXh0X2ZuKSB7XG4gICAgY29uc3Qgc2xvdF9jaGFuZ2VzID0gZ2V0X3Nsb3RfY2hhbmdlcyhzbG90X2RlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBnZXRfc2xvdF9jaGFuZ2VzX2ZuKTtcbiAgICB1cGRhdGVfc2xvdF9iYXNlKHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBzbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHRfZm4pO1xufVxuZnVuY3Rpb24gZ2V0X2FsbF9kaXJ0eV9mcm9tX3Njb3BlKCQkc2NvcGUpIHtcbiAgICBpZiAoJCRzY29wZS5jdHgubGVuZ3RoID4gMzIpIHtcbiAgICAgICAgY29uc3QgZGlydHkgPSBbXTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gJCRzY29wZS5jdHgubGVuZ3RoIC8gMzI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRpcnR5W2ldID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfcmVzdF9wcm9wcyhwcm9wcywga2V5cykge1xuICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICBrZXlzID0gbmV3IFNldChrZXlzKTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmICgha2V5cy5oYXMoaykgJiYga1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9zbG90cyhzbG90cykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHNsb3RzKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBUcmFjayB3aGljaCBub2RlcyBhcmUgY2xhaW1lZCBkdXJpbmcgaHlkcmF0aW9uLiBVbmNsYWltZWQgbm9kZXMgY2FuIHRoZW4gYmUgcmVtb3ZlZCBmcm9tIHRoZSBET01cbi8vIGF0IHRoZSBlbmQgb2YgaHlkcmF0aW9uIHdpdGhvdXQgdG91Y2hpbmcgdGhlIHJlbWFpbmluZyBub2Rlcy5cbmxldCBpc19oeWRyYXRpbmcgPSBmYWxzZTtcbmZ1bmN0aW9uIHN0YXJ0X2h5ZHJhdGluZygpIHtcbiAgICBpc19oeWRyYXRpbmcgPSB0cnVlO1xufVxuZnVuY3Rpb24gZW5kX2h5ZHJhdGluZygpIHtcbiAgICBpc19oeWRyYXRpbmcgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHVwcGVyX2JvdW5kKGxvdywgaGlnaCwga2V5LCB2YWx1ZSkge1xuICAgIC8vIFJldHVybiBmaXJzdCBpbmRleCBvZiB2YWx1ZSBsYXJnZXIgdGhhbiBpbnB1dCB2YWx1ZSBpbiB0aGUgcmFuZ2UgW2xvdywgaGlnaClcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgICBjb25zdCBtaWQgPSBsb3cgKyAoKGhpZ2ggLSBsb3cpID4+IDEpO1xuICAgICAgICBpZiAoa2V5KG1pZCkgPD0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxvdyA9IG1pZCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBoaWdoID0gbWlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG59XG5mdW5jdGlvbiBpbml0X2h5ZHJhdGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC5oeWRyYXRlX2luaXQpXG4gICAgICAgIHJldHVybjtcbiAgICB0YXJnZXQuaHlkcmF0ZV9pbml0ID0gdHJ1ZTtcbiAgICAvLyBXZSBrbm93IHRoYXQgYWxsIGNoaWxkcmVuIGhhdmUgY2xhaW1fb3JkZXIgdmFsdWVzIHNpbmNlIHRoZSB1bmNsYWltZWQgaGF2ZSBiZWVuIGRldGFjaGVkIGlmIHRhcmdldCBpcyBub3QgPGhlYWQ+XG4gICAgbGV0IGNoaWxkcmVuID0gdGFyZ2V0LmNoaWxkTm9kZXM7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIDxoZWFkPiwgdGhlcmUgbWF5IGJlIGNoaWxkcmVuIHdpdGhvdXQgY2xhaW1fb3JkZXJcbiAgICBpZiAodGFyZ2V0Lm5vZGVOYW1lID09PSAnSEVBRCcpIHtcbiAgICAgICAgY29uc3QgbXlDaGlsZHJlbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAobm9kZS5jbGFpbV9vcmRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbXlDaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNoaWxkcmVuID0gbXlDaGlsZHJlbjtcbiAgICB9XG4gICAgLypcbiAgICAqIFJlb3JkZXIgY2xhaW1lZCBjaGlsZHJlbiBvcHRpbWFsbHkuXG4gICAgKiBXZSBjYW4gcmVvcmRlciBjbGFpbWVkIGNoaWxkcmVuIG9wdGltYWxseSBieSBmaW5kaW5nIHRoZSBsb25nZXN0IHN1YnNlcXVlbmNlIG9mXG4gICAgKiBub2RlcyB0aGF0IGFyZSBhbHJlYWR5IGNsYWltZWQgaW4gb3JkZXIgYW5kIG9ubHkgbW92aW5nIHRoZSByZXN0LiBUaGUgbG9uZ2VzdFxuICAgICogc3Vic2VxdWVuY2Ugc3Vic2VxdWVuY2Ugb2Ygbm9kZXMgdGhhdCBhcmUgY2xhaW1lZCBpbiBvcmRlciBjYW4gYmUgZm91bmQgYnlcbiAgICAqIGNvbXB1dGluZyB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIC5jbGFpbV9vcmRlciB2YWx1ZXMuXG4gICAgKlxuICAgICogVGhpcyBhbGdvcml0aG0gaXMgb3B0aW1hbCBpbiBnZW5lcmF0aW5nIHRoZSBsZWFzdCBhbW91bnQgb2YgcmVvcmRlciBvcGVyYXRpb25zXG4gICAgKiBwb3NzaWJsZS5cbiAgICAqXG4gICAgKiBQcm9vZjpcbiAgICAqIFdlIGtub3cgdGhhdCwgZ2l2ZW4gYSBzZXQgb2YgcmVvcmRlcmluZyBvcGVyYXRpb25zLCB0aGUgbm9kZXMgdGhhdCBkbyBub3QgbW92ZVxuICAgICogYWx3YXlzIGZvcm0gYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSwgc2luY2UgdGhleSBkbyBub3QgbW92ZSBhbW9uZyBlYWNoIG90aGVyXG4gICAgKiBtZWFuaW5nIHRoYXQgdGhleSBtdXN0IGJlIGFscmVhZHkgb3JkZXJlZCBhbW9uZyBlYWNoIG90aGVyLiBUaHVzLCB0aGUgbWF4aW1hbFxuICAgICogc2V0IG9mIG5vZGVzIHRoYXQgZG8gbm90IG1vdmUgZm9ybSBhIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZS5cbiAgICAqL1xuICAgIC8vIENvbXB1dGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgLy8gbTogc3Vic2VxdWVuY2UgbGVuZ3RoIGogPT4gaW5kZXggayBvZiBzbWFsbGVzdCB2YWx1ZSB0aGF0IGVuZHMgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBsZW5ndGggalxuICAgIGNvbnN0IG0gPSBuZXcgSW50MzJBcnJheShjaGlsZHJlbi5sZW5ndGggKyAxKTtcbiAgICAvLyBQcmVkZWNlc3NvciBpbmRpY2VzICsgMVxuICAgIGNvbnN0IHAgPSBuZXcgSW50MzJBcnJheShjaGlsZHJlbi5sZW5ndGgpO1xuICAgIG1bMF0gPSAtMTtcbiAgICBsZXQgbG9uZ2VzdCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gY2hpbGRyZW5baV0uY2xhaW1fb3JkZXI7XG4gICAgICAgIC8vIEZpbmQgdGhlIGxhcmdlc3Qgc3Vic2VxdWVuY2UgbGVuZ3RoIHN1Y2ggdGhhdCBpdCBlbmRzIGluIGEgdmFsdWUgbGVzcyB0aGFuIG91ciBjdXJyZW50IHZhbHVlXG4gICAgICAgIC8vIHVwcGVyX2JvdW5kIHJldHVybnMgZmlyc3QgZ3JlYXRlciB2YWx1ZSwgc28gd2Ugc3VidHJhY3Qgb25lXG4gICAgICAgIC8vIHdpdGggZmFzdCBwYXRoIGZvciB3aGVuIHdlIGFyZSBvbiB0aGUgY3VycmVudCBsb25nZXN0IHN1YnNlcXVlbmNlXG4gICAgICAgIGNvbnN0IHNlcUxlbiA9ICgobG9uZ2VzdCA+IDAgJiYgY2hpbGRyZW5bbVtsb25nZXN0XV0uY2xhaW1fb3JkZXIgPD0gY3VycmVudCkgPyBsb25nZXN0ICsgMSA6IHVwcGVyX2JvdW5kKDEsIGxvbmdlc3QsIGlkeCA9PiBjaGlsZHJlblttW2lkeF1dLmNsYWltX29yZGVyLCBjdXJyZW50KSkgLSAxO1xuICAgICAgICBwW2ldID0gbVtzZXFMZW5dICsgMTtcbiAgICAgICAgY29uc3QgbmV3TGVuID0gc2VxTGVuICsgMTtcbiAgICAgICAgLy8gV2UgY2FuIGd1YXJhbnRlZSB0aGF0IGN1cnJlbnQgaXMgdGhlIHNtYWxsZXN0IHZhbHVlLiBPdGhlcndpc2UsIHdlIHdvdWxkIGhhdmUgZ2VuZXJhdGVkIGEgbG9uZ2VyIHNlcXVlbmNlLlxuICAgICAgICBtW25ld0xlbl0gPSBpO1xuICAgICAgICBsb25nZXN0ID0gTWF0aC5tYXgobmV3TGVuLCBsb25nZXN0KTtcbiAgICB9XG4gICAgLy8gVGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBub2RlcyAoaW5pdGlhbGx5IHJldmVyc2VkKVxuICAgIGNvbnN0IGxpcyA9IFtdO1xuICAgIC8vIFRoZSByZXN0IG9mIHRoZSBub2Rlcywgbm9kZXMgdGhhdCB3aWxsIGJlIG1vdmVkXG4gICAgY29uc3QgdG9Nb3ZlID0gW107XG4gICAgbGV0IGxhc3QgPSBjaGlsZHJlbi5sZW5ndGggLSAxO1xuICAgIGZvciAobGV0IGN1ciA9IG1bbG9uZ2VzdF0gKyAxOyBjdXIgIT0gMDsgY3VyID0gcFtjdXIgLSAxXSkge1xuICAgICAgICBsaXMucHVzaChjaGlsZHJlbltjdXIgLSAxXSk7XG4gICAgICAgIGZvciAoOyBsYXN0ID49IGN1cjsgbGFzdC0tKSB7XG4gICAgICAgICAgICB0b01vdmUucHVzaChjaGlsZHJlbltsYXN0XSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdC0tO1xuICAgIH1cbiAgICBmb3IgKDsgbGFzdCA+PSAwOyBsYXN0LS0pIHtcbiAgICAgICAgdG9Nb3ZlLnB1c2goY2hpbGRyZW5bbGFzdF0pO1xuICAgIH1cbiAgICBsaXMucmV2ZXJzZSgpO1xuICAgIC8vIFdlIHNvcnQgdGhlIG5vZGVzIGJlaW5nIG1vdmVkIHRvIGd1YXJhbnRlZSB0aGF0IHRoZWlyIGluc2VydGlvbiBvcmRlciBtYXRjaGVzIHRoZSBjbGFpbSBvcmRlclxuICAgIHRvTW92ZS5zb3J0KChhLCBiKSA9PiBhLmNsYWltX29yZGVyIC0gYi5jbGFpbV9vcmRlcik7XG4gICAgLy8gRmluYWxseSwgd2UgbW92ZSB0aGUgbm9kZXNcbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCB0b01vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd2hpbGUgKGogPCBsaXMubGVuZ3RoICYmIHRvTW92ZVtpXS5jbGFpbV9vcmRlciA+PSBsaXNbal0uY2xhaW1fb3JkZXIpIHtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbmNob3IgPSBqIDwgbGlzLmxlbmd0aCA/IGxpc1tqXSA6IG51bGw7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUodG9Nb3ZlW2ldLCBhbmNob3IpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfc3R5bGVzKHRhcmdldCwgc3R5bGVfc2hlZXRfaWQsIHN0eWxlcykge1xuICAgIGNvbnN0IGFwcGVuZF9zdHlsZXNfdG8gPSBnZXRfcm9vdF9mb3Jfc3R5bGUodGFyZ2V0KTtcbiAgICBpZiAoIWFwcGVuZF9zdHlsZXNfdG8uZ2V0RWxlbWVudEJ5SWQoc3R5bGVfc2hlZXRfaWQpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSBzdHlsZV9zaGVldF9pZDtcbiAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBzdHlsZXM7XG4gICAgICAgIGFwcGVuZF9zdHlsZXNoZWV0KGFwcGVuZF9zdHlsZXNfdG8sIHN0eWxlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfcm9vdF9mb3Jfc3R5bGUobm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgIGNvbnN0IHJvb3QgPSBub2RlLmdldFJvb3ROb2RlID8gbm9kZS5nZXRSb290Tm9kZSgpIDogbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGlmIChyb290ICYmIHJvb3QuaG9zdCkge1xuICAgICAgICByZXR1cm4gcm9vdDtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudDtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0KG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZV9lbGVtZW50ID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICBhcHBlbmRfc3R5bGVzaGVldChnZXRfcm9vdF9mb3Jfc3R5bGUobm9kZSksIHN0eWxlX2VsZW1lbnQpO1xuICAgIHJldHVybiBzdHlsZV9lbGVtZW50LnNoZWV0O1xufVxuZnVuY3Rpb24gYXBwZW5kX3N0eWxlc2hlZXQobm9kZSwgc3R5bGUpIHtcbiAgICBhcHBlbmQobm9kZS5oZWFkIHx8IG5vZGUsIHN0eWxlKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKSB7XG4gICAgaWYgKGlzX2h5ZHJhdGluZykge1xuICAgICAgICBpbml0X2h5ZHJhdGUodGFyZ2V0KTtcbiAgICAgICAgaWYgKCh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9PT0gdW5kZWZpbmVkKSB8fCAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkICE9PSBudWxsKSAmJiAodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQucGFyZW50RWxlbWVudCAhPT0gdGFyZ2V0KSkpIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gdGFyZ2V0LmZpcnN0Q2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2tpcCBub2RlcyBvZiB1bmRlZmluZWQgb3JkZXJpbmdcbiAgICAgICAgd2hpbGUgKCh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCAhPT0gbnVsbCkgJiYgKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkLmNsYWltX29yZGVyID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlICE9PSB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCkge1xuICAgICAgICAgICAgLy8gV2Ugb25seSBpbnNlcnQgaWYgdGhlIG9yZGVyaW5nIG9mIHRoaXMgbm9kZSBzaG91bGQgYmUgbW9kaWZpZWQgb3IgdGhlIHBhcmVudCBub2RlIGlzIG5vdCB0YXJnZXRcbiAgICAgICAgICAgIGlmIChub2RlLmNsYWltX29yZGVyICE9PSB1bmRlZmluZWQgfHwgbm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCB8fCBub2RlLm5leHRTaWJsaW5nICE9PSBudWxsKSB7XG4gICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvciB8fCBudWxsKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9oeWRyYXRpb24odGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBpZiAoaXNfaHlkcmF0aW5nICYmICFhbmNob3IpIHtcbiAgICAgICAgYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCB8fCBub2RlLm5leHRTaWJsaW5nICE9IGFuY2hvcikge1xuICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvciB8fCBudWxsKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0cnVzdGVkKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC5pc1RydXN0ZWQpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfX3ZhbHVlJykge1xuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0KSB7XG4gICAgICAgICAgICBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdmdfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBwcm9wLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wIGluIG5vZGUpIHtcbiAgICAgICAgbm9kZVtwcm9wXSA9IHR5cGVvZiBub2RlW3Byb3BdID09PSAnYm9vbGVhbicgJiYgdmFsdWUgPT09ICcnID8gdHJ1ZSA6IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXAsIF9fdmFsdWUsIGNoZWNrZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUuYWRkKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrZWQpIHtcbiAgICAgICAgdmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gbnVsbCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBpbml0X2NsYWltX2luZm8obm9kZXMpIHtcbiAgICBpZiAobm9kZXMuY2xhaW1faW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5vZGVzLmNsYWltX2luZm8gPSB7IGxhc3RfaW5kZXg6IDAsIHRvdGFsX2NsYWltZWQ6IDAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGFpbV9ub2RlKG5vZGVzLCBwcmVkaWNhdGUsIHByb2Nlc3NOb2RlLCBjcmVhdGVOb2RlLCBkb250VXBkYXRlTGFzdEluZGV4ID0gZmFsc2UpIHtcbiAgICAvLyBUcnkgdG8gZmluZCBub2RlcyBpbiBhbiBvcmRlciBzdWNoIHRoYXQgd2UgbGVuZ3RoZW4gdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZVxuICAgIGluaXRfY2xhaW1faW5mbyhub2Rlcyk7XG4gICAgY29uc3QgcmVzdWx0Tm9kZSA9ICgoKSA9PiB7XG4gICAgICAgIC8vIFdlIGZpcnN0IHRyeSB0byBmaW5kIGFuIGVsZW1lbnQgYWZ0ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgICBmb3IgKGxldCBpID0gbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4OyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHByb2Nlc3NOb2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzW2ldID0gcmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZG9udFVwZGF0ZUxhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlcndpc2UsIHdlIHRyeSB0byBmaW5kIG9uZSBiZWZvcmVcbiAgICAgICAgLy8gV2UgaXRlcmF0ZSBpbiByZXZlcnNlIHNvIHRoYXQgd2UgZG9uJ3QgZ28gdG9vIGZhciBiYWNrXG4gICAgICAgIGZvciAobGV0IGkgPSBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcHJvY2Vzc05vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNbaV0gPSByZXBsYWNlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkb250VXBkYXRlTGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2luY2Ugd2Ugc3BsaWNlZCBiZWZvcmUgdGhlIGxhc3RfaW5kZXgsIHdlIGRlY3JlYXNlIGl0XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiB3ZSBjYW4ndCBmaW5kIGFueSBtYXRjaGluZyBub2RlLCB3ZSBjcmVhdGUgYSBuZXcgb25lXG4gICAgICAgIHJldHVybiBjcmVhdGVOb2RlKCk7XG4gICAgfSkoKTtcbiAgICByZXN1bHROb2RlLmNsYWltX29yZGVyID0gbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkO1xuICAgIG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZCArPSAxO1xuICAgIHJldHVybiByZXN1bHROb2RlO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBjcmVhdGVfZWxlbWVudCkge1xuICAgIHJldHVybiBjbGFpbV9ub2RlKG5vZGVzLCAobm9kZSkgPT4gbm9kZS5ub2RlTmFtZSA9PT0gbmFtZSwgKG5vZGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVtb3ZlID0gW107XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG4gICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlLnB1c2goYXR0cmlidXRlLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbW92ZS5mb3JFYWNoKHYgPT4gbm9kZS5yZW1vdmVBdHRyaWJ1dGUodikpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0sICgpID0+IGNyZWF0ZV9lbGVtZW50KG5hbWUpKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBlbGVtZW50KTtcbn1cbmZ1bmN0aW9uIGNsYWltX3N2Z19lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnX2VsZW1lbnQpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIHJldHVybiBjbGFpbV9ub2RlKG5vZGVzLCAobm9kZSkgPT4gbm9kZS5ub2RlVHlwZSA9PT0gMywgKG5vZGUpID0+IHtcbiAgICAgICAgY29uc3QgZGF0YVN0ciA9ICcnICsgZGF0YTtcbiAgICAgICAgaWYgKG5vZGUuZGF0YS5zdGFydHNXaXRoKGRhdGFTdHIpKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5kYXRhLmxlbmd0aCAhPT0gZGF0YVN0ci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5zcGxpdFRleHQoZGF0YVN0ci5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gZGF0YVN0cjtcbiAgICAgICAgfVxuICAgIH0sICgpID0+IHRleHQoZGF0YSksIHRydWUgLy8gVGV4dCBub2RlcyBzaG91bGQgbm90IHVwZGF0ZSBsYXN0IGluZGV4IHNpbmNlIGl0IGlzIGxpa2VseSBub3Qgd29ydGggaXQgdG8gZWxpbWluYXRlIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgYWN0dWFsIGVsZW1lbnRzXG4gICAgKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBmaW5kX2NvbW1lbnQobm9kZXMsIHRleHQsIHN0YXJ0KSB7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gOCAvKiBjb21tZW50IG5vZGUgKi8gJiYgbm9kZS50ZXh0Q29udGVudC50cmltKCkgPT09IHRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBub2Rlcy5sZW5ndGg7XG59XG5mdW5jdGlvbiBjbGFpbV9odG1sX3RhZyhub2Rlcykge1xuICAgIC8vIGZpbmQgaHRtbCBvcGVuaW5nIHRhZ1xuICAgIGNvbnN0IHN0YXJ0X2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfU1RBUlQnLCAwKTtcbiAgICBjb25zdCBlbmRfaW5kZXggPSBmaW5kX2NvbW1lbnQobm9kZXMsICdIVE1MX1RBR19FTkQnLCBzdGFydF9pbmRleCk7XG4gICAgaWYgKHN0YXJ0X2luZGV4ID09PSBlbmRfaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKCk7XG4gICAgfVxuICAgIGluaXRfY2xhaW1faW5mbyhub2Rlcyk7XG4gICAgY29uc3QgaHRtbF90YWdfbm9kZXMgPSBub2Rlcy5zcGxpY2Uoc3RhcnRfaW5kZXgsIGVuZF9pbmRleCAtIHN0YXJ0X2luZGV4ICsgMSk7XG4gICAgZGV0YWNoKGh0bWxfdGFnX25vZGVzWzBdKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbaHRtbF90YWdfbm9kZXMubGVuZ3RoIC0gMV0pO1xuICAgIGNvbnN0IGNsYWltZWRfbm9kZXMgPSBodG1sX3RhZ19ub2Rlcy5zbGljZSgxLCBodG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBuLmNsYWltX29yZGVyID0gbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkO1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKGNsYWltZWRfbm9kZXMpO1xufVxuZnVuY3Rpb24gc2V0X2RhdGEodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ICE9PSBkYXRhKVxuICAgICAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VsZWN0LnNlbGVjdGVkSW5kZXggPSAtMTsgLy8gbm8gb3B0aW9uIHNob3VsZCBiZSBzZWxlY3RlZFxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG4vLyB1bmZvcnR1bmF0ZWx5IHRoaXMgY2FuJ3QgYmUgYSBjb25zdGFudCBhcyB0aGF0IHdvdWxkbid0IGJlIHRyZWUtc2hha2VhYmxlXG4vLyBzbyB3ZSBjYWNoZSB0aGUgcmVzdWx0IGluc3RlYWRcbmxldCBjcm9zc29yaWdpbjtcbmZ1bmN0aW9uIGlzX2Nyb3Nzb3JpZ2luKCkge1xuICAgIGlmIChjcm9zc29yaWdpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNyb3Nzb3JpZ2luID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHZvaWQgd2luZG93LnBhcmVudC5kb2N1bWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNyb3Nzb3JpZ2luID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY3Jvc3NvcmlnaW47XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKG5vZGUsIGZuKSB7XG4gICAgY29uc3QgY29tcHV0ZWRfc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChjb21wdXRlZF9zdHlsZS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuICAgIGNvbnN0IGlmcmFtZSA9IGVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgJyArXG4gICAgICAgICdvdmVyZmxvdzogaGlkZGVuOyBib3JkZXI6IDA7IG9wYWNpdHk6IDA7IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsLCBidWJibGVzID0gZmFsc2UpIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgYnViYmxlcywgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5mdW5jdGlvbiBxdWVyeV9zZWxlY3Rvcl9hbGwoc2VsZWN0b3IsIHBhcmVudCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgfVxuICAgIG0oaHRtbCwgdGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5lKSB7XG4gICAgICAgICAgICB0aGlzLmUgPSBlbGVtZW50KHRhcmdldC5ub2RlTmFtZSk7XG4gICAgICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pKGFuY2hvcik7XG4gICAgfVxuICAgIGgoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnQodGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgICAgIHRoaXMuaSh0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cbmNsYXNzIEh0bWxUYWdIeWRyYXRpb24gZXh0ZW5kcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihjbGFpbWVkX25vZGVzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgICAgIHRoaXMubCA9IGNsYWltZWRfbm9kZXM7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICBpZiAodGhpcy5sKSB7XG4gICAgICAgICAgICB0aGlzLm4gPSB0aGlzLmw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdXBlci5jKGh0bWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGkoYW5jaG9yKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpbnNlcnRfaHlkcmF0aW9uKHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0cmlidXRlX3RvX29iamVjdChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICByZXN1bHRbYXR0cmlidXRlLm5hbWVdID0gYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cyhlbGVtZW50KSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgcmVzdWx0W25vZGUuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBpbmZvcm1hdGlvbiBmb3IgbXVsdGlwbGUgZG9jdW1lbnRzIGJlY2F1c2UgYSBTdmVsdGUgYXBwbGljYXRpb24gY291bGQgYWxzbyBjb250YWluIGlmcmFtZXNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvaXNzdWVzLzM2MjRcbmNvbnN0IG1hbmFnZWRfc3R5bGVzID0gbmV3IE1hcCgpO1xubGV0IGFjdGl2ZSA9IDA7XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3N0eWxlX2luZm9ybWF0aW9uKGRvYywgbm9kZSkge1xuICAgIGNvbnN0IGluZm8gPSB7IHN0eWxlc2hlZXQ6IGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0KG5vZGUpLCBydWxlczoge30gfTtcbiAgICBtYW5hZ2VkX3N0eWxlcy5zZXQoZG9jLCBpbmZvKTtcbiAgICByZXR1cm4gaW5mbztcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpO1xuICAgIGNvbnN0IHsgc3R5bGVzaGVldCwgcnVsZXMgfSA9IG1hbmFnZWRfc3R5bGVzLmdldChkb2MpIHx8IGNyZWF0ZV9zdHlsZV9pbmZvcm1hdGlvbihkb2MsIG5vZGUpO1xuICAgIGlmICghcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiAnJ30ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJykuc3BsaXQoJywgJyk7XG4gICAgY29uc3QgbmV4dCA9IHByZXZpb3VzLmZpbHRlcihuYW1lXG4gICAgICAgID8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cbiAgICAgICAgOiBhbmltID0+IGFuaW0uaW5kZXhPZignX19zdmVsdGUnKSA9PT0gLTEgLy8gcmVtb3ZlIGFsbCBTdmVsdGUgYW5pbWF0aW9uc1xuICAgICk7XG4gICAgY29uc3QgZGVsZXRlZCA9IHByZXZpb3VzLmxlbmd0aCAtIG5leHQubGVuZ3RoO1xuICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gbmV4dC5qb2luKCcsICcpO1xuICAgICAgICBhY3RpdmUgLT0gZGVsZXRlZDtcbiAgICAgICAgaWYgKCFhY3RpdmUpXG4gICAgICAgICAgICBjbGVhcl9ydWxlcygpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG1hbmFnZWRfc3R5bGVzLmZvckVhY2goaW5mbyA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IHN0eWxlc2hlZXQgfSA9IGluZm87XG4gICAgICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgICAgICBpbmZvLnJ1bGVzID0ge307XG4gICAgICAgIH0pO1xuICAgICAgICBtYW5hZ2VkX3N0eWxlcy5jbGVhcigpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfYW5pbWF0aW9uKG5vZGUsIGZyb20sIGZuLCBwYXJhbXMpIHtcbiAgICBpZiAoIWZyb20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHRvID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoZnJvbS5sZWZ0ID09PSB0by5sZWZ0ICYmIGZyb20ucmlnaHQgPT09IHRvLnJpZ2h0ICYmIGZyb20udG9wID09PSB0by50b3AgJiYgZnJvbS5ib3R0b20gPT09IHRvLmJvdHRvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBzaG91bGQgdGhpcyBiZSBzZXBhcmF0ZWQgZnJvbSBkZXN0cnVjdHVyaW5nPyBPciBzdGFydC9lbmQgYWRkZWQgdG8gcHVibGljIGFwaSBhbmQgZG9jdW1lbnRhdGlvbj9cbiAgICBzdGFydDogc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzpcbiAgICBlbmQgPSBzdGFydF90aW1lICsgZHVyYXRpb24sIHRpY2sgPSBub29wLCBjc3MgfSA9IGZuKG5vZGUsIHsgZnJvbSwgdG8gfSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBsZXQgbmFtZTtcbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVsYXkpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBuYW1lKTtcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgIH1cbiAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgIGlmICghc3RhcnRlZCAmJiBub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgbm93ID49IGVuZCkge1xuICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHN0YXJ0X3RpbWU7XG4gICAgICAgICAgICBjb25zdCB0ID0gMCArIDEgKiBlYXNpbmcocCAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHN0YXJ0KCk7XG4gICAgdGljaygwLCAxKTtcbiAgICByZXR1cm4gc3RvcDtcbn1cbmZ1bmN0aW9uIGZpeF9wb3NpdGlvbihub2RlKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChzdHlsZS5wb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyAmJiBzdHlsZS5wb3NpdGlvbiAhPT0gJ2ZpeGVkJykge1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHN0eWxlO1xuICAgICAgICBjb25zdCBhID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGFkZF90cmFuc2Zvcm0obm9kZSwgYSk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkX3RyYW5zZm9ybShub2RlLCBhKSB7XG4gICAgY29uc3QgYiA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGEubGVmdCAhPT0gYi5sZWZ0IHx8IGEudG9wICE9PSBiLnRvcCkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgICAgIG5vZGUuc3R5bGUudHJhbnNmb3JtID0gYCR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHthLmxlZnQgLSBiLmxlZnR9cHgsICR7YS50b3AgLSBiLnRvcH1weClgO1xuICAgIH1cbn1cblxubGV0IGN1cnJlbnRfY29tcG9uZW50O1xuZnVuY3Rpb24gc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIGN1cnJlbnRfY29tcG9uZW50ID0gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkge1xuICAgIGlmICghY3VycmVudF9jb21wb25lbnQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24gY2FsbGVkIG91dHNpZGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uJyk7XG4gICAgcmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuZnVuY3Rpb24gYmVmb3JlVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYmVmb3JlX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25EZXN0cm95KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fZGVzdHJveS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5zZXQoa2V5LCBjb250ZXh0KTtcbn1cbmZ1bmN0aW9uIGdldENvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuZ2V0KGtleSk7XG59XG5mdW5jdGlvbiBnZXRBbGxDb250ZXh0cygpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dDtcbn1cbmZ1bmN0aW9uIGhhc0NvbnRleHQoa2V5KSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuaGFzKGtleSk7XG59XG4vLyBUT0RPIGZpZ3VyZSBvdXQgaWYgd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0XG4vLyBzaG9ydGhhbmQgZXZlbnRzLCBvciBpZiB3ZSB3YW50IHRvIGltcGxlbWVudFxuLy8gYSByZWFsIGJ1YmJsaW5nIG1lY2hhbmlzbVxuZnVuY3Rpb24gYnViYmxlKGNvbXBvbmVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW2V2ZW50LnR5cGVdO1xuICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuLmNhbGwodGhpcywgZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbi8vIGZsdXNoKCkgY2FsbHMgY2FsbGJhY2tzIGluIHRoaXMgb3JkZXI6XG4vLyAxLiBBbGwgYmVmb3JlVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuXG4vLyAyLiBBbGwgYmluZDp0aGlzIGNhbGxiYWNrcywgaW4gcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyAzLiBBbGwgYWZ0ZXJVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW4uIEVYQ0VQVFxuLy8gICAgZm9yIGFmdGVyVXBkYXRlcyBjYWxsZWQgZHVyaW5nIHRoZSBpbml0aWFsIG9uTW91bnQsIHdoaWNoIGFyZSBjYWxsZWQgaW5cbi8vICAgIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gU2luY2UgY2FsbGJhY2tzIG1pZ2h0IHVwZGF0ZSBjb21wb25lbnQgdmFsdWVzLCB3aGljaCBjb3VsZCB0cmlnZ2VyIGFub3RoZXJcbi8vIGNhbGwgdG8gZmx1c2goKSwgdGhlIGZvbGxvd2luZyBzdGVwcyBndWFyZCBhZ2FpbnN0IHRoaXM6XG4vLyAxLiBEdXJpbmcgYmVmb3JlVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4vLyAgICBkaXJ0eV9jb21wb25lbnRzIGFycmF5IGFuZCB3aWxsIGNhdXNlIGEgcmVlbnRyYW50IGNhbGwgdG8gZmx1c2goKS4gQmVjYXVzZVxuLy8gICAgdGhlIGZsdXNoIGluZGV4IGlzIGtlcHQgb3V0c2lkZSB0aGUgZnVuY3Rpb24sIHRoZSByZWVudHJhbnQgY2FsbCB3aWxsIHBpY2tcbi8vICAgIHVwIHdoZXJlIHRoZSBlYXJsaWVyIGNhbGwgbGVmdCBvZmYgYW5kIGdvIHRocm91Z2ggYWxsIGRpcnR5IGNvbXBvbmVudHMuIFRoZVxuLy8gICAgY3VycmVudF9jb21wb25lbnQgdmFsdWUgaXMgc2F2ZWQgYW5kIHJlc3RvcmVkIHNvIHRoYXQgdGhlIHJlZW50cmFudCBjYWxsIHdpbGxcbi8vICAgIG5vdCBpbnRlcmZlcmUgd2l0aCB0aGUgXCJwYXJlbnRcIiBmbHVzaCgpIGNhbGwuXG4vLyAyLiBiaW5kOnRoaXMgY2FsbGJhY2tzIGNhbm5vdCB0cmlnZ2VyIG5ldyBmbHVzaCgpIGNhbGxzLlxuLy8gMy4gRHVyaW5nIGFmdGVyVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgTk9UIGhhdmUgdGhlaXIgYWZ0ZXJVcGRhdGVcbi8vICAgIGNhbGxiYWNrIGNhbGxlZCBhIHNlY29uZCB0aW1lOyB0aGUgc2Vlbl9jYWxsYmFja3Mgc2V0LCBvdXRzaWRlIHRoZSBmbHVzaCgpXG4vLyAgICBmdW5jdGlvbiwgZ3VhcmFudGVlcyB0aGlzIGJlaGF2aW9yLlxuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5sZXQgZmx1c2hpZHggPSAwOyAvLyBEbyAqbm90KiBtb3ZlIHRoaXMgaW5zaWRlIHRoZSBmbHVzaCgpIGZ1bmN0aW9uXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBjb25zdCBzYXZlZF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIHdoaWxlIChmbHVzaGlkeCA8IGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ZsdXNoaWR4XTtcbiAgICAgICAgICAgIGZsdXNoaWR4Kys7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICBmbHVzaGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChzYXZlZF9jb21wb25lbnQpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSk7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKGdvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgY29uc3QgZ3JvdXAgPSBvdXRyb3M7XG4gICAgZ3JvdXAuciArPSAxO1xuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAxLCAwLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnc3RhcnQnKSk7XG4gICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIS0tZ3JvdXAucikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIHJlc3VsdCBpbiBgZW5kKClgIGJlaW5nIGNhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gY2xlYW4gdXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxIC0gdCwgdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgIGdvKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW5kKHJlc2V0KSB7XG4gICAgICAgICAgICBpZiAocmVzZXQgJiYgY29uZmlnLnRpY2spIHtcbiAgICAgICAgICAgICAgICBjb25maWcudGljaygxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcywgaW50cm8pIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgdCA9IGludHJvID8gMCA6IDE7XG4gICAgbGV0IHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lID0gbnVsbDtcbiAgICBmdW5jdGlvbiBjbGVhcl9hbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5pdChwcm9ncmFtLCBkdXJhdGlvbikge1xuICAgICAgICBjb25zdCBkID0gKHByb2dyYW0uYiAtIHQpO1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzW2ldID09PSBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfYXdhaXRfYmxvY2tfYnJhbmNoKGluZm8sIGN0eCwgZGlydHkpIHtcbiAgICBjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcbiAgICBjb25zdCB7IHJlc29sdmVkIH0gPSBpbmZvO1xuICAgIGlmIChpbmZvLmN1cnJlbnQgPT09IGluZm8udGhlbikge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby52YWx1ZV0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby5jYXRjaCkge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby5lcnJvcl0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaW5mby5ibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xufVxuXG5jb25zdCBnbG9iYWxzID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgPyB3aW5kb3dcbiAgICA6IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICA/IGdsb2JhbFRoaXNcbiAgICAgICAgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9rZXlzKGN0eCwgbGlzdCwgZ2V0X2NvbnRleHQsIGdldF9rZXkpIHtcbiAgICBjb25zdCBrZXlzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSkpO1xuICAgICAgICBpZiAoa2V5cy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaGF2ZSBkdXBsaWNhdGUga2V5cyBpbiBhIGtleWVkIGVhY2gnKTtcbiAgICAgICAgfVxuICAgICAgICBrZXlzLmFkZChrZXkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpc21hcCcsXG4gICAgJ2xvb3AnLFxuICAgICdtdWx0aXBsZScsXG4gICAgJ211dGVkJyxcbiAgICAnbm9tb2R1bGUnLFxuICAgICdub3ZhbGlkYXRlJyxcbiAgICAnb3BlbicsXG4gICAgJ3BsYXlzaW5saW5lJyxcbiAgICAncmVhZG9ubHknLFxuICAgICdyZXF1aXJlZCcsXG4gICAgJ3JldmVyc2VkJyxcbiAgICAnc2VsZWN0ZWQnXG5dKTtcblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgYXR0cnNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChhdHRyc190b19hZGQpIHtcbiAgICAgICAgY29uc3QgY2xhc3Nlc190b19hZGQgPSBhdHRyc190b19hZGQuY2xhc3NlcztcbiAgICAgICAgY29uc3Qgc3R5bGVzX3RvX2FkZCA9IGF0dHJzX3RvX2FkZC5zdHlsZXM7XG4gICAgICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0eWxlc190b19hZGQpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnN0eWxlID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZXNfdG9fYWRkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuc3R5bGUgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKG1lcmdlX3Nzcl9zdHlsZXMoYXR0cmlidXRlcy5zdHlsZSwgc3R5bGVzX3RvX2FkZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IGAgJHtuYW1lfT1cIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmZ1bmN0aW9uIG1lcmdlX3Nzcl9zdHlsZXMoc3R5bGVfYXR0cmlidXRlLCBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICBjb25zdCBzdHlsZV9vYmplY3QgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGluZGl2aWR1YWxfc3R5bGUgb2Ygc3R5bGVfYXR0cmlidXRlLnNwbGl0KCc7JykpIHtcbiAgICAgICAgY29uc3QgY29sb25faW5kZXggPSBpbmRpdmlkdWFsX3N0eWxlLmluZGV4T2YoJzonKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGluZGl2aWR1YWxfc3R5bGUuc2xpY2UoMCwgY29sb25faW5kZXgpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbmRpdmlkdWFsX3N0eWxlLnNsaWNlKGNvbG9uX2luZGV4ICsgMSkudHJpbSgpO1xuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZV9kaXJlY3RpdmVbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgc3R5bGVfb2JqZWN0W25hbWVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZV9vYmplY3Q7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBlc2NhcGUodmFsdWUpIDogdmFsdWU7XG59XG5mdW5jdGlvbiBlc2NhcGVfb2JqZWN0KG9iaikge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICByZXN1bHRba2V5XSA9IGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUob2JqW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cywgY29udGV4dCkge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAoY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIHsgJCRzbG90cyA9IHt9LCBjb250ZXh0ID0gbmV3IE1hcCgpIH0gPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCAkJHNsb3RzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSAmJiBib29sZWFuX2F0dHJpYnV0ZXMuaGFzKG5hbWUpID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiAnJztcbn1cbmZ1bmN0aW9uIHN0eWxlX29iamVjdF90b19zdHJpbmcoc3R5bGVfb2JqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHN0eWxlX29iamVjdClcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gc3R5bGVfb2JqZWN0W2tleV0pXG4gICAgICAgIC5tYXAoa2V5ID0+IGAke2tleX06ICR7c3R5bGVfb2JqZWN0W2tleV19O2ApXG4gICAgICAgIC5qb2luKCcgJyk7XG59XG5mdW5jdGlvbiBhZGRfc3R5bGVzKHN0eWxlX29iamVjdCkge1xuICAgIGNvbnN0IHN0eWxlcyA9IHN0eWxlX29iamVjdF90b19zdHJpbmcoc3R5bGVfb2JqZWN0KTtcbiAgICByZXR1cm4gc3R5bGVzID8gYCBzdHlsZT1cIiR7c3R5bGVzfVwiYCA6ICcnO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvciwgY3VzdG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICBpZiAoIWN1c3RvbUVsZW1lbnQpIHtcbiAgICAgICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBhcHBlbmRfc3R5bGVzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKG9wdGlvbnMuY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eSxcbiAgICAgICAgc2tpcF9ib3VuZDogZmFsc2UsXG4gICAgICAgIHJvb3Q6IG9wdGlvbnMudGFyZ2V0IHx8IHBhcmVudF9jb21wb25lbnQuJCQucm9vdFxuICAgIH07XG4gICAgYXBwZW5kX3N0eWxlcyAmJiBhcHBlbmRfc3R5bGVzKCQkLnJvb3QpO1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBvcHRpb25zLnByb3BzIHx8IHt9LCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgc3RhcnRfaHlkcmF0aW5nKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvciwgb3B0aW9ucy5jdXN0b21FbGVtZW50KTtcbiAgICAgICAgZW5kX2h5ZHJhdGluZygpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbl9tb3VudCB9ID0gdGhpcy4kJDtcbiAgICAgICAgICAgIHRoaXMuJCQub25fZGlzY29ubmVjdCA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QpO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cy4gVXNlZCB3aGVuIGRldj1mYWxzZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy40Ni40JyB9LCBkZXRhaWwpLCB0cnVlKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9oeWRyYXRpb25fZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydF9oeWRyYXRpb24odGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbJ2NhcHR1cmUnXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGEnLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnICYmICEoYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIGFyZykpIHtcbiAgICAgICAgbGV0IG1zZyA9ICd7I2VhY2h9IG9ubHkgaXRlcmF0ZXMgb3ZlciBhcnJheS1saWtlIG9iamVjdHMuJztcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgYXJnICYmIFN5bWJvbC5pdGVyYXRvciBpbiBhcmcpIHtcbiAgICAgICAgICAgIG1zZyArPSAnIFlvdSBjYW4gdXNlIGEgc3ByZWFkIHRvIGNvbnZlcnQgdGhpcyBpdGVyYWJsZSBpbnRvIGFuIGFycmF5Lic7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfc2xvdHMobmFtZSwgc2xvdCwga2V5cykge1xuICAgIGZvciAoY29uc3Qgc2xvdF9rZXkgb2YgT2JqZWN0LmtleXMoc2xvdCkpIHtcbiAgICAgICAgaWYgKCF+a2V5cy5pbmRleE9mKHNsb3Rfa2V5KSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGA8JHtuYW1lfT4gcmVjZWl2ZWQgYW4gdW5leHBlY3RlZCBzbG90IFwiJHtzbG90X2tleX1cIi5gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgU3ZlbHRlIGNvbXBvbmVudHMgd2l0aCBzb21lIG1pbm9yIGRldi1lbmhhbmNlbWVudHMuIFVzZWQgd2hlbiBkZXY9dHJ1ZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50RGV2IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAoIW9wdGlvbnMudGFyZ2V0ICYmICFvcHRpb25zLiQkaW5saW5lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25cIik7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWQnKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxuICAgICRjYXB0dXJlX3N0YXRlKCkgeyB9XG4gICAgJGluamVjdF9zdGF0ZSgpIHsgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIHRvIGNyZWF0ZSBzdHJvbmdseSB0eXBlZCBTdmVsdGUgY29tcG9uZW50cy5cbiAqIFRoaXMgb25seSBleGlzdHMgZm9yIHR5cGluZyBwdXJwb3NlcyBhbmQgc2hvdWxkIGJlIHVzZWQgaW4gYC5kLnRzYCBmaWxlcy5cbiAqXG4gKiAjIyMgRXhhbXBsZTpcbiAqXG4gKiBZb3UgaGF2ZSBjb21wb25lbnQgbGlicmFyeSBvbiBucG0gY2FsbGVkIGBjb21wb25lbnQtbGlicmFyeWAsIGZyb20gd2hpY2hcbiAqIHlvdSBleHBvcnQgYSBjb21wb25lbnQgY2FsbGVkIGBNeUNvbXBvbmVudGAuIEZvciBTdmVsdGUrVHlwZVNjcmlwdCB1c2VycyxcbiAqIHlvdSB3YW50IHRvIHByb3ZpZGUgdHlwaW5ncy4gVGhlcmVmb3JlIHlvdSBjcmVhdGUgYSBgaW5kZXguZC50c2A6XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgU3ZlbHRlQ29tcG9uZW50VHlwZWQgfSBmcm9tIFwic3ZlbHRlXCI7XG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnRUeXBlZDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogYGBgXG4gKiBUeXBpbmcgdGhpcyBtYWtlcyBpdCBwb3NzaWJsZSBmb3IgSURFcyBsaWtlIFZTIENvZGUgd2l0aCB0aGUgU3ZlbHRlIGV4dGVuc2lvblxuICogdG8gcHJvdmlkZSBpbnRlbGxpc2Vuc2UgYW5kIHRvIHVzZSB0aGUgY29tcG9uZW50IGxpa2UgdGhpcyBpbiBhIFN2ZWx0ZSBmaWxlXG4gKiB3aXRoIFR5cGVTY3JpcHQ6XG4gKiBgYGBzdmVsdGVcbiAqIDxzY3JpcHQgbGFuZz1cInRzXCI+XG4gKiBcdGltcG9ydCB7IE15Q29tcG9uZW50IH0gZnJvbSBcImNvbXBvbmVudC1saWJyYXJ5XCI7XG4gKiA8L3NjcmlwdD5cbiAqIDxNeUNvbXBvbmVudCBmb289eydiYXInfSAvPlxuICogYGBgXG4gKlxuICogIyMjIyBXaHkgbm90IG1ha2UgdGhpcyBwYXJ0IG9mIGBTdmVsdGVDb21wb25lbnQoRGV2KWA/XG4gKiBCZWNhdXNlXG4gKiBgYGB0c1xuICogY2xhc3MgQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQ8e2Zvbzogc3RyaW5nfT4ge31cbiAqIGNvbnN0IGNvbXBvbmVudDogdHlwZW9mIFN2ZWx0ZUNvbXBvbmVudCA9IEFTdWJjbGFzc09mU3ZlbHRlQ29tcG9uZW50O1xuICogYGBgXG4gKiB3aWxsIHRocm93IGEgdHlwZSBlcnJvciwgc28gd2UgbmVlZCB0byBzZXBhcmF0ZSB0aGUgbW9yZSBzdHJpY3RseSB0eXBlZCBjbGFzcy5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50VHlwZWQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnREZXYge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZmluaXRlIGxvb3AgZGV0ZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIEh0bWxUYWdIeWRyYXRpb24sIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVDb21wb25lbnRUeXBlZCwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfc3R5bGVzLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldCwgYXBwZW5kX2h5ZHJhdGlvbiwgYXBwZW5kX2h5ZHJhdGlvbl9kZXYsIGFwcGVuZF9zdHlsZXMsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGF0dHJpYnV0ZV90b19vYmplY3QsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX2h0bWxfdGFnLCBjbGFpbV9zcGFjZSwgY2xhaW1fc3ZnX2VsZW1lbnQsIGNsYWltX3RleHQsIGNsZWFyX2xvb3BzLCBjb21wb25lbnRfc3Vic2NyaWJlLCBjb21wdXRlX3Jlc3RfcHJvcHMsIGNvbXB1dGVfc2xvdHMsIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgY3JlYXRlX2FuaW1hdGlvbiwgY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbiwgY3JlYXRlX2NvbXBvbmVudCwgY3JlYXRlX2luX3RyYW5zaXRpb24sIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbiwgY3JlYXRlX3Nsb3QsIGNyZWF0ZV9zc3JfY29tcG9uZW50LCBjdXJyZW50X2NvbXBvbmVudCwgY3VzdG9tX2V2ZW50LCBkYXRhc2V0X2RldiwgZGVidWcsIGRlc3Ryb3lfYmxvY2ssIGRlc3Ryb3lfY29tcG9uZW50LCBkZXN0cm95X2VhY2gsIGRldGFjaCwgZGV0YWNoX2FmdGVyX2RldiwgZGV0YWNoX2JlZm9yZV9kZXYsIGRldGFjaF9iZXR3ZWVuX2RldiwgZGV0YWNoX2RldiwgZGlydHlfY29tcG9uZW50cywgZGlzcGF0Y2hfZGV2LCBlYWNoLCBlbGVtZW50LCBlbGVtZW50X2lzLCBlbXB0eSwgZW5kX2h5ZHJhdGluZywgZXNjYXBlLCBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlLCBlc2NhcGVfb2JqZWN0LCBlc2NhcGVkLCBleGNsdWRlX2ludGVybmFsX3Byb3BzLCBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIGZpeF9wb3NpdGlvbiwgZmx1c2gsIGdldEFsbENvbnRleHRzLCBnZXRDb250ZXh0LCBnZXRfYWxsX2RpcnR5X2Zyb21fc2NvcGUsIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlLCBnZXRfY3VycmVudF9jb21wb25lbnQsIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMsIGdldF9yb290X2Zvcl9zdHlsZSwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc0NvbnRleHQsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnNlcnRfaHlkcmF0aW9uLCBpbnNlcnRfaHlkcmF0aW9uX2RldiwgaW50cm9zLCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciwgaXNfY2xpZW50LCBpc19jcm9zc29yaWdpbiwgaXNfZW1wdHksIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1lcmdlX3Nzcl9zdHlsZXMsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCBxdWVyeV9zZWxlY3Rvcl9hbGwsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzcmNfdXJsX2VxdWFsLCBzdGFydF9oeWRyYXRpbmcsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHRydXN0ZWQsIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2gsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdXBkYXRlX3Nsb3RfYmFzZSwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCBub2RlO1xuICBjb25zdCByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBjb25zdCB7eCx5fT0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBjb25zdCB7dG9wOnQsIGxlZnQ6bCwgaGVpZ2h0Omh9ID0gcmVjdFxuICBsZXQgdG9wICA9IC15ICsgdCArIGggKyAzXG4gIGxldCBsZWZ0ID0gLXggKyBsIC0gNVxuICBsZXQge1xuICAgIGRlc2NyaXB0aW9uLFxuICAgIGluY29tcGxldGUsXG4gICAgY3JpdGVyaW9uMSxcbiAgICBjcml0ZXJpb24yLFxuICAgIGhlbHBVcmwsXG4gICAgaW1wYWN0LFxuICAgIGh0bWwsXG4gICAgYWxsLFxuICAgIGFueSxcbiAgICBoZWxwLFxuICAgIHRncyxcbiAgICBncnAsXG4gICAgZWwsXG4gIH0gPSBub2RlLl9heGVfXG5cbiAgZnVuY3Rpb24gcmVmb3JtYXQoYXJyKSB7XG4gICAgY29uc3Qgcmd4ID0gLyhbXFxkLiM6XSspKCB8XFx3KykvZ1xuICAgIHJldHVybiBhcnIubWFwKGl0ZW09PntcbiAgICAgIGxldCB4MSA9IGl0ZW0ubWVzc2FnZVxuICAgICAgY29uc3QgeDIgPSB4MS5tYXRjaChyZ3gpXG4gICAgICB4MSA9IHgxLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpXG4gICAgICB4MiAmJiB4Mi5maWx0ZXIoeD0+eC5sZW5ndGg+MikuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgeDEgPSB4MS5yZXBsYWNlKGVsZW1lbnQsIGA8Yj4ke2VsZW1lbnR9PC9iPmApXG4gICAgICB9KVxuICAgICAgcmV0dXJuIHgxXG4gICAgfSlcbiAgfVxuICBhbGwgPSByZWZvcm1hdChhbGwpXG4gIGFueSA9IHJlZm9ybWF0KGFueSlcblxuICBsZXQgc3R5bGVcbiAgaWYgKGdycC5tYXRjaCgvcGFnZS0vKSkge1xuICAgIHN0eWxlID0gYHRvcDoke3RvcH1weDtsZWZ0OjA7cmlnaHQ6MDttYXJnaW46YXV0bztgXG4gIH0gZWxzZSB7XG4gICAgc3R5bGUgPSBgdG9wOjA7bGVmdDowO29wYWNpdHk6MDtgXG4gIH1cblxuICBzZXRUaW1lb3V0KCgpPT4ge1xuICAgIGNvbnN0IHBvcHVwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmExMXktcG9wdXAnKVxuICAgIGNvbnN0IHtcbiAgICAgIHdpZHRoOnBvcFdpZHRoLFxuICAgICAgaGVpZ2h0OnBvcEhlaWdodFxuICAgIH0gPSBwb3B1cC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG4gICAgY29uc3Qgd2luSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0XG4gICAgY29uc3Qgd2luWU9mZnN0ID0gd2luZG93LnBhZ2VZT2Zmc2V0XG4gICAgaWYgKHRvcCtwb3BIZWlnaHQ+d2luSGVpZ2h0LXdpbllPZmZzdCkge1xuICAgICAgdG9wIC09IChwb3BIZWlnaHQgKyAzMClcbiAgICB9XG5cbiAgICBjb25zdCB3aW5XaWR0aCA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICBjb25zdCB3aW5YT2Zmc3Q9IHdpbmRvdy5wYWdlWE9mZnNldFxuICAgIGlmIChsZWZ0K3BvcFdpZHRoPndpbldpZHRoLXdpblhPZmZzdCkge1xuICAgICAgbGVmdCAtPSAocG9wV2lkdGggLSAxOCkgXG4gICAgfVxuICAgIGlmIChub2RlLnN0eWxlLnBvc2l0aW9uPT09J2ZpeGVkJykge1xuICAgICAgLy8gaWYgYm94IGluIGZpeGVkIHBvc2l0aW9uLCBwb3B1cCB0b28oYW5kIHVwZGF0ZSB0b3AgcG9zaXRpb24pXG4gICAgICBwb3B1cC5zdHlsZSA9IGB0b3A6JHt0b3Atd2luWU9mZnN0fXB4O2xlZnQ6JHtsZWZ0fXB4O3Bvc2l0aW9uOmZpeGVkO2BcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGdycC5tYXRjaCgvcGFnZS0vKSkge1xuICAgICAgICBwb3B1cC5zdHlsZSA9IGB0b3A6JHt0b3B9cHg7bGVmdDowO3JpZ2h0OjA7bWFyZ2luOmF1dG87YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9wdXAuc3R5bGUgPSBgdG9wOiR7dG9wfXB4O2xlZnQ6JHtsZWZ0fXB4O2BcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gcmF0aW8oKSB7XG4gICAgY29uc3Qge1xuICAgICAgY29udHJhc3RSYXRpbyxcbiAgICAgIGV4cGVjdGVkQ29udHJhc3RSYXRpbyxcbiAgICB9ID0gbm9kZS5fYXhlXy5hbnlbMF0uZGF0YVxuICAgIGlmIChjb250cmFzdFJhdGlvKSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgLCBjb250cmFzdCByYXRpbzogJHtjb250cmFzdFJhdGlvfSxcbiAgICAgIGV4cGVjdGVkOiAke2V4cGVjdGVkQ29udHJhc3RSYXRpb30uYFxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB7Z2V0Q29sb3IsIGNvbnRyYXN0fSA9IHdpbmRvdy5taXRtLmZuXG4gICAgICBjb25zdCByYXRpbyA9IGNvbnRyYXN0KC4uLmdldENvbG9yKGVsKSlcbiAgICAgIHJldHVybiBgLiBDb250cmFzdCByYXRpbzogJHtyYXRpb30uYFxuICAgIH1cbiAgfVxuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGhsanMuaGlnaGxpZ2h0QWxsKClcbiAgfSwgMCk7XG5cbiAgZnVuY3Rpb24gY29weXRvKGUpIHtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5pY29waWVkJylcbiAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmExMXktY29udGVudCcpLmlubmVySFRNTFxuICAgIHNldFRpbWVvdXQoKCk9PntlbC5zdHlsZSA9ICcnfSwgMzAwMClcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KVxuICAgIGVsLnN0eWxlID0gJ2Rpc3BsYXk6YmxvY2s7J1xuICB9XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImExMXktcG9wdXBcIiB7c3R5bGV9PlxuICA8c3BhbiBjbGFzcz1cImljb3B5XCIgb246Y2xpY2s9e2NvcHl0b30+XG4gICAgPHN2ZyB3aWR0aD1cIjE2cHhcIiBoZWlnaHQ9XCIxNnB4XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIHZlcnNpb249XCIxLjFcIj5cbiAgICAgIDxnIGlkPVwic3VyZmFjZTFcIj5cbiAgICAgIDxwYXRoIHN0eWxlPVwiIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpub256ZXJvO2ZpbGw6cmdiKDAlLDAlLDAlKTtmaWxsLW9wYWNpdHk6MTtcIiBkPVwiTSAxMC44ODI4MTIgNC4wMjczNDQgTCAxMC44ODI4MTIgMCBMIDEuNzMwNDY5IDAgTCAxLjczMDQ2OSAxMi4yNjk1MzEgTCA1LjExNzE4OCAxMi4yNjk1MzEgTCA1LjExNzE4OCAxNiBMIDE0LjI2OTUzMSAxNiBMIDE0LjI2OTUzMSA3LjQxNzk2OSBaIE0gMTAuODgyODEyIDUuNDY0ODQ0IEwgMTIuNTM1MTU2IDcuMTE3MTg4IEwgMTAuODgyODEyIDcuMTE3MTg4IFogTSAyLjc0NjA5NCAxMS4yNTM5MDYgTCAyLjc0NjA5NCAxLjAxNTYyNSBMIDkuODYzMjgxIDEuMDE1NjI1IEwgOS44NjMyODEgMy43MzA0NjkgTCA1LjExNzE4OCAzLjczMDQ2OSBMIDUuMTE3MTg4IDExLjI1MzkwNiBaIE0gNi4xMzY3MTkgMTQuOTg0Mzc1IEwgNi4xMzY3MTkgNC43NDYwOTQgTCA5Ljg2MzI4MSA0Ljc0NjA5NCBMIDkuODYzMjgxIDguMTM2NzE5IEwgMTMuMjUzOTA2IDguMTM2NzE5IEwgMTMuMjUzOTA2IDE0Ljk4NDM3NSBaIE0gNi4xMzY3MTkgMTQuOTg0Mzc1IFwiLz5cbiAgICAgIDwvZz5cbiAgICA8L3N2Zz5cbiAgICA8c3BhbiBjbGFzcz1cImljb3BpZWRcIj5Db3BpZWQgdG8gY2xpcGJvYXJkPC9zcGFuPlxuICA8L3NwYW4+XG4gIDxkaXYgY2xhc3M9XCJhMTF5LWNvbnRlbnRcIj5cbiAgICA8aDQ+e2hlbHB9PC9oND5cbiAgICA8cD57ZGVzY3JpcHRpb259PC9wPlxuICAgIDxwIGNsYXNzPXRncz48Yj50YWdzOjwvYj4ge3Rnc308L3A+XG4gICAgPHA+XG4gICAgICA8Yj5jcml0ZXJpYTo8L2I+XG4gICAgICB7I2lmIGNyaXRlcmlvbjF9XG4gICAgICAgIDxhIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIiBocmVmPVwie2NyaXRlcmlvbjEubGlua31cIj57Y3JpdGVyaW9uMS5uYW1lfTwvYT4sIFxuICAgICAgey9pZn1cbiAgICAgIHsjZWFjaCBPYmplY3QuZW50cmllcyhjcml0ZXJpb24yKSBhcyBba2V5LCB2YWx1ZV19XG4gICAgICAgIDxhIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIiBocmVmPVwie3ZhbHVlLmxpbmt9XCI+e3ZhbHVlLm5hbWV9PC9hPiwgXG4gICAgICB7L2VhY2h9XG4gICAgICA8YSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCIgaHJlZj1cIntoZWxwVXJsfVwiPntncnB9PC9hPlxuICAgIDwvcD5cbiAgICA8ZGV0YWlscyBvcGVuPlxuICAgICAgPHN1bW1hcnk+PGI+aW1wYWN0OjwvYj4ge2ltcGFjdH08L3N1bW1hcnk+XG4gICAgICB7I2lmIGFsbC5sZW5ndGh8fGFueS5sZW5ndGh9XG4gICAgICAgIDxoci8+XG4gICAgICAgIDxkaXYgY2xhc3M9cHJlPlxuICAgICAgICAgIHsjaWYgYWxsLmxlbmd0aD4xfVxuICAgICAgICAgICAgPGI+Rml4IEFMTCBvZiB0aGUgZm9sbG93aW5nOjwvYj5cbiAgICAgICAgICAgIDxvbD5cbiAgICAgICAgICAgIHsjZWFjaCBhbGwgYXMgY2F0fVxuICAgICAgICAgICAgICA8bGk+e0BodG1sIGNhdH08L2xpPlxuICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgPC9vbD5cbiAgICAgICAgICB7OmVsc2UgaWYgYWxsLmxlbmd0aD09PTF9XG4gICAgICAgICAgICB7QGh0bWwgYWxsWzBdfVxuICAgICAgICAgIHs6ZWxzZSBpZiBhbnkubGVuZ3RoPjF9XG4gICAgICAgICAgICA8Yj5GaXggT05FIG9mIHRoZSBmb2xsb3dpbmc6PC9iPlxuICAgICAgICAgICAgPG9sPlxuICAgICAgICAgICAgeyNlYWNoIGFueSBhcyBjYXR9XG4gICAgICAgICAgICAgIDxsaT57QGh0bWwgY2F0fTwvbGk+XG4gICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgICA8L29sPlxuICAgICAgICAgIHs6ZWxzZSBpZiBhbnkubGVuZ3RoPT09MX1cbiAgICAgICAgICAgIHtAaHRtbCBhbnlbMF19XG4gICAgICAgICAgey9pZn1cbiAgICAgICAgICB7I2lmIGluY29tcGxldGUgJiYgZ3JwPT09J2NvbG9yLWNvbnRyYXN0J31cbiAgICAgICAgICAgIHtyYXRpbygpfVxuICAgICAgICAgIHsvaWZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8aHIvPlxuICAgICAgey9pZn1cbiAgICAgIDxkaXYgY2xhc3M9cHJlPlxuICAgICAgICA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtaHRtbFwiPntodG1sfTwvY29kZT48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGV0YWlscz5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlPlxuLmExMXktcG9wdXAge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjI4LCAxOTYsIDAuNjUpO1xuICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoNHB4KTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IDJweDtcbiAgcGFkZGluZzogMCAxMHB4O1xuICBoZWlnaHQ6IGF1dG87XG4gIHdpZHRoOiAzNjBweDtcbiAgYm94LXNoYWRvdzogXG4gICAgcmdiKDAgMCAwIC8gMjUlKSAwcHggIDU0cHggNTVweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggLTEycHggMzBweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggICA0cHggIDZweCwgXG4gICAgcmdiKDAgMCAwIC8gMTclKSAwcHggIDEycHggMTNweCwgXG4gICAgcmdiKDAgMCAwIC8gIDklKSAwcHggIC0zcHggIDVweDtcbn1cbi5pY29weSB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICByaWdodDogMTBweDtcbiAgdG9wOiAxMHB4O1xufVxuLmljb3BpZWQge1xuICBhbmltYXRpb246IGJsaW5rZXIgMXMgbGluZWFyIGluZmluaXRlO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBjb2xvcjogYnJvd247XG4gIGRpc3BsYXk6IG5vbmU7XG4gIHJpZ2h0OiAzMHB4O1xuICB0b3A6IDIzcHg7XG59XG5Aa2V5ZnJhbWVzIGJsaW5rZXIge1xuICA1MCUge29wYWNpdHk6IDA7fVxufVxuaDQge1xuICBtYXJnaW46IDEwcHggMDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBmb250LXdlaWdodDogNzAwO1xufVxucCB7XG4gIG1hcmdpbjogMC4ycmVtIDA7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmRldGFpbHMge1xuICBtYXJnaW4tYm90dG9tOiA4cHg7XG59XG5kZXRhaWxzIHN1bW1hcnkge1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4udGdzIHtcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xuICB0ZXh0LWFsaWduOiBpbmhlcml0O1xufVxuLnByZSB7XG4gIGZvbnQtc2l6ZTogMTEuNXB4O1xufVxuLnByZSBvbCB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZy1pbmxpbmUtc3RhcnQ6IDE1cHg7XG59XG5wcmUge1xuICBmb250LWZhbWlseTogdWktbW9ub3NwYWNlLCBtb25vc3BhY2U7XG4gIHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbWFyZ2luOiAwO1xufVxucHJlIGNvZGUge1xuICBwYWRkaW5nOiA1cHg7XG59XG48L3N0eWxlPlxuIiwiY29uc3QgY3NwQXJyID0gW1xuICAnZGVmYXVsdC1zcmMnLFxuICAnY2hpbGQtc3JjJyxcbiAgJ2Nvbm5lY3Qtc3JjJyxcbiAgJ2ZvbnQtc3JjJyxcbiAgJ2ZyYW1lLXNyYycsXG4gICdpbWctc3JjJyxcbiAgJ21hbmlmZXN0LXNyYycsXG4gICdtZWRpYS1zcmMnLFxuICAnb2JqZWN0LXNyYycsXG4gICdwcmVmZXRjaC1zcmMnLFxuICAnc2NyaXB0LXNyYycsXG4gICdzY3JpcHQtc3JjLWVsZW0nLFxuICAnc2NyaXB0LXNyYy1hdHRyJyxcbiAgJ3N0eWxlLXNyYycsXG4gICdzdHlsZS1zcmMtZWxlbScsXG4gICdzdHlsZS1zcmMtYXR0cicsXG4gICd3b3JrZXItc3JjJyxcbiAgJ2Jhc2UtdXJpJyxcbiAgJ3BsdWdpbi10eXBlcycsXG4gICdzYW5kYm94JyxcbiAgJ25hdmlnYXRlLXRvJyxcbiAgJ2Zvcm0tYWN0aW9uJyxcbiAgJ2ZyYW1lLWFuY2VzdG9ycycsXG4gICd1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJyxcbiAgJ3JlcG9ydC11cmknLFxuICAncmVwb3J0LXRvJyxcbl1cbmNvbnN0IGNzcEZldGNoID0gW1xuICAnZGVmYXVsdC1zcmMnLFxuICAnY2hpbGQtc3JjJyxcbiAgJ2Nvbm5lY3Qtc3JjJyxcbiAgJ2ZvbnQtc3JjJyxcbiAgJ2ZyYW1lLXNyYycsXG4gICdpbWctc3JjJyxcbiAgJ21hbmlmZXN0LXNyYycsXG4gICdtZWRpYS1zcmMnLFxuICAnb2JqZWN0LXNyYycsXG4gICdwcmVmZXRjaC1zcmMnLFxuICAnc2NyaXB0LXNyYycsXG4gICdzdHlsZS1zcmMnLFxuICAnd29ya2VyLXNyYycsXG5dXG5jb25zdCBjc3BFQXR0ciA9IFtcbiAgJ3NjcmlwdC1zcmMtZWxlbScsXG4gICdzY3JpcHQtc3JjLWF0dHInLFxuICAnc3R5bGUtc3JjLWVsZW0nLFxuICAnc3R5bGUtc3JjLWF0dHInLFxuXVxuY29uc3QgY3NwSW5mbyA9IHtcbiAgJ2RlZmF1bHQtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvZGVmYXVsdC1zcmMnLFxuICAgIG5vdGU6ICdpcyBhIGZhbGxiYWNrIGRpcmVjdGl2ZSBmb3IgdGhlIG90aGVyIGZldGNoIGRpcmVjdGl2ZXM6IDxiPmNoaWxkLXNyYzwvYj4sIDxiPmNvbm5lY3Qtc3JjPC9iPiwgPGI+Zm9udC1zcmM8L2I+LCA8Yj5pbWctc3JjPC9iPiwgPGI+bWFuaWZlc3Qtc3JjPC9iPiwgPGI+bWVkaWEtc3JjPC9iPiwgPGI+cHJlZmV0Y2gtc3JjPC9iPiwgPGI+b2JqZWN0LXNyYzwvYj4sIDxiPnNjcmlwdC1zcmMoc2NyaXB0LXNyYy1lbGVtLCBzY3JpcHQtc3JjLWF0dHIpPC9iPiwgPGI+c3R5bGUtc3JjKHN0eWxlLXNyYy1lbGVtLCBzdHlsZS1zcmMtYXR0cik8L2I+LidcbiAgfSxcbiAgJ2NoaWxkLXNyYyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2NoaWxkLXNyYycsXG4gICAgbm90ZTogJ2FsbG93cyB0aGUgZGV2ZWxvcGVyIHRvIGNvbnRyb2wgbmVzdGVkIGJyb3dzaW5nIGNvbnRleHRzIGFuZCB3b3JrZXIgZXhlY3V0aW9uIGNvbnRleHRzLidcbiAgfSxcbiAgJ2Nvbm5lY3Qtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvY29ubmVjdC1zcmMnLFxuICAgIG5vdGU6ICdwcm92aWRlcyBjb250cm9sIG92ZXIgZmV0Y2ggcmVxdWVzdHMsIFhIUiwgZXZlbnRzb3VyY2UsIGJlYWNvbiBhbmQgd2Vic29ja2V0cyBjb25uZWN0aW9ucy4nXG4gIH0sXG4gICdmb250LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZvbnQtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHdoaWNoIFVSTHMgdG8gbG9hZCBmb250cyBmcm9tLidcbiAgfSxcbiAgJ2ZyYW1lLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZyYW1lLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBuZXN0ZWQgYnJvd3NpbmcgY29udGV4dHMgbG9hZGluZyB1c2luZyBlbGVtZW50cyBzdWNoIGFzICZsdDtmcmFtZSZndDsgYW5kICZsdDtpZnJhbWUmZ3Q7LidcbiAgfSxcbiAgJ2ltZy1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9pbWctc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIHRoYXQgaW1hZ2VzIGNhbiBiZSBsb2FkZWQgZnJvbS4nXG4gIH0sXG4gICdtYW5pZmVzdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9tYW5pZmVzdC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgdGhhdCBhcHBsaWNhdGlvbiBtYW5pZmVzdHMgbWF5IGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ21lZGlhLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L21lZGlhLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyBmcm9tIHdoaWNoIHZpZGVvLCBhdWRpbyBhbmQgdGV4dCB0cmFjayByZXNvdXJjZXMgY2FuIGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ29iamVjdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9vYmplY3Qtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcGx1Z2lucyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xuICB9LFxuICAncHJlZmV0Y2gtc3JjJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcHJlZmV0Y2gtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIGZyb20gd2hpY2ggcmVzb3VyY2VzIGNhbiBiZSBwcmVmZXRjaGVkIGZyb20uJ1xuICB9LFxuICAnc2NyaXB0LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIGxvY2F0aW9ucyBmcm9tIHdoaWNoIGEgc2NyaXB0IGNhbiBiZSBleGVjdXRlZCBmcm9tLiBJdCBpcyBhIGZhbGxiYWNrIGRpcmVjdGl2ZSBmb3Igb3RoZXIgc2NyaXB0LWxpa2UgZGlyZWN0aXZlczogPGI+c2NyaXB0LXNyYy1lbGVtPC9iPiwgPGI+c2NyaXB0LXNyYy1hdHRyPC9iPidcbiAgfSxcbiAgJ3NjcmlwdC1zcmMtZWxlbSc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMtZWxlbScsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0ICZsdDtzY3JpcHQmZ3Q7IGVsZW1lbnRzLCBidXQgbm90IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLidcbiAgfSxcbiAgJ3NjcmlwdC1zcmMtYXR0cic6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3NjcmlwdC1zcmMtYXR0cicsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBKYXZhU2NyaXB0IGlubGluZSBldmVudCBoYW5kbGVycy4gVGhpcyBpbmNsdWRlcyBvbmx5IGlubGluZSBzY3JpcHQgZXZlbnQgaGFuZGxlcnMgbGlrZSBvbmNsaWNrLCBidXQgbm90IFVSTHMgbG9hZGVkIGRpcmVjdGx5IGludG8gJmx0O3NjcmlwdCZndDsgZWxlbWVudHMuJ1xuICB9LFxuICAnc3R5bGUtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcbiAgICBub3RlOiAnY29udHJvbHMgZnJvbSB3aGVyZSBzdHlsZXMgZ2V0IGFwcGxpZWQgdG8gYSBkb2N1bWVudC4gVGhpcyBpbmNsdWRlcyA8bGluaz4gZWxlbWVudHMsIEBpbXBvcnQgcnVsZXMsIGFuZCByZXF1ZXN0cyBvcmlnaW5hdGluZyBmcm9tIGEgTGluayBIVFRQIHJlc3BvbnNlIGhlYWRlciBmaWVsZDogPGI+c3R5bGUtc3JjLWVsZW08L2I+LCA8Yj5zdHlsZS1zcmMtYXR0cjwvYj4nXG4gIH0sXG4gICdzdHlsZS1zcmMtZWxlbSc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBzdHlsZXNoZWV0cyAmbHQ7c3R5bGUmZ3Q7IGVsZW1lbnRzIGFuZCAmbHQ7bGluayZndDsgZWxlbWVudHMgd2l0aCByZWw9XCJzdHlsZXNoZWV0XCIuJ1xuICB9LFxuICAnc3R5bGUtc3JjLWF0dHInOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgaW5saW5lIHN0eWxlcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgRE9NIGVsZW1lbnRzLidcbiAgfSxcbiAgJ3dvcmtlci1zcmMnOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS93b3JrZXItc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIFdvcmtlciwgU2hhcmVkV29ya2VyLCBvciBTZXJ2aWNlV29ya2VyIHNjcmlwdHMuJ1xuICB9LFxuICAnYmFzZS11cmknOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9iYXNlLXVyaScsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgcG9zc2libGUgVVJMcyB0aGF0IHRoZSAmbHQ7YmFzZSZndDsgZWxlbWVudCBjYW4gdXNlLidcbiAgfSxcbiAgJ3BsdWdpbi10eXBlcyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3BsdWdpbi10eXBlcycsXG4gICAgbm90ZTogJ2xpbWl0cyB0aGUgdHlwZXMgb2YgcmVzb3VyY2VzIHRoYXQgY2FuIGJlIGxvYWRlZCBpbnRvIHRoZSBkb2N1bWVudCAoZS5nLiBhcHBsaWNhdGlvbi9wZGYpLiAzIHJ1bGVzIGFwcGx5IHRvIHRoZSBhZmZlY3RlZCBlbGVtZW50cywgJmx0O2VtYmVkJmd0OyBhbmQgJmx0O29iamVjdCZndDsnLFxuICAgIGRlcHJlY2F0ZWQ6IHRydWVcbiAgfSxcbiAgJ3NhbmRib3gnOiB7XG4gICAgbGV2ZWw6ICcxLjEvMicsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zYW5kYm94JyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBwb3NzaWJsZSBVUkxzIHRoYXQgdGhlICZsdDtiYXNlJmd0OyBlbGVtZW50IGNhbiB1c2UuJ1xuICB9LFxuICAnbmF2aWdhdGUtdG8nOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9uYXZpZ2F0ZS10bycsXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB3aGljaCBhIGRvY3VtZW50IGNhbiBuYXZpZ2F0ZSB0byBieSBhbnkgbWVhbiAobm90IHlldCBzdXBwb3J0ZWQgYnkgbW9kZXJuIGJyb3dzZXJzIGluIEphbiAyMDIxKS4nXG4gIH0sXG4gICdmb3JtLWFjdGlvbic6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Zvcm0tYWN0aW9uJyxcbiAgICBub3RlOiAncmVzdHJpY3RzIHRoZSBVUkxzIHdoaWNoIHRoZSBmb3JtcyBjYW4gc3VibWl0IHRvLidcbiAgfSxcbiAgJ2ZyYW1lLWFuY2VzdG9ycyc6IHtcbiAgICBsZXZlbDogMixcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2ZyYW1lLWFuY2VzdG9ycycsXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB0aGF0IGNhbiBlbWJlZCB0aGUgcmVxdWVzdGVkIHJlc291cmNlIGluc2lkZSBvZiAmbHQ7ZnJhbWUmZ3Q7LCAmbHQ7aWZyYW1lJmd0OywgJmx0O29iamVjdCZndDssICZsdDtlbWJlZCZndDssIG9yICZsdDthcHBsZXQmZ3Q7IGVsZW1lbnRzLidcbiAgfSxcbiAgJ3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnOiB7XG4gICAgbGV2ZWw6ICc/JyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3VwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHMnLFxuICAgIG5vdGU6ICdpbnN0cnVjdHMgdXNlciBhZ2VudHMgdG8gdHJlYXQgYWxsIG9mIGEgc2l0ZVxcJ3MgaW5zZWN1cmUgVVJMcyAodGhvc2Ugc2VydmVkIG92ZXIgSFRUUCkgYXMgdGhvdWdoIHRoZXkgaGF2ZSBiZWVuIHJlcGxhY2VkIHdpdGggc2VjdXJlIFVSTHMgKHRob3NlIHNlcnZlZCBvdmVyIEhUVFBTKS4gVGhpcyBkaXJlY3RpdmUgaXMgaW50ZW5kZWQgZm9yIHdlYiBzaXRlcyB3aXRoIGxhcmdlIG51bWJlcnMgb2YgaW5zZWN1cmUgbGVnYWN5IFVSTHMgdGhhdCBuZWVkIHRvIGJlIHJld3JpdHRlbi4nXG4gIH0sXG4gICdyZXBvcnQtdXJpJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvcmVwb3J0LXVyaScsXG4gICAgbm90ZTogJ2RpcmVjdGl2ZSBpcyBkZXByZWNhdGVkIGJ5IHJlcG9ydC10bywgd2hpY2ggaXMgYSBVUkkgdGhhdCB0aGUgcmVwb3J0cyBhcmUgc2VudCB0by4nLFxuICAgIGRlcHJlY2F0ZWQ6IHRydWVcbiAgfSxcbiAgJ3JlcG9ydC10byc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3JlcG9ydC10bycsXG4gICAgbm90ZTogJ3doaWNoIGlzIGEgZ3JvdXBuYW1lIGRlZmluZWQgaW4gdGhlIGhlYWRlciBpbiBhIGpzb24gZm9ybWF0dGVkIGhlYWRlciB2YWx1ZS4nXG4gIH0sXG59XG5jb25zdCBwb2xpY3kgPSB7XG4gICdub25lJyAgOiAnV29uXFwndCBhbGxvdyBsb2FkaW5nIG9mIGFueSByZXNvdXJjZXMuJyxcbiAgJ2Jsb2I6JyA6ICdSYXcgZGF0YSB0aGF0IGlzblxcJ3QgbmVjZXNzYXJpbHkgaW4gYSBKYXZhU2NyaXB0LW5hdGl2ZSBmb3JtYXQuJyxcbiAgJ2RhdGE6JyA6ICdPbmx5IGFsbG93IHJlc291cmNlcyBmcm9tIHRoZSBkYXRhIHNjaGVtZSAoaWU6IEJhc2U2NCBlbmNvZGVkIGltYWdlcykuJyxcbiAgXCInc2VsZidcIjogJ09ubHkgYWxsb3cgcmVzb3VyY2VzIGZyb20gdGhlIGN1cnJlbnQgb3JpZ2luLicsXG4gIFwiJ3Vuc2FmZS1pbmxpbmUnXCI6ICcnLFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3NwQXJyLFxuICBjc3BJbmZvLFxuICBjc3BGZXRjaCxcbiAgY3NwRUF0dHIsXG4gIHBvbGljeSxcbn0iLCI8c2NyaXB0PlxuaW1wb3J0IHtvbk1vdW50fSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHtcbiAgY3NwQXJyLFxuICBjc3BJbmZvLFxuICBjc3BGZXRjaCxcbiAgY3NwRUF0dHIsXG59IGZyb20gJy4vQ3NwZGlyZWN0aXZlJ1xubGV0IGNzcCA9IHdpbmRvdy5taXRtLmluZm8uY3NwXG5sZXQgcmVwb3J0VG8gPSBjc3AucmVwb3J0VG9cblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGZhbGxiYWNrID0gdHJ1ZVxuICBjb25zdCB7cG9saWN5fSA9IGNzcFsnZGVmYXVsdC1zcmMnXSB8fCB7fVxuICBpZiAocG9saWN5ICYmIHBvbGljeS5sZW5ndGg+MCkge1xuICAgIGZvciAoY29uc3QgaWQgb2YgY3NwRmV0Y2gpIHtcbiAgICAgIGlmICghY3NwW2lkXSkge1xuICAgICAgICBjc3BbaWRdID0ge3BvbGljeSwgZmFsbGJhY2t9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgaWQgb2YgY3NwRUF0dHIpIHtcbiAgICBjb25zdCBwYXIgPSBpZC5yZXBsYWNlKC8tLns0fSQvLCAnJylcbiAgICBjb25zdCB7cG9saWN5fSA9IGNzcFtwYXJdIHx8IHt9XG4gICAgaWYgKCFjc3BbaWRdICYmIHBvbGljeSkge1xuICAgICAgY3NwW2lkXSA9IHtwb2xpY3ksIGZhbGxiYWNrfVxuICAgIH1cbiAgfVxuICBpZiAocmVwb3J0VG8hPT0nSlNPTiBFcnJvciEnICYmIHJlcG9ydFRvPy5sZW5ndGggPiAxNSkge1xuICAgIGxldCBjYiA9IHJlcG9ydFRvLnJlcGxhY2UoL1xcbi9nLCcnKS50cmltKClcbiAgICBpZiAoY2JbMF09PT0neycgJiYgY2Iuc2xpY2UoLTEpPT09J30nKSB7XG4gICAgICBjYiA9IEpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UoYFske2NifV1gKSwgbnVsbCwgMilcbiAgICAgIHJlcG9ydFRvID0gY2IucmVwbGFjZSgvXFxbfFxcXS9nLCAnJykucmVwbGFjZSgvXFxuICAvZywgJ1xcbicpLnRyaW0oKVxuICAgIH1cbiAgfVxufSlcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveFwiPlxuICA8Yj5Db250ZW50IFNlY3VyaXR5IFBvbGljeTwvYj5cbiAgPHA+XG4gICAgQ1NQIG9uOlxuICAgIDxhIHRhcmdldD1ibGFuayBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9DU1BcIj5Nb3ppbGxhPC9hPiwgXG4gICAgPGEgdGFyZ2V0PWJsYW5rIGhyZWY9XCJodHRwczovL2NvbnRlbnQtc2VjdXJpdHktcG9saWN5LmNvbS9cIj5jb250ZW50LXNlY3VyaXR5LXBvbGljeS5jb208L2E+LFxuICAgIDxhIHRhcmdldD1ibGFuayBocmVmPVwiaHR0cHM6Ly9jaGVhdHNoZWV0c2VyaWVzLm93YXNwLm9yZy9jaGVhdHNoZWV0cy9Db250ZW50X1NlY3VyaXR5X1BvbGljeV9DaGVhdF9TaGVldC5odG1sXCI+T1dBU1AtY2hlYXQtc2hlZXQ8L2E+XG4gIDwvcD5cbiAgPGRpdj5cbiAgICB7I2VhY2ggY3NwQXJyIGFzIGlkLCBpfVxuICAgIHsjaWYgY3NwW2lkXX0gICAgICBcbiAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5IGNsYXNzPXtjc3BbaWRdLmZhbGxiYWNrID8gJ2ZhbGxiYWNrJyA6ICcnfT5cbiAgICAgICAgeyNpZiBjc3BJbmZvW2lkXS5saW5rfVxuICAgICAgICAgIHtpKzF9LntpZH06KHtjc3BbaWRdLnBvbGljeS5sZW5ndGh9KTxhIHRhcmdldD1ibGFuayBocmVmPXtjc3BJbmZvW2lkXS5saW5rfT48c21hbGw+dntjc3BJbmZvW2lkXS5sZXZlbH08L3NtYWxsPjwvYT5cbiAgICAgICAgezplbHNlfVxuICAgICAgICAgIHtpKzF9LntpZH06KHtjc3BbaWRdLnBvbGljeS5sZW5ndGh9KTxzbWFsbD52e2NzcEluZm9baWRdLmxldmVsfTwvc21hbGw+XG4gICAgICAgIHsvaWZ9XG4gICAgICA8L3N1bW1hcnk+XG4gICAgICAgIHsjaWYgY3NwSW5mb1tpZF0ubm90ZX1cbiAgICAgICAgICA8ZGV0YWlscyBjbGFzcz1cIm5vdGVcIj48c3VtbWFyeT5leHBhbmQuLi48L3N1bW1hcnk+XG4gICAgICAgICAgICA8c21hbGw+e0BodG1sIGNzcEluZm9baWRdLm5vdGV9PC9zbWFsbD5cbiAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgIHsvaWZ9XG4gICAgICAgIHsjZWFjaCBjc3BbaWRdLnBvbGljeSBhcyBpdGVtLCB4fVxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJpdGVtXCI+e3grMX06e2l0ZW19PC9kaXY+XG4gICAgICAgIHsvZWFjaH1cbiAgICAgIDwvZGV0YWlscz5cbiAgICB7L2lmfVxuICAgIHsvZWFjaH1cbiAgICA8aHIgLz5cbiAgICA8ZGV0YWlscz48c3VtbWFyeSBjbGFzcz1cInJlcG9ydFwiPjxiPnJlcG9ydC10bzwvYj46PC9zdW1tYXJ5PlxuICAgICAgPGRldGFpbHMgY2xhc3M9XCJub3RlXCI+PHN1bW1hcnk+ZXhwYW5kLi4uPC9zdW1tYXJ5PlxuICAgICAgICA8c21hbGw+e0BodG1sICd1c2VkIHRvIHNwZWNpZnkgZGV0YWlscyBhYm91dCB0aGUgZGlmZmVyZW50IGVuZHBvaW50cyB0aGF0IGEgdXNlci1hZ2VudCBoYXMgYXZhaWxhYmxlIHRvIGl0IGZvciBkZWxpdmVyaW5nIHJlcG9ydHMgdG8uIFlvdSBjYW4gdGhlbiByZXRyaWV2ZSByZXBvcnRzIGJ5IG1ha2luZyBhIHJlcXVlc3QgdG8gdGhvc2UgVVJMcy4nfTwvc21hbGw+XG4gICAgICA8L2RldGFpbHM+XG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbVwiPntyZXBvcnRUb308L2Rpdj5cbiAgICA8L2RldGFpbHM+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+XG5kZXRhaWxzLm5vdGUge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XG4gIHN1bW1hcnkge1xuICAgIGNvbG9yOiByZWQ7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgICBtYXJnaW4tbGVmdDogLTE0cHg7XG4gICAgcGFkZGluZy1sZWZ0OiAxNHB4O1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gICAgJjo6LXdlYmtpdC1kZXRhaWxzLW1hcmtlciB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xuICAgIH1cbiAgfVxufSBcbnN1bW1hcnksLml0ZW0ge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtZmFtaWx5OiAnQ291cmllciBOZXcnLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IHNtYWxsO1xuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGJsdWU7XG4gIH1cbn1cbnN1bW1hcnkuZmFsbGJhY2sge1xuICBjb2xvcjogZGFya3JlZDtcbn1cbi5pdGVtIHtcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xuICBmb250LXNpemU6IHNtYWxsZXI7XG4gIGNvbG9yOiAjOTEwMGNkO1xufVxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCwgb25EZXN0cm95IH0gZnJvbSAnc3ZlbHRlJztcbmNvbnN0IF9jID0gJ2NvbG9yOiBibHVldmlvbGV0J1xuXG5sZXQga2V5cyA9IFtdXG4kOiBfa2V5cyA9IGtleXNcblxuZnVuY3Rpb24gcmVsb2FkS2V5cygpIHtcbiAgY29uc29sZS5sb2coJyVjUmVsb2FkIGhvdGtleXMuJywgX2MpO1xuICBjb25zdCB7bWFjcm9rZXlzOiBta2V5fSA9IHdpbmRvdy5taXRtXG4gIGtleXMgPSBbXVxuICBmb3IgKGNvbnN0IGlkIGluIG1rZXkpIHtcbiAgICBrZXlzLnB1c2goe2lkLCB0aXRsZTogbWtleVtpZF0uX3RpdGxlfSlcbiAgfVxufVxuXG5sZXQgb2JzZXJ2ZXJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zdCBxcnkgPSAnLm1pdG0tY29udGFpbmVyLmNlbnRlcidcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXJ5KVxuICBjb25zdCBub2RlVmlzaWJsZSA9IG9icyA9PiB7XG4gICAgaWYgKG5vZGUuYXR0cmlidXRlcy5zdHlsZSkge1xuICAgICAgcmVsb2FkS2V5cygpXG4gICAgfVxuICB9XG4gIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobm9kZVZpc2libGUpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHthdHRyaWJ1dGVzOiB0cnVlfSlcbiAgc2V0VGltZW91dChyZWxvYWRLZXlzLCAxMDAwKVxufSk7XG5cbm9uRGVzdHJveSgoKSA9PiB7XG4gIGlmIChvYnNlcnZlcikge1xuICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICAgIG9ic2VydmVyID0gdW5kZWZpbmVkXG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBoYW5kbGVDbGljayhlKSB7XG4gIGNvbnN0IGtleSA9IGUudGFyZ2V0LmRhdGFzZXQuaWRcbiAgY29uc3QgZm4gPSBtaXRtLm1hY3Jva2V5c1trZXldXG4gIGxldCBbdHlwLCAuLi5hcnJdID0ga2V5LnNwbGl0KCc6JylcbiAgY29uc3Qgb3B0ID0ge31cbiAgaWYgKHR5cD09PSdrZXknKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGxldCBrXG4gICAgaWYgKHFjdGwpIHtcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXG4gICAgICBrID0gcWN0bFsxXS5zdWJzdHIoLTEpXG4gICAgfSBlbHNlIGlmIChxYWx0KSB7XG4gICAgICBrLmN0cmxLZXkgPSB0cnVlXG4gICAgICBrID0gcWFsdFsxXS5zdWJzdHIoLTEpXG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXG4gICAgICBvcHQuY3RybEtleSA9IHRydWVcbiAgICAgIGsgPSBhcnIucG9wKCkuc3Vic3RyKC0xKVxuICAgIH1cbiAgICBvcHQuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5XG4gICAgb3B0LmNvZGUgPSBgS2V5JHtrLnRvVXBwZXJDYXNlKCl9YFxuICAgIG9wdC5rZXkgPSBtaXRtLmZuLmNvZGVUb0NoYXIob3B0KVxuICB9IGVsc2UgaWYgKHR5cD09PSdjb2RlJykge1xuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcbiAgICBpZiAocWN0bCkge1xuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXG4gICAgICBhcnIgPSBxY3RsWzFdLnNwbGl0KCc6JylcbiAgICB9IGVsc2UgaWYgKHFhbHQpIHtcbiAgICAgIG9wdC5hbHRLZXkgPSB0cnVlXG4gICAgICBhcnIgPSBxYWx0WzFdLnNwbGl0KCc6JylcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXG4gICAgICBvcHQuYWx0S2V5ICA9IHRydWVcbiAgICB9XG4gICAgb3B0LmNvZGUgPSBhcnIucG9wKClcbiAgICBvcHQuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5XG4gICAgb3B0LmtleSA9IG1pdG0uZm4uY29kZVRvQ2hhcihvcHQpXG4gIH1cbiAgaWYgKGZuKSB7XG4gICAgY29uc3QgbWFjcm8gPSBmbihuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIG9wdCkpXG4gICAgbWl0bS5mbi5tYWNyb0F1dG9tYXRpb24obWFjcm8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5mdW5jdGlvbiBrdG9TaG93KGspIHtcbiAgcmV0dXJuIGsuc3BsaXQoJycpLm1hcCh4PT5gJHt4fWApLmpvaW4oJyAnKVxufVxuXG5mdW5jdGlvbiBrY29kZShvYmopIHtcbiAgY29uc3Qga2V5ID0gb2JqLmlkXG4gIGNvbnN0IHtjb2RlVG9DaGFyOiBjaGFyfSA9IG1pdG0uZm5cbiAgbGV0IFt0eXAsIC4uLmFycl0gPSBrZXkuc3BsaXQoJzonKVxuICBjb25zdCBvcHQgPSB7fVxuICBsZXQgbXNnXG4gIGlmICh0eXA9PT0na2V5Jykge1xuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcbiAgICBpZiAgICAgIChxY3RsKSB7IG1zZyA9IGBjdGwgLiAuLi4g4oe+ICR7a3RvU2hvdyhxY3RsWzFdKX1gICB9XG4gICAgZWxzZSBpZiAocWFsdCkgeyBtc2cgPSBgYWx0IC4gLi4uIOKHviAke2t0b1Nob3cocWFsdFsxXSl9YCAgfVxuICAgIGVsc2UgICAgICAgICAgIHsgbXNnID0gYGN0bCArIGFsdCDih74gJHtrdG9TaG93KGFyci5wb3AoKSl9YH1cbiAgfSBlbHNlIGlmICh0eXA9PT0nY29kZScpIHtcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXG4gICAgaWYgICAgICAocWN0bCkgeyBtc2cgPSAnY3RsIC4gLi4uIOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhxY3RsWzFdKX1cbiAgICBlbHNlIGlmIChxYWx0KSB7IG1zZyA9ICdhbHQgLiAuLi4g4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KHFhbHRbMV0pfVxuICAgIGVsc2UgICAgICAgICAgIHsgbXNnID0gJ2N0bCArIGFsdCDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3coYXJyLmpvaW4oJzonKSl9XG4gIH1cbiAgcmV0dXJuIG1zZ1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxiPkhvdC1rZXlzOjwvYj5cbiAgPHRhYmxlPlxuICAgIHsjZWFjaCBfa2V5cyBhcyBvYmosaX1cbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIGNsYXNzPVwibm9cIj57aSsxfTwvdGQ+XG4gICAgICAgIDx0ZCBjbGFzcz1cImtjb2RlXCIgZGF0YS1pZD17b2JqLmlkfSBvbjpjbGljaz17aGFuZGxlQ2xpY2t9PlxuICAgICAgICAgIHtrY29kZShvYmopfVxuICAgICAgICA8L3RkPlxuICAgICAgICA8dGQgY2xhc3M9XCJ0aXRsZVwiPntvYmoudGl0bGV9PC90ZD5cbiAgICAgIDwvdHI+XG4gICAgey9lYWNofVxuICA8L3RhYmxlPlxuPC9kaXY+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+XG4gIC52Ym94IHtcbiAgICBjb2xvcjpibHVlO1xuICAgIGxlZnQ6IDA7XG4gICAgcmlnaHQ6IDA7XG4gIH1cbiAgdGFibGUge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGNvbG9yOiBtYXJvb247XG4gICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgICB0cjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE5OSwgMTY2LCAxMTYsIDAuNDUyKTtcbiAgICAgIC5rY29kZSB7XG4gICAgICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICBjb2xvcjogcmVkO1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0ZCB7XG4gICAgICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xuICAgICAgcGFkZGluZy1sZWZ0OiA1cHg7XG4gICAgfVxuICAgIC5ubyB7XG4gICAgICBwYWRkaW5nOiAwO1xuICAgICAgd2lkdGg6IDI1cHg7XG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgfVxuICAgIC5rY29kZSB7XG4gICAgICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlO1xuICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgfVxuICAgIC50aXRsZSB7XG4gICAgICBmb250LWZhbWlseTogJ0dpbGwgU2FucycsICdHaWxsIFNhbnMgTVQnLCBDYWxpYnJpLCAnVHJlYnVjaGV0IE1TJywgc2Fucy1zZXJpZjtcbiAgICAgIHdpZHRoOiA1MCU7XG4gICAgfVxuICB9XG48L3N0eWxlPiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBOb3RlOiBUaGlzIHJlZ2V4IG1hdGNoZXMgZXZlbiBpbnZhbGlkIEpTT04gc3RyaW5ncywgYnV0IHNpbmNlIHdl4oCZcmVcbi8vIHdvcmtpbmcgb24gdGhlIG91dHB1dCBvZiBgSlNPTi5zdHJpbmdpZnlgIHdlIGtub3cgdGhhdCBvbmx5IHZhbGlkIHN0cmluZ3Ncbi8vIGFyZSBwcmVzZW50ICh1bmxlc3MgdGhlIHVzZXIgc3VwcGxpZWQgYSB3ZWlyZCBgb3B0aW9ucy5pbmRlbnRgIGJ1dCBpblxuLy8gdGhhdCBjYXNlIHdlIGRvbuKAmXQgY2FyZSBzaW5jZSB0aGUgb3V0cHV0IHdvdWxkIGJlIGludmFsaWQgYW55d2F5KS5cbnZhciBzdHJpbmdPckNoYXIgPSAvKFwiKD86W15cXFxcXCJdfFxcXFwuKSpcIil8WzosXS9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ2lmeShwYXNzZWRPYmosIG9wdGlvbnMpIHtcbiAgdmFyIGluZGVudCwgbWF4TGVuZ3RoLCByZXBsYWNlcjtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgaW5kZW50ID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgWzFdLFxuICAgIHVuZGVmaW5lZCxcbiAgICBvcHRpb25zLmluZGVudCA9PT0gdW5kZWZpbmVkID8gMiA6IG9wdGlvbnMuaW5kZW50XG4gICkuc2xpY2UoMiwgLTMpO1xuICBtYXhMZW5ndGggPVxuICAgIGluZGVudCA9PT0gXCJcIlxuICAgICAgPyBJbmZpbml0eVxuICAgICAgOiBvcHRpb25zLm1heExlbmd0aCA9PT0gdW5kZWZpbmVkXG4gICAgICA/IDgwXG4gICAgICA6IG9wdGlvbnMubWF4TGVuZ3RoO1xuICByZXBsYWNlciA9IG9wdGlvbnMucmVwbGFjZXI7XG5cbiAgcmV0dXJuIChmdW5jdGlvbiBfc3RyaW5naWZ5KG9iaiwgY3VycmVudEluZGVudCwgcmVzZXJ2ZWQpIHtcbiAgICAvLyBwcmV0dGllci1pZ25vcmVcbiAgICB2YXIgZW5kLCBpbmRleCwgaXRlbXMsIGtleSwga2V5UGFydCwga2V5cywgbGVuZ3RoLCBuZXh0SW5kZW50LCBwcmV0dGlmaWVkLCBzdGFydCwgc3RyaW5nLCB2YWx1ZTtcblxuICAgIGlmIChvYmogJiYgdHlwZW9mIG9iai50b0pTT04gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgb2JqID0gb2JqLnRvSlNPTigpO1xuICAgIH1cblxuICAgIHN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG9iaiwgcmVwbGFjZXIpO1xuXG4gICAgaWYgKHN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIGxlbmd0aCA9IG1heExlbmd0aCAtIGN1cnJlbnRJbmRlbnQubGVuZ3RoIC0gcmVzZXJ2ZWQ7XG5cbiAgICBpZiAoc3RyaW5nLmxlbmd0aCA8PSBsZW5ndGgpIHtcbiAgICAgIHByZXR0aWZpZWQgPSBzdHJpbmcucmVwbGFjZShcbiAgICAgICAgc3RyaW5nT3JDaGFyLFxuICAgICAgICBmdW5jdGlvbiAobWF0Y2gsIHN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICByZXR1cm4gc3RyaW5nTGl0ZXJhbCB8fCBtYXRjaCArIFwiIFwiO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgaWYgKHByZXR0aWZpZWQubGVuZ3RoIDw9IGxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcHJldHRpZmllZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVwbGFjZXIgIT0gbnVsbCkge1xuICAgICAgb2JqID0gSlNPTi5wYXJzZShzdHJpbmcpO1xuICAgICAgcmVwbGFjZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgJiYgb2JqICE9PSBudWxsKSB7XG4gICAgICBuZXh0SW5kZW50ID0gY3VycmVudEluZGVudCArIGluZGVudDtcbiAgICAgIGl0ZW1zID0gW107XG4gICAgICBpbmRleCA9IDA7XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgc3RhcnQgPSBcIltcIjtcbiAgICAgICAgZW5kID0gXCJdXCI7XG4gICAgICAgIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGl0ZW1zLnB1c2goXG4gICAgICAgICAgICBfc3RyaW5naWZ5KG9ialtpbmRleF0sIG5leHRJbmRlbnQsIGluZGV4ID09PSBsZW5ndGggLSAxID8gMCA6IDEpIHx8XG4gICAgICAgICAgICAgIFwibnVsbFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnQgPSBcIntcIjtcbiAgICAgICAgZW5kID0gXCJ9XCI7XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpbmRleF07XG4gICAgICAgICAga2V5UGFydCA9IEpTT04uc3RyaW5naWZ5KGtleSkgKyBcIjogXCI7XG4gICAgICAgICAgdmFsdWUgPSBfc3RyaW5naWZ5KFxuICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICBuZXh0SW5kZW50LFxuICAgICAgICAgICAga2V5UGFydC5sZW5ndGggKyAoaW5kZXggPT09IGxlbmd0aCAtIDEgPyAwIDogMSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpdGVtcy5wdXNoKGtleVBhcnQgKyB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBbc3RhcnQsIGluZGVudCArIGl0ZW1zLmpvaW4oXCIsXFxuXCIgKyBuZXh0SW5kZW50KSwgZW5kXS5qb2luKFxuICAgICAgICAgIFwiXFxuXCIgKyBjdXJyZW50SW5kZW50XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfSkocGFzc2VkT2JqLCBcIlwiLCAwKTtcbn07XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHN0cmluZ2lmeSBmcm9tIFwianNvbi1zdHJpbmdpZnktcHJldHR5LWNvbXBhY3RcIjtcblxuZXhwb3J0IGxldCBnZW5lcmFsID0ge31cbmV4cG9ydCBsZXQganNvbiA9IHt9XG5cbmxldCBrZXlzID0gT2JqZWN0LmtleXMoanNvbikgXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1zdi1pdGVtPlxueyNlYWNoIGtleXMgYXMga2V5fVxuPGRldGFpbHMgY2xhc3M9J3N2LWRhdGEgc3Yte2tleX0gc3R7TWF0aC50cnVuYyhnZW5lcmFsLnN0YXR1cy8xMDApfXgnPlxuICA8c3VtbWFyeSBjbGFzcz1zdi10aXRsZT57a2V5fTwvc3VtbWFyeT5cbiAgPHByZSBjbGFzcz1zdi17Z2VuZXJhbC5leHR9PntzdHJpbmdpZnkoanNvbltrZXldKX08L3ByZT5cbjwvZGV0YWlscz5cbnsvZWFjaH1cbjwvZGl2PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi5zdi1pdGVtIHtcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xufVxuLnN2LXRpdGxlLCBwcmUge1xuICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xuICBmb250LXNpemU6IHNtYWxsO1xuICBtYXJnaW46IDA7XG4gICYuc3YtaHRtbCB7XG4gICAgZm9udC1zaXplOiB4LXNtYWxsO1xuICB9XG59XG4uc3YtdGl0bGU6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcbn1cbi5zdi1yZXNwQm9keSB7XG4gIGNvbG9yOiBibHVldmlvbGV0O1xuICBmb250LXdlaWdodDogNjAwO1xuICAmOmlzKC5zdDR4LC5zdDV4KSB7XG4gICAgY29sb3I6IHJlZDtcbiAgfVxufVxuLnN2LXJlcXNCb2R5IHtcbiAgY29sb3I6IG1lZGl1bXZpb2xldHJlZDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50LCBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xuICBpbXBvcnQgSnNvbiBmcm9tICcuL0pzb24uc3ZlbHRlJztcblxuICBsZXQgbHN0ID0ge31cbiAgbGV0IG9iaiA9IHtyb3dzOiBbXX1cbiAgbGV0IHF1ZXJ5PSBmYWxzZTtcbiAgbGV0IHBhdGggPSB0cnVlO1xuICBsZXQgYm9keSA9IHRydWU7XG4gIFxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByb3dzID0gKHdpbmRvdy5pbm5lckhlaWdodC0xMDApLzE3LjVcbiAgICBjb25zb2xlLmxvZyh7cm93c30pXG4gICAgY29uc3QgX2xpbWl0XyA9IHJvd3NcbiAgICBjb25zdCBfY291bnRfID0ge3RvdGFsOidpZCd9XG4gICAgY29uc3QgX2Rpc3RpbmN0XyA9IFsnc2Vzc2lvbiddXG4gICAgY29uc3QgX3doZXJlXz0gJ2lkPjAgb3JkZXJieSBpZDpkJ1xuICAgIG9iaiA9IGF3YWl0IG1pdG0uZm4uc3FsTGlzdCh7X2NvdW50XywgX2Rpc3RpbmN0XywgX3doZXJlXywgX2xpbWl0X30sICdsb2cnKVxuICAgIG9iai5yb3dzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBsc3RbaXRlbS5zZXNzaW9uXSA9IFtdXG4gICAgfSk7XG4gIH0pXG5cbiAgYXN5bmMgZnVuY3Rpb24gZGV0YWlsQ2xpY2soZSkge1xuICAgIGNvbnN0IHNzID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc3NcbiAgICBpZiAoIWxzdFtzc10/Lmxlbmd0aCkge1xuICAgICAgY29uc3Qgb2JqID0gYXdhaXQgbWl0bS5mbi5zcWxMaXN0KHtfd2hlcmVfOiBgc2Vzc2lvbj0ke3NzfSBvcmRlcmJ5IGlkYH0sICdsb2cnKVxuICAgICAgbHN0W3NzXSA9IG9iai5yb3dzLm1hcCh4ID0+IHtcbiAgICAgICAgeC5tZXRhID0gSlNPTi5wYXJzZSh4Lm1ldGEpXG4gICAgICAgIGlmICh4Lm1ldGEuZ2VuZXJhbC5leHQ9PT0nanNvbicpIHtcbiAgICAgICAgICB4LmRhdGEgPSBKU09OLnBhcnNlKHguZGF0YSlcbiAgICAgICAgICBkZWxldGUgeC5kYXRhLmdlbmVyYWxcbiAgICAgICAgICBpZiAoeC5tZXRhLmdlbmVyYWwubWV0aG9kPT09J0dFVCcpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB4LmRhdGEucmVxc0JvZHlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHhcbiAgICAgIH0pXG4gICAgICBjb25zb2xlLmxvZyhzcywgb2JqLnJvd3MpXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gZXhwQ2xpY2soZSkge1xuICAgIGlmIChib2R5KSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gZS5jdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAoZGV0YWlscy5hdHRyaWJ1dGVzLm9wZW4pIHtcbiAgICAgICAgICBkZXRhaWxzLmNoaWxkcmVuWzJdLnNldEF0dHJpYnV0ZSgnb3BlbicsJycpXG4gICAgICAgICAgY29uc3QgYXJyMSA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LUdFVCwubXQtREVMRVRFKSBkZXRhaWxzOmlzKC5zdi1yZXNwQm9keSwuc3YtcmVzcEhlYWRlciknKVxuICAgICAgICAgIGNvbnN0IGFycjIgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1QVVQsLm10LVBPU1QpIGRldGFpbHM6aXMoLnN2LXJlcXNCb2R5KScpXG4gICAgICAgICAgY29uc3QgYXJyMyA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LVJFRElSRUNUKSBkZXRhaWxzOmlzKC5zdi1yZXNwSGVhZGVyKScpXG4gICAgICAgICAgY29uc3QgYXJyNCA9IGRldGFpbHMucXVlcnlTZWxlY3RvckFsbCgnLnN2LWNvbnRlbnQ6aXMoLm10LUVSUk9SKSBkZXRhaWxzOmlzKC5zdi1yZXNwQm9keSknKVxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIxKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMikgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjMpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnI0KSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cbiAgICAgICAgfVxuICAgICAgfSwgMCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaG9zdCh1cmwpIHtcbiAgICBjb25zdCBvYmogPSBuZXcgVVJMKHVybClcbiAgICBsZXQgbXNnID0gcGF0aCA/IG9iai5wYXRobmFtZSA6IG9iai5vcmlnaW4gKyBvYmoucGF0aG5hbWVcbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIG1zZyArPSBvYmouc2VhcmNoXG4gICAgfVxuICAgIHJldHVybiBtc2cubGVuZ3RoPjkwID8gbXNnLnNsaWNlKDAsIDkwKSsnLi4uJyA6IG1zZ1xuICB9XG5cbiAgZnVuY3Rpb24gZXJyX21ldGhvZChpMikge1xuICAgIGNvbnN0IHttZXRob2QsIHN0YXR1c30gPSBpMi5tZXRhLmdlbmVyYWxcbiAgICBjb25zdCBzdCA9IE1hdGgudHJ1bmMoc3RhdHVzLzEwMClcbiAgICBpZiAoc3Q9PT0zKSB7XG4gICAgICByZXR1cm4gJ210LVJFRElSRUNUJ1xuICAgIH0gZWxzZSBpZiAoc3Q+Mykge1xuICAgICAgcmV0dXJuICdtdC1FUlJPUidcbiAgICB9XG4gICAgcmV0dXJuIGBtdC0ke21ldGhvZH1gIFxuICB9XG48L3NjcmlwdD5cblxuPGRpdj5cbjxiPlNxbGl0ZSBMb2dzITwvYj5cbjxsYWJlbCBmb3I9c3YtYm9keT5cbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3YtYm9keSBiaW5kOmNoZWNrZWQ9e2JvZHl9IC8+ZXhwLWJvZHlcbjwvbGFiZWw+XG48bGFiZWwgZm9yPXN2LW5vLWhvc3Q+XG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LW5vLWhvc3QgYmluZDpjaGVja2VkPXtwYXRofSAvPm5vLWhvc3RcbjwvbGFiZWw+XG48bGFiZWwgZm9yPXN2LXF1ZXJ5PlxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1xdWVyeSBiaW5kOmNoZWNrZWQ9e3F1ZXJ5fSAvPnF1ZXJ5XG48L2xhYmVsPlxueyNlYWNoIG9iai5yb3dzIGFzIGl0ZW19XG4gIDxkZXRhaWxzIGNsYXNzPXN2LXNlc3Npb24gZGF0YS1zcz17aXRlbS5zZXNzaW9ufSBvbjpjbGljaz17ZGV0YWlsQ2xpY2t9PlxuICAgIDxzdW1tYXJ5IGNsYXNzPXN2LW1haW4+XG4gICAgICB7aXRlbS5zZXNzaW9ufTxzcGFuIGNsYXNzPXN2LXRvdGFsPih7aXRlbS50b3RhbH0pPC9zcGFuPlxuICAgIDwvc3VtbWFyeT5cbiAgICB7I2lmIGxzdFtpdGVtLnNlc3Npb25dLmxlbmd0aH1cbiAgICAgIHsjZWFjaCBsc3RbaXRlbS5zZXNzaW9uXSBhcyBpMn1cbiAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvd3MnPlxuICAgICAgICAgIDxzdW1tYXJ5IFxuICAgICAgICAgIGRhdGEtaWQ9e2kyLmlkfVxuICAgICAgICAgIGRhdGEtc3M9e2l0ZW0uc2Vzc2lvbn1cbiAgICAgICAgICBjbGFzcz0nc3YtdGl0bGUgc3R7TWF0aC50cnVuYyhpMi5tZXRhLmdlbmVyYWwuc3RhdHVzLzEwMCl9eCdcbiAgICAgICAgICBvbjpjbGljaz17ZXhwQ2xpY2t9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5zdGF0dXN9PntpMi5tZXRhLmdlbmVyYWwuc3RhdHVzfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPXN2LXtpMi5tZXRhLmdlbmVyYWwubWV0aG9kfT57aTIubWV0YS5nZW5lcmFsLm1ldGhvZC5wYWRFbmQoNCwnLicpfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPXN2LXtwYXRoPydwYXRoJzonZnVsbHBhdGgnfT57aG9zdChpMi51cmwsIHBhdGgsIHF1ZXJ5KX08L3NwYW4+XG4gICAgICAgICAgPC9zdW1tYXJ5PlxuICAgICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3ctZGF0YSBzdi1oZWFkZXInPlxuICAgICAgICAgICAgPHN1bW1hcnkgY2xhc3M9J3N2LXRpdGxlIHN2LWhlYWRlcic+aGVhZGVyPC9zdW1tYXJ5PlxuICAgICAgICAgICAgPEpzb24ganNvbj17aTIubWV0YX0vPlxuICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgICA8ZGV0YWlscyBjbGFzcz0nc3Ytcm93LWRhdGEgc3YtY29udGVudCB7ZXJyX21ldGhvZChpMil9Jz5cbiAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzPSdzdi10aXRsZSBzdi1jb250ZW50Jz5jb250ZW50PC9zdW1tYXJ5PlxuICAgICAgICAgICAgeyNpZiBpMi5tZXRhLmdlbmVyYWwuZXh0PT09J2pzb24nfVxuICAgICAgICAgICAgICA8SnNvbiBqc29uPXtpMi5kYXRhfSBnZW5lcmFsPXtpMi5tZXRhLmdlbmVyYWx9IC8+XG4gICAgICAgICAgICB7OmVsc2V9XG4gICAgICAgICAgICAgIDxwcmUgY2xhc3M9c3Yte2kyLm1ldGEuZ2VuZXJhbC5leHR9PntpMi5kYXRhfTwvcHJlPlxuICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgIDwvZGV0YWlscz4gICAgICAgIFxuICAgICAgey9lYWNofVxuICAgIHs6ZWxzZX1cbiAgICAgIGxvYWRpbmctMS4uLiAgICAgICAgICBcbiAgICB7L2lmfVxuICA8L2RldGFpbHM+XG57L2VhY2h9XG48L2Rpdj5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG5bdHlwZT1jaGVja2JveF0ge1xuICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xufVxuLnN2LXNlc3Npb24ge1xuICBzdW1tYXJ5IHtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgJi5zdi1tYWluOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xuICAgIH1cbiAgfVxufVxuLnN2LXJvd3Mge1xuICBwYWRkaW5nLWxlZnQ6IDE2cHg7XG59XG4uc3Ytcm93LWRhdGEge1xuICBwYWRkaW5nLWxlZnQ6IDE0cHg7XG59XG4uc3YtdG90YWwge1xuICBmb250LXNpemU6IHgtc21hbGw7XG4gIHZlcnRpY2FsLWFsaWduOiB0ZXh0LXRvcDtcbiAgY29sb3I6IGRhcmttYWdlbnRhO1xufVxuLnN2LXRpdGxlLCAuc3Ytcm93LWRhdGEgcHJlIHtcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogc21hbGw7XG4gIG1hcmdpbjogMDtcbiAgJi5zdi1odG1sIHtcbiAgICBmb250LXNpemU6IHgtc21hbGw7XG4gIH1cbn1cbnN1bW1hcnk6aXMoLnN0MngpIHtcbiAgY29sb3I6IzMwMDQ3ZTtcbn1cbnN1bW1hcnk6aXMoLnN0M3gsLnN0NHgsLnN0NXgpIHtcbiAgY29sb3I6ICNiNDAwMDA7XG59XG4uc3YtUE9TVCwuc3YtUFVUIHtcbiAgY29sb3I6IGNyaW1zb247XG59XG4uc3YtREVMRVRFIHtcbiAgY29sb3I6IHJlZFxufVxuLnN2LXBhdGgge1xuICBjb2xvcjogZGFya2dyZWVuO1xufVxuLnN2LWZ1bGxwYXRoIHtcbiAgY29sb3I6IGRhcmttYWdlbnRhO1xufVxuLnN2LXRpdGxlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG59XG48L3N0eWxlPlxuIiwiLy8gZmVhdDogc3ZlbHRlIHJlbGF0ZWRcbmNvbnN0IHtkZWZhdWx0OiBBMTF5UG9wdXB9ID0gcmVxdWlyZSgnLi9BMTF5UG9wdXAuc3ZlbHRlJylcbmNvbnN0IHtkZWZhdWx0OiBDc3BoZWFkZXJ9ID0gcmVxdWlyZSgnLi9Dc3BoZWFkZXIuc3ZlbHRlJylcbmNvbnN0IHtkZWZhdWx0OiBIb3RrZXlzfSAgID0gcmVxdWlyZSgnLi9Ib3RrZXlzLnN2ZWx0ZScpXG5jb25zdCB7ZGVmYXVsdDogU3FsaXRlfSAgICA9IHJlcXVpcmUoJy4vc3FsaXRlLnN2ZWx0ZScpXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQTExeVBvcHVwLFxuICBDc3BoZWFkZXIsXG4gIEhvdGtleXMsXG4gIFNxbGl0ZVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfcG9zdG1lc3NhZ2UgPSByZXF1aXJlKCcuL193c19wb3N0bWVzc2FnZScpXG5jb25zdCBfd3NfaW5pdFNvY2tldCA9IHJlcXVpcmUoJy4vX3dzX2luaXQtc29ja2V0JylcbmNvbnN0IF93c19zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fd3Nfc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbG9jYXRpb24gPSByZXF1aXJlKCcuL193c19sb2NhdGlvbicpXG5jb25zdCBfd3Nfb2JzZXJ2ZXIgPSByZXF1aXJlKCcuL193c19vYnNlcnZlcicpXG5jb25zdCBfd3NfZ2VuZXJhbCA9IHJlcXVpcmUoJy4vX3dzX2dlbmVyYWwnKVxuY29uc3QgX3dzX2NzcEVyciA9IHJlcXVpcmUoJy4vX3dzX2NzcC1lcnInKVxuY29uc3QgX3dzX21hY3JvcyA9IHJlcXVpcmUoJy4vX3dzX21hY3JvcycpXG5jb25zdCBfYyA9ICdjb2xvcjogcmVkJ1xuXG5fd3NfcG9zdG1lc3NhZ2UoKVxuX3dzX2luaXRTb2NrZXQoKVxuX3dzX3NjcmVlbnNob3QoKVxuX3dzX2xvY2F0aW9uKClcbl93c19vYnNlcnZlcigpXG5fd3NfZ2VuZXJhbCgpXG5fd3NfY3NwRXJyKClcbl93c19tYWNyb3MoKVxuY29uc29sZS5sb2coJyVjV3M6IHdzLWNsaWVudCBsb2FkZWQuLi4nLCBfYylcbndpbmRvdy5taXRtLnN2ZWx0ZSA9IHJlcXVpcmUoJy4uL19zdmVsdGUnKVxuIl0sIm5hbWVzIjpbIl93c19wb3N0bWVzc2FnZSIsIl9jIiwiX3dzX2NsaWVudCIsInJlcXVpcmUkJDAiLCJfd3NfbXNnUGFyc2VyIiwiX3dzX2luSWZyYW1lIiwiX3dzX3ZlbmRvciIsInJlcXVpcmUkJDEiLCJyZXF1aXJlJCQyIiwiX3dzX2luaXRTb2NrZXQiLCJfc2NyZWVuc2hvdCIsIl93c19uYW1lc3BhY2UiLCJfd3Nfc2NyZWVuc2hvdCIsInBsYXkiLCJzcWxpdGUiLCJyZXF1aXJlJCQzIiwibG9jYXRpb24iLCJpbml0IiwiX3dzX2xvY2F0aW9uIiwiX3dzX2RlYm91bmNlIiwiX3dzX3JvdXRlIiwicmVxdWlyZSQkNCIsIl93c19vYnNlcnZlciIsIl93c19nZW5lcmFsIiwiX3dzX2NzcEVyciIsIl93c19tYWNyb3MiLCJjc3BJbmZvIiwiY3NwQXJyIiwiY3NwRmV0Y2giLCJjc3BFQXR0ciIsInN0cmluZ2lmeSIsInJlcXVpcmUkJDUiLCJyZXF1aXJlJCQ2IiwicmVxdWlyZSQkNyIsInJlcXVpcmUkJDgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0FDQUEsaUJBQWMsR0FBRyxNQUFNO0NBQ3ZCLEVBQUUsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFO0NBQ2xDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7Q0FDeEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBQztDQUM3RixL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QUFDLEVBQUUsR0FBRztDQUNSLEVBQUUsQ0FBQyxFQUFFLEdBQUc7Q0FDUixFQUFFLENBQUMsRUFBRSxHQUFHO0NBQ1IsRUFBRSxFQUFFLEVBQUUsR0FBRztDQUNULEVBQUM7QUFDRDtDQUNBLE1BQU0sS0FBSyxHQUFHO0NBQ2QsRUFBRSxHQUFHLE1BQU07Q0FDWCxFQUFFLEtBQUssRUFBRSxPQUFPO0NBQ2hCLEVBQUUsUUFBUSxFQUFFLE1BQU07Q0FDbEIsRUFBRSxTQUFTLEVBQUUsSUFBSTtDQUNqQixFQUFFLE1BQU0sRUFBRSxLQUFLO0NBQ2YsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsR0FBRyxFQUFFLEtBQUs7Q0FDWixFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7Q0FDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0NBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtDQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7Q0FDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0NBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtDQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7Q0FDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0NBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtDQUNYLEVBQUUsR0FBRyxFQUFFLEtBQUs7Q0FDWixFQUFFLEdBQUcsRUFBRSxLQUFLO0NBQ1osRUFBRSxHQUFHLEVBQUUsS0FBSztDQUNaLEVBQUUsR0FBRyxFQUFFLEtBQUs7Q0FDWixFQUFFLElBQUksRUFBRSxNQUFNO0NBQ2QsRUFBRSxPQUFPLEtBQUssR0FBRztDQUNqQixFQUFFLFNBQVMsR0FBRyxHQUFHO0NBQ2pCLEVBQUUsU0FBUyxHQUFHLEdBQUc7Q0FDakIsRUFBRSxVQUFVLEVBQUUsR0FBRztDQUNqQixFQUFFLE1BQU0sSUFBSSxLQUFLO0NBQ2pCLEVBQUUsTUFBTSxJQUFJLE1BQU07Q0FDbEIsRUFBRSxRQUFRLEVBQUUsTUFBTTtDQUNsQixFQUFDO0FBQ0Q7Q0FDQSxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO0NBQy9DLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFHO0NBQzlCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUc7Q0FDeEIsRUFBRSxJQUFJLE1BQUs7Q0FDWCxFQUFFLElBQUksSUFBSSxHQUFHLEdBQUU7Q0FDZixFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBQztDQUM5QixFQUFFLElBQUksS0FBSyxFQUFFO0NBQ2IsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRTtDQUN0QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUU7Q0FDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRTtDQUMvQixLQUFLO0NBQ0wsR0FBRyxNQUFNO0NBQ1QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBQztDQUMzQyxJQUFJLElBQUksS0FBSyxFQUFFO0NBQ2YsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRTtDQUN4QixNQUFNLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxFQUFFO0NBQ2pDLFFBQVEsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUM7Q0FDM0IsT0FBTztDQUNQLEtBQUssTUFBTTtDQUNYLE1BQU0sSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7Q0FDakMsUUFBUSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBQztDQUMzQixPQUFPLE1BQU07Q0FDYixRQUFRLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFDO0NBQzNCLE9BQU87Q0FDUCxLQUFLO0NBQ0wsR0FBRztDQUNILEVBQUUsT0FBTyxJQUFJO0NBQ2IsQ0FBQztBQUNEO0NBQ0EsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFO0NBQzNCLEVBQUUsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Q0FDakMsSUFBSSxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN4QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0NBQ2QsQ0FBQztBQUNEO0NBQ0EsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLFdBQVU7Q0FDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLFdBQVU7S0FDdEMsU0FBYyxHQUFHO0NBQ2pCLEVBQUUsVUFBVTtDQUNaLEVBQUUsTUFBTTtDQUNSLEVBQUUsTUFBTTtDQUNSLEVBQUUsTUFBTTtDQUNSLEVBQUUsS0FBSztDQUNQOztDQ3hKQSxNQUFNTCxZQUFVLEdBQUdILGFBQXVCO0NBQzFDLE1BQU1GLElBQUUsR0FBRyxpQkFBZ0I7QUFDM0I7Q0FDQSxTQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUU7Q0FDckIsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRTtDQUMvQyxJQUFJLElBQUk7Q0FDUixNQUFNLE1BQU0sTUFBTSxHQUFHO0NBQ3JCLFFBQVEsTUFBTSxFQUFFLE1BQU07Q0FDdEIsUUFBUSxPQUFPLEVBQUU7Q0FDakIsWUFBWSxRQUFRLEVBQUUsa0JBQWtCO0NBQ3hDLFlBQVksY0FBYyxFQUFFLGtCQUFrQjtDQUM5QyxTQUFTO0NBQ1QsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Q0FDbEMsUUFBTztDQUNQLE1BQU0sS0FBSyxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQztDQUMzQyxPQUFPLElBQUksQ0FBQyxTQUFTLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUMsQ0FBQyxDQUFDO0NBQzNELE9BQU8sSUFBSSxDQUFDLFNBQVMsSUFBSSxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBQyxZQUFZLEVBQUM7Q0FDM0QsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFO0NBQ3BCLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBQztDQUNuQixLQUFLO0NBQ0wsR0FBRyxDQUFDO0NBQ0osQ0FBQztBQUNEO0NBQ0EsU0FBUyxLQUFLLENBQUMsSUFBSSxFQUFFO0NBQ3JCLEVBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxTQUFTLE9BQU8sRUFBRSxNQUFNLEVBQUU7Q0FDL0MsSUFBSSxJQUFJO0NBQ1IsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0NBQ2hELEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRTtDQUNwQixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUM7Q0FDbkIsS0FBSztDQUNMLEdBQUcsQ0FBQztDQUNKLENBQUM7QUFDRDtDQUNBLGVBQWVZLE1BQUksRUFBRSxRQUFRLEVBQUU7Q0FDL0IsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUk7Q0FDOUIsRUFBRSxJQUFJLFFBQVEsRUFBRTtDQUNoQixJQUFJLElBQUksUUFBUSxRQUFRLENBQUMsS0FBSyxVQUFVLEVBQUU7Q0FDMUMsTUFBTSxRQUFRLEdBQUcsUUFBUSxHQUFFO0NBQzNCLEtBQUs7Q0FDTCxJQUFJLE1BQU0sT0FBTyxHQUFHUCxZQUFVLEdBQUU7Q0FDaEMsSUFBSSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTTtDQUNqQyxJQUFJLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUM7Q0FDdEMsSUFBSSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFDO0NBQ3hDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUM7Q0FDcEQsSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQztDQUNqRixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRUwsSUFBRSxFQUFDO0NBQ3ZDLElBQUksSUFBSSxPQUFNO0NBQ2QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7Q0FDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFDO0NBQ2pDLEtBQUssTUFBTTtDQUNYLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssRUFBQztDQUNqQyxLQUFLO0NBQ0wsSUFBSSxPQUFPLE1BQU07Q0FDakIsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLFNBQVNhLFFBQU0sR0FBRztDQUNsQixFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFVBQVM7Q0FDakMsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRTtDQUMvQyxJQUFJLElBQUk7Q0FDUixNQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFDO0NBQ3RCLE1BQU0sSUFBSSxHQUFHLEVBQUU7Q0FDZixRQUFRLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBRztDQUN0QixPQUFPO0NBQ1AsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0NBQ3pDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRTtDQUNwQixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUM7Q0FDbkIsS0FBSztDQUNMLEdBQUcsQ0FBQztDQUNKLENBQUM7QUFDRDtDQUNBLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUtBLFFBQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBQztDQUM5RCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxLQUFLQSxRQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUM7Q0FDOUQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBS0EsUUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFDO0NBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUtBLFFBQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBQztBQUM5RDtLQUNBLFFBQWMsR0FBR0Q7Ozs7Q0MzRWpCO0NBQ0EsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBR1YsVUFBc0I7Q0FDaEQsTUFBTVEsZUFBYSxHQUFHSixnQkFBMEI7Q0FDaEQsTUFBTUQsWUFBVSxHQUFHRSxhQUF1QjtDQUMxQyxNQUFNLElBQUksR0FBR08sU0FBcUI7Q0FDbEMsTUFBTWQsSUFBRSxHQUFHLGlCQUFnQjtDQUMzQixNQUFNLFNBQVMsSUFBSSxHQUFFO0NBQ3JCLE1BQU0sU0FBUyxJQUFJLEdBQUU7Q0FDckIsTUFBTSxVQUFVLEdBQUcsR0FBRTtDQUNyQixNQUFNLFdBQVcsRUFBRSxHQUFFO0NBQ3JCLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxFQUFDO0FBQ0Y7Q0FDQSxJQUFJLFNBQVMsR0FBRztDQUNoQixFQUFFLElBQUksRUFBRSxFQUFFO0NBQ1YsRUFBRSxJQUFJLEVBQUUsRUFBRTtDQUNWLEVBQUUsS0FBSyxFQUFFLEVBQUU7Q0FDWCxFQUFFLE1BQU0sRUFBRSxFQUFFO0NBQ1osRUFBQztDQUVELElBQUksTUFBTSxHQUFHO0NBQ2IsRUFBRSxLQUFLLEVBQUUsRUFBRTtDQUNYLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDVixFQUFFLElBQUksRUFBRSxFQUFFO0NBQ1YsRUFBQztBQUNEO0NBQ0EsU0FBUyxJQUFJLENBQUMsRUFBRSxFQUFFO0NBQ2xCLEVBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztDQUN4RCxDQUNBO0NBQ0EsU0FBUyxPQUFPLEVBQUUsT0FBTyxFQUFFO0NBQzNCLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxFQUFDO0NBQ2hFLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFDO0NBQ3pELEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7Q0FDdEIsQ0FBQztBQUNEO0NBQ0EsU0FBUyxZQUFZLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtDQUNwQyxFQUFFLEtBQUssTUFBTSxFQUFFLElBQUksT0FBTyxFQUFFO0NBQzVCLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBQztDQUNqRSxJQUFJLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFDO0NBQ2hELElBQUksTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBQztDQUMzQixJQUFJLEdBQUcsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUk7Q0FDN0IsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFDO0NBQ3JCLE1BQU0sSUFBSSxHQUFHLFlBQVksT0FBTyxFQUFFO0NBQ2xDLFFBQVEsR0FBRyxHQUFHLE1BQU0sSUFBRztDQUN2QixPQUFPO0NBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Q0FDOUIsUUFBUSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUM7Q0FDdkIsT0FBTztDQUNQLE1BQUs7Q0FDTCxJQUFJLEdBQUcsQ0FBQyxTQUFTLEdBQUcsUUFBTztDQUMzQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBQztDQUNqQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDO0NBQy9CLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBQztDQUN0QyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxJQUFJLEtBQUssR0FBRyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFDO0NBQ3BFLElBQUksSUFBSSxHQUFHLEdBQUcsTUFBTSxFQUFFO0NBQ3RCLE1BQU0sTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7Q0FDL0MsTUFBTSxFQUFFLENBQUMsU0FBUyxHQUFHLFNBQVE7Q0FDN0IsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBQztDQUNqQyxNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFDO0NBQ2xDLEtBQUssTUFBTTtDQUNYLE1BQU0sTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUM7Q0FDL0MsTUFBTSxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBQztDQUMxQixNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFDO0NBQ2xDLEtBQUs7Q0FDTCxHQUFHO0NBQ0gsQ0FBQztBQUNEO0NBQ0EsU0FBUyxVQUFVLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRTtDQUN4QyxFQUFFLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0NBQ3hCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFFO0NBQ25DLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUM7Q0FDbkMsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLFNBQVMsY0FBYyxHQUFHO0NBQzFCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU07Q0FDMUQsRUFBRSxNQUFNLEdBQUcsSUFBSSx3QkFBdUI7Q0FDdEMsRUFBRSxNQUFNLEtBQUssR0FBRztDQUNoQixJQUFJLFFBQVE7Q0FDWixJQUFJLFNBQVM7Q0FDYixJQUFJLFNBQVM7Q0FDYixJQUFJLFVBQVU7Q0FDZCxJQUFHO0NBQ0gsRUFBRSxNQUFNLEtBQUssR0FBRztDQUNoQjtDQUNBLElBQUksVUFBVTtDQUNkLElBQUksV0FBVztDQUNmLElBQUksZUFBZTtDQUNuQixJQUFHO0NBQ0gsRUFBRSxNQUFNLFFBQVEsR0FBRztDQUNuQixJQUFJLGdCQUFnQixFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtDQUN2QyxJQUFHO0NBQ0gsRUFBRSxNQUFNLElBQUksR0FBRztDQUNmLElBQUksV0FBVyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFDLENBQUM7Q0FDOUQsSUFBSSxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssa0JBQWtCLEVBQUMsQ0FBQztDQUM5RCxJQUFJLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsZ0JBQWUsQ0FBQztDQUM5RCxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSywwQkFBeUIsQ0FBQztDQUM5RCxJQUFJLE9BQU8sSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLGdDQUErQixDQUFDO0NBQzlELElBQUksT0FBTyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRSxDQUFDO0NBQzlELElBQUc7Q0FDSCxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLEdBQUcsa0JBQWlCO0NBQzlDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxjQUFhO0NBQzFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sR0FBRyxvQkFBbUI7Q0FDaEQsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLHFCQUFvQjtDQUNqRCxFQUFFLElBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsbUJBQWtCO0NBQy9DLEVBQUUsSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxvQkFBbUI7Q0FDaEQsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUk7Q0FDdkIsQ0FBQztBQUNEO0NBQ0EsSUFBSSxPQUFNO0NBQ1YsSUFBSSxTQUFRO0NBQ1osSUFBSSxLQUFLLEdBQUcsR0FBRTtBQUNkO0NBQ0EsZUFBZSxTQUFTLEVBQUUsS0FBSyxFQUFFO0NBQ2pDLEVBQUUsTUFBTSxTQUFTLEdBQUdVLGVBQWEsR0FBRTtDQUNuQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFNO0NBQ3ZCLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEtBQUk7Q0FDckI7Q0FDQSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRTtDQUNuQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUU7Q0FDZixHQUFHO0FBQ0g7Q0FDQSxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUM7Q0FDekIsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLElBQUksQ0FBQyxhQUFZLENBQUM7Q0FDbkQsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxTQUFRLEtBQUs7Q0FDbkQsRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxZQUFXLEVBQUU7Q0FDbkQsRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxZQUFXLEVBQUU7Q0FDbkQsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLElBQUksQ0FBQyxhQUFZLENBQUM7Q0FDbkQsRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssQ0FBQyxjQUFjLEdBQUUsU0FBUztBQUNuRDtDQUNBLEVBQUUsSUFBSSxTQUFTLEVBQUU7Q0FDakIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHSyxXQUFRO0NBQ25DLElBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFDO0NBQzFDLElBQUksVUFBVSxHQUFHLEdBQUU7Q0FDbkIsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFJO0NBQ25CLElBQUksS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0NBQ25DLE1BQU0sTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFDO0NBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0NBQzdCLFFBQVEsSUFBSSxHQUFHLE1BQUs7Q0FFcEIsUUFBUSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFFO0NBQ3BDLFFBQVEsSUFBSSxHQUFHLFlBQVksT0FBTyxFQUFFO0NBQ3BDLFVBQVUsR0FBRyxHQUFHLE1BQU0sSUFBRztDQUN6QixTQUFTO0NBQ1QsUUFBUSxJQUFJLE9BQU8sR0FBRyxLQUFLLFVBQVUsRUFBRTtDQUN2QyxVQUFVLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO0NBQzlCLFNBQVMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Q0FDdkMsVUFBVSxLQUFLLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRTtDQUNqQyxZQUFZLElBQUksT0FBTyxHQUFHLEtBQUssVUFBVSxFQUFFO0NBQzNDLGNBQWMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7Q0FDbEMsYUFBYTtDQUNiLFdBQVc7Q0FDWCxTQUFTO0NBQ1QsUUFBUSxNQUFNLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBQztDQUN0QyxRQUFRLE1BQU0sR0FBRyxVQUFVLENBQUMsWUFBWTtDQUN4QyxVQUFVLEtBQUssR0FBRyxHQUFFO0NBQ3BCLFVBQVUsTUFBTSxHQUFHLFVBQVM7Q0FDNUIsVUFBVSxNQUFNO0NBQ2hCLFlBQVksV0FBVztDQUN2QixZQUFZLFlBQVk7Q0FDeEIsWUFBWSxXQUFXO0NBQ3ZCLFlBQVksWUFBWTtDQUN4QixXQUFXLEdBQUcsTUFBTSxDQUFDLEtBQUk7Q0FDekIsVUFBVSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0NBQ3BDLFlBQVksV0FBVyxJQUFJLFVBQVUsQ0FBQztDQUN0QyxjQUFjLEdBQUcsV0FBVztDQUM1QixjQUFjLE9BQU8sR0FBRztDQUN4QixnQkFBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO0NBQzVDLGdCQUFnQixJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVUsRUFBRTtDQUNwRCxrQkFBa0IsUUFBUSxHQUFHLFFBQVEsR0FBRTtDQUN2QyxpQkFBaUI7Q0FDakIsZ0JBQWdCLElBQUksQ0FBQyxRQUFRLEVBQUM7Q0FDOUIsZUFBZTtDQUNmLGFBQWEsRUFBRSxNQUFNLEVBQUM7Q0FDdEIsV0FBVyxNQUFNO0NBQ2pCLFlBQVksV0FBVyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxHQUFFO0NBQzNELFdBQVc7Q0FDWCxVQUFVLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQztDQUMzRCxVQUFVLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQztDQUMzRCxVQUFVLFdBQVcsS0FBSyxVQUFVLENBQUMsV0FBVyxHQUFHLE1BQU0sR0FBRTtDQUMzRCxTQUFTLEVBQUUsQ0FBQyxFQUFDO0NBQ2IsT0FBTztDQUNQLEtBQUs7Q0FDTCxJQUFJLElBQUksSUFBSSxFQUFFO0NBQ2QsTUFBTSxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBQztDQUM3QixNQUFNLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFDO0NBQzVCLE1BQU0sVUFBVSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUM7Q0FDNUIsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUk7Q0FDeEMsTUFBTSxZQUFZLElBQUksVUFBVSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUM7Q0FDdkQsS0FBSztDQUNMLEdBQUcsTUFBTTtDQUNULElBQUksVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUM7Q0FDM0IsSUFBSSxVQUFVLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBQztDQUMxQixJQUFJLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFDO0NBQzFCLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO0NBQ3RDLElBQUksWUFBWSxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFDO0NBQ3JELEdBQUc7Q0FDSCxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVU7Q0FDcEMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxVQUFTO0NBQ25DLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksVUFBUztDQUNuQyxHQUFtQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBQztDQUV4QyxFQUFFLElBQUksUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLFVBQVUsRUFBRTtDQUN4RCxJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFDO0NBQ3pELEdBQUc7Q0FDSCxFQUFFLElBQUksR0FBRyxNQUFLO0NBQ2QsQ0FBQztBQUNEO0NBQ0EsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztDQUNuRCxNQUFNLENBQUMsUUFBUSxHQUFHLFNBQVE7Q0FDMUIsU0FBUyxRQUFRLEdBQUc7Q0FDcEIsRUFBRSxRQUFRLENBQUMsVUFBVSxHQUFFO0NBQ3ZCLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0NBQ2xDLElBQUksU0FBUyxFQUFFLElBQUk7Q0FDbkIsSUFBSSxPQUFPLEVBQUUsSUFBSTtDQUNqQixHQUFHLEVBQUM7Q0FDSixDQUFDO0FBQ0Q7Q0FDQSxNQUFNLFdBQVcsR0FBRyxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUM7Q0FDM0MsU0FBU0MsTUFBSSxHQUFHO0NBQ2hCLEVBQUUsTUFBTSxJQUFJLE9BQU8sUUFBUSxDQUFDLEtBQUk7Q0FDaEMsRUFBRSxNQUFNLElBQUksT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBRztDQUNsRCxFQUFFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUFHO0NBQ2xELEVBQUUsTUFBTSxPQUFPLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLElBQUc7Q0FDbEQsRUFBRSxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBRztDQUNsRCxFQUFFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUFHO0NBQ2xELEVBQUUsTUFBTSxTQUFTLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLElBQUc7Q0FDbEQsRUFBRSxNQUFNLElBQUksT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRTtDQUNsRCxFQUFFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFDO0NBQ2xELEVBQUUsTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLGtCQUFpQjtDQUN6QyxFQUFFLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxrQkFBaUI7Q0FDekMsRUFBRSxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsa0JBQWlCO0NBQ3pDLEVBQUUsUUFBUSxDQUFDLEtBQUssR0FBRyxXQUFVO0NBQzdCLEVBQUUsT0FBTyxFQUFFLEtBQUssR0FBRyxVQUFTO0NBQzVCLEVBQUUsT0FBTyxFQUFFLEtBQUssR0FBRyxVQUFTO0FBQzVCO0NBQ0EsRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLE1BQUs7Q0FDN0IsRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLGFBQVk7Q0FDcEMsRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLENBQUMsa0NBQWtDLEVBQUM7Q0FDNUQsRUFBRSxPQUFPLEdBQUcsU0FBUyxHQUFHLENBQUMsaUNBQWlDLEVBQUM7Q0FDM0QsRUFBRSxPQUFPLEdBQUcsU0FBUyxHQUFHLENBQUMsbUVBQW1FLEVBQUM7Q0FDN0YsRUFBRSxJQUFJLE1BQU0sU0FBUyxHQUFHLFdBQVU7Q0FDbEMsRUFBRSxPQUFPLEdBQUcsU0FBUyxHQUFHLHNCQUFxQjtDQUM3QyxFQUFFLE9BQU8sR0FBRyxTQUFTLEdBQUcsc0JBQXFCO0NBQzdDLEVBQUUsUUFBUSxFQUFFLFNBQVMsR0FBRyx1QkFBc0I7Q0FDOUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLHVCQUFzQjtDQUM5QyxFQUFFLFNBQVMsQ0FBQyxTQUFTLEdBQUcsd0JBQXVCO0NBQy9DLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLElBQUksT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLElBQUksT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFDO0NBQ3ZDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsT0FBTyxFQUFDO0NBQ3ZDO0NBQ0EsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFDO0NBQzVELEVBQUUsVUFBVSxDQUFDLE1BQU07Q0FDbkIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87Q0FDNUIsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQU87Q0FDNUIsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVE7Q0FDN0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLE9BQU07Q0FDN0IsSUFBSSxTQUFTLENBQUMsS0FBSyxJQUFJLFNBQVE7Q0FDL0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVM7Q0FDaEMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDO0NBRTVDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQztDQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUM7Q0FDdkMsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFDO0NBQ3ZDLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBQztDQUN2QyxJQUFJLFNBQVMsQ0FBWSxFQUFDO0NBQzFCLElBQUksUUFBUSxHQUFFO0NBQ2QsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFNBQVMsS0FBSyxFQUFFO0NBQ3ZELE1BQU0sTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU07Q0FDN0IsTUFBTSxJQUFJLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDN0MsUUFBUSxTQUFTLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUM7Q0FDckQsUUFBUSxNQUFNLEdBQUcsTUFBSztDQUN0QixPQUFPLE1BQUs7Q0FDWixRQUFRLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFDO0NBQy9ELFFBQVEsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO0NBQ3JELFVBQVUsU0FBUyxDQUFDLE1BQU0sR0FBRTtDQUM1QixTQUFTO0NBQ1QsT0FBTztDQUNQLEtBQUssQ0FBQyxDQUFDO0NBQ1AsR0FBRyxFQUFFLENBQUMsRUFBQztDQUNQLENBQUM7QUFDRDtDQUNBLFNBQVMsZUFBZSxDQUFDLEtBQUssRUFBRTtDQUNoQyxFQUFFLElBQUksTUFBTSxFQUFFO0NBQ2QsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFDO0NBQ3hELElBQUksTUFBTSxHQUFHLE1BQUs7Q0FDbEIsR0FBRztDQUNILEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0NBQzVCLElBQUksSUFBSSxVQUFVLEdBQUcsRUFBQztDQUN0QixJQUFJLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNO0NBQ3ZDLE1BQU0sSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsRUFBQztDQUN0QyxNQUFNLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtDQUN0QyxRQUFRLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFDO0NBQ3pGLFFBQVEsUUFBUSxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFDO0NBQ2pELE9BQU87Q0FDUCxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ3RCO0NBQ0EsTUFBTSxVQUFVLElBQUksRUFBQztDQUNyQixNQUFNLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Q0FDdEMsUUFBUSxhQUFhLENBQUMsUUFBUSxFQUFDO0NBQy9CLE9BQU87Q0FDUCxLQUFLLEVBQUUsR0FBRyxFQUFDO0NBQ1gsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLElBQUksTUFBTSxHQUFHLEdBQUU7Q0FDZixJQUFJLE1BQU0sR0FBRyxHQUFFO0NBQ2YsSUFBSSxNQUFNLEdBQUcsR0FBRTtDQUNmLElBQUksTUFBTSxHQUFHLEdBQUU7Q0FDZixJQUFJLE1BQU0sR0FBRyxHQUFFO0NBQ2YsSUFBSSxNQUFNLEdBQUcsR0FBRTtDQUNmLElBQUksT0FBTyxHQUFHLEdBQUU7Q0FDaEIsTUFBTSxNQUFNLEdBQUcsS0FBSTtBQUNuQjtDQUNBLElBQUksV0FBVyxHQUFHLFVBQVM7Q0FDM0IsU0FBUyxRQUFRLEdBQUc7Q0FDcEIsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUM7Q0FDdkMsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUM7Q0FDekMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtBQUMvQztDQUNBLEVBQUUsTUFBTSxHQUFHLEdBQUU7Q0FDYixFQUFFLE1BQU0sR0FBRyxHQUFFO0NBQ2IsRUFBRSxPQUFPLEdBQUcsR0FBRTtDQUNkLEVBQUUsV0FBVyxHQUFHLFVBQVM7Q0FDekIsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBQztDQUNoRCxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUVoQixJQUFFLEVBQUM7Q0FDakUsRUFBRSxJQUFJLEtBQUssRUFBRTtDQUNiLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUM7Q0FDcEIsSUFBSSxlQUFlLENBQUMsS0FBSyxFQUFDO0NBQzFCLElBQUksT0FBTyxJQUFJO0NBQ2YsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLElBQUksV0FBVyxHQUFHLFVBQVM7Q0FDM0IsU0FBUyxRQUFRLEdBQUc7Q0FDcEIsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQztDQUN6QyxFQUFFLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQzNDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUk7QUFDL0M7Q0FDQSxFQUFFLE1BQU0sR0FBRyxHQUFFO0NBQ2IsRUFBRSxNQUFNLEdBQUcsR0FBRTtDQUNiLEVBQUUsT0FBTyxHQUFHLEdBQUU7Q0FDZCxFQUFFLFdBQVcsR0FBRyxVQUFTO0NBQ3pCLEVBQUUsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUM7Q0FDaEQsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFDO0NBQzVFLEVBQUUsSUFBSSxLQUFLLEVBQUU7Q0FDYixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFDO0NBQ3BCLElBQUksZUFBZSxDQUFDLEtBQUssRUFBQztDQUMxQixJQUFJLE9BQU8sSUFBSTtDQUNmLEdBQUc7Q0FDSCxDQUFDO0FBQ0Q7Q0FDQSxJQUFJLFdBQVcsR0FBRyxVQUFTO0NBQzNCLFNBQVMsUUFBUSxHQUFHO0NBQ3BCLEVBQUUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDekMsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztDQUMzQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFJO0FBQy9DO0NBQ0EsRUFBRSxNQUFNLEdBQUcsR0FBRTtDQUNiLEVBQUUsTUFBTSxHQUFHLEdBQUU7Q0FDYixFQUFFLE9BQU8sR0FBRyxHQUFFO0NBQ2QsRUFBRSxXQUFXLEdBQUcsVUFBUztDQUN6QixFQUFFLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFDO0NBQ2hELEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBQztDQUM1RSxFQUFFLElBQUksS0FBSyxFQUFFO0NBQ2IsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBQztDQUNwQixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUM7Q0FDMUIsSUFBSSxPQUFPLElBQUk7Q0FDZixHQUFHO0NBQ0gsQ0FBQztBQUNEO0NBQ0EsU0FBUyxNQUFNLEVBQUUsQ0FBQyxFQUFFO0NBQ3BCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7Q0FDakIsSUFBSSxJQUFJLFdBQVcsS0FBSyxXQUFXLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksV0FBVyxFQUFFO0NBQ25FLE1BQU0sWUFBWSxDQUFDLFdBQVcsRUFBQztDQUMvQixNQUFNLFlBQVksQ0FBQyxXQUFXLEVBQUM7Q0FDL0IsTUFBTSxZQUFZLENBQUMsV0FBVyxFQUFDO0NBQy9CLE1BQU0sSUFBSSxXQUFXLEVBQUU7Q0FDdkIsUUFBUSxRQUFRLEdBQUU7Q0FDbEIsT0FBTztDQUNQLE1BQU0sSUFBSSxXQUFXLEVBQUU7Q0FDdkIsUUFBUSxRQUFRLEdBQUU7Q0FDbEIsT0FBTyxNQUFNO0NBQ2IsUUFBUSxRQUFRLEdBQUU7Q0FDbEIsT0FBTztDQUNQLE1BQU0sV0FBVyxHQUFHLFVBQVM7Q0FDN0IsTUFBTSxXQUFXLEdBQUcsVUFBUztDQUM3QixNQUFNLFdBQVcsR0FBRyxVQUFTO0NBQzdCLEtBQUs7Q0FDTCxHQUFHO0NBQ0gsQ0FBQztDQUNELElBQUksSUFBSSxHQUFHLE1BQUs7Q0FDaEIsSUFBSSxNQUFNLEdBQUcsTUFBSztDQUNsQixTQUFTLFFBQVEsRUFBRSxDQUFDLEVBQUU7Q0FDdEIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtDQUM3RCxJQUFJLE1BQU07Q0FDVixHQUFHLE1BQU07Q0FDVCxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLEVBQUU7Q0FDekIsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO0NBQ2xDLFFBQVEsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxVQUFTO0NBQzlELFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxHQUFHLFlBQVksRUFBRTtDQUNuQyxVQUFVLElBQUksR0FBRyxDQUFDLEtBQUk7Q0FDdEIsVUFBVSxLQUFLLENBQUMsS0FBSyxHQUFHLFVBQVUsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUM7Q0FDbkUsVUFBVSxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUM7Q0FDbkUsVUFBVSxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUM7Q0FDbkUsU0FBUyxNQUFNO0NBQ2YsVUFBVSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFO0NBQzVDLFlBQVksTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUM7Q0FDM0MsWUFBWSxNQUFNLENBQUMsS0FBSyxHQUFHLGtCQUFpQjtDQUM1QyxZQUFZLE1BQU0sR0FBRyxLQUFJO0NBQ3pCLFdBQVcsTUFBTTtDQUNqQixZQUFZLE1BQU0sR0FBRyxDQUFDLE9BQU07Q0FDNUIsWUFBWSxJQUFJLE1BQU0sRUFBRTtDQUN4QixjQUFjLE1BQU0sQ0FBQyxLQUFLLEdBQUcsa0JBQWlCO0NBQzlDLGFBQWEsTUFBTTtDQUNuQixjQUFjLE1BQU0sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBQztDQUN4RCxhQUFhO0NBQ2IsV0FBVztDQUNYLFNBQVM7Q0FDVCxPQUFPO0NBQ1AsS0FBSyxNQUFNO0NBQ1gsTUFBTSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0NBQ3hCLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7Q0FDakMsUUFBUSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7Q0FDeEIsVUFBVSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBQztDQUMxQyxVQUFVLFlBQVksQ0FBQyxXQUFXLEVBQUM7Q0FDbkMsVUFBVSxZQUFZLENBQUMsV0FBVyxFQUFDO0NBQ25DLFVBQVUsWUFBWSxDQUFDLFdBQVcsRUFBQztDQUNuQyxVQUFVLE9BQU8sSUFBSSxLQUFJO0NBQ3pCLFVBQVUsTUFBTTtDQUNoQixTQUFTO0NBQ1QsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztDQUN6QixRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQztDQUMzQixRQUFRLFlBQVksQ0FBQyxXQUFXLEVBQUM7Q0FDakMsUUFBUSxXQUFXLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUM7Q0FDbEQsT0FBTyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtDQUM1QixRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0NBQ3pCLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDO0NBQzNCLFFBQVEsWUFBWSxDQUFDLFdBQVcsRUFBQztDQUNqQyxRQUFRLFdBQVcsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBQztDQUNsRCxPQUFPLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO0NBQzNCLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7Q0FDekIsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUM7Q0FDM0IsUUFBUSxZQUFZLENBQUMsV0FBVyxFQUFDO0NBQ2pDLFFBQVEsV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFDO0NBQ2xELE9BQU87Q0FDUCxNQUFNLENBQUMsQ0FBQyxLQUFLLEdBQUcsUUFBTztDQUN2QixNQUFNLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBQztDQUN0QixLQUFLO0NBQ0wsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLE1BQU0sV0FBQ2UsVUFBUSxDQUFDLEdBQUcsU0FBUTtDQUMzQixJQUFJLE9BQU8sR0FBR0EsVUFBUSxDQUFDLEtBQUk7Q0FDM0IsSUFBSSxPQUFPLEdBQUcsVUFBUztDQUN2QixJQUFJLFVBQVUsR0FBRyxHQUFFO0FBQ25CO0NBQ0EsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0NBQzVCO0NBQ0EsRUFBRSxJQUFJLE9BQU8sSUFBSUEsVUFBUSxDQUFDLElBQUksRUFBRTtDQUNoQyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFDO0NBQ3JDLElBQUksT0FBTyxHQUFHQSxVQUFRLENBQUMsS0FBSTtDQUMzQixHQUFHLE1BQU07Q0FDVCxJQUFJLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTtDQUMzQixNQUFNLE9BQU8sSUFBSSxZQUFZLENBQUMsT0FBTyxFQUFDO0NBQ3RDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxLQUFLO0NBQ2hDLFFBQVEsT0FBTyxHQUFHLFVBQVM7Q0FDM0IsUUFBUSxLQUFLLE1BQU0sRUFBRSxJQUFJLFVBQVUsRUFBRTtDQUNyQyxVQUFVLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxLQUFJO0NBQzlCLFVBQVUsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtDQUMzQyxZQUFZLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0NBQzdCLGNBQWMsUUFBUTtDQUN0QixhQUFhLE1BQU07Q0FDbkIsY0FBYyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSTtDQUNoQyxhQUFhO0NBQ2IsV0FBVztDQUNYLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBQztDQUNuQixTQUFTO0NBQ1QsUUFBUSxNQUFNLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtDQUNwRSxRQUFRLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQztDQUN6RCxRQUFRLFdBQVcsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBQztDQUN0RCxRQUFRLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSTtDQUN4QyxRQUFRLElBQUksUUFBUSxFQUFFO0NBQ3RCLFVBQVUsV0FBVyxJQUFJLFVBQVUsQ0FBQztDQUNwQyxZQUFZLEdBQUcsV0FBVztDQUMxQixZQUFZLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUMsQ0FBQztDQUN0QyxXQUFXLEVBQUUsTUFBTSxFQUFDO0NBQ3BCLFNBQVMsTUFBTTtDQUNmLFVBQVUsV0FBVyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFDO0NBQ3hELFNBQVM7QUFDVDtDQUNBLE9BQU8sRUFBRSxHQUFHLEVBQUM7Q0FDYixLQUFLO0NBQ0wsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLFNBQVMsVUFBVSxHQUFHO0NBQ3RCLEVBQUUsTUFBTSxNQUFNLEdBQUdWLFlBQVUsR0FBRTtDQUM3QixFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtDQUMxRSxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBQztDQUN4RSxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQztDQUNwRSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFDO0NBQ3BELElBQUksR0FBRyxRQUFRLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtDQUMxQyxNQUFNVyxNQUFJLEVBQUUsQ0FBQztDQUNiLEtBQUssTUFBTTtDQUNYLE1BQU0sTUFBTSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFQSxNQUFJLEVBQUM7Q0FDdkQsS0FBSztDQUNMLEdBQUcsTUFBTTtDQUNULElBQUksTUFBTTtDQUNWLEdBQUc7QUFDSDtDQUNBLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVM7Q0FDOUIsRUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLFlBQVk7Q0FDbEMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUM7Q0FDaEMsSUFBSSxXQUFXLEdBQUU7Q0FDakIsSUFBRztDQUNILENBQUM7QUFDRDtDQUNBLE1BQU0sTUFBTSxHQUFHO0NBQ2YsRUFBRSxNQUFNLFdBQVcsV0FBVztDQUM5QixFQUFFLFdBQVcsTUFBTSxXQUFXO0NBQzlCLEVBQUUsV0FBVyxNQUFNLFdBQVc7Q0FDOUIsRUFBRSxRQUFRLFNBQVMsV0FBVztDQUM5QixFQUFFLGVBQWUsRUFBRSxXQUFXO0NBQzlCLEVBQUUsZUFBZSxFQUFFLFdBQVc7Q0FDOUIsRUFBRSxhQUFhLElBQUksV0FBVztDQUM5QixFQUFFLFNBQVMsUUFBUSxXQUFXO0NBQzlCLEVBQUUsZ0JBQWdCLENBQUMsV0FBVztDQUM5QixFQUFFLFlBQVksS0FBSyxXQUFXO0NBQzlCLEVBQUUsV0FBVyxNQUFNLFdBQVc7Q0FDOUIsRUFBRSxTQUFTLFFBQVEsV0FBVztDQUM5QixFQUFFLFNBQVMsUUFBUSxXQUFXO0NBQzlCLEVBQUUsZUFBZSxFQUFFLFdBQVc7Q0FDOUIsRUFBRSxTQUFTLFFBQVEsV0FBVztDQUM5QixFQUFFLGVBQWUsRUFBRSxXQUFXO0NBQzlCLEVBQUUsWUFBWSxLQUFLLFdBQVc7Q0FDOUIsRUFBRSxVQUFVLE9BQU8sV0FBVztDQUM5QixFQUFFLFVBQVUsT0FBTyxXQUFXO0NBQzlCLEVBQUUsUUFBUSxTQUFTLFdBQVc7Q0FDOUIsRUFBRSxjQUFjLEdBQUcsV0FBVztDQUM5QixFQUFFLFVBQVUsT0FBTyxXQUFXO0NBQzlCLEVBQUUsV0FBVyxNQUFNLFdBQVc7Q0FDOUIsRUFBRSxTQUFTLFFBQVEsV0FBVztDQUM5QixFQUFFLGVBQWUsRUFBRSxXQUFXO0NBQzlCLEVBQUUsYUFBYSxJQUFJLFdBQVc7Q0FDOUIsRUFBRSxhQUFhLElBQUksV0FBVztDQUM5QixFQUFFLGdCQUFnQixDQUFDLFdBQVc7Q0FDOUIsRUFBRSxZQUFZLEtBQUssV0FBVztDQUM5QixFQUFFLFNBQVMsUUFBUSxXQUFXO0NBQzlCLEVBQUUsWUFBWSxLQUFLLFdBQVc7Q0FDOUIsRUFBRSxZQUFZLEtBQUssV0FBVztDQUM5QixFQUFFLFFBQVEsU0FBUyxXQUFXO0NBQzlCLEVBQUUsVUFBVSxPQUFPLFdBQVc7Q0FDOUIsRUFBQztBQUNEO0NBQ0EsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDcEMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLFVBQVM7Q0FDbkMsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBQztDQUM1QjtDQUNBLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQyxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0NBQ3pDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBQztDQUNqQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBQztDQUN4RCxHQUFHLE1BQU07Q0FDVCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUM7Q0FDMUMsSUFBSSxVQUFVLENBQUMsTUFBTTtDQUNyQixNQUFNLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUM7Q0FDL0IsTUFBTSxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsY0FBYyxFQUFFLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUM7Q0FDNUUsTUFBTSxNQUFNLEdBQUcsS0FBSTtDQUNuQixLQUFLLEVBQUUsQ0FBQyxFQUFDO0NBQ1QsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtDQUN0QixFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHO0NBQzFCLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVM7Q0FDNUIsSUFBSSxHQUFHLEdBQUc7Q0FDVixJQUFHO0NBQ0gsQ0FBQztBQUNEO0NBQ0EsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxHQUFHLGdCQUFlO0NBQ2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxRQUFPO0NBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxPQUFNO0NBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxLQUFJO0NBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxLQUFJO0FBQzFCO0tBQ0FDLGNBQWMsR0FBRzs7Q0NocEJqQixTQUFTLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxHQUFHLEdBQUcsRUFBRTtDQUNwQyxFQUFFLElBQUksU0FBUTtDQUNkLEVBQUUsT0FBTyxZQUFZO0NBQ3JCLElBQUksTUFBTSxLQUFLLEdBQUcsS0FBSTtDQUN0QixJQUFJLE1BQU0sSUFBSSxHQUFHLFVBQVM7Q0FDMUIsSUFBSSxRQUFRLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBQztDQUN0QyxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTTtDQUNoQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksRUFBQztDQUMzQixLQUFLLEVBQUUsS0FBSyxFQUFDO0NBQ2IsR0FBRztDQUNILENBQUM7S0FDREMsY0FBYyxHQUFHOzs7O0NDVmpCLE1BQU1SLGVBQWEsR0FBR1IsZ0JBQTBCO0FBQ2hEO0tBQ0FpQixXQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLE1BQU0sU0FBUyxHQUFHVCxlQUFhLEdBQUU7Q0FDbkMsRUFBRSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUM7Q0FDM0MsRUFBRSxJQUFJLEtBQUssRUFBRTtDQUNiLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUTtDQUN0QyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7Q0FDN0IsTUFBTSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUM7Q0FDM0IsS0FBSztDQUNMLEdBQUc7Q0FDSCxFQUFFLE9BQU8sS0FBSztDQUNkOzs7O0NDWkE7Q0FDQSxNQUFNLFdBQVcsR0FBR1IsY0FBd0I7Q0FDNUMsTUFBTVEsZUFBYSxHQUFHSixnQkFBMEI7Q0FDaEQsTUFBTSxZQUFZLEdBQUdDLGVBQXlCO0NBQzlDLE1BQU0sVUFBVSxHQUFHTyxhQUF1QjtDQUMxQyxNQUFNLFNBQVMsR0FBR00sWUFBc0I7QUFDeEM7S0FDQUMsY0FBYyxHQUFHLE1BQU07Q0FDdkIsRUFBRSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEVBQUU7Q0FDakQsSUFBSSxNQUFNO0NBQ1YsR0FBRztDQUNILEVBQUUsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksRUFBQztDQUNuRCxFQUFFLE1BQU0sS0FBSyxHQUFHLEdBQUU7Q0FDbEIsRUFBRSxNQUFNLEtBQUssR0FBRyxHQUFFO0FBQ2xCO0NBQ0EsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTLEdBQUU7Q0FDekIsRUFBRSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO0NBQ2pDLElBQUksTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVTtDQUM3QyxJQUFJLEtBQUssTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO0NBQ3pCLE1BQU0sSUFBSSxFQUFFLEdBQUcsR0FBRTtDQUNqQixNQUFNLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRTtDQUMzQixRQUFRLEVBQUUsR0FBRztDQUNiLFVBQVUsS0FBSyxFQUFFLFNBQVM7Q0FDMUIsVUFBVSxNQUFNLEVBQUUsSUFBSTtDQUN0QixVQUFVLE1BQU0sRUFBRSxJQUFJO0NBQ3RCLFVBQVM7Q0FDVCxPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxRQUFRLEVBQUU7Q0FDeEMsUUFBUSxFQUFFLEdBQUc7Q0FDYixVQUFVLEtBQUssRUFBRSxXQUFXO0NBQzVCLFVBQVUsTUFBTSxFQUFFLEtBQUs7Q0FDdkIsVUFBVSxNQUFNLEVBQUUsS0FBSztDQUN2QixVQUFTO0NBQ1QsT0FBTyxNQUFNO0NBQ2IsUUFBUSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQztDQUNyQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtDQUNuQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFJO0NBQ3RCLFNBQVMsRUFBQztDQUNWLFFBQVEsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFDO0NBQ3pCLE9BQU87Q0FDUCxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFFO0NBQ3BCLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHO0NBQ2xCLFFBQVEsTUFBTSxFQUFFLEtBQUs7Q0FDckIsUUFBUSxNQUFNLEVBQUUsSUFBSTtDQUNwQixRQUFPO0NBQ1AsS0FBSztDQUNMLEdBQUc7QUFDSDtDQUNBLEVBQUUsSUFBSSxHQUFFO0NBQ1IsRUFBRSxJQUFJLE1BQUs7Q0FDWCxFQUFFLE1BQU0sU0FBUyxHQUFHWCxlQUFhLEdBQUU7Q0FDbkMsRUFBRSxNQUFNLE9BQU8sR0FBRyxVQUFVLEdBQUU7Q0FDOUIsRUFBRSxNQUFNLFFBQVEsR0FBRyxZQUFZO0NBQy9CLElBQUksSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtDQUNuQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVE7Q0FDcEMsS0FBSztDQUNMLElBQUksTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBQztDQUN0QyxJQUFJLEtBQUssTUFBTSxFQUFFLElBQUksS0FBSyxFQUFFO0NBQzVCLE1BQU0sTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUM7Q0FDbkQsTUFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUU7Q0FDckIsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRTtDQUMvQixVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSTtDQUNqQyxVQUFVLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7Q0FDOUMsWUFBWSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQUs7Q0FDcEMsV0FBVztDQUNYLFVBQVUsSUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFO0NBQ2hELFlBQVksTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUU7Q0FDbkMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxTQUFTLEdBQUcsU0FBUyxFQUFFO0NBQzNDLGNBQWMsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFDO0NBQy9CLGFBQWE7Q0FDYixZQUFZLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBQztDQUM5QixZQUFZLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7Q0FDakMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFDO0NBQ3pCLGFBQWE7Q0FDYixXQUFXO0NBQ1gsVUFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7Q0FDaEMsWUFBWSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDO0NBQzVFLFlBQVksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUM7Q0FDekQsWUFBWSxNQUFNLE1BQU0sR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEdBQUU7Q0FDckUsWUFBWSxXQUFXLENBQUMsTUFBTSxFQUFDO0NBQy9CLFdBQVc7Q0FDWCxTQUFTO0NBQ1QsT0FBTyxNQUFNO0NBQ2IsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRTtDQUMvQixVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSTtDQUNqQyxVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBSztDQUNsQyxVQUFVLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRTtDQUNoQyxZQUFZLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUM7Q0FDNUUsWUFBWSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBQztDQUN6RCxZQUFZLE1BQU0sTUFBTSxHQUFHLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sR0FBRTtDQUNyRSxZQUFZLFdBQVcsQ0FBQyxNQUFNLEVBQUM7Q0FDL0IsV0FBVztDQUNYLFNBQVM7Q0FDVCxPQUFPO0NBQ1AsS0FBSztDQUNMLElBQUc7QUFDSDtDQUNBLEVBQUUsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtDQUNqQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFdBQVU7Q0FDM0MsSUFBSSxNQUFNLE9BQU8sR0FBRztDQUNwQixNQUFNLFVBQVUsRUFBRSxFQUFFLEdBQUcsSUFBSSxHQUFHLEtBQUs7Q0FDbkMsTUFBTSxTQUFTLEVBQUUsSUFBSTtDQUNyQixNQUFNLE9BQU8sRUFBRSxJQUFJO0NBQ25CLE1BQUs7Q0FDTCxJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNO0NBQ3hELE1BQU0sTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFDO0NBQ3hFLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztDQUM5QyxLQUFLLEVBQUM7Q0FDTixHQUFHO0NBQ0g7O0NDN0dBLE1BQU0sR0FBRyxHQUFHLG1FQUFrRTtDQUM5RSxNQUFNVixJQUFFLEdBQUcsaUJBQWdCO0FBQzNCO0NBQ0EsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLO0NBQzdCLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRTtDQUNiLEVBQUUsT0FBTyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7Q0FDckIsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFDO0NBQ3JDLEdBQUc7Q0FDSCxFQUFFLE9BQU8sRUFBRTtDQUNYLEVBQUM7QUFDRDtLQUNBc0IsYUFBYyxHQUFHLE1BQU07Q0FDdkIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTTtBQUN4QjtDQUNBO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSztDQUMvQyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7Q0FDcEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQy9DLElBQUc7QUFDSDtDQUNBO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsS0FBSztDQUM3QyxJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUU7Q0FDckMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQzlDLElBQUc7QUFDSDtDQUNBO0NBQ0EsRUFBRSxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUs7Q0FDNUMsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0NBQ3BDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztDQUM1QyxJQUFHO0FBQ0g7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztDQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDM0MsSUFBRztBQUNIO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtDQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDO0NBQ3ZCLElBQUc7QUFDSDtDQUNBO0NBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLO0NBQzlCLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFFO0NBQzlCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQztDQUMzQyxJQUFHO0FBQ0g7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxRQUFR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
