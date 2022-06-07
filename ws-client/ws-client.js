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

	const { console: console_1$2 } = globals;
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

	// (114:6) {#if criterion1}
	function create_if_block_7(ctx) {
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
				add_location(a, file$4, 114, 8, 3395);
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
			id: create_if_block_7.name,
			type: "if",
			source: "(114:6) {#if criterion1}",
			ctx
		});

		return block;
	}

	// (117:6) {#if criterion2}
	function create_if_block_6(ctx) {
		let a;
		let t0_value = /*criterion2*/ ctx[6].name + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				a = element("a");
				t0 = text(t0_value);
				t1 = text(",");
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*criterion2*/ ctx[6].link);
				add_location(a, file$4, 117, 8, 3532);
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
			source: "(117:6) {#if criterion2}",
			ctx
		});

		return block;
	}

	// (124:6) {#if all.length||any.length}
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
				add_location(hr0, file$4, 124, 8, 3836);
				attr_dev(div, "class", "pre svelte-fcjyx6");
				add_location(div, file$4, 125, 8, 3850);
				add_location(hr1, file$4, 149, 8, 4517);
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
			source: "(124:6) {#if all.length||any.length}",
			ctx
		});

		return block;
	}

	// (143:35) 
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
				if (dirty & /*any*/ 2 && raw_value !== (raw_value = /*any*/ ctx[1][0] + "")) html_tag.p(raw_value);
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
			source: "(143:35) ",
			ctx
		});

		return block;
	}

	// (136:33) 
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

				add_location(b, file$4, 136, 12, 4170);
				attr_dev(ol, "class", "svelte-fcjyx6");
				add_location(ol, file$4, 137, 12, 4215);
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
				if (dirty & /*any*/ 2) {
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
			source: "(136:33) ",
			ctx
		});

		return block;
	}

	// (134:35) 
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
				if (dirty & /*all*/ 1 && raw_value !== (raw_value = /*all*/ ctx[0][0] + "")) html_tag.p(raw_value);
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
			source: "(134:35) ",
			ctx
		});

		return block;
	}

	// (127:10) {#if all.length>1}
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

				add_location(b, file$4, 127, 12, 3907);
				attr_dev(ol, "class", "svelte-fcjyx6");
				add_location(ol, file$4, 128, 12, 3952);
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
				if (dirty & /*all*/ 1) {
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
			source: "(127:10) {#if all.length>1}",
			ctx
		});

		return block;
	}

	// (139:12) {#each any as cat}
	function create_each_block_1$2(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 139, 14, 4265);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				li.innerHTML = raw_value;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*any*/ 2 && raw_value !== (raw_value = /*cat*/ ctx[24] + "")) li.innerHTML = raw_value;		},
			d: function destroy(detaching) {
				if (detaching) detach_dev(li);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1$2.name,
			type: "each",
			source: "(139:12) {#each any as cat}",
			ctx
		});

		return block;
	}

	// (130:12) {#each all as cat}
	function create_each_block$4(ctx) {
		let li;
		let raw_value = /*cat*/ ctx[24] + "";

		const block = {
			c: function create() {
				li = element("li");
				add_location(li, file$4, 130, 14, 4002);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				li.innerHTML = raw_value;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*all*/ 1 && raw_value !== (raw_value = /*cat*/ ctx[24] + "")) li.innerHTML = raw_value;		},
			d: function destroy(detaching) {
				if (detaching) detach_dev(li);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$4.name,
			type: "each",
			source: "(130:12) {#each all as cat}",
			ctx
		});

		return block;
	}

	// (146:10) {#if incomplete && grp==='color-contrast'}
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
			source: "(146:10) {#if incomplete && grp==='color-contrast'}",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let div2;
		let span;
		let svg;
		let g;
		let path;
		let t0;
		let div1;
		let h4;
		let t2;
		let p0;
		let t4;
		let p1;
		let b0;
		let t6;
		let t7;
		let t8;
		let p2;
		let b1;
		let t10;
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
		let div0;
		let pre;
		let code;
		let mounted;
		let dispose;
		let if_block0 = /*criterion1*/ ctx[5] && create_if_block_7(ctx);
		let if_block1 = /*criterion2*/ ctx[6] && create_if_block_6(ctx);
		let if_block2 = (/*all*/ ctx[0].length || /*any*/ ctx[1].length) && create_if_block$2(ctx);

		const block = {
			c: function create() {
				div2 = element("div");
				span = element("span");
				svg = svg_element("svg");
				g = svg_element("g");
				path = svg_element("path");
				t0 = space();
				div1 = element("div");
				h4 = element("h4");
				h4.textContent = `${/*help*/ ctx[10]}`;
				t2 = space();
				p0 = element("p");
				p0.textContent = `${/*description*/ ctx[3]}`;
				t4 = space();
				p1 = element("p");
				b0 = element("b");
				b0.textContent = "tags:";
				t6 = space();
				t7 = text(/*tgs*/ ctx[11]);
				t8 = space();
				p2 = element("p");
				b1 = element("b");
				b1.textContent = "criteria:";
				t10 = space();
				if (if_block0) if_block0.c();
				t11 = space();
				if (if_block1) if_block1.c();
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
				if (if_block2) if_block2.c();
				t19 = space();
				div0 = element("div");
				pre = element("pre");
				code = element("code");
				code.textContent = `${/*html*/ ctx[9]}`;
				set_style(path, "stroke", "none");
				set_style(path, "fill-rule", "nonzero");
				set_style(path, "fill", "rgb(0%,0%,0%)");
				set_style(path, "fill-opacity", "1");
				attr_dev(path, "d", "M 10.882812 4.027344 L 10.882812 0 L 1.730469 0 L 1.730469 12.269531 L 5.117188 12.269531 L 5.117188 16 L 14.269531 16 L 14.269531 7.417969 Z M 10.882812 5.464844 L 12.535156 7.117188 L 10.882812 7.117188 Z M 2.746094 11.253906 L 2.746094 1.015625 L 9.863281 1.015625 L 9.863281 3.730469 L 5.117188 3.730469 L 5.117188 11.253906 Z M 6.136719 14.984375 L 6.136719 4.746094 L 9.863281 4.746094 L 9.863281 8.136719 L 13.253906 8.136719 L 13.253906 14.984375 Z M 6.136719 14.984375 ");
				add_location(path, file$4, 103, 6, 2620);
				attr_dev(g, "id", "surface1");
				add_location(g, file$4, 102, 6, 2596);
				attr_dev(svg, "width", "16px");
				attr_dev(svg, "height", "16px");
				attr_dev(svg, "viewBox", "0 0 16 16");
				attr_dev(svg, "version", "1.1");
				add_location(svg, file$4, 101, 4, 2523);
				set_style(span, "position", "absolute");
				set_style(span, "right", "10px");
				set_style(span, "top", "10px");
				set_style(span, "cursor", "pointer");
				add_location(span, file$4, 100, 2, 2432);
				attr_dev(h4, "class", "svelte-fcjyx6");
				add_location(h4, file$4, 108, 4, 3252);
				attr_dev(p0, "class", "svelte-fcjyx6");
				add_location(p0, file$4, 109, 4, 3272);
				add_location(b0, file$4, 110, 17, 3310);
				attr_dev(p1, "class", "tgs svelte-fcjyx6");
				add_location(p1, file$4, 110, 4, 3297);
				add_location(b1, file$4, 112, 6, 3347);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "href", /*helpUrl*/ ctx[7]);
				add_location(a, file$4, 119, 6, 3644);
				attr_dev(p2, "class", "svelte-fcjyx6");
				add_location(p2, file$4, 111, 4, 3337);
				add_location(b2, file$4, 122, 15, 3759);
				attr_dev(summary, "class", "svelte-fcjyx6");
				add_location(summary, file$4, 122, 6, 3750);
				attr_dev(code, "class", "language-html svelte-fcjyx6");
				add_location(code, file$4, 152, 13, 4570);
				attr_dev(pre, "class", "svelte-fcjyx6");
				add_location(pre, file$4, 152, 8, 4565);
				attr_dev(div0, "class", "pre svelte-fcjyx6");
				add_location(div0, file$4, 151, 6, 4541);
				details.open = true;
				attr_dev(details, "class", "svelte-fcjyx6");
				add_location(details, file$4, 121, 4, 3729);
				attr_dev(div1, "class", "a11y-content");
				add_location(div1, file$4, 107, 2, 3221);
				attr_dev(div2, "class", "a11y-popup svelte-fcjyx6");
				attr_dev(div2, "style", /*style*/ ctx[2]);
				add_location(div2, file$4, 99, 0, 2397);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, span);
				append_dev(span, svg);
				append_dev(svg, g);
				append_dev(g, path);
				append_dev(div2, t0);
				append_dev(div2, div1);
				append_dev(div1, h4);
				append_dev(div1, t2);
				append_dev(div1, p0);
				append_dev(div1, t4);
				append_dev(div1, p1);
				append_dev(p1, b0);
				append_dev(p1, t6);
				append_dev(p1, t7);
				append_dev(div1, t8);
				append_dev(div1, p2);
				append_dev(p2, b1);
				append_dev(p2, t10);
				if (if_block0) if_block0.m(p2, null);
				append_dev(p2, t11);
				if (if_block1) if_block1.m(p2, null);
				append_dev(p2, t12);
				append_dev(p2, a);
				append_dev(a, t13);
				append_dev(div1, t14);
				append_dev(div1, details);
				append_dev(details, summary);
				append_dev(summary, b2);
				append_dev(summary, t16);
				append_dev(summary, t17);
				append_dev(details, t18);
				if (if_block2) if_block2.m(details, null);
				append_dev(details, t19);
				append_dev(details, div0);
				append_dev(div0, pre);
				append_dev(pre, code);

				if (!mounted) {
					dispose = listen_dev(span, "click", copyto, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (/*criterion1*/ ctx[5]) if_block0.p(ctx, dirty);
				if (/*criterion2*/ ctx[6]) if_block1.p(ctx, dirty);

				if (/*all*/ ctx[0].length || /*any*/ ctx[1].length) {
					if (if_block2) {
						if_block2.p(ctx, dirty);
					} else {
						if_block2 = create_if_block$2(ctx);
						if_block2.c();
						if_block2.m(details, t19);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (dirty & /*style*/ 4) {
					attr_dev(div2, "style", /*style*/ ctx[2]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(div2);
				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
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
		const text = document.querySelector('.a11y-content').innerHTML;

		navigator.clipboard.writeText(text).then(() => {
			console.log("Copied to clipboard");
		});
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
				popup.style = `top:${top}px;left:${left}px;`;
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

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<A11yPopup> was created with unknown prop '${key}'`);
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
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { node: 14 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "A11yPopup",
				options,
				id: create_fragment$4.name
			});

			const { ctx } = this.$$;
			const props = options.props || {};

			if (/*node*/ ctx[14] === undefined && !('node' in props)) {
				console_1$2.warn("<A11yPopup> was created without expected prop 'node'");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MtY2xpZW50LmpzIiwic291cmNlcyI6WyJfY2xpZW50L193c19wb3N0bWVzc2FnZS5qcyIsIl9jbGllbnQvX3dzX2NsaWVudC5qcyIsIl9jbGllbnQvX3dzX21zZy1wYXJzZXIuanMiLCJfY2xpZW50L193c19pbi1pZnJhbWUuanMiLCJfY2xpZW50L193c192ZW5kb3IuanMiLCJfY2xpZW50L193c19pbml0LXNvY2tldC5qcyIsIl9jbGllbnQvX3NjcmVlbnNob3QuanMiLCJfY2xpZW50L193c19uYW1lc3BhY2UuanMiLCJfY2xpZW50L193c19zY3JlZW5zaG90LmpzIiwiX2NsaWVudC9fa2V5Ym9hcmQuanMiLCJfY2xpZW50L193c19wbGF5LmpzIiwiX2NsaWVudC9fd3NfbG9jYXRpb24uanMiLCJfY2xpZW50L193c19kZWJvdW5jZS5qcyIsIl9jbGllbnQvX3dzX3JvdXRlLmpzIiwiX2NsaWVudC9fd3Nfb2JzZXJ2ZXIuanMiLCJfY2xpZW50L193c19nZW5lcmFsLmpzIiwiX2NsaWVudC9fd3NfY3NwLWVyci5qcyIsIl9jbGllbnQvX3dzX21hY3Jvcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvaW50ZXJuYWwvaW5kZXgubWpzIiwiX3N2ZWx0ZS9BMTF5UG9wdXAuc3ZlbHRlIiwiX3N2ZWx0ZS9Dc3BkaXJlY3RpdmUuanMiLCJfc3ZlbHRlL0NzcGhlYWRlci5zdmVsdGUiLCJfc3ZlbHRlL0hvdGtleXMuc3ZlbHRlIiwiLi4vbm9kZV9tb2R1bGVzL2pzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0L2luZGV4LmpzIiwiX3N2ZWx0ZS9Kc29uLnN2ZWx0ZSIsIl9zdmVsdGUvc3FsaXRlLnN2ZWx0ZSIsIl9zdmVsdGUvaW5kZXguanMiLCJfY2xpZW50L3dzLWNsaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcbiAgICBpZiAod2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgPj4+IFBvc3RtZXNzYWdlOiAke2V2ZW50Lm9yaWdpbn0gPT4gaHR0cHM6Ly8ke2xvY2F0aW9uLmhvc3R9YCwgZXZlbnQuZGF0YSlcbiAgICB9XG4gIH1cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpXG59XG4iLCJjb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGxldCB3aW5kb3dSZWZcbiAgcmV0dXJuIHtcbiAgICAvLyBleDogd3NfX2hlbHAoKVxuICAgIF9oZWxwICh7IGRhdGEgfSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fcGluZyhcInRoZXJlXCIpXG4gICAgX3BpbmcgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgIH0sXG4gICAgLy8gZXg6IHdzX19vcGVuKHt1cmw6IFwiaHR0cHM6Ly9nb29nbGUuY29tXCJ9KVxuICAgIF9vcGVuICh7IGRhdGEgfSkge1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSAnZGlyZWN0b3JpZXM9MCx0aXRsZWJhcj0wLHRvb2xiYXI9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCx3aWR0aD04MDAsaGVpZ2h0PTYwMCdcbiAgICAgIHdpbmRvd1JlZiA9IHdpbmRvdy5vcGVuKGRhdGEudXJsLCAnX2xvZ3MnLCBmZWF0dXJlcylcbiAgICAgIHdpbmRvd1JlZi5ibHVyKClcbiAgICB9LFxuICAgIC8vIGV4OiB3c19fc3R5bGUoJy5pbnRybz0+YmFja2dyb3VuZDpyZWQ7JylcbiAgICBfc3R5bGUgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zdCB7IHEsIGNzcyB9ID0gZGF0YVxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxKS5mb3JFYWNoKFxuICAgICAgICBub2RlID0+IChub2RlLnN0eWxlLmNzc1RleHQgPSBjc3MpXG4gICAgICApXG4gICAgfSxcbiAgICAvLyBleDogd3NfX1xuICAgIF9zYXZlVGFncyAoeyByb3V0ZXMsIF9fdGFnMSB9KSB7XG4gICAgICBpZiAoIWxvY2F0aW9uLm9yaWdpbi5tYXRjaCgnY2hyb21lLWV4dGVuc2lvbicpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBVcGRhdGUgcm91dGVzJywgX2MpXG4gICAgICAgIHdpbmRvdy5taXRtLnJvdXRlcyA9IHJvdXRlc1xuICAgICAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBfX3RhZzEgLy8jIF9fdGFnMSBpbi1zeW5jXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBleDogd3NfX1xuICAgIF9maWxlcyAoeyBkYXRhLCB0eXAgfSkge1xuICAgICAgY29uc3QgeyBmaWxlcyB9ID0gd2luZG93Lm1pdG1cbiAgICAgIGNvbnNvbGUud2FybihgcmVjZWl2ZSBicm9kY2FzdCAke3R5cH1gKVxuICAgICAgLyoqXG4gICAgICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcbiAgICAgICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAgICAgKi9cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzW2Ake3R5cH1fZXZlbnRzYF0pIHtcbiAgICAgICAgY29uc29sZS53YXJuKGZpbGVzW2Ake3R5cH1fZXZlbnRzYF1ba2V5XSArICcnKVxuICAgICAgICBmaWxlc1tgJHt0eXB9X2V2ZW50c2BdW2tleV0oZGF0YSlcbiAgICAgIH1cbiAgICB9LFxuICAgIF9zZXRDbGllbnQgKHsgZGF0YSB9KSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNXczogX3NldENsaWVudCcsIF9jLCBkYXRhKVxuICAgICAgd2luZG93Lm1pdG0uY2xpZW50ID0gZGF0YVxuICAgIH1cbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfY2xpZW50ID0gcmVxdWlyZSgnLi9fd3NfY2xpZW50JylcbmNvbnN0IF93c193Y2NtZCA9IF93c19jbGllbnQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudCwgbXNnKSA9PiB7XG4gIGlmICh3aW5kb3cubWl0bS5hcmd2LmRlYnVnPy5pbmNsdWRlcygnVycpKSB7XG4gICAgaWYgKG1zZy5sZW5ndGggPiA0MCkge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXMuLi5gJywgbXNnLnNsaWNlKDAsIDQwKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+PiB3cy1tZXNzYWdlOiBgJXNgJywgbXNnKVxuICAgIH1cbiAgfVxuICBjb25zdCBhcnIgPSBtc2cucmVwbGFjZSgvXFxzKyQvLCAnJykubWF0Y2goL14gKihbXFx3Ol0rKSAqKFxcey4qKS8pXG4gIGlmIChhcnIpIHtcbiAgICBsZXQgWywgY21kLCBqc29uXSA9IGFyclxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIChqc29uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoanNvbilcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihqc29uLCBlcnJvcilcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5fd3NfcXVldWVbY21kXSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVbY21kXVxuICAgICAgaGFuZGxlcihqc29uLmRhdGEpXG4gICAgfSBlbHNlIGlmIChfd3Nfd2NjbWRbY21kXSkge1xuICAgICAgX3dzX3djY21kW2NtZF0uY2FsbChldmVudCwganNvbilcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBsZXQgaWZybVxuICB0cnkge1xuICAgIGlmcm0gPSB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcFxuICB9IGNhdGNoIChlKSB7XG4gICAgaWZybSA9IHRydWVcbiAgfVxuICByZXR1cm4gaWZybSA/ICdpZnJhbWUnIDogJ3dpbmRvdydcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IHZlbmRvciB9ID0gbmF2aWdhdG9yXG4gIGNvbnN0IGJyb3dzZXIgPSB7XG4gICAgJyc6ICdmaXJlZm94JyxcbiAgICAnR29vZ2xlIEluYy4nOiAnY2hyb21pdW0nLFxuICAgICdBcHBsZSBDb21wdXRlciwgSW5jLic6ICd3ZWJraXQnXG4gIH1bdmVuZG9yXVxuICByZXR1cm4gYnJvd3NlclxufVxuIiwiLyogZ2xvYmFsIFdlYlNvY2tldCAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfd3NfbXNnUGFyc2VyID0gcmVxdWlyZSgnLi9fd3NfbXNnLXBhcnNlcicpXG5jb25zdCBfd3NfaW5JZnJhbWUgPSByZXF1aXJlKCcuL193c19pbi1pZnJhbWUnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIHdpbmRvdy5fd3NfcXVldWUgPSB7fVxuICB3aW5kb3cuX3dzX2Nvbm5lY3RlZCA9IGZhbHNlXG4gIGNvbnN0IHtfX2FyZ3MsIF9fZmxhZ30gPSB3aW5kb3cubWl0bVxuXG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxuICB9XG5cbiAgY29uc3Qgb25vcGVuID0gZGF0YSA9PiB7XG4gICAgZnVuY3Rpb24gd3Nfc2VuZCgpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHdpbmRvdy5fd3NfY29ubmVjdCkge1xuICAgICAgICBjb25zdCBmbiA9IHdpbmRvdy5fd3NfY29ubmVjdFtrZXldXG4gICAgICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkX3NlbmQgPSB0cnVlXG4gICAgICAgIGNvbnNvbGUubG9nKGAlY1dzOiAke2ZuKycnfWAsIF9jKVxuICAgICAgICBmbihkYXRhKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9wZW4gY29ubmVjdGlvbicsIF9jKVxuICAgIH1cblxuICAgIGNvbnNvbGUudGltZUVuZCgnd3MnKVxuICAgIHdpbmRvdy5fd3NfY29ubmVjdGVkID0gdHJ1ZVxuXG4gICAgc2V0VGltZW91dCh3c19zZW5kLCAxKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKCF3aW5kb3cuX3dzX2Nvbm5lY3RlZF9zZW5kKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JFVFJZLi4uLi4uLi4uLicpXG4gICAgICAgIHdzX3NlbmQoKVxuICAgICAgfVxuICAgIH0sIDEwKSAvLyBtaW5pbWl6ZSBpbnRlcm1pdHRlbiAgICAgXG4gIH1cblxuICBjb25zdCBvbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChfX2ZsYWdbJ3dzLWNvbm5lY3QnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IGNsb3NlIGNvbm5lY3Rpb24nLCBfYylcbiAgICB9XG4gIH1cblxuICBjb25zdCBvbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChfX2ZsYWdbJ29uLW1lc3NhZ2UnXSkge1xuICAgICAgY29uc29sZS5sb2coJyVjV3M6IG9uLW1lc3NhZ2U6JywgX2MsIGUuZGF0YSlcbiAgICB9XG4gICAgX3dzX21zZ1BhcnNlcihlLCBlLmRhdGEpXG4gIH1cbiAgXG4gIGNvbnN0IGNvbm5lY3QgPSBfX2FyZ3Mubm9zb2NrZXQ9PT11bmRlZmluZWRcbiAgaWYgKGNvbm5lY3QgfHwgKHdpbmRvdy5jaHJvbWUgJiYgY2hyb21lLnRhYnMpKSB7XG4gICAgY29uc3QgdmVuZG9yID0gWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKF93c192ZW5kb3IoKSlcbiAgICBjb25zdCBwcmUgPSB2ZW5kb3IgPyAnd3MnIDogJ3dzcydcbiAgICBjb25zdCBwcnQgPSB2ZW5kb3IgPyAnMzAwMicgOiAnMzAwMSdcbiAgICBjb25zdCB1cmwgPSBgJHtwcmV9Oi8vbG9jYWxob3N0OiR7cHJ0fS93cz9wYWdlPSR7X3dzX2luSWZyYW1lKCl9JnVybD0ke2RvY3VtZW50LlVSTC5zcGxpdCgnPycpWzBdfWBcbiAgICBsZXQgd3NcbiAgICB0cnkge1xuICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHVybCkgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICAgIGNvbnNvbGUudGltZSgnd3MnKVxuICAgIHdpbmRvdy5fd3MgPSB3c1xuICBcbiAgICB3cy5vbm9wZW4gPSBvbm9wZW5cbiAgICB3cy5vbmNsb3NlID0gb25jbG9zZVxuICAgIHdzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZSAgXG4gIH1cbiAgaWYgKF9fZmxhZ1snd3MtY29ubmVjdCddKSB7XG4gICAgY29uc29sZS5sb2coYCVjV3M6ICR7Y29ubmVjdCA/ICdpbml0JyA6ICdvZmYnfSBjb25uZWN0aW9uYCwgX2MpXG4gIH1cbn1cbiIsImFzeW5jIGZ1bmN0aW9uIHNjcmVuc2hvdChqc29uKSB7XG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgaWYgKFt0cnVlLCAnb2ZmJ10uaW5jbHVkZXMoX19hcmdzLm5vc29ja2V0KSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShqc29uKVxuICAgICAgICB9XG4gICAgICAgIGZldGNoKCcvbWl0bS1wbGF5L3NjcmVuc2hvdC5qc29uJywgY29uZmlnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXNvbHZlKHJlc3BvbnNlLmpzb24oKSl9KVxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhICAgICkgeyByZXNvbHZlKGRhdGEpICAgICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkgeyAgXG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3cud3NfX3NlbmQoJ3NjcmVlbnNob3QnLCBqc29uLCByZXNvbHZlKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgfVxuICAgIH0pICBcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBzY3JlbnNob3QiLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCB7IGhvc3RuYW1lOiBob3N0IH0gPSBsb2NhdGlvblxuICBsZXQgbmFtZXNwYWNlXG5cbiAgZnVuY3Rpb24gdG9SZWdleCAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiB3aW5kb3cubWl0bS5yb3V0ZXMpIHtcbiAgICBpZiAoaG9zdC5tYXRjaCh0b1JlZ2V4KGtleS5yZXBsYWNlKC9+L2csICdbXi5dKicpKSkpIHtcbiAgICAgIG5hbWVzcGFjZSA9IGtleVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hbWVzcGFjZVxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBtaXRtICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF9zY3JlZW5zaG90ID0gcmVxdWlyZSgnLi9fc2NyZWVuc2hvdCcpXG5jb25zdCBfd3NfbmFtZXNwYWNlID0gcmVxdWlyZSgnLi9fd3NfbmFtZXNwYWNlJylcbmNvbnN0IF93c192ZW5kb3IgPSByZXF1aXJlKCcuL193c192ZW5kb3InKVxuY29uc3QgX2MgPSAnY29sb3I6ICNiYWRhNTUnXG5cbmxldCBhY3RcbmZ1bmN0aW9uIHNjcmVlbnNob3QgKGUpIHtcbiAgaWYgKG1pdG0uYXJndi5sYXp5Y2xpY2spIHtcbiAgICBpZiAobWl0bS5zY3JlZW5zaG90KSB7XG4gICAgICB3aW5kb3cubWl0bS5zY3JlZW5zaG90ID0gdW5kZWZpbmVkXG4gICAgICBjb25zb2xlLmxvZygnPj4+IGRlbGF5IGFjdGlvbicpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGFjdCkge1xuICAgICAgYWN0ID0gdW5kZWZpbmVkXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3QgaG9zdCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKCc6Ly8nICwnfn4nKVxuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXG4gIGNvbnN0IHsgc2VsZWN0b3IgfSA9IHJvdXRlLnNjcmVlbnNob3RcblxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gIGNvbnN0IGZuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy9nLCAnficpXG4gIGNvbnN0IGRlbGF5ID0gbWl0bS5hcmd2LmxhenljbGljayA9PT0gdHJ1ZSA/IDcwMCA6IG1pdG0uYXJndi5sYXp5Y2xpY2tcbiAgZm9yIChjb25zdCBlbCBvZiBhcnIpIHtcbiAgICBsZXQgbm9kZSA9IGUudGFyZ2V0XG4gICAgd2hpbGUgKGVsICE9PSBub2RlICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuICAgIH1cbiAgICBpZiAobm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgX3BhZ2UgPSB3aW5kb3dbJ3hwbGF5LXBhZ2UnXVxuICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBicm93c2VyIH1cbiAgICAgIHBhcmFtcy5mbmFtZSA9IGZuYW1lPT09J34nID8gJ35fJyA6IGZuYW1lXG4gICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXG4gICAgICBpZiAobWl0bS5hcmd2LmxhenljbGljaykge1xuICAgICAgICAvLyBkZWxheSBhY3Rpb24gdG8gZmluaXNoIHNjcmVlbnNob3RcbiAgICAgICAgd2luZG93Lm1pdG0uc2NyZWVuc2hvdCA9IGUudGFyZ2V0XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgbWl0bS5sYXN0RXZlbnQgPSBlXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGFjdCA9IHdpbmRvdy5taXRtLnNjcmVlbnNob3RcbiAgICAgICAgICBpZiAoYWN0KSB7XG4gICAgICAgICAgICBhY3QuY2xpY2soKVxuICAgICAgICAgICAgYWN0ID0gdW5kZWZpbmVkXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY1dzOiBkZWxheSBhY3Rpb24gdW5kZWZpbmVkJywgX2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVsYXkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXRtLmxhc3RFdmVudCA9IGVcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudGNsaWNrKGUpIHtcbiAgbWl0bS5sYXN0RXZlbnQgPSBlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tfd3NfbmFtZXNwYWNlKCldXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcbiAgICBpZiAocm91dGUgJiYgcm91dGUuc2NyZWVuc2hvdCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNjcmVlbnNob3QpXG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudGNsaWNrKVxuICAgIH1cbiAgfSlcbn1cbiIsImNvbnN0IGtjb2RlMSA9IHtcbiAgQmFja3F1b3RlICAgOiAnYCcsXG4gIEJyYWNrZXRMZWZ0IDogJ1snLFxuICBCcmFja2V0UmlnaHQ6ICddJyxcbiAgQmFja3NsYXNoOiAnXFxcXCcsXG4gIENvbW1hICAgIDogJywnLFxuICBQZXJpb2QgICA6ICcuJyxcbiAgUXVvdGUgICAgOiBcIidcIixcbiAgU2VtaWNvbG9uOiAnOycsXG4gIFNsYXNoICAgIDogJy8nLFxuICBTcGFjZSAgICA6ICcgJyxcbiAgTWludXMgICAgOiAnLScsXG4gIEVxdWFsICAgIDogJz0nLFxufVxuXG5jb25zdCBrY29kZTIgPSB7XG4gIEJhY2txdW90ZSAgIDogJ34nLFxuICBCcmFja2V0TGVmdCA6ICd7JyxcbiAgQnJhY2tldFJpZ2h0OiAnfScsXG4gIEJhY2tzbGFzaDogJ3wnLFxuICBDb21tYSAgICA6ICc8JyxcbiAgUGVyaW9kICAgOiAnPicsXG4gIFF1b3RlICAgIDogJ1wiJyxcbiAgU2VtaWNvbG9uOiAnOicsXG4gIFNsYXNoICAgIDogJz8nLFxuICBTcGFjZSAgICA6ICcgJyxcbiAgTWludXMgICAgOiAnXycsXG4gIEVxdWFsICAgIDogJysnLFxufVxuXG5jb25zdCBrY29kZTMgPSB7XG4gIDE6ICchJyxcbiAgMjogJ0AnLFxuICAzOiAnIycsXG4gIDQ6ICckJyxcbiAgNTogJyUnLFxuICA2OiAnXicsXG4gIDc6ICcmJyxcbiAgODogJyonLFxuICA5OiAnKCcsXG4gIDEwOiAnKSdcbn1cblxuY29uc3Qga3Nob3cgPSB7XG4gIC4uLmtjb2RlMSxcbiAgRW50ZXI6ICdFbnRlcicsXG4gIENhcHNMb2NrOiAnQ2FwcycsXG4gIEJhY2tzcGFjZTogJ0JTJyxcbiAgRXNjYXBlOiAnRXNjJyxcbiAgRGlnaXQxOiAnMScsXG4gIERpZ2l0MjogJzInLFxuICBEaWdpdDM6ICczJyxcbiAgRGlnaXQ0OiAnNCcsXG4gIERpZ2l0NTogJzUnLFxuICBEaWdpdDY6ICc2JyxcbiAgRGlnaXQ3OiAnNycsXG4gIERpZ2l0ODogJzgnLFxuICBEaWdpdDk6ICc5JyxcbiAgRGlnaXQwOiAnMCcsXG4gIFRhYjogJ1RhYicsXG4gIEtleUE6ICdhJyxcbiAgS2V5QjogJ2InLFxuICBLZXlDOiAnYycsXG4gIEtleUQ6ICdkJyxcbiAgS2V5RTogJ2UnLFxuICBLZXlGOiAnZicsXG4gIEtleUc6ICdnJyxcbiAgS2V5SDogJ2gnLFxuICBLZXlJOiAnaScsXG4gIEtleUo6ICdqJyxcbiAgS2V5SzogJ2snLFxuICBLZXlMOiAnbCcsXG4gIEtleU06ICdtJyxcbiAgS2V5TjogJ24nLFxuICBLZXlPOiAnbycsXG4gIEtleVA6ICdwJyxcbiAgS2V5UTogJ3EnLFxuICBLZXlSOiAncicsXG4gIEtleVM6ICdzJyxcbiAgS2V5VDogJ3QnLFxuICBLZXlVOiAndScsXG4gIEtleVY6ICd2JyxcbiAgS2V5VzogJ3cnLFxuICBLZXlYOiAneCcsXG4gIEtleVk6ICd5JyxcbiAgS2V5WjogJ3onLFxuICBGMTogICdGMScsXG4gIEYyOiAgJ0YyJyxcbiAgRjM6ICAnRjMnLFxuICBGNDogICdGNCcsXG4gIEY1OiAgJ0Y1JyxcbiAgRjY6ICAnRjYnLFxuICBGNzogICdGNycsXG4gIEY4OiAgJ0Y4JyxcbiAgRjk6ICAnRjknLFxuICBGMTA6ICdGMTAnLFxuICBGMTE6ICdGMTEnLFxuICBGMTI6ICdGMTInLFxuICBFbmQ6ICdFbmQnLFxuICBIb21lOiAnSG9tZScsXG4gIEFycm93VXA6ICAgICfihpEnLFxuICBBcnJvd0Rvd246ICAn4oaTJyxcbiAgQXJyb3dMZWZ0OiAgJ+KGkCcsXG4gIEFycm93UmlnaHQ6ICfihpInLFxuICBEZWxldGU6ICAgJ0RlbCcsXG4gIFBhZ2VVcDogICAnUGdVcCcsXG4gIFBhZ2VEb3duOiAnUGdEbicsXG59XG5cbmZ1bmN0aW9uIGNvZGVUb0NoYXIoZXZuLCBvcHQ9e2NvZGVPbmx5OmZhbHNlfSkge1xuICBjb25zdCB7Y29kZSwgc2hpZnRLZXl9ID0gZXZuXG4gIGNvbnN0IHtjb2RlT25seX0gPSBvcHRcbiAgbGV0IG1hdGNoXG4gIGxldCBjaGFyID0gJydcbiAgbWF0Y2ggPSBjb2RlLm1hdGNoKC9LZXkoLikvKVxuICBpZiAobWF0Y2gpIHtcbiAgICBjaGFyID0gbWF0Y2gucG9wKClcbiAgICBpZiAoIWNvZGVPbmx5ICYmICFzaGlmdEtleSkge1xuICAgICAgY2hhciA9IGNoYXIudG9Mb3dlckNhc2UoKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtYXRjaCA9IGNvZGUubWF0Y2goLyhEaWdpdHxOdW1wYWQpKC4pLylcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNoYXIgPSBtYXRjaC5wb3AoKVxuICAgICAgaWYgKCFjb2RlT25seSAmJiBzaGlmdEtleSkge1xuICAgICAgICBjaGFyID0ga2NvZGUzW2NoYXJdXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghY29kZU9ubHkgJiYgc2hpZnRLZXkpIHtcbiAgICAgICAgY2hhciA9IGtjb2RlMltjb2RlXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhciA9IGtjb2RlMVtjb2RlXVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gY2hhclxufVxuXG5mdW5jdGlvbiBjb2RlVG9TaG93KGNvZGVzKSB7XG4gIHJldHVybiBjb2Rlcy5zcGxpdCgnOicpLm1hcCh4PT57XG4gICAgcmV0dXJuIGAke2tzaG93W3hdfWBcbiAgfSkuam9pbign4pynJylcbn1cblxud2luZG93Lm1pdG0uZm4uY29kZVRvQ2hhciA9IGNvZGVUb0NoYXJcbndpbmRvdy5taXRtLmZuLmNvZGVUb1Nob3cgPSBjb2RlVG9TaG93XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29kZVRvQ2hhcixcbiAga2NvZGUxLFxuICBrY29kZTIsXG4gIGtjb2RlMyxcbiAga3Nob3dcbn0iLCJjb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5mdW5jdGlvbiBfcG9zdChqc29uKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGpzb24pXG4gICAgICB9XG4gICAgICBmZXRjaCgnL21pdG0tcGxheS9wbGF5Lmpzb24nLCBjb25maWcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXNvbHZlKHJlc3BvbnNlLmpzb24oKSl9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSAgICApIHsgcmVzb2x2ZShkYXRhKSAgICAgICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gX3BsYXkoanNvbikge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHdpbmRvdy53c19fc2VuZCgnYXV0b2ZpbGwnLCBqc29uLCByZXNvbHZlKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfVxuICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBwbGF5IChhdXRvZmlsbCkge1xuICBjb25zdCB7X19hcmdzfSA9IHdpbmRvdy5taXRtXG4gIGlmIChhdXRvZmlsbCkge1xuICAgIGlmICh0eXBlb2YgKGF1dG9maWxsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYXV0b2ZpbGwgPSBhdXRvZmlsbCgpXG4gICAgfVxuICAgIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgICBjb25zdCBsZW50aCA9IGF1dG9maWxsLmxlbmd0aFxuICAgIGNvbnN0IF9wYWdlID0gd2luZG93Wyd4cGxheS1wYWdlJ11cbiAgICBjb25zdCBfZnJhbWUgPSB3aW5kb3dbJ3hwbGF5LWZyYW1lJ11cbiAgICBjb25zdCBfanNvbiA9IHthdXRvZmlsbCwgYnJvd3NlciwgX3BhZ2UsIF9mcmFtZX1cbiAgICBjb25zdCBtc2cgPSBsZW50aCA9PT0gMSA/IGAgICR7YXV0b2ZpbGx9YCA6IEpTT04uc3RyaW5naWZ5KGF1dG9maWxsLCBudWxsLCAyKVxuICAgIGNvbnNvbGUubG9nKGAlY01hY3JvczogJHttc2d9YCwgX2MpXG4gICAgbGV0IHJlc3VsdFxuICAgIGlmIChbdHJ1ZSwgJ29mZiddLmluY2x1ZGVzKF9fYXJncy5ub3NvY2tldCkpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IF9wb3N0KF9qc29uKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCBfcGxheShfanNvbilcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmZ1bmN0aW9uIHNxbGl0ZSgpIHtcbiAgY29uc3QgW2NtZCwgcSwgdGJsXSA9IGFyZ3VtZW50c1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB7cX1cbiAgICAgIGlmICh0YmwpIHtcbiAgICAgICAgZGF0YS50YmwgPSB0YmxcbiAgICAgIH1cbiAgICAgIHdpbmRvdy53c19fc2VuZChjbWQsIGRhdGEsIHJlc29sdmUpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9XG4gIH0pXG59XG5cbndpbmRvdy5taXRtLmZuLnNxbExpc3QgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbExpc3QnLCBxLCB0YmwpXG53aW5kb3cubWl0bS5mbi5zcWxEZWwgID0gKHEsIHRibCkgPT4gc3FsaXRlKCdzcWxEZWwnICwgcSwgdGJsKVxud2luZG93Lm1pdG0uZm4uc3FsSW5zICA9IChxLCB0YmwpID0+IHNxbGl0ZSgnc3FsSW5zJyAsIHEsIHRibClcbndpbmRvdy5taXRtLmZuLnNxbFVwZCAgPSAocSwgdGJsKSA9PiBzcWxpdGUoJ3NxbFVwZCcgLCBxLCB0YmwpXG5cbm1vZHVsZS5leHBvcnRzID0gcGxheVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uLCBoaXN0b3J5LCBjaHJvbWUsIEV2ZW50LCBDc3NTZWxlY3RvckdlbmVyYXRvciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCB7Y29kZVRvQ2hhcjpfa2V5fSA9IHJlcXVpcmUoJy4vX2tleWJvYXJkJylcbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuY29uc3QgX3dzX3ZlbmRvciA9IHJlcXVpcmUoJy4vX3dzX3ZlbmRvcicpXG5jb25zdCBwbGF5ID0gcmVxdWlyZSgnLi9fd3NfcGxheScpXG5jb25zdCBfYyA9ICdjb2xvcjogI2JhZGE1NSdcbmNvbnN0IHN0eWxlTGVmdCAgPSAndG9wOiAtMnB4OyBsZWZ0OiAgM3B4OydcbmNvbnN0IHN0eWxlVG9wUiAgPSAndG9wOiAgMHB4OyByaWdodDogM3B4OydcbmNvbnN0IHN0eWxlUmlnaHQgPSAndG9wOiAxNHB4OyByaWdodDogM3B4OydcbmNvbnN0IGJ1dHRvblN0eWxlPSAnJ1xuY29uc3Qgc3R5bGUgPSBgXG4ubWl0bS1jb250YWluZXIge1xuICB6LWluZGV4OiA5OTk5OTtcbiAgcG9zaXRpb246IGZpeGVkO1xuICBmb250LXNpemU6IDEycHg7XG4gIGxpbmUtaGVpZ2h0OiAxNHB4O1xufVxuLm1pdG0tY29udGFpbmVyLmNlbnRlciB7XG4gIGJhY2tncm91bmQ6ICNmY2ZmZGNiMDtcbiAgcG9zaXRpb246IGZpeGVkO1xuICAvKiBjZW50ZXIgdGhlIGVsZW1lbnQgKi9cbiAgcmlnaHQ6IDA7XG4gIGxlZnQ6IDA7XG4gIHRvcDogMjBweDtcbiAgbWFyZ2luLXJpZ2h0OiBhdXRvO1xuICBtYXJnaW4tbGVmdDogYXV0bztcbiAgLyogZ2l2ZSBpdCBkaW1lbnNpb25zICovXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDUwcHgpO1xuICBwYWRkaW5nOiA1cHggMTBweDtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdpZHRoOiA5MCU7XG4gIGRpc3BsYXk6IG5vbmU7XG59XG4ubWl0bS1idG4ge1xuICBjb2xvcjogYmxhY2s7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC1zaXplOiA4cHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMXB4IDZweDtcbiAgYm9yZGVyLXJhZGl1czogM3B4O1xuICBmb250LWZhbWlseTogbW9uYWNvLCBDb25zb2xhcywgXCJMdWNpZGEgQ29uc29sZVwiLCBtb25vc3BhY2U7XG59XG4ubWl0bS1idG46aG92ZXJ7XG4gIHRleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7XG59XG4ubWl0bS1idG4ubGVmdCxcbi5taXRtLWJ0bi5yaWdodCB7XG4gIGRpc3BsYXk6IGJsb2NrO1xufVxuLm1pdG0tYnRuLnJpZ2h0IHtcbiAgZmxvYXQ6IHJpZ2h0O1xuICBtYXJnaW4tdG9wOiAycHg7XG59XG4uYmdyb3VwLWxlZnQsXG4uYmdyb3VwLXJpZ2h0IHtcbiAgZGlzcGxheTogdGFibGU7XG4gIG1hcmdpbi10b3A6IDRweDtcbn1cbi5iZ3JvdXAtbGVmdDIge1xuICBkaXNwbGF5OiB0YWJsZTtcbiAgbWFyZ2luLXRvcDogMDtcbn1cbi5iZ3JvdXAtbGVmdD5kaXYsXG4uYmdyb3VwLWxlZnQyPmRpdixcbi5iZ3JvdXAtcmlnaHQ+ZGl2IHtcbiAgcGFkZGluZy1ib3R0b206IDJweDtcbn1cbi5iZ3JvdXAtdG9wcixcbi5iZ3JvdXAtdG9wciBzcGFuIHtcbiAgZm9udC1zaXplOiAxNHB4O1xufWBcblxubGV0IGNvbnRhaW5lciA9IHtcbiAgdG9wcjoge30sXG4gIGxlZnQ6IHt9LFxuICByaWdodDoge30sXG4gIHRhcmdldDoge30sXG59XG5sZXQgYnV0dG9uID0ge31cbmxldCBiZ3JvdXAgPSB7XG4gIHJpZ2h0OiB7fSxcbiAgdG9wcjoge30sXG4gIGxlZnQ6IHt9LFxufVxuXG5mdW5jdGlvbiB3YWl0KG1zKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKVxufTtcblxuZnVuY3Rpb24gdG9SZWdleCAocGF0aE1zZykge1xuICBsZXQgW3BhdGgsIG1zZ10gPSBwYXRoTXNnLnNwbGl0KCc9PicpLm1hcChpdGVtID0+IGl0ZW0udHJpbSgpKVxuICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpXG4gIHJldHVybiB7IHBhdGgsIG1zZyB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1dHRvbihidXR0b25zLCBwb3MpIHtcbiAgZm9yIChjb25zdCBpZCBpbiBidXR0b25zKSB7XG4gICAgY29uc3QgW2NhcHRpb24sIGNvbG9yLCBrbGFzXSA9IGlkLnNwbGl0KCd8JykubWFwKHg9PngudHJpbSgpKVxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXG4gICAgY29uc3QgZm4gID0gYnV0dG9uc1tpZF1cbiAgICBidG4ub25jbGljayA9IGFzeW5jIGUgPT4ge1xuICAgICAgbGV0IGFyciA9IGZuKGUpXG4gICAgICBpZiAoYXJyIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICBhcnIgPSBhd2FpdCBhcnJcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgICAgYXdhaXQgcGxheShhcnIpXG4gICAgICB9XG4gICAgfVxuICAgIGJ0bi5pbm5lclRleHQgPSBjYXB0aW9uXG4gICAgYnRuLmNsYXNzTGlzdC5hZGQoJ21pdG0tYnRuJylcbiAgICBidG4uY2xhc3NMaXN0LmFkZChgJHtwb3N9YClcbiAgICBidG4uY2xhc3NMaXN0LmFkZChrbGFzIHx8IGNhcHRpb24pXG4gICAgYnRuLnN0eWxlID0gYnV0dG9uU3R5bGUgKyAoY29sb3IgPyBgYmFja2dyb3VuZDogJHtjb2xvcn07YCA6ICcnKVxuICAgIGlmIChwb3M9PT0ndG9wcicpIHtcbiAgICAgIGNvbnN0IGJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgICBici5pbm5lckhUTUwgPSAnJm5ic3A7J1xuICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoYnIpXG4gICAgICBiZ3JvdXBbcG9zXS5hcHBlbmRDaGlsZChidG4pXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBkaXYuYXBwZW5kQ2hpbGQoYnRuKVxuICAgICAgYmdyb3VwW3Bvc10uYXBwZW5kQ2hpbGQoZGl2KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRCdXR0b25zIChidXR0b25zLCBwb3NpdGlvbikge1xuICBpZiAoYmdyb3VwW3Bvc2l0aW9uXSkge1xuICAgIGJncm91cFtwb3NpdGlvbl0uaW5uZXJIVE1MID0gJydcbiAgICBjcmVhdGVCdXR0b24oYnV0dG9ucywgcG9zaXRpb24pXG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdEhvdEtleXMoKSB7XG4gIGNvbnN0IHttaXRtOiB7c3ZlbHRlOiB7Q3NwaGVhZGVyLCBTcWxpdGV9LCBmbn19ID0gd2luZG93XG4gIGNvbnN0IHFyeSAgPSAnLm1pdG0tY29udGFpbmVyLnBvcHVwJyBcbiAgY29uc3Qgd2NhZzIgPSBbXG4gICAgJ3djYWcyYScsXG4gICAgJ3djYWcyYWEnLFxuICAgICd3Y2FnMjFhJyxcbiAgICAnd2NhZzIxYWEnLFxuICBdXG4gIGNvbnN0IHdjYWczID0gW1xuICAgIC8vIC4uLndjYWcyLFxuICAgICd3Y2FnMmFhYScsXG4gICAgJ3djYWcyMWFhYScsXG4gICAgJ2Jlc3QtcHJhY3RpY2UnLFxuICBdXG4gIGNvbnN0IHJ1bGVzT2JqID0ge1xuICAgICdjb2xvci1jb250cmFzdCc6IHsgZW5hYmxlZDogdHJ1ZSB9LFxuICB9XG4gIGNvbnN0IGtleXMgPSB7XG4gICAgJ2NvZGU6S2V5QycoX2UpIHtmbi5zdmVsdGUoQ3NwaGVhZGVyLCAnTGlnaHRQYXN0ZWxHcmVlbicpfSxcbiAgICAnY29kZTpLZXlRJyhfZSkge2ZuLnN2ZWx0ZShTcWxpdGUgICAsICdMaWdodFBhc3RlbEdyZWVuJyl9LFxuICAgICdrZXk6eXl5JyAgKF9lKSB7Zm4uYXhlcnVuKHdjYWczLCBydWxlc09iaiAgICAgICAgICAgICAgKX0sXG4gICAgJ2tleTp5eScgICAoX2UpIHtmbi5heGVydW4od2NhZzIgICAgICAgICAgICAgICAgICAgICAgICApfSxcbiAgICAna2V5OnknICAgIChfZSkge2ZuLmF4ZXJ1biggICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9LFxuICAgICdrZXk6YycgICAgKF9lKSB7ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxcnkpLmlubmVyVGV4dD0nJ30sXG4gIH1cbiAga2V5c1snY29kZTpLZXlDJ10uX3RpdGxlID0gJ1Nob3cgQ1NQIEhlYWRlcidcbiAga2V5c1snY29kZTpLZXlRJ10uX3RpdGxlID0gJ1Nob3cgU3FsaXRlJ1xuICBrZXlzWydrZXk6eXl5JyAgXS5fdGl0bGUgPSAnRXhlY3MgYTExeSBzdHJpY3QnXG4gIGtleXNbJ2tleTp5eScgICBdLl90aXRsZSA9ICdFeGVjcyBhMTF5IHdjYWc6YWEnXG4gIGtleXNbJ2tleTp5JyAgICBdLl90aXRsZSA9ICdFeGVjcyBhMTF5IGNoZWNrJ1xuICBrZXlzWydrZXk6YycgICAgXS5fdGl0bGUgPSAnQ2xlYXIgYTExeSByZXN1bHQnXG4gIG1pdG0ubWFjcm9rZXlzID0ga2V5c1xufVxuXG5sZXQgZGVidW5rXG5sZXQgaW50ZXJ2SWRcbmxldCBvbmNlcyA9IHt9IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxuXG5hc3luYyBmdW5jdGlvbiB1cmxDaGFuZ2UgKGV2ZW50KSB7XG4gIGNvbnN0IG5hbWVzcGFjZSA9IF93c19uYW1lc3BhY2UoKVxuICBjb25zdCB7bWl0bX0gPSB3aW5kb3dcblxuICBpZiAobWl0bS5hcmd2LmExMXkgJiYgbWl0bS5mbi5heGVydW4pIHtcbiAgICBtaXRtLmZuLmF4ZXJ1bigpXG4gIH1cblxuICBjbGVhckludGVydmFsKGludGVydklkKVxuICBpZiAobWl0bS5hdXRvaW50ZXJ2YWwpIHtkZWxldGUgbWl0bS5hdXRvaW50ZXJ2YWx9XG4gIGlmIChtaXRtLmF1dG9maWxsKSAgICAge2RlbGV0ZSBtaXRtLmF1dG9maWxsICAgIH1cbiAgaWYgKG1pdG0uYXV0b2J1dHRvbnMpICB7ZGVsZXRlIG1pdG0uYXV0b2J1dHRvbnMgfVxuICBpZiAobWl0bS5sZWZ0YnV0dG9ucykgIHtkZWxldGUgbWl0bS5sZWZ0YnV0dG9ucyB9XG4gIGlmIChtaXRtLnJpZ2h0YnV0dG9ucykge2RlbGV0ZSBtaXRtLnJpZ2h0YnV0dG9uc31cbiAgaWYgKG1pdG0ubWFjcm9rZXlzKSAgICB7ZGVmYXVsdEhvdEtleXMoKSAgICAgICAgfVxuICBpZiAobmFtZXNwYWNlKSB7XG4gICAgY29uc3Qge2hyZWYsIG9yaWdpbn0gPSBsb2NhdGlvblxuICAgIGNvbnN0IF9ocmVmID0gaHJlZi5yZXBsYWNlKG9yaWdpbiwgJycpXG4gICAgb2JzZXJ2ZXJmbiA9IFtdXG4gICAgbGV0IG5vbmUgPSB0cnVlXG4gICAgZm9yIChjb25zdCBrZXkgaW4gbWl0bS5tYWNyb3MpIHtcbiAgICAgIGNvbnN0IHsgcGF0aCwgbXNnIH0gPSB0b1JlZ2V4KGtleSlcbiAgICAgIGlmIChfaHJlZi5tYXRjaChwYXRoKSkge1xuICAgICAgICBub25lID0gZmFsc2VcbiAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IG1zZyB8fCAnRW50cnknXG4gICAgICAgIGxldCBmbnMgPSBtaXRtLm1hY3Jvc1trZXldKClcbiAgICAgICAgaWYgKGZucyBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICBmbnMgPSBhd2FpdCBmbnNcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9ic2VydmVyZm4ucHVzaChmbnMpXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmbnMpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBmbjIgb2YgZm5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuMiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICBvYnNlcnZlcmZuLnB1c2goZm4yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkZWJ1bmsgJiYgY2xlYXJUaW1lb3V0KGRlYnVuaylcbiAgICAgICAgZGVidW5rID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgb25jZXMgPSB7fSAvLyBmZWF0OiBvbmV0aW1lIGZuIGNhbGxcbiAgICAgICAgICBkZWJ1bmsgPSB1bmRlZmluZWRcbiAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhdXRvYnV0dG9ucyxcbiAgICAgICAgICAgIHJpZ2h0YnV0dG9ucyxcbiAgICAgICAgICAgIGxlZnRidXR0b25zLFxuICAgICAgICAgICAgbGVmdDJidXR0b25zXG4gICAgICAgICAgfSA9IHdpbmRvdy5taXRtXG4gICAgICAgICAgaWYgKHdpbmRvdy5taXRtLmF1dG9maWxsKSB7XG4gICAgICAgICAgICBhdXRvYnV0dG9ucyAmJiBzZXRCdXR0b25zKHtcbiAgICAgICAgICAgICAgLi4uYXV0b2J1dHRvbnMsXG4gICAgICAgICAgICAgICdFbnRyeScoKSB7XG4gICAgICAgICAgICAgICAgbGV0IHthdXRvZmlsbH0gPSB3aW5kb3cubWl0bVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXV0b2ZpbGwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgIGF1dG9maWxsID0gYXV0b2ZpbGwoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwbGF5KGF1dG9maWxsKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAndG9wcicpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICd0b3ByJyApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJpZ2h0YnV0dG9ucyAmJiBzZXRCdXR0b25zKHJpZ2h0YnV0dG9ucywgJ3JpZ2h0JylcbiAgICAgICAgICBsZWZ0MmJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhsZWZ0MmJ1dHRvbnMsICdsZWZ0MicpXG4gICAgICAgICAgbGVmdGJ1dHRvbnMgICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMgLCAnbGVmdCcgKVxuICAgICAgICB9LCAwKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobm9uZSkge1xuICAgICAgc2V0QnV0dG9ucyh7fSwgJ3JpZ2h0JylcbiAgICAgIHNldEJ1dHRvbnMoe30sICdsZWZ0JylcbiAgICAgIHNldEJ1dHRvbnMoe30sICd0b3ByJylcbiAgICAgIGNvbnN0IHtsZWZ0MmJ1dHRvbnN9ID0gd2luZG93Lm1pdG1cbiAgICAgIGxlZnQyYnV0dG9ucyAmJiBzZXRCdXR0b25zKGxlZnQyYnV0dG9ucywgJ2xlZnQyJylcbiAgICB9XG4gIH1cbiAgY29udGFpbmVyLnJpZ2h0LnN0eWxlID0gc3R5bGVSaWdodFxuICBjb250YWluZXIudG9wci5zdHlsZSAgPSBzdHlsZVRvcFJcbiAgY29udGFpbmVyLmxlZnQuc3R5bGUgID0gc3R5bGVMZWZ0XG4gIGNvbnN0IHZpc2libGUgPSAod2luZG93Lm1pdG0uYXV0b2ZpbGwpXG4gIGJ1dHRvbi5zdHlsZSA9IGJ1dHRvblN0eWxlICsgKHZpc2libGUgPyAnYmFja2dyb3VuZC1jb2xvcjogYXp1cmU7JyA6ICdkaXNwbGF5OiBub25lOycpXG4gIGlmICh0eXBlb2YgKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCkgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpbnRlcnZJZCA9IHNldEludGVydmFsKHdpbmRvdy5taXRtLmF1dG9pbnRlcnZhbCwgNTAwKVxuICB9XG4gIGN0cmwgPSBmYWxzZVxufVxuXG5jb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNvbXBhcmVIcmVmKTtcbndpbmRvdy5vYnNlcnZlciA9IG9ic2VydmVyXG5mdW5jdGlvbiBvYnNlcnZlZCgpIHtcbiAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICBzdWJ0cmVlOiB0cnVlXG4gIH0pXG59XG5cbmNvbnN0IF91cmxDaGFuZ2VkID0gbmV3IEV2ZW50KCd1cmxjaGFuZ2VkJylcbmZ1bmN0aW9uIGluaXQoKSB7XG4gIGNvbnN0IGJvZHkgICAgID0gZG9jdW1lbnQuYm9keVxuICBjb25zdCBkaXZSaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgZGl2VG9wUiAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGRpdkxlZnQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyAgKVxuICBjb25zdCBkaXZQb3B1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicgIClcbiAgY29uc3QgZGl2Q2VudGVyPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnICApXG4gIGNvbnN0IGh0bWwgICAgID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcgKVxuICBjb25zdCBzdHlsZUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgY29uc3QgaHRtbHJlZiAgPSBodG1sLmZpcnN0RWxlbWVudENoaWxkXG4gIGNvbnN0IGJvZHlyZWYgID0gYm9keS5maXJzdEVsZW1lbnRDaGlsZFxuICBkaXZSaWdodC5zdHlsZSA9IHN0eWxlUmlnaHRcbiAgZGl2VG9wUiAuc3R5bGUgPSBzdHlsZVRvcFJcbiAgZGl2TGVmdCAuc3R5bGUgPSBzdHlsZUxlZnRcblxuICBzdHlsZUJ0biAuaW5uZXJIVE1MID0gc3R5bGVcbiAgc3R5bGVCdG4gLmNsYXNzTmFtZSA9ICdtaXRtLWNsYXNzJ1xuICBkaXZSaWdodCAuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYmdyb3VwLXJpZ2h0XCI+PC9zcGFuPmBcbiAgZGl2VG9wUiAgLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC10b3ByXCI+PC9zcGFuPmBcbiAgZGl2TGVmdCAgLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImJncm91cC1sZWZ0XCI+PC9zcGFuPjxzcGFuIGNsYXNzPVwiYmdyb3VwLWxlZnQyXCI+PC9zcGFuPmBcbiAgZGl2TGVmdCAgLmNsYXNzTmFtZSA9ICdtaXRtLWNvbnRhaW5lciBsZWZ0J1xuICBkaXZUb3BSICAuY2xhc3NOYW1lID0gJ21pdG0tY29udGFpbmVyIHRvcHInXG4gIGRpdlJpZ2h0IC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcmlnaHQnXG4gIGRpdlBvcHVwIC5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgcG9wdXAnXG4gIGRpdkNlbnRlci5jbGFzc05hbWUgPSAnbWl0bS1jb250YWluZXIgY2VudGVyJ1xuXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKHN0eWxlQnRuICwgaHRtbHJlZilcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2UmlnaHQgLCBodG1scmVmKVxuICBodG1sLmluc2VydEJlZm9yZShkaXZUb3BSICAsIGh0bWxyZWYpXG4gIGh0bWwuaW5zZXJ0QmVmb3JlKGRpdkxlZnQgICwgaHRtbHJlZilcbiAgaHRtbC5pbnNlcnRCZWZvcmUoZGl2Q2VudGVyLCBodG1scmVmKVxuICBib2R5Lmluc2VydEJlZm9yZShkaXZQb3B1cCAsIGJvZHlyZWYpXG4gIC8vIGJvZHkuYXBwZW5kQ2hpbGQgKGRpdlBvcHVwKVxuICBjb25zdCBob3RrZXkgPSBuZXcgbWl0bS5zdmVsdGUuSG90a2V5cyh7dGFyZ2V0OmRpdkNlbnRlcn0pXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbnRhaW5lci50b3ByID0gZGl2VG9wUlxuICAgIGNvbnRhaW5lci5sZWZ0ID0gZGl2TGVmdFxuICAgIGNvbnRhaW5lci5yaWdodD0gZGl2UmlnaHRcbiAgICBjb250YWluZXIuaG90a2V5ID0gaG90a2V5XG4gICAgY29udGFpbmVyLnBvcHVwICA9IGRpdlBvcHVwXG4gICAgY29udGFpbmVyLnRhcmdldCA9IGRpdkNlbnRlclxuICAgIGNvbnRhaW5lci5ub2Rla2V5PSBkaXZDZW50ZXIuY2hpbGRyZW5bMF1cbiAgICBidXR0b24uc3R5bGUgPSBgJHtidXR0b25TdHlsZX1iYWNrZ3JvdW5kLWNvbG9yOiBhenVyZTtgXG4gICAgYmdyb3VwLnJpZ2h0ID0gZGl2UmlnaHQuY2hpbGRyZW5bMF1cbiAgICBiZ3JvdXAudG9wciAgPSBkaXZUb3BSIC5jaGlsZHJlblswXVxuICAgIGJncm91cC5sZWZ0ICA9IGRpdkxlZnQgLmNoaWxkcmVuWzBdXG4gICAgYmdyb3VwLmxlZnQyID0gZGl2TGVmdCAuY2hpbGRyZW5bMV1cbiAgICB1cmxDaGFuZ2UoX3VybENoYW5nZWQpXG4gICAgb2JzZXJ2ZWQoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChjZW50ZXIgJiYgIWRpdkNlbnRlci5jb250YWlucyhldmVudC50YXJnZXQpKSB7XG4gICAgICAgIGRpdkNlbnRlci5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxuICAgICAgICBjZW50ZXIgPSBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuICB9LCAwKVxufVxuXG5mdW5jdGlvbiBtYWNyb0F1dG9tYXRpb24obWFjcm8pIHtcbiAgaWYgKGNlbnRlcikge1xuICAgIGNvbnRhaW5lci50YXJnZXQuYXR0cmlidXRlcy5yZW1vdmVOYW1lZEl0ZW0oJ3N0eWxlJylcbiAgICBjZW50ZXIgPSBmYWxzZVxuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG1hY3JvKSkge1xuICAgIGxldCBtYWNyb0luZGV4ID0gMFxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgbGV0IHNlbGVjdG9yID0gbWFjcm9bbWFjcm9JbmRleF1cbiAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXiAqWz0tXT4vKSkge1xuICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gQ3NzU2VsZWN0b3JHZW5lcmF0b3IuZ2V0Q3NzU2VsZWN0b3IoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcbiAgICAgICAgc2VsZWN0b3IgPSBgJHthY3RpdmVFbGVtZW50fSAke3NlbGVjdG9yfWBcbiAgICAgIH1cbiAgICAgIHBsYXkoW3NlbGVjdG9yXSlcblxuICAgICAgbWFjcm9JbmRleCArPSAxXG4gICAgICBpZiAobWFjcm9JbmRleCA+PSBtYWNyby5sZW5ndGgpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcbiAgICAgIH1cbiAgICB9LCAxMDApXG4gIH1cbn1cblxubGV0IHN0ZERibCA9IFtdXG5sZXQgaGdoRGJsID0gW11cbmxldCBzdGRDdGwgPSBbXVxubGV0IGhnaEN0bCA9IFtdXG5sZXQgc3RkQWx0ID0gW11cbmxldCBoZ2hBbHQgPSBbXVxubGV0IHNhdmVLZXkgPSAnJ1xuY29uc3Qga2RlbGF5ID0gMTAwMFxuXG5sZXQgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcbmZ1bmN0aW9uIG1hY3JvRGJsKCkge1xuICBjb25zdCBrZXkxID0gYGtleToke3N0ZERibC5qb2luKCcnKX1gXG4gIGNvbnN0IGtleTIgPSBgY29kZToke2hnaERibC5qb2luKCc6Jyl9YFxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cblxuICBzdGREYmwgPSBbXVxuICBoZ2hEYmwgPSBbXVxuICBzYXZlS2V5ID0gJydcbiAgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IGN0cmwgKyBhbHQgICsgICR7a2V5MX0gIHwgICR7a2V5Mn1gLCBfYylcbiAgaWYgKG1hY3JvKSB7XG4gICAgbWFjcm8gPSBtYWNybyhlKVxuICAgIG1hY3JvQXV0b21hdGlvbihtYWNybylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmxldCBkZWJvdW5jZUN0bCA9IHVuZGVmaW5lZFxuZnVuY3Rpb24gbWFjcm9DdGwoKSB7XG4gIGNvbnN0IGtleTEgPSBga2V5Ojwke3N0ZEN0bC5qb2luKCcnKX0+YFxuICBjb25zdCBrZXkyID0gYGNvZGU6PCR7aGdoQ3RsLmpvaW4oJzonKX0+YFxuICBjb25zdCB7IG1hY3Jva2V5cywgbGFzdEtleTogZSB9ID0gd2luZG93Lm1pdG1cblxuICBzdGRDdGwgPSBbXVxuICBoZ2hDdGwgPSBbXVxuICBzYXZlS2V5ID0gJydcbiAgZGVib3VuY2VDdGwgPSB1bmRlZmluZWRcbiAgbGV0IG1hY3JvID0gbWFjcm9rZXlzW2tleTFdIHx8IG1hY3Jva2V5c1trZXkyXVxuICBjb25zb2xlLmxvZyhgJWNNYWNyb3M6IC4uLi4gKyBjdHJsICsgJHtrZXkxfSB8ICR7a2V5Mn1gLCAnY29sb3I6ICNiYWVhZjEnKVxuICBpZiAobWFjcm8pIHtcbiAgICBtYWNybyA9IG1hY3JvKGUpXG4gICAgbWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxubGV0IGRlYm91bmNlQWx0ID0gdW5kZWZpbmVkXG5mdW5jdGlvbiBtYWNyb0FsdCgpIHtcbiAgY29uc3Qga2V5MSA9IGBrZXk6eyR7c3RkQWx0LmpvaW4oJycpfX1gXG4gIGNvbnN0IGtleTIgPSBgY29kZTp7JHtoZ2hBbHQuam9pbignOicpfX1gXG4gIGNvbnN0IHsgbWFjcm9rZXlzLCBsYXN0S2V5OiBlIH0gPSB3aW5kb3cubWl0bVxuXG4gIHN0ZEFsdCA9IFtdXG4gIGhnaEFsdCA9IFtdXG4gIHNhdmVLZXkgPSAnJ1xuICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuICBsZXQgbWFjcm8gPSBtYWNyb2tleXNba2V5MV0gfHwgbWFjcm9rZXlzW2tleTJdXG4gIGNvbnNvbGUubG9nKGAlY01hY3JvczogLi4uLiArIGFsdCAgKyAke2tleTF9IHwgJHtrZXkyfWAsICdjb2xvcjogI2JhZGFmMScpXG4gIGlmIChtYWNybykge1xuICAgIG1hY3JvID0gbWFjcm8oZSlcbiAgICBtYWNyb0F1dG9tYXRpb24obWFjcm8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5mdW5jdGlvbiBrZXliVXAgKGUpIHtcbiAgaWYgKCFlLmFsdEtleSkge1xuICAgIGlmIChkZWJvdW5jZURibCB8fCAoZGVib3VuY2VDdGwgJiYgIWUuY3RybEtleSkgfHwgZGVib3VuY2VBbHQpIHtcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZURibClcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUFsdClcbiAgICAgIGlmIChkZWJvdW5jZURibCkge1xuICAgICAgICBtYWNyb0RibCgpXG4gICAgICB9IGVsc2UgXG4gICAgICBpZiAoZGVib3VuY2VDdGwpIHtcbiAgICAgICAgbWFjcm9DdGwoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFjcm9BbHQoKVxuICAgICAgfVxuICAgICAgZGVib3VuY2VEYmwgPSB1bmRlZmluZWRcbiAgICAgIGRlYm91bmNlQ3RsID0gdW5kZWZpbmVkXG4gICAgICBkZWJvdW5jZUFsdCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfVxufVxudmFyIGN0cmwgPSBmYWxzZVxudmFyIGNlbnRlciA9IGZhbHNlXG5mdW5jdGlvbiBrZXliQ3RybCAoZSkge1xuICBpZiAoIWUuY29kZSB8fCBbJ0FsdCcsICdDb250cm9sJywgJ01ldGEnXS5pbmNsdWRlcyhlLmtleSkpIHtcbiAgICByZXR1cm5cbiAgfSBlbHNlIHtcbiAgICBpZiAoZS5rZXk9PT0nU2hpZnQnKSB7XG4gICAgICBpZiAoZS5jdHJsS2V5ICYmICFlLmFsdEtleSkge1xuICAgICAgICBjb25zdCB7bm9kZWtleSwgdGFyZ2V0LCByaWdodCwgdG9wciwgbGVmdH0gPSBjb250YWluZXJcbiAgICAgICAgaWYgKGUuY29kZT09PSdTaGlmdFJpZ2h0Jykge1xuICAgICAgICAgIGN0cmwgPSAhY3RybFxuICAgICAgICAgIHJpZ2h0LnN0eWxlID0gc3R5bGVSaWdodCsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKVxuICAgICAgICAgIHRvcHIuc3R5bGUgID0gc3R5bGVUb3BSICsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKVxuICAgICAgICAgIGxlZnQuc3R5bGUgID0gc3R5bGVMZWZ0ICsgKCFjdHJsID8gJycgOiAnZGlzcGxheTogbm9uZTsnKSAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRhcmdldC5jaGlsZHJlblswXSE9PW5vZGVrZXkpIHtcbiAgICAgICAgICAgIHRhcmdldC5yZXBsYWNlQ2hpbGRyZW4obm9kZWtleSlcbiAgICAgICAgICAgIHRhcmdldC5zdHlsZSA9ICdkaXNwbGF5OiBibG9jazsnXG4gICAgICAgICAgICBjZW50ZXIgPSB0cnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbnRlciA9ICFjZW50ZXJcbiAgICAgICAgICAgIGlmIChjZW50ZXIpIHtcbiAgICAgICAgICAgICAgdGFyZ2V0LnN0eWxlID0gJ2Rpc3BsYXk6IGJsb2NrOydcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRhcmdldC5hdHRyaWJ1dGVzLnJlbW92ZU5hbWVkSXRlbSgnc3R5bGUnKVxuICAgICAgICAgICAgfSAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjaGFyID0gX2tleShlKVxuICAgICAgaWYgKGUuY3RybEtleSAmJiBlLmFsdEtleSkge1xuICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICAgIGNoYXIgPSBfa2V5KGUsIHtjb2RlT25seTogdHJ1ZX0pXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlRGJsKVxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZUN0bClcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXG4gICAgICAgICAgc2F2ZUtleSArPSBjaGFyXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH0gXG4gICAgICAgIHN0ZERibC5wdXNoKGNoYXIpXG4gICAgICAgIGhnaERibC5wdXNoKGUuY29kZSlcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlRGJsKVxuICAgICAgICBkZWJvdW5jZURibCA9IHNldFRpbWVvdXQobWFjcm9EYmwsIGtkZWxheSlcbiAgICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgIHN0ZEN0bC5wdXNoKGNoYXIpXG4gICAgICAgIGhnaEN0bC5wdXNoKGUuY29kZSlcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlQ3RsKVxuICAgICAgICBkZWJvdW5jZUN0bCA9IHNldFRpbWVvdXQobWFjcm9DdGwsIGtkZWxheSlcbiAgICAgIH0gZWxzZSBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICAgc3RkQWx0LnB1c2goY2hhcilcbiAgICAgICAgaGdoQWx0LnB1c2goZS5jb2RlKVxuICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VBbHQpXG4gICAgICAgIGRlYm91bmNlQWx0ID0gc2V0VGltZW91dChtYWNyb0FsdCwga2RlbGF5KVxuICAgICAgfVxuICAgICAgZS5fa2V5cyA9IHNhdmVLZXlcbiAgICAgIG1pdG0ubGFzdEtleSA9IGUgICAgICAgIFxuICAgIH0gXG4gIH1cbn1cblxuY29uc3Qge2xvY2F0aW9ufSA9IGRvY3VtZW50XG5sZXQgb2xkSHJlZiA9IGxvY2F0aW9uLmhyZWZcbmxldCBvRGVidW5rID0gdW5kZWZpbmVkXG5sZXQgb2JzZXJ2ZXJmbiA9IFtdXG5cbmZ1bmN0aW9uIGNvbXBhcmVIcmVmKG5vZGVzKSB7XG4gIC8vIGNvbnNvbGUubG9nKGAlY01hY3JvczogRE9NIG11dGF0ZWQhYCwgX2MpXG4gIGlmIChvbGRIcmVmICE9IGxvY2F0aW9uLmhyZWYpIHtcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChfdXJsQ2hhbmdlZClcbiAgICBvbGRIcmVmID0gbG9jYXRpb24uaHJlZlxuICB9IGVsc2Uge1xuICAgIGlmIChvYnNlcnZlcmZuLmxlbmd0aCkge1xuICAgICAgb0RlYnVuayAmJiBjbGVhclRpbWVvdXQob0RlYnVuaylcbiAgICAgIG9EZWJ1bmsgPSBzZXRUaW1lb3V0KCgpPT4ge1xuICAgICAgICBvRGVidW5rID0gdW5kZWZpbmVkXG4gICAgICAgIGZvciAoY29uc3QgZm4gb2Ygb2JzZXJ2ZXJmbikge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBmbi5uYW1lXG4gICAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5tYXRjaCgvT25jZSQvKSkge1xuICAgICAgICAgICAgaWYgKG9uY2VzW25hbWVdKSB7IC8vIGZlYXQ6IG9uZXRpbWUgZm4gY2FsbFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgb25jZXNbbmFtZV0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZuKG5vZGVzKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHthdXRvYnV0dG9ucywgcmlnaHRidXR0b25zLCBsZWZ0YnV0dG9uc30gPSB3aW5kb3cubWl0bVxuICAgICAgICByaWdodGJ1dHRvbnMgJiYgc2V0QnV0dG9ucyhyaWdodGJ1dHRvbnMsICdyaWdodCcpXG4gICAgICAgIGxlZnRidXR0b25zICYmIHNldEJ1dHRvbnMobGVmdGJ1dHRvbnMsICdsZWZ0JylcbiAgICAgICAgY29uc3QgeyBhdXRvZmlsbCB9ID0gd2luZG93Lm1pdG1cbiAgICAgICAgaWYgKGF1dG9maWxsKSB7XG4gICAgICAgICAgYXV0b2J1dHRvbnMgJiYgc2V0QnV0dG9ucyh7XG4gICAgICAgICAgICAuLi5hdXRvYnV0dG9ucyxcbiAgICAgICAgICAgICdFbnRyeScoKSB7cGxheShhdXRvZmlsbCl9XG4gICAgICAgICAgfSwgJ3RvcHInKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF1dG9idXR0b25zICYmIHNldEJ1dHRvbnMoYXV0b2J1dHRvbnMsICd0b3ByJylcbiAgICAgICAgfVxuXG4gICAgICB9LCAxMDApXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHdzTG9jYXRpb24oKSB7XG4gIGNvbnN0IHZlbmRvciA9IF93c192ZW5kb3IoKVxuICBpZiAoWydmaXJlZm94JywgJ3dlYmtpdCddLmluY2x1ZGVzKHZlbmRvcikgfHwgKGNocm9tZSAmJiAhY2hyb21lLnRhYnMpKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXliQ3RybClcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBrZXliVXApXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VybGNoYW5nZWQnLCB1cmxDaGFuZ2UpXG4gICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICBpbml0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdClcbiAgICB9ICAgIFxuICB9IGVsc2Uge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgZm4gPSBoaXN0b3J5LnB1c2hTdGF0ZVxuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmbi5hcHBseShoaXN0b3J5LCBhcmd1bWVudHMpXG4gICAgY29tcGFyZUhyZWYoKVxuICB9XG59XG5cbmNvbnN0IHBhc3RlbCA9IHtcbiAgUG9zdEl0OiAgICAgICAgICAnI2ZjZmZkY2Q2JyxcbiAgUGFzdGVsR3JlZW46ICAgICAnIzc3ZGQ3N2Q2JyxcbiAgUGFzdGVsQnJvd246ICAgICAnIzgzNjk1M2Q2JyxcbiAgQmFieUJsdWU6ICAgICAgICAnIzg5Y2ZmMGQ2JyxcbiAgUGFzdGVsVHVycXVvaXNlOiAnIzk5YzVjNGQ2JyxcbiAgQmx1ZUdyZWVuUGFzdGVsOiAnIzlhZGVkYmQ2JyxcbiAgUGVyc2lhblBhc3RlbDogICAnI2FhOTQ5OWQ2JyxcbiAgTWFnaWNNaW50OiAgICAgICAnI2FhZjBkMWQ2JyxcbiAgTGlnaHRQYXN0ZWxHcmVlbjonI2IyZmJhNWQ2JyxcbiAgUGFzdGVsUHVycGxlOiAgICAnI2IzOWViNWQ2JyxcbiAgUGFzdGVsTGlsYWM6ICAgICAnI2JkYjBkMGQ2JyxcbiAgUGFzdGVsUGVhOiAgICAgICAnI2JlZTdhNWQ2JyxcbiAgTGlnaHRMaW1lOiAgICAgICAnI2JlZmQ3M2Q2JyxcbiAgTGlnaHRQZXJpd2lua2xlOiAnI2MxYzZmY2Q2JyxcbiAgUGFsZU1hdXZlOiAgICAgICAnI2M2YTRhNGQ2JyxcbiAgTGlnaHRMaWdodEdyZWVuOiAnI2M4ZmZiMGQ2JyxcbiAgUGFzdGVsVmlvbGV0OiAgICAnI2NiOTljOWQ2JyxcbiAgUGFzdGVsTWludDogICAgICAnI2NlZjBjY2Q2JyxcbiAgUGFzdGVsR3JleTogICAgICAnI2NmY2ZjNGQ2JyxcbiAgUGFsZUJsdWU6ICAgICAgICAnI2Q2ZmZmZWQ2JyxcbiAgUGFzdGVsTGF2ZW5kZXI6ICAnI2Q4YTFjNGQ2JyxcbiAgUGFzdGVsUGluazogICAgICAnI2RlYTVhNGQ2JyxcbiAgUGFzdGVsU21pcms6ICAgICAnI2RlZWNlMWQ2JyxcbiAgUGFzdGVsRGF5OiAgICAgICAnI2RmZDhlMWQ2JyxcbiAgUGFzdGVsUGFyY2htZW50OiAnI2U1ZDlkM2Q2JyxcbiAgUGFzdGVsUm9zZVRhbjogICAnI2U5ZDFiZmQ2JyxcbiAgUGFzdGVsTWFnZW50YTogICAnI2Y0OWFjMmQ2JyxcbiAgRWxlY3RyaWNMYXZlbmRlcjonI2Y0YmZmZmQ2JyxcbiAgUGFzdGVsWWVsbG93OiAgICAnI2ZkZmQ5NmQ2JyxcbiAgUGFzdGVsUmVkOiAgICAgICAnI2ZmNjk2MWQ2JyxcbiAgUGFzdGVsT3JhbmdlOiAgICAnI2ZmOTY0ZmQ2JyxcbiAgQW1lcmljYW5QaW5rOiAgICAnI2ZmOTg5OWQ2JyxcbiAgQmFieVBpbms6ICAgICAgICAnI2ZmYjdjZWQ2JyxcbiAgQmFieVB1cnBsZTogICAgICAnI2NhOWJmN2Q2Jyxcbn1cblxuZnVuY3Rpb24gc3ZlbHRlKFN2ZWx0LCBiZz0nUG9zdEl0JykgeyAvLyBmZWF0OiBzdmVsdGUgcmVsYXRlZFxuICBjb25zdCB7dGFyZ2V0LCBwb3B1cH0gPSBjb250YWluZXJcbiAgdGFyZ2V0LnJlcGxhY2VDaGlsZHJlbignJylcbiAgLy8gcG9wdXAgLnJlcGxhY2VDaGlsZHJlbignJylcbiAgaWYgKHR5cGVvZihiZykhPT0nc3RyaW5nJyAmJiBiZy5wb3B1cCkge1xuICAgIGNvbnN0IHByb3BzID0ge25vZGU6IGJnLm5vZGV9XG4gICAgd2luZG93Lm1pdG0uc2FwcCA9IG5ldyBTdmVsdCh7dGFyZ2V0OiBwb3B1cCwgcHJvcHN9KVxuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5taXRtLnNhcHAgPSBuZXcgU3ZlbHQoe3RhcmdldH0pXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCBiY29sb3IgPSBwYXN0ZWxbYmddXG4gICAgICB0YXJnZXQuc3R5bGUgPSBgZGlzcGxheTogYmxvY2ske2Jjb2xvciA/ICc7YmFja2dyb3VuZDonK2Jjb2xvciA6ICcnfTtgXG4gICAgICBjZW50ZXIgPSB0cnVlXG4gICAgfSwgMCkgIFxuICB9XG59XG5cbmZ1bmN0aW9uIGhvdEtleXMob2JqKSB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcbiAgICAuLi53aW5kb3cubWl0bS5tYWNyb2tleXMsXG4gICAgLi4ub2JqXG4gIH1cbn1cblxud2luZG93Lm1pdG0uZm4ubWFjcm9BdXRvbWF0aW9uID0gbWFjcm9BdXRvbWF0aW9uXG53aW5kb3cubWl0bS5mbi5ob3RLZXlzID0gaG90S2V5c1xud2luZG93Lm1pdG0uZm4uc3ZlbHRlID0gc3ZlbHRlXG53aW5kb3cubWl0bS5mbi5wbGF5ID0gcGxheVxud2luZG93Lm1pdG0uZm4ud2FpdCA9IHdhaXRcblxubW9kdWxlLmV4cG9ydHMgPSB3c0xvY2F0aW9uXG4iLCJmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGRlbGF5ID0gNTAwKSB7XG4gIGxldCBfdGltZW91dFxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHNcbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGZuLmFwcGx5KF90aGlzLCBhcmdzKVxuICAgIH0sIGRlbGF5KVxuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlXG4iLCIvKiBnbG9iYWwgbG9jYXRpb24gKi9cbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGxldCByb3V0ZSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuYW1lc3BhY2VdXG4gIGNvbnN0IHtfc3VibnM6IHN9ID0gcm91dGUuX2NoaWxkbnNcbiAgaWYgKHMgJiYgbWl0bS5yb3V0ZXNbc10pIHtcbiAgICByb3V0ZT0gbWl0bS5yb3V0ZXNbc11cbiAgfVxuICByZXR1cm4gcm91dGVcbn1cbiIsIi8qIGdsb2JhbCBsb2NhdGlvbiwgTXV0YXRpb25PYnNlcnZlciAqL1xuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5jb25zdCBfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3NjcmVlbnNob3QnKVxuY29uc3QgX3dzX25hbWVzcGFjZSA9IHJlcXVpcmUoJy4vX3dzX25hbWVzcGFjZScpXG5jb25zdCBfd3NfZGVib3VuY2UgPSByZXF1aXJlKCcuL193c19kZWJvdW5jZScpXG5jb25zdCBfd3NfdmVuZG9yID0gcmVxdWlyZSgnLi9fd3NfdmVuZG9yJylcbmNvbnN0IF93c19yb3V0ZSA9IHJlcXVpcmUoJy4vX3dzX3JvdXRlJylcblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGlmIChsb2NhdGlvbi5vcmlnaW4ubWF0Y2goJ2Nocm9tZS1leHRlbnNpb24nKSkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGhvc3QgPSBsb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSgnOi8vJyAsJ35+JylcbiAgY29uc3Qgc3Nob3QgPSB7fVxuICBjb25zdCBub2RlcyA9IHt9XG5cbiAgbGV0IHJvdXRlID0gX3dzX3JvdXRlKClcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICBjb25zdCB7IG9ic2VydmVyOiBvYiB9ID0gcm91dGUuc2NyZWVuc2hvdFxuICAgIGZvciAoY29uc3QgaWQgaW4gb2IpIHtcbiAgICAgIGxldCBlbCA9IHt9XG4gICAgICBpZiAob2JbaWRdID09PSB0cnVlKSB7XG4gICAgICAgIGVsID0ge1xuICAgICAgICAgIHRpdGxlOiAnbm90aXRsZScsXG4gICAgICAgICAgaW5zZXJ0OiB0cnVlLFxuICAgICAgICAgIHJlbW92ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGlmICh0eXBlb2Ygb2JbaWRdICE9PSAnc3RyaW5nJykge1xuICAgICAgICBlbCA9IHtcbiAgICAgICAgICB0aXRsZTogJ25vY2FwdHVyZScsXG4gICAgICAgICAgaW5zZXJ0OiBmYWxzZSxcbiAgICAgICAgICByZW1vdmU6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFyciA9IG9iW2lkXS5zcGxpdCgnOicpXG4gICAgICAgIGFyclsxXS5zcGxpdCgnLCcpLm1hcChlID0+IHtcbiAgICAgICAgICBlbFtlXSA9IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgZWwudGl0bGUgPSBhcnJbMF1cbiAgICAgIH1cbiAgICAgIHNzaG90W2lkXSA9IGVsXG4gICAgICBub2Rlc1tpZF0gPSB7XG4gICAgICAgIGluc2VydDogZmFsc2UsXG4gICAgICAgIHJlbW92ZTogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBvYlxuICBsZXQgZm5hbWVcbiAgY29uc3QgbmFtZXNwYWNlID0gX3dzX25hbWVzcGFjZSgpXG4gIGNvbnN0IGJyb3dzZXIgPSBfd3NfdmVuZG9yKClcbiAgY29uc3QgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICAgIG9iID0gcm91dGUuc2NyZWVuc2hvdC5vYnNlcnZlclxuICAgIH1cbiAgICBjb25zdCBfcGFnZSA9IHdpbmRvd1sneHBsYXktcGFnZSddXG4gICAgZm9yIChjb25zdCBpZCBpbiBub2Rlcykge1xuICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoaWQpXG4gICAgICBpZiAoZWwubGVuZ3RoKSB7XG4gICAgICAgIGlmICghbm9kZXNbaWRdLmluc2VydCkge1xuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSB0cnVlXG4gICAgICAgICAgaWYgKG5vZGVzW2lkXS5yZW1vdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbm9kZXNbaWRdLnJlbW92ZSA9IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvYiAmJiB0eXBlb2Ygb2JbaWRdPT09J2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3Qgbm9kID0gZWxbMF0gfHwgZWxcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PT09dW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIG5vZC5fd3NfY291bnQgPSAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2QuX3dzX2NvdW50ICs9IDFcbiAgICAgICAgICAgIGlmIChub2QuX3dzX2NvdW50PDIpIHtcbiAgICAgICAgICAgICAgb2JbaWRdKG5vZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IFxuICAgICAgICAgIGlmIChzc2hvdFtpZF0uaW5zZXJ0KSB7XG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcbiAgICAgICAgICAgIGZuYW1lID0gYH4ke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0taW5zZXJ0YFxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9XG4gICAgICAgICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIW5vZGVzW2lkXS5yZW1vdmUpIHtcbiAgICAgICAgICBub2Rlc1tpZF0ucmVtb3ZlID0gdHJ1ZVxuICAgICAgICAgIG5vZGVzW2lkXS5pbnNlcnQgPSBmYWxzZVxuICAgICAgICAgIGlmIChzc2hvdFtpZF0ucmVtb3ZlKSB7XG4gICAgICAgICAgICBmbmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvL2csICctJylcbiAgICAgICAgICAgIGZuYW1lID0gYH4ke2ZuYW1lfS0ke3NzaG90W2lkXS50aXRsZX0tcmVtb3ZlYFxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0geyBuYW1lc3BhY2UsIF9wYWdlLCBob3N0LCBmbmFtZSwgYnJvd3NlciB9XG4gICAgICAgICAgICBfc2NyZWVuc2hvdChwYXJhbXMpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHJvdXRlICYmIHJvdXRlLnNjcmVlbnNob3QpIHtcbiAgICBjb25zdCB7b2JzZXJ2ZXI6IG9ifSA9IHJvdXRlLnNjcmVlbnNob3RcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgYXR0cmlidXRlczogb2IgPyB0cnVlIDogZmFsc2UsXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgfVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKF93c19kZWJvdW5jZShjYWxsYmFjaywgMjgwKSlcbiAgICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgb3B0aW9ucylcbiAgICB9KVxuICB9XG59XG4iLCJjb25zdCB0NjQgPSAnV2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaaCdcbmNvbnN0IF9jID0gJ2NvbG9yOiAjYmFkYTU1J1xuXG5jb25zdCBuYW5vaWQgPSAoc2l6ZSA9IDgpID0+IHtcbiAgbGV0IGlkID0gJydcbiAgd2hpbGUgKHNpemUtLSA+IDApIHtcbiAgICBpZCArPSB0NjRbTWF0aC5yYW5kb20oKSAqIDY0IHwgMF1cbiAgfVxuICByZXR1cm4gaWRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG4gIGNvbnN0IHsgX3dzIH0gPSB3aW5kb3dcblxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfc3R5bGV7XCJkYXRhXCI6e1wicVwiOlwiKlwiLFwiY3NzXCI6XCJjb2xvcjpibHVlO1wifX0nKVxuICAvLyBleDogd3NfYnJvYWRjYXN0KCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXG4gIHdpbmRvdy53c19icm9hZGNhc3QgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxuICAgIF93cy5zZW5kKGBicm9hZGNhc3Qke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19lbWl0cGFnZSgnX3N0eWxle1wiZGF0YVwiOntcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn19JylcbiAgLy8gZXg6IHdzX2VtaXRwYWdlKCdfcGluZ3tcImRhdGFcIjpcIkhpIVwifScpXG4gIHdpbmRvdy53c19lbWl0cGFnZSA9IChqc29uLCByZWdleCA9ICcnKSA9PiB7XG4gICAgY29uc3QgbXNnID0geyBkYXRhOiBqc29uLCByZWdleCB9XG4gICAgX3dzLnNlbmQoYGVtaXRwYWdlJHtKU09OLnN0cmluZ2lmeShtc2cpfWApXG4gIH1cblxuICAvLyBleDogd3NfX3N0eWxlKHtcInFcIjpcIipcIixcImNzc1wiOlwiY29sb3I6Ymx1ZTtcIn0pXG4gIHdpbmRvdy53c19fc3R5bGUgPSAoanNvbiwgX2FsbCA9IHRydWUpID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24sIF9hbGwgfVxuICAgIF93cy5zZW5kKGBfc3R5bGUke0pTT04uc3RyaW5naWZ5KG1zZyl9YClcbiAgfVxuXG4gIC8vIGV4OiB3c19fcGluZygnSGkhJylcbiAgd2luZG93LndzX19waW5nID0gKGpzb24pID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxuICAgIF93cy5zZW5kKGBfcGluZyR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgLy8gZXg6IHdzX19oZWxwKClcbiAgd2luZG93LndzX19oZWxwID0gKCkgPT4ge1xuICAgIF93cy5zZW5kKCdfaGVscHt9JylcbiAgfVxuXG4gIC8vIGV4OiB3c19fb3Blbih7dXJsOidodHRwczovL2dvb2dsZS5jb20nfSlcbiAgd2luZG93LndzX19vcGVuID0gKGpzb24pID0+IHtcbiAgICBjb25zdCBtc2cgPSB7IGRhdGE6IGpzb24gfVxuICAgIF93cy5zZW5kKGBfb3BlbiR7SlNPTi5zdHJpbmdpZnkobXNnKX1gKVxuICB9XG5cbiAgd2luZG93LndzX19zZW5kID0gKGNtZCwgZGF0YSwgaGFuZGxlcikgPT4ge1xuICAgIGNvbnN0IHsgX19mbGFnIH0gPSB3aW5kb3cubWl0bVxuICAgIGNvbnN0IGlkID0gbmFub2lkKClcbiAgICBjb25zdCBrZXkgPSBgJHtjbWR9OiR7aWR9YFxuICAgIHdpbmRvdy5fd3NfcXVldWVba2V5XSA9IGhhbmRsZXIgfHwgKHcgPT4ge30pXG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh3aW5kb3cuX3dzX3F1ZXVlW2tleV0pIHtcbiAgICAgICAgZGVsZXRlIHdpbmRvdy5fd3NfcXVldWVba2V5XVxuICAgICAgICBjb25zb2xlLmxvZygnJWNXczogd3MgdGltZW91dCEnLCBfYywga2V5KVxuICAgICAgfVxuICAgIH0sIDUwMDApXG4gICAgXG4gICAgY29uc3QgcGFyYW1zID0gYCR7a2V5fSR7SlNPTi5zdHJpbmdpZnkoeyBkYXRhIH0pfWBcbiAgICBjb25zdCBmbGFnID0gd2luZG93Lm1pdG0uX19mbGFnWyd3cy1tZXNzYWdlJ11cbiAgICBpZiAoZmxhZyA+IDEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBfd3Muc2VuZDogJHtwYXJhbXN9YClcbiAgICB9XG4gICAgX3dzLnNlbmQocGFyYW1zKVxuICB9XG4gIGNvbnN0IHdzcnVuID0ge31cbiAgY29uc3QgYXJyID0gd2luZG93Lm1pdG0ud3NydW5cbiAgZm9yIChjb25zdCBrIG9mIGFycikge1xuICAgIGNvbnN0IGNtZCAgPSBrLnJlcGxhY2UoJyQnLCAnJylcbiAgICB3c3J1bltjbWRdID0gKGRhdGEsIGhhbmRsZXIpID0+IHdpbmRvdy53c19fc2VuZChjbWQsIGRhdGEsIGhhbmRsZXIpXG4gIH1cbiAgd2luZG93Lm1pdG0ud3NydW4gPSB3c3J1blxufVxuIiwiLyogZ2xvYmFsIGxvY2F0aW9uICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbmNvbnN0IF93c19uYW1lc3BhY2UgPSByZXF1aXJlKCcuL193c19uYW1lc3BhY2UnKVxuXG5sZXQgX3RpbWVvdXRcbmxldCBfY3NwID0ge31cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBjc3BFcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc3QgeyBob3N0bmFtZTogaG9zdCB9ID0gbG9jYXRpb25cbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfd3NfbmFtZXNwYWNlKClcbiAgICBjb25zdCBwYXRoID0gbG9jYXRpb24ucGF0aG5hbWVcbiAgICAgIC5yZXBsYWNlKC9eXFwvLywgJycpXG4gICAgICAucmVwbGFjZSgvXFwvL2csICctJylcbiAgICBjb25zdCB7XG4gICAgICBibG9ja2VkVVJJLFxuICAgICAgZGlzcG9zaXRpb24sXG4gICAgICBkb2N1bWVudFVSSSxcbiAgICAgIGVmZmVjdGl2ZURpcmVjdGl2ZSxcbiAgICAgIG9yaWdpbmFsUG9saWN5LFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZSxcbiAgICAgIHZpb2xhdGVkRGlyZWN0aXZlXG4gICAgfSA9IGVcbiAgICBjb25zdCB0eXAgPSBgWyR7ZGlzcG9zaXRpb259XSAke2RvY3VtZW50VVJJfWBcbiAgICBpZiAoIV9jc3BbdHlwXSkge1xuICAgICAgX2NzcFt0eXBdID0ge31cbiAgICB9XG4gICAgaWYgKCFfY3NwW3R5cF0uX2dlbmVyYWxfKSB7XG4gICAgICBfY3NwW3R5cF0uX2dlbmVyYWxfID0ge1xuICAgICAgICBwb2xpY3k6IG9yaWdpbmFsUG9saWN5LFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIGhvc3QsXG4gICAgICAgIHBhdGhcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgX2RvYyA9IF9jc3BbdHlwXVxuICAgIGlmICghX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV0pIHtcbiAgICAgIF9kb2NbdmlvbGF0ZWREaXJlY3RpdmVdID0ge31cbiAgICB9XG5cbiAgICBjb25zdCBfZXJyID0gX2RvY1t2aW9sYXRlZERpcmVjdGl2ZV1cbiAgICBpZiAoIV9lcnJbYmxvY2tlZFVSSV0pIHtcbiAgICAgIF9lcnJbYmxvY2tlZFVSSV0gPSB7fVxuICAgIH1cbiAgICBjb25zdCBfbWF0Y2ggPSBvcmlnaW5hbFBvbGljeS5tYXRjaChgJHt2aW9sYXRlZERpcmVjdGl2ZX0gW147XSs7YClcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBfbWF0Y2ggPyBfbWF0Y2hbMF0gOiBlZmZlY3RpdmVEaXJlY3RpdmVcbiAgICBfZXJyW2Jsb2NrZWRVUkldID0ge1xuICAgICAgZGlyZWN0aXZlLFxuICAgICAgdGltZVN0YW1wLFxuICAgICAgdHlwZVxuICAgIH1cbiAgICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpXG4gICAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gQ1NQOicsIF9jc3ApXG4gICAgICAvLyB3aW5kb3cud3NfX3NlbmQoJ2NzcF9lcnJvcicsIHtcbiAgICAgIC8vICAgbmFtZXNwYWNlLFxuICAgICAgLy8gICBob3N0LFxuICAgICAgLy8gICBwYXRoLFxuICAgICAgLy8gICBfY3NwLFxuICAgICAgLy8gfSk7XG4gICAgICBfY3NwID0ge31cbiAgICB9LCA0MDAwKVxuICB9XG5cbiAgaWYgKHdpbmRvdy5taXRtLmNsaWVudC5jc3ApIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWN1cml0eXBvbGljeXZpb2xhdGlvbicsIGNzcEVycm9yKVxuICB9XG59XG4vLyBkaXNwb3NpdGlvbjogXCJyZXBvcnRcIlxuLy8gZG9jdW1lbnRVUkk6IFwiaHR0cHM6Ly93aGF0L2h0bWwvY29udGFpbi9jc3BcIlxuLy8gdmlvbGF0ZWREaXJlY3RpdmU6IFwiaW1nLXNyY1wiXG5cbi8vIGJsb2NrZWRVUkk6IFwiaHR0cHM6Ly93aGF0L3VybC9nZXR0aW5nL2Jsb2NrZWRcIlxuLy8gZWZmZWN0aXZlRGlyZWN0aXZlOiBcImltZy1zcmNcIlxuLy8gb3JpZ2luYWxQb2xpY3k6IFwic2NyaXB0LXNyYyBudWxsOyBmcmFtZS1zcmMgbnVsbDsgc3R5bGUtc3JjIG51bGw7IHN0eWxlLXNyYy1lbGVtIG51bGw7IGltZy1zcmMgbnVsbDtcIlxuLy8gdGltZVN0YW1wOiAxOTMzLjgyMDAwMDAwNTY1MzFcbi8vIHR5cGU6IFwic2VjdXJpdHlwb2xpY3l2aW9sYXRpb25cIlxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxuICB9XG4gIFxuICB3aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxuICAgIH0sIDEwMDApXG4gIH1cbiAgXG4gIHdpbmRvdy5taXRtLmZuLmdldENvb2tpZSA9IG5hbWUgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gYDsgJHtkb2N1bWVudC5jb29raWV9YDtcbiAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KGA7ICR7bmFtZX09YCk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgcmV0dXJuIHBhcnRzLnBvcCgpLnNwbGl0KCc7Jykuc2hpZnQoKTtcbiAgfVxuXG4gIGNvbnN0IG9uTW91bnQgPSBlID0+IGNvbnNvbGUubG9nKCclY01hY3JvczogZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsICdjb2xvcjogIzVhZGE1NScsIGUpXG4gIHdpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gb25Nb3VudFxufVxuIiwiZnVuY3Rpb24gbm9vcCgpIHsgfVxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5mdW5jdGlvbiBhc3NpZ24odGFyLCBzcmMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZm9yIChjb25zdCBrIGluIHNyYylcbiAgICAgICAgdGFyW2tdID0gc3JjW2tdO1xuICAgIHJldHVybiB0YXI7XG59XG5mdW5jdGlvbiBpc19wcm9taXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG4gICAgZWxlbWVudC5fX3N2ZWx0ZV9tZXRhID0ge1xuICAgICAgICBsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxubGV0IHNyY191cmxfZXF1YWxfYW5jaG9yO1xuZnVuY3Rpb24gc3JjX3VybF9lcXVhbChlbGVtZW50X3NyYywgdXJsKSB7XG4gICAgaWYgKCFzcmNfdXJsX2VxdWFsX2FuY2hvcikge1xuICAgICAgICBzcmNfdXJsX2VxdWFsX2FuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICB9XG4gICAgc3JjX3VybF9lcXVhbF9hbmNob3IuaHJlZiA9IHVybDtcbiAgICByZXR1cm4gZWxlbWVudF9zcmMgPT09IHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWY7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdF9iYXNlKHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBzbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBpZiAoc2xvdF9jaGFuZ2VzKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY29udGV4dCA9IGdldF9zbG90X2NvbnRleHQoc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGdldF9zbG90X2NvbnRleHRfZm4pO1xuICAgICAgICBzbG90LnAoc2xvdF9jb250ZXh0LCBzbG90X2NoYW5nZXMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90KHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbn1cbmZ1bmN0aW9uIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSgkJHNjb3BlKSB7XG4gICAgaWYgKCQkc2NvcGUuY3R4Lmxlbmd0aCA+IDMyKSB7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gW107XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9ICQkc2NvcGUuY3R4Lmxlbmd0aCAvIDMyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkaXJ0eVtpXSA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlKSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gVHJhY2sgd2hpY2ggbm9kZXMgYXJlIGNsYWltZWQgZHVyaW5nIGh5ZHJhdGlvbi4gVW5jbGFpbWVkIG5vZGVzIGNhbiB0aGVuIGJlIHJlbW92ZWQgZnJvbSB0aGUgRE9NXG4vLyBhdCB0aGUgZW5kIG9mIGh5ZHJhdGlvbiB3aXRob3V0IHRvdWNoaW5nIHRoZSByZW1haW5pbmcgbm9kZXMuXG5sZXQgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG5mdW5jdGlvbiBzdGFydF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGVuZF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG59XG5mdW5jdGlvbiB1cHBlcl9ib3VuZChsb3csIGhpZ2gsIGtleSwgdmFsdWUpIHtcbiAgICAvLyBSZXR1cm4gZmlyc3QgaW5kZXggb2YgdmFsdWUgbGFyZ2VyIHRoYW4gaW5wdXQgdmFsdWUgaW4gdGhlIHJhbmdlIFtsb3csIGhpZ2gpXG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgICAgY29uc3QgbWlkID0gbG93ICsgKChoaWdoIC0gbG93KSA+PiAxKTtcbiAgICAgICAgaWYgKGtleShtaWQpIDw9IHZhbHVlKSB7XG4gICAgICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGlnaCA9IG1pZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG93O1xufVxuZnVuY3Rpb24gaW5pdF9oeWRyYXRlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuaHlkcmF0ZV9pbml0KVxuICAgICAgICByZXR1cm47XG4gICAgdGFyZ2V0Lmh5ZHJhdGVfaW5pdCA9IHRydWU7XG4gICAgLy8gV2Uga25vdyB0aGF0IGFsbCBjaGlsZHJlbiBoYXZlIGNsYWltX29yZGVyIHZhbHVlcyBzaW5jZSB0aGUgdW5jbGFpbWVkIGhhdmUgYmVlbiBkZXRhY2hlZCBpZiB0YXJnZXQgaXMgbm90IDxoZWFkPlxuICAgIGxldCBjaGlsZHJlbiA9IHRhcmdldC5jaGlsZE5vZGVzO1xuICAgIC8vIElmIHRhcmdldCBpcyA8aGVhZD4sIHRoZXJlIG1heSBiZSBjaGlsZHJlbiB3aXRob3V0IGNsYWltX29yZGVyXG4gICAgaWYgKHRhcmdldC5ub2RlTmFtZSA9PT0gJ0hFQUQnKSB7XG4gICAgICAgIGNvbnN0IG15Q2hpbGRyZW4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG15Q2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjaGlsZHJlbiA9IG15Q2hpbGRyZW47XG4gICAgfVxuICAgIC8qXG4gICAgKiBSZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5LlxuICAgICogV2UgY2FuIHJlb3JkZXIgY2xhaW1lZCBjaGlsZHJlbiBvcHRpbWFsbHkgYnkgZmluZGluZyB0aGUgbG9uZ2VzdCBzdWJzZXF1ZW5jZSBvZlxuICAgICogbm9kZXMgdGhhdCBhcmUgYWxyZWFkeSBjbGFpbWVkIGluIG9yZGVyIGFuZCBvbmx5IG1vdmluZyB0aGUgcmVzdC4gVGhlIGxvbmdlc3RcbiAgICAqIHN1YnNlcXVlbmNlIHN1YnNlcXVlbmNlIG9mIG5vZGVzIHRoYXQgYXJlIGNsYWltZWQgaW4gb3JkZXIgY2FuIGJlIGZvdW5kIGJ5XG4gICAgKiBjb21wdXRpbmcgdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiAuY2xhaW1fb3JkZXIgdmFsdWVzLlxuICAgICpcbiAgICAqIFRoaXMgYWxnb3JpdGhtIGlzIG9wdGltYWwgaW4gZ2VuZXJhdGluZyB0aGUgbGVhc3QgYW1vdW50IG9mIHJlb3JkZXIgb3BlcmF0aW9uc1xuICAgICogcG9zc2libGUuXG4gICAgKlxuICAgICogUHJvb2Y6XG4gICAgKiBXZSBrbm93IHRoYXQsIGdpdmVuIGEgc2V0IG9mIHJlb3JkZXJpbmcgb3BlcmF0aW9ucywgdGhlIG5vZGVzIHRoYXQgZG8gbm90IG1vdmVcbiAgICAqIGFsd2F5cyBmb3JtIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2UsIHNpbmNlIHRoZXkgZG8gbm90IG1vdmUgYW1vbmcgZWFjaCBvdGhlclxuICAgICogbWVhbmluZyB0aGF0IHRoZXkgbXVzdCBiZSBhbHJlYWR5IG9yZGVyZWQgYW1vbmcgZWFjaCBvdGhlci4gVGh1cywgdGhlIG1heGltYWxcbiAgICAqIHNldCBvZiBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlIGZvcm0gYSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UuXG4gICAgKi9cbiAgICAvLyBDb21wdXRlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZVxuICAgIC8vIG06IHN1YnNlcXVlbmNlIGxlbmd0aCBqID0+IGluZGV4IGsgb2Ygc21hbGxlc3QgdmFsdWUgdGhhdCBlbmRzIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgbGVuZ3RoIGpcbiAgICBjb25zdCBtID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoICsgMSk7XG4gICAgLy8gUHJlZGVjZXNzb3IgaW5kaWNlcyArIDFcbiAgICBjb25zdCBwID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICBtWzBdID0gLTE7XG4gICAgbGV0IGxvbmdlc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGNoaWxkcmVuW2ldLmNsYWltX29yZGVyO1xuICAgICAgICAvLyBGaW5kIHRoZSBsYXJnZXN0IHN1YnNlcXVlbmNlIGxlbmd0aCBzdWNoIHRoYXQgaXQgZW5kcyBpbiBhIHZhbHVlIGxlc3MgdGhhbiBvdXIgY3VycmVudCB2YWx1ZVxuICAgICAgICAvLyB1cHBlcl9ib3VuZCByZXR1cm5zIGZpcnN0IGdyZWF0ZXIgdmFsdWUsIHNvIHdlIHN1YnRyYWN0IG9uZVxuICAgICAgICAvLyB3aXRoIGZhc3QgcGF0aCBmb3Igd2hlbiB3ZSBhcmUgb24gdGhlIGN1cnJlbnQgbG9uZ2VzdCBzdWJzZXF1ZW5jZVxuICAgICAgICBjb25zdCBzZXFMZW4gPSAoKGxvbmdlc3QgPiAwICYmIGNoaWxkcmVuW21bbG9uZ2VzdF1dLmNsYWltX29yZGVyIDw9IGN1cnJlbnQpID8gbG9uZ2VzdCArIDEgOiB1cHBlcl9ib3VuZCgxLCBsb25nZXN0LCBpZHggPT4gY2hpbGRyZW5bbVtpZHhdXS5jbGFpbV9vcmRlciwgY3VycmVudCkpIC0gMTtcbiAgICAgICAgcFtpXSA9IG1bc2VxTGVuXSArIDE7XG4gICAgICAgIGNvbnN0IG5ld0xlbiA9IHNlcUxlbiArIDE7XG4gICAgICAgIC8vIFdlIGNhbiBndWFyYW50ZWUgdGhhdCBjdXJyZW50IGlzIHRoZSBzbWFsbGVzdCB2YWx1ZS4gT3RoZXJ3aXNlLCB3ZSB3b3VsZCBoYXZlIGdlbmVyYXRlZCBhIGxvbmdlciBzZXF1ZW5jZS5cbiAgICAgICAgbVtuZXdMZW5dID0gaTtcbiAgICAgICAgbG9uZ2VzdCA9IE1hdGgubWF4KG5ld0xlbiwgbG9uZ2VzdCk7XG4gICAgfVxuICAgIC8vIFRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2Ygbm9kZXMgKGluaXRpYWxseSByZXZlcnNlZClcbiAgICBjb25zdCBsaXMgPSBbXTtcbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbm9kZXMsIG5vZGVzIHRoYXQgd2lsbCBiZSBtb3ZlZFxuICAgIGNvbnN0IHRvTW92ZSA9IFtdO1xuICAgIGxldCBsYXN0ID0gY2hpbGRyZW4ubGVuZ3RoIC0gMTtcbiAgICBmb3IgKGxldCBjdXIgPSBtW2xvbmdlc3RdICsgMTsgY3VyICE9IDA7IGN1ciA9IHBbY3VyIC0gMV0pIHtcbiAgICAgICAgbGlzLnB1c2goY2hpbGRyZW5bY3VyIC0gMV0pO1xuICAgICAgICBmb3IgKDsgbGFzdCA+PSBjdXI7IGxhc3QtLSkge1xuICAgICAgICAgICAgdG9Nb3ZlLnB1c2goY2hpbGRyZW5bbGFzdF0pO1xuICAgICAgICB9XG4gICAgICAgIGxhc3QtLTtcbiAgICB9XG4gICAgZm9yICg7IGxhc3QgPj0gMDsgbGFzdC0tKSB7XG4gICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICB9XG4gICAgbGlzLnJldmVyc2UoKTtcbiAgICAvLyBXZSBzb3J0IHRoZSBub2RlcyBiZWluZyBtb3ZlZCB0byBndWFyYW50ZWUgdGhhdCB0aGVpciBpbnNlcnRpb24gb3JkZXIgbWF0Y2hlcyB0aGUgY2xhaW0gb3JkZXJcbiAgICB0b01vdmUuc29ydCgoYSwgYikgPT4gYS5jbGFpbV9vcmRlciAtIGIuY2xhaW1fb3JkZXIpO1xuICAgIC8vIEZpbmFsbHksIHdlIG1vdmUgdGhlIG5vZGVzXG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgdG9Nb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdoaWxlIChqIDwgbGlzLmxlbmd0aCAmJiB0b01vdmVbaV0uY2xhaW1fb3JkZXIgPj0gbGlzW2pdLmNsYWltX29yZGVyKSB7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5jaG9yID0gaiA8IGxpcy5sZW5ndGggPyBsaXNbal0gOiBudWxsO1xuICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKHRvTW92ZVtpXSwgYW5jaG9yKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX3N0eWxlcyh0YXJnZXQsIHN0eWxlX3NoZWV0X2lkLCBzdHlsZXMpIHtcbiAgICBjb25zdCBhcHBlbmRfc3R5bGVzX3RvID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKHRhcmdldCk7XG4gICAgaWYgKCFhcHBlbmRfc3R5bGVzX3RvLmdldEVsZW1lbnRCeUlkKHN0eWxlX3NoZWV0X2lkKSkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gc3R5bGVfc2hlZXRfaWQ7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gc3R5bGVzO1xuICAgICAgICBhcHBlbmRfc3R5bGVzaGVldChhcHBlbmRfc3R5bGVzX3RvLCBzdHlsZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICBjb25zdCByb290ID0gbm9kZS5nZXRSb290Tm9kZSA/IG5vZGUuZ2V0Um9vdE5vZGUoKSA6IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBpZiAocm9vdCAmJiByb290Lmhvc3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfVxuICAgIHJldHVybiBub2RlLm93bmVyRG9jdW1lbnQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKSB7XG4gICAgY29uc3Qgc3R5bGVfZWxlbWVudCA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgYXBwZW5kX3N0eWxlc2hlZXQoZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpLCBzdHlsZV9lbGVtZW50KTtcbiAgICByZXR1cm4gc3R5bGVfZWxlbWVudC5zaGVldDtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXNoZWV0KG5vZGUsIHN0eWxlKSB7XG4gICAgYXBwZW5kKG5vZGUuaGVhZCB8fCBub2RlLCBzdHlsZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSkge1xuICAgIGlmIChpc19oeWRyYXRpbmcpIHtcbiAgICAgICAgaW5pdF9oeWRyYXRlKHRhcmdldCk7XG4gICAgICAgIGlmICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPT09IHVuZGVmaW5lZCkgfHwgKCh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCAhPT0gbnVsbCkgJiYgKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkLnBhcmVudEVsZW1lbnQgIT09IHRhcmdldCkpKSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IHRhcmdldC5maXJzdENoaWxkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNraXAgbm9kZXMgb2YgdW5kZWZpbmVkIG9yZGVyaW5nXG4gICAgICAgIHdoaWxlICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5jbGFpbV9vcmRlciA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpIHtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgaW5zZXJ0IGlmIHRoZSBvcmRlcmluZyBvZiB0aGlzIG5vZGUgc2hvdWxkIGJlIG1vZGlmaWVkIG9yIHRoZSBwYXJlbnQgbm9kZSBpcyBub3QgdGFyZ2V0XG4gICAgICAgICAgICBpZiAobm9kZS5jbGFpbV9vcmRlciAhPT0gdW5kZWZpbmVkIHx8IG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgaWYgKGlzX2h5ZHJhdGluZyAmJiAhYW5jaG9yKSB7XG4gICAgICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPSBhbmNob3IpIHtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJ1c3RlZChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQuaXNUcnVzdGVkKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnX192YWx1ZScpIHtcbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB0eXBlb2Ygbm9kZVtwcm9wXSA9PT0gJ2Jvb2xlYW4nICYmIHZhbHVlID09PSAnJyA/IHRydWUgOiB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwLCBfX3ZhbHVlLCBjaGVja2VkKSB7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLmFkZChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgaWYgKCFjaGVja2VkKSB7XG4gICAgICAgIHZhbHVlLmRlbGV0ZShfX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20odmFsdWUpO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gaW5pdF9jbGFpbV9pbmZvKG5vZGVzKSB7XG4gICAgaWYgKG5vZGVzLmNsYWltX2luZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvID0geyBsYXN0X2luZGV4OiAwLCB0b3RhbF9jbGFpbWVkOiAwIH07XG4gICAgfVxufVxuZnVuY3Rpb24gY2xhaW1fbm9kZShub2RlcywgcHJlZGljYXRlLCBwcm9jZXNzTm9kZSwgY3JlYXRlTm9kZSwgZG9udFVwZGF0ZUxhc3RJbmRleCA9IGZhbHNlKSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgbm9kZXMgaW4gYW4gb3JkZXIgc3VjaCB0aGF0IHdlIGxlbmd0aGVuIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICBpbml0X2NsYWltX2luZm8obm9kZXMpO1xuICAgIGNvbnN0IHJlc3VsdE5vZGUgPSAoKCkgPT4ge1xuICAgICAgICAvLyBXZSBmaXJzdCB0cnkgdG8gZmluZCBhbiBlbGVtZW50IGFmdGVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSB0cnkgdG8gZmluZCBvbmUgYmVmb3JlXG4gICAgICAgIC8vIFdlIGl0ZXJhdGUgaW4gcmV2ZXJzZSBzbyB0aGF0IHdlIGRvbid0IGdvIHRvbyBmYXIgYmFja1xuICAgICAgICBmb3IgKGxldCBpID0gbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHByb2Nlc3NOb2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzW2ldID0gcmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZG9udFVwZGF0ZUxhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIHNwbGljZWQgYmVmb3JlIHRoZSBsYXN0X2luZGV4LCB3ZSBkZWNyZWFzZSBpdFxuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgd2UgY2FuJ3QgZmluZCBhbnkgbWF0Y2hpbmcgbm9kZSwgd2UgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gY3JlYXRlTm9kZSgpO1xuICAgIH0pKCk7XG4gICAgcmVzdWx0Tm9kZS5jbGFpbV9vcmRlciA9IG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZDtcbiAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICByZXR1cm4gcmVzdWx0Tm9kZTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgY3JlYXRlX2VsZW1lbnQpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZU5hbWUgPT09IG5hbWUsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZS5wdXNoKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW1vdmUuZm9yRWFjaCh2ID0+IG5vZGUucmVtb3ZlQXR0cmlidXRlKHYpKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LCAoKSA9PiBjcmVhdGVfZWxlbWVudChuYW1lKSk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV9zdmdfZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Z19lbGVtZW50KTtcbn1cbmZ1bmN0aW9uIGNsYWltX3RleHQobm9kZXMsIGRhdGEpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IDMsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGFTdHIgPSAnJyArIGRhdGE7XG4gICAgICAgIGlmIChub2RlLmRhdGEuc3RhcnRzV2l0aChkYXRhU3RyKSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuZGF0YS5sZW5ndGggIT09IGRhdGFTdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuc3BsaXRUZXh0KGRhdGFTdHIubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUuZGF0YSA9IGRhdGFTdHI7XG4gICAgICAgIH1cbiAgICB9LCAoKSA9PiB0ZXh0KGRhdGEpLCB0cnVlIC8vIFRleHQgbm9kZXMgc2hvdWxkIG5vdCB1cGRhdGUgbGFzdCBpbmRleCBzaW5jZSBpdCBpcyBsaWtlbHkgbm90IHdvcnRoIGl0IHRvIGVsaW1pbmF0ZSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGFjdHVhbCBlbGVtZW50c1xuICAgICk7XG59XG5mdW5jdGlvbiBjbGFpbV9zcGFjZShub2Rlcykge1xuICAgIHJldHVybiBjbGFpbV90ZXh0KG5vZGVzLCAnICcpO1xufVxuZnVuY3Rpb24gZmluZF9jb21tZW50KG5vZGVzLCB0ZXh0LCBzdGFydCkge1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDggLyogY29tbWVudCBub2RlICovICYmIG5vZGUudGV4dENvbnRlbnQudHJpbSgpID09PSB0ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZXMubGVuZ3RoO1xufVxuZnVuY3Rpb24gY2xhaW1faHRtbF90YWcobm9kZXMpIHtcbiAgICAvLyBmaW5kIGh0bWwgb3BlbmluZyB0YWdcbiAgICBjb25zdCBzdGFydF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX1NUQVJUJywgMCk7XG4gICAgY29uc3QgZW5kX2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfRU5EJywgc3RhcnRfaW5kZXgpO1xuICAgIGlmIChzdGFydF9pbmRleCA9PT0gZW5kX2luZGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgSHRtbFRhZ0h5ZHJhdGlvbigpO1xuICAgIH1cbiAgICBpbml0X2NsYWltX2luZm8obm9kZXMpO1xuICAgIGNvbnN0IGh0bWxfdGFnX25vZGVzID0gbm9kZXMuc3BsaWNlKHN0YXJ0X2luZGV4LCBlbmRfaW5kZXggLSBzdGFydF9pbmRleCArIDEpO1xuICAgIGRldGFjaChodG1sX3RhZ19ub2Rlc1swXSk7XG4gICAgZGV0YWNoKGh0bWxfdGFnX25vZGVzW2h0bWxfdGFnX25vZGVzLmxlbmd0aCAtIDFdKTtcbiAgICBjb25zdCBjbGFpbWVkX25vZGVzID0gaHRtbF90YWdfbm9kZXMuc2xpY2UoMSwgaHRtbF90YWdfbm9kZXMubGVuZ3RoIC0gMSk7XG4gICAgZm9yIChjb25zdCBuIG9mIGNsYWltZWRfbm9kZXMpIHtcbiAgICAgICAgbi5jbGFpbV9vcmRlciA9IG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZDtcbiAgICAgICAgbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkICs9IDE7XG4gICAgfVxuICAgIHJldHVybiBuZXcgSHRtbFRhZ0h5ZHJhdGlvbihjbGFpbWVkX25vZGVzKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gLTE7IC8vIG5vIG9wdGlvbiBzaG91bGQgYmUgc2VsZWN0ZWRcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuLy8gdW5mb3J0dW5hdGVseSB0aGlzIGNhbid0IGJlIGEgY29uc3RhbnQgYXMgdGhhdCB3b3VsZG4ndCBiZSB0cmVlLXNoYWtlYWJsZVxuLy8gc28gd2UgY2FjaGUgdGhlIHJlc3VsdCBpbnN0ZWFkXG5sZXQgY3Jvc3NvcmlnaW47XG5mdW5jdGlvbiBpc19jcm9zc29yaWdpbigpIHtcbiAgICBpZiAoY3Jvc3NvcmlnaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjcm9zc29yaWdpbiA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjcm9zc29yaWdpbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNyb3Nzb3JpZ2luO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihub2RlLCBmbikge1xuICAgIGNvbnN0IGNvbXB1dGVkX3N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICAnb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGlmcmFtZS50YWJJbmRleCA9IC0xO1xuICAgIGNvbnN0IGNyb3Nzb3JpZ2luID0gaXNfY3Jvc3NvcmlnaW4oKTtcbiAgICBsZXQgdW5zdWJzY3JpYmU7XG4gICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSBcImRhdGE6dGV4dC9odG1sLDxzY3JpcHQ+b25yZXNpemU9ZnVuY3Rpb24oKXtwYXJlbnQucG9zdE1lc3NhZ2UoMCwnKicpfTwvc2NyaXB0PlwiO1xuICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3Rlbih3aW5kb3csICdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBpZnJhbWUuY29udGVudFdpbmRvdylcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBpZnJhbWUub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4oaWZyYW1lLmNvbnRlbnRXaW5kb3csICdyZXNpemUnLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFwcGVuZChub2RlLCBpZnJhbWUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bnN1YnNjcmliZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXRhY2goaWZyYW1lKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgYnViYmxlcyA9IGZhbHNlKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGJ1YmJsZXMsIGZhbHNlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuZnVuY3Rpb24gcXVlcnlfc2VsZWN0b3JfYWxsKHNlbGVjdG9yLCBwYXJlbnQgPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgIH1cbiAgICBtKGh0bWwsIHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBpZiAoIXRoaXMuZSkge1xuICAgICAgICAgICAgdGhpcy5lID0gZWxlbWVudCh0YXJnZXQubm9kZU5hbWUpO1xuICAgICAgICAgICAgdGhpcy50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5jKGh0bWwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaShhbmNob3IpO1xuICAgIH1cbiAgICBoKGh0bWwpIHtcbiAgICAgICAgdGhpcy5lLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMubiA9IEFycmF5LmZyb20odGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB0aGlzLmkodGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5jbGFzcyBIdG1sVGFnSHlkcmF0aW9uIGV4dGVuZHMgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgICAgICB0aGlzLmwgPSBjbGFpbWVkX25vZGVzO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgaWYgKHRoaXMubCkge1xuICAgICAgICAgICAgdGhpcy5uID0gdGhpcy5sO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3VwZXIuYyhodG1sKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0X2h5ZHJhdGlvbih0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGF0dHJpYnV0ZV90b19vYmplY3QoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmVzdWx0W2F0dHJpYnV0ZS5uYW1lXSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHMoZWxlbWVudCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIHJlc3VsdFtub2RlLnNsb3QgfHwgJ2RlZmF1bHQnXSA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gd2UgbmVlZCB0byBzdG9yZSB0aGUgaW5mb3JtYXRpb24gZm9yIG11bHRpcGxlIGRvY3VtZW50cyBiZWNhdXNlIGEgU3ZlbHRlIGFwcGxpY2F0aW9uIGNvdWxkIGFsc28gY29udGFpbiBpZnJhbWVzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8zNjI0XG5jb25zdCBtYW5hZ2VkX3N0eWxlcyA9IG5ldyBNYXAoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zdHlsZV9pbmZvcm1hdGlvbihkb2MsIG5vZGUpIHtcbiAgICBjb25zdCBpbmZvID0geyBzdHlsZXNoZWV0OiBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKSwgcnVsZXM6IHt9IH07XG4gICAgbWFuYWdlZF9zdHlsZXMuc2V0KGRvYywgaW5mbyk7XG4gICAgcmV0dXJuIGluZm87XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGNvbnN0IGRvYyA9IGdldF9yb290X2Zvcl9zdHlsZShub2RlKTtcbiAgICBjb25zdCB7IHN0eWxlc2hlZXQsIHJ1bGVzIH0gPSBtYW5hZ2VkX3N0eWxlcy5nZXQoZG9jKSB8fCBjcmVhdGVfc3R5bGVfaW5mb3JtYXRpb24oZG9jLCBub2RlKTtcbiAgICBpZiAoIXJ1bGVzW25hbWVdKSB7XG4gICAgICAgIHJ1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBtYW5hZ2VkX3N0eWxlcy5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBzdHlsZXNoZWV0IH0gPSBpbmZvO1xuICAgICAgICAgICAgbGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICAgICAgaW5mby5ydWxlcyA9IHt9O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFuYWdlZF9zdHlsZXMuY2xlYXIoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBzZXRDb250ZXh0KGtleSwgY29udGV4dCkge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuZnVuY3Rpb24gZ2V0QWxsQ29udGV4dHMoKSB7XG4gICAgcmV0dXJuIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQ7XG59XG5mdW5jdGlvbiBoYXNDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmhhcyhrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbi5jYWxsKHRoaXMsIGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG4vLyBmbHVzaCgpIGNhbGxzIGNhbGxiYWNrcyBpbiB0aGlzIG9yZGVyOlxuLy8gMS4gQWxsIGJlZm9yZVVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlblxuLy8gMi4gQWxsIGJpbmQ6dGhpcyBjYWxsYmFja3MsIGluIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gMy4gQWxsIGFmdGVyVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuLiBFWENFUFRcbi8vICAgIGZvciBhZnRlclVwZGF0ZXMgY2FsbGVkIGR1cmluZyB0aGUgaW5pdGlhbCBvbk1vdW50LCB3aGljaCBhcmUgY2FsbGVkIGluXG4vLyAgICByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIFNpbmNlIGNhbGxiYWNrcyBtaWdodCB1cGRhdGUgY29tcG9uZW50IHZhbHVlcywgd2hpY2ggY291bGQgdHJpZ2dlciBhbm90aGVyXG4vLyBjYWxsIHRvIGZsdXNoKCksIHRoZSBmb2xsb3dpbmcgc3RlcHMgZ3VhcmQgYWdhaW5zdCB0aGlzOlxuLy8gMS4gRHVyaW5nIGJlZm9yZVVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuLy8gICAgZGlydHlfY29tcG9uZW50cyBhcnJheSBhbmQgd2lsbCBjYXVzZSBhIHJlZW50cmFudCBjYWxsIHRvIGZsdXNoKCkuIEJlY2F1c2Vcbi8vICAgIHRoZSBmbHVzaCBpbmRleCBpcyBrZXB0IG91dHNpZGUgdGhlIGZ1bmN0aW9uLCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbCBwaWNrXG4vLyAgICB1cCB3aGVyZSB0aGUgZWFybGllciBjYWxsIGxlZnQgb2ZmIGFuZCBnbyB0aHJvdWdoIGFsbCBkaXJ0eSBjb21wb25lbnRzLiBUaGVcbi8vICAgIGN1cnJlbnRfY29tcG9uZW50IHZhbHVlIGlzIHNhdmVkIGFuZCByZXN0b3JlZCBzbyB0aGF0IHRoZSByZWVudHJhbnQgY2FsbCB3aWxsXG4vLyAgICBub3QgaW50ZXJmZXJlIHdpdGggdGhlIFwicGFyZW50XCIgZmx1c2goKSBjYWxsLlxuLy8gMi4gYmluZDp0aGlzIGNhbGxiYWNrcyBjYW5ub3QgdHJpZ2dlciBuZXcgZmx1c2goKSBjYWxscy5cbi8vIDMuIER1cmluZyBhZnRlclVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIE5PVCBoYXZlIHRoZWlyIGFmdGVyVXBkYXRlXG4vLyAgICBjYWxsYmFjayBjYWxsZWQgYSBzZWNvbmQgdGltZTsgdGhlIHNlZW5fY2FsbGJhY2tzIHNldCwgb3V0c2lkZSB0aGUgZmx1c2goKVxuLy8gICAgZnVuY3Rpb24sIGd1YXJhbnRlZXMgdGhpcyBiZWhhdmlvci5cbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xubGV0IGZsdXNoaWR4ID0gMDsgLy8gRG8gKm5vdCogbW92ZSB0aGlzIGluc2lkZSB0aGUgZmx1c2goKSBmdW5jdGlvblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgY29uc3Qgc2F2ZWRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICB3aGlsZSAoZmx1c2hpZHggPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGlydHlfY29tcG9uZW50c1tmbHVzaGlkeF07XG4gICAgICAgICAgICBmbHVzaGlkeCsrO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgZmx1c2hpZHggPSAwO1xuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgc2Vlbl9jYWxsYmFja3MuY2xlYXIoKTtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoc2F2ZWRfY29tcG9uZW50KTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IChwcm9ncmFtLmIgLSB0KTtcbiAgICAgICAgZHVyYXRpb24gKj0gTWF0aC5hYnMoZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhOiB0LFxuICAgICAgICAgICAgYjogcHJvZ3JhbS5iLFxuICAgICAgICAgICAgZCxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgc3RhcnQ6IHByb2dyYW0uc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IHByb2dyYW0uc3RhcnQgKyBkdXJhdGlvbixcbiAgICAgICAgICAgIGdyb3VwOiBwcm9ncmFtLmdyb3VwXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKGIpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgY29uc3QgcHJvZ3JhbSA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBub3coKSArIGRlbGF5LFxuICAgICAgICAgICAgYlxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBwcm9ncmFtLmdyb3VwID0gb3V0cm9zO1xuICAgICAgICAgICAgb3V0cm9zLnIgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYilcbiAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGIsICdzdGFydCcpKTtcbiAgICAgICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ19wcm9ncmFtICYmIG5vdyA+IHBlbmRpbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBydW5uaW5nX3Byb2dyYW0uYiwgcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uLCAwLCBlYXNpbmcsIGNvbmZpZy5jc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0uYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEtLXJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbm93IC0gcnVubmluZ19wcm9ncmFtLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IHJ1bm5pbmdfcHJvZ3JhbS5hICsgcnVubmluZ19wcm9ncmFtLmQgKiBlYXNpbmcocCAvIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gISEocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBydW4oYikge1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZV9wcm9taXNlKHByb21pc2UsIGluZm8pIHtcbiAgICBjb25zdCB0b2tlbiA9IGluZm8udG9rZW4gPSB7fTtcbiAgICBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaW5kZXgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGluZm8udG9rZW4gIT09IHRva2VuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpbmZvLnJlc29sdmVkID0gdmFsdWU7XG4gICAgICAgIGxldCBjaGlsZF9jdHggPSBpbmZvLmN0eDtcbiAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGlsZF9jdHggPSBjaGlsZF9jdHguc2xpY2UoKTtcbiAgICAgICAgICAgIGNoaWxkX2N0eFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmxvY2sgPSB0eXBlICYmIChpbmZvLmN1cnJlbnQgPSB0eXBlKShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgbmVlZHNfZmx1c2ggPSBmYWxzZTtcbiAgICAgICAgaWYgKGluZm8uYmxvY2spIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmJsb2Nrcykge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzLmZvckVhY2goKGJsb2NrLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCAmJiBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmJsb2Nrc1tpXSA9PT0gYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tfb3V0cm9zKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluZm8uYmxvY2suZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICAgICAgYmxvY2subShpbmZvLm1vdW50KCksIGluZm8uYW5jaG9yKTtcbiAgICAgICAgICAgIG5lZWRzX2ZsdXNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLmJsb2NrID0gYmxvY2s7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrcylcbiAgICAgICAgICAgIGluZm8uYmxvY2tzW2luZGV4XSA9IGJsb2NrO1xuICAgICAgICBpZiAobmVlZHNfZmx1c2gpIHtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzX3Byb21pc2UocHJvbWlzZSkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudF9jb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjdXJyZW50X2NvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5jYXRjaCwgMiwgaW5mby5lcnJvciwgZXJyb3IpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICAgICAgaWYgKCFpbmZvLmhhc0NhdGNoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiB3ZSBwcmV2aW91c2x5IGhhZCBhIHRoZW4vY2F0Y2ggYmxvY2ssIGRlc3Ryb3kgaXRcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby5wZW5kaW5nKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5wZW5kaW5nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnRoZW4pIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHByb21pc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gdXBkYXRlX2F3YWl0X2Jsb2NrX2JyYW5jaChpbmZvLCBjdHgsIGRpcnR5KSB7XG4gICAgY29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG4gICAgY29uc3QgeyByZXNvbHZlZCB9ID0gaW5mbztcbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLnRoZW4pIHtcbiAgICAgICAgY2hpbGRfY3R4W2luZm8udmFsdWVdID0gcmVzb2x2ZWQ7XG4gICAgfVxuICAgIGlmIChpbmZvLmN1cnJlbnQgPT09IGluZm8uY2F0Y2gpIHtcbiAgICAgICAgY2hpbGRfY3R4W2luZm8uZXJyb3JdID0gcmVzb2x2ZWQ7XG4gICAgfVxuICAgIGluZm8uYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93XG4gICAgOiB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyBnbG9iYWxUaGlzXG4gICAgICAgIDogZ2xvYmFsKTtcblxuZnVuY3Rpb24gZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZCgxKTtcbiAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG59XG5mdW5jdGlvbiBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZml4X2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9rZXllZF9lYWNoKG9sZF9ibG9ja3MsIGRpcnR5LCBnZXRfa2V5LCBkeW5hbWljLCBjdHgsIGxpc3QsIGxvb2t1cCwgbm9kZSwgZGVzdHJveSwgY3JlYXRlX2VhY2hfYmxvY2ssIG5leHQsIGdldF9jb250ZXh0KSB7XG4gICAgbGV0IG8gPSBvbGRfYmxvY2tzLmxlbmd0aDtcbiAgICBsZXQgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGxldCBpID0gbztcbiAgICBjb25zdCBvbGRfaW5kZXhlcyA9IHt9O1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIG9sZF9pbmRleGVzW29sZF9ibG9ja3NbaV0ua2V5XSA9IGk7XG4gICAgY29uc3QgbmV3X2Jsb2NrcyA9IFtdO1xuICAgIGNvbnN0IG5ld19sb29rdXAgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgZGVsdGFzID0gbmV3IE1hcCgpO1xuICAgIGkgPSBuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgY2hpbGRfY3R4ID0gZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgYmxvY2sgPSBsb29rdXAuZ2V0KGtleSk7XG4gICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgIGJsb2NrID0gY3JlYXRlX2VhY2hfYmxvY2soa2V5LCBjaGlsZF9jdHgpO1xuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR5bmFtaWMpIHtcbiAgICAgICAgICAgIGJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3X2xvb2t1cC5zZXQoa2V5LCBuZXdfYmxvY2tzW2ldID0gYmxvY2spO1xuICAgICAgICBpZiAoa2V5IGluIG9sZF9pbmRleGVzKVxuICAgICAgICAgICAgZGVsdGFzLnNldChrZXksIE1hdGguYWJzKGkgLSBvbGRfaW5kZXhlc1trZXldKSk7XG4gICAgfVxuICAgIGNvbnN0IHdpbGxfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBkaWRfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBpbnNlcnQoYmxvY2spIHtcbiAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgIGJsb2NrLm0obm9kZSwgbmV4dCk7XG4gICAgICAgIGxvb2t1cC5zZXQoYmxvY2sua2V5LCBibG9jayk7XG4gICAgICAgIG5leHQgPSBibG9jay5maXJzdDtcbiAgICAgICAgbi0tO1xuICAgIH1cbiAgICB3aGlsZSAobyAmJiBuKSB7XG4gICAgICAgIGNvbnN0IG5ld19ibG9jayA9IG5ld19ibG9ja3NbbiAtIDFdO1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW28gLSAxXTtcbiAgICAgICAgY29uc3QgbmV3X2tleSA9IG5ld19ibG9jay5rZXk7XG4gICAgICAgIGNvbnN0IG9sZF9rZXkgPSBvbGRfYmxvY2sua2V5O1xuICAgICAgICBpZiAobmV3X2Jsb2NrID09PSBvbGRfYmxvY2spIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgIG5leHQgPSBuZXdfYmxvY2suZmlyc3Q7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgICAgICBuLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgb2xkIGJsb2NrXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbG9va3VwLmhhcyhuZXdfa2V5KSB8fCB3aWxsX21vdmUuaGFzKG5ld19rZXkpKSB7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkaWRfbW92ZS5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZWx0YXMuZ2V0KG5ld19rZXkpID4gZGVsdGFzLmdldChvbGRfa2V5KSkge1xuICAgICAgICAgICAgZGlkX21vdmUuYWRkKG5ld19rZXkpO1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aWxsX21vdmUuYWRkKG9sZF9rZXkpO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChvLS0pIHtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvXTtcbiAgICAgICAgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfYmxvY2sua2V5KSlcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgIH1cbiAgICB3aGlsZSAobilcbiAgICAgICAgaW5zZXJ0KG5ld19ibG9ja3NbbiAtIDFdKTtcbiAgICByZXR1cm4gbmV3X2Jsb2Nrcztcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfa2V5cyhjdHgsIGxpc3QsIGdldF9jb250ZXh0LCBnZXRfa2V5KSB7XG4gICAgY29uc3Qga2V5cyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpKTtcbiAgICAgICAgaWYgKGtleXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGhhdmUgZHVwbGljYXRlIGtleXMgaW4gYSBrZXllZCBlYWNoJyk7XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5hZGQoa2V5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xuICAgIGNvbnN0IHRvX251bGxfb3V0ID0ge307XG4gICAgY29uc3QgYWNjb3VudGVkX2ZvciA9IHsgJCRzY29wZTogMSB9O1xuICAgIGxldCBpID0gbGV2ZWxzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IG8gPSBsZXZlbHNbaV07XG4gICAgICAgIGNvbnN0IG4gPSB1cGRhdGVzW2ldO1xuICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuKSlcbiAgICAgICAgICAgICAgICAgICAgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlW2tleV0gPSBuW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV2ZWxzW2ldID0gbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIHRvX251bGxfb3V0KSB7XG4gICAgICAgIGlmICghKGtleSBpbiB1cGRhdGUpKVxuICAgICAgICAgICAgdXBkYXRlW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGU7XG59XG5mdW5jdGlvbiBnZXRfc3ByZWFkX29iamVjdChzcHJlYWRfcHJvcHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNwcmVhZF9wcm9wcyA9PT0gJ29iamVjdCcgJiYgc3ByZWFkX3Byb3BzICE9PSBudWxsID8gc3ByZWFkX3Byb3BzIDoge307XG59XG5cbi8vIHNvdXJjZTogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5kaWNlcy5odG1sXG5jb25zdCBib29sZWFuX2F0dHJpYnV0ZXMgPSBuZXcgU2V0KFtcbiAgICAnYWxsb3dmdWxsc2NyZWVuJyxcbiAgICAnYWxsb3dwYXltZW50cmVxdWVzdCcsXG4gICAgJ2FzeW5jJyxcbiAgICAnYXV0b2ZvY3VzJyxcbiAgICAnYXV0b3BsYXknLFxuICAgICdjaGVja2VkJyxcbiAgICAnY29udHJvbHMnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVmZXInLFxuICAgICdkaXNhYmxlZCcsXG4gICAgJ2Zvcm1ub3ZhbGlkYXRlJyxcbiAgICAnaGlkZGVuJyxcbiAgICAnaXNtYXAnLFxuICAgICdsb29wJyxcbiAgICAnbXVsdGlwbGUnLFxuICAgICdtdXRlZCcsXG4gICAgJ25vbW9kdWxlJyxcbiAgICAnbm92YWxpZGF0ZScsXG4gICAgJ29wZW4nLFxuICAgICdwbGF5c2lubGluZScsXG4gICAgJ3JlYWRvbmx5JyxcbiAgICAncmVxdWlyZWQnLFxuICAgICdyZXZlcnNlZCcsXG4gICAgJ3NlbGVjdGVkJ1xuXSk7XG5cbmNvbnN0IGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyID0gL1tcXHMnXCI+Lz1cXHV7RkREMH0tXFx1e0ZERUZ9XFx1e0ZGRkV9XFx1e0ZGRkZ9XFx1ezFGRkZFfVxcdXsxRkZGRn1cXHV7MkZGRkV9XFx1ezJGRkZGfVxcdXszRkZGRX1cXHV7M0ZGRkZ9XFx1ezRGRkZFfVxcdXs0RkZGRn1cXHV7NUZGRkV9XFx1ezVGRkZGfVxcdXs2RkZGRX1cXHV7NkZGRkZ9XFx1ezdGRkZFfVxcdXs3RkZGRn1cXHV7OEZGRkV9XFx1ezhGRkZGfVxcdXs5RkZGRX1cXHV7OUZGRkZ9XFx1e0FGRkZFfVxcdXtBRkZGRn1cXHV7QkZGRkV9XFx1e0JGRkZGfVxcdXtDRkZGRX1cXHV7Q0ZGRkZ9XFx1e0RGRkZFfVxcdXtERkZGRn1cXHV7RUZGRkV9XFx1e0VGRkZGfVxcdXtGRkZGRX1cXHV7RkZGRkZ9XFx1ezEwRkZGRX1cXHV7MTBGRkZGfV0vdTtcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuLy8gaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI25vbmNoYXJhY3RlclxuZnVuY3Rpb24gc3ByZWFkKGFyZ3MsIGF0dHJzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoYXR0cnNfdG9fYWRkKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzZXNfdG9fYWRkID0gYXR0cnNfdG9fYWRkLmNsYXNzZXM7XG4gICAgICAgIGNvbnN0IHN0eWxlc190b19hZGQgPSBhdHRyc190b19hZGQuc3R5bGVzO1xuICAgICAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLmNsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzID0gY2xhc3Nlc190b19hZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzICs9ICcgJyArIGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdHlsZXNfdG9fYWRkKSB7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlcy5zdHlsZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcy5zdHlsZSA9IHN0eWxlX29iamVjdF90b19zdHJpbmcoc3R5bGVzX3RvX2FkZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnN0eWxlID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhtZXJnZV9zc3Jfc3R5bGVzKGF0dHJpYnV0ZXMuc3R5bGUsIHN0eWxlc190b19hZGQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5mdW5jdGlvbiBtZXJnZV9zc3Jfc3R5bGVzKHN0eWxlX2F0dHJpYnV0ZSwgc3R5bGVfZGlyZWN0aXZlKSB7XG4gICAgY29uc3Qgc3R5bGVfb2JqZWN0ID0ge307XG4gICAgZm9yIChjb25zdCBpbmRpdmlkdWFsX3N0eWxlIG9mIHN0eWxlX2F0dHJpYnV0ZS5zcGxpdCgnOycpKSB7XG4gICAgICAgIGNvbnN0IGNvbG9uX2luZGV4ID0gaW5kaXZpZHVhbF9zdHlsZS5pbmRleE9mKCc6Jyk7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBpbmRpdmlkdWFsX3N0eWxlLnNsaWNlKDAsIGNvbG9uX2luZGV4KS50cmltKCk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gaW5kaXZpZHVhbF9zdHlsZS5zbGljZShjb2xvbl9pbmRleCArIDEpLnRyaW0oKTtcbiAgICAgICAgaWYgKCFuYW1lKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHN0eWxlX29iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gc3R5bGVfZGlyZWN0aXZlKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gc3R5bGVfZGlyZWN0aXZlW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHN0eWxlX29iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHN0eWxlX29iamVjdFtuYW1lXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGVfb2JqZWN0O1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gZXNjYXBlKHZhbHVlKSA6IHZhbHVlO1xufVxuZnVuY3Rpb24gZXNjYXBlX29iamVjdChvYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXNgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGRlYnVnKGZpbGUsIGxpbmUsIGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgY29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiAnJztcbn1cbmxldCBvbl9kZXN0cm95O1xuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcbiAgICBmdW5jdGlvbiAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMsIGNvbnRleHQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgICAgICBjb25zdCAkJCA9IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3ksXG4gICAgICAgICAgICBjb250ZXh0OiBuZXcgTWFwKGNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCB7ICQkc2xvdHMgPSB7fSwgY29udGV4dCA9IG5ldyBNYXAoKSB9ID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdGl0bGU6ICcnLCBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgJCRzbG90cywgY29udGV4dCk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LnRpdGxlICsgcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7dmFsdWUgPT09IHRydWUgJiYgYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lKSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogJyc7XG59XG5mdW5jdGlvbiBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKHN0eWxlX29iamVjdCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhzdHlsZV9vYmplY3QpXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IHN0eWxlX29iamVjdFtrZXldKVxuICAgICAgICAubWFwKGtleSA9PiBgJHtrZXl9OiAke3N0eWxlX29iamVjdFtrZXldfTtgKVxuICAgICAgICAuam9pbignICcpO1xufVxuZnVuY3Rpb24gYWRkX3N0eWxlcyhzdHlsZV9vYmplY3QpIHtcbiAgICBjb25zdCBzdHlsZXMgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKHN0eWxlX29iamVjdCk7XG4gICAgcmV0dXJuIHN0eWxlcyA/IGAgc3R5bGU9XCIke3N0eWxlc31cImAgOiAnJztcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IsIGN1c3RvbUVsZW1lbnQpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgaWYgKCFjdXN0b21FbGVtZW50KSB7XG4gICAgICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIG9uX2Rlc3Ryb3kucHVzaCguLi5uZXdfb25fZGVzdHJveSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBFZGdlIGNhc2UgLSBjb21wb25lbnQgd2FzIGRlc3Ryb3llZCBpbW1lZGlhdGVseSxcbiAgICAgICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gZGVzdHJveV9jb21wb25lbnQoY29tcG9uZW50LCBkZXRhY2hpbmcpIHtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJDtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgcnVuX2FsbCgkJC5vbl9kZXN0cm95KTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuZChkZXRhY2hpbmcpO1xuICAgICAgICAvLyBUT0RPIG51bGwgb3V0IG90aGVyIHJlZnMsIGluY2x1ZGluZyBjb21wb25lbnQuJCQgKGJ1dCBuZWVkIHRvXG4gICAgICAgIC8vIHByZXNlcnZlIGZpbmFsIHN0YXRlPylcbiAgICAgICAgJCQub25fZGVzdHJveSA9ICQkLmZyYWdtZW50ID0gbnVsbDtcbiAgICAgICAgJCQuY3R4ID0gW107XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpIHtcbiAgICBpZiAoY29tcG9uZW50LiQkLmRpcnR5WzBdID09PSAtMSkge1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgICAgIGNvbXBvbmVudC4kJC5kaXJ0eS5maWxsKDApO1xuICAgIH1cbiAgICBjb21wb25lbnQuJCQuZGlydHlbKGkgLyAzMSkgfCAwXSB8PSAoMSA8PCAoaSAlIDMxKSk7XG59XG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucywgaW5zdGFuY2UsIGNyZWF0ZV9mcmFnbWVudCwgbm90X2VxdWFsLCBwcm9wcywgYXBwZW5kX3N0eWxlcywgZGlydHkgPSBbLTFdKSB7XG4gICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIG9uX2Rpc2Nvbm5lY3Q6IFtdLFxuICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgY29udGV4dDogbmV3IE1hcChvcHRpb25zLmNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHksXG4gICAgICAgIHNraXBfYm91bmQ6IGZhbHNlLFxuICAgICAgICByb290OiBvcHRpb25zLnRhcmdldCB8fCBwYXJlbnRfY29tcG9uZW50LiQkLnJvb3RcbiAgICB9O1xuICAgIGFwcGVuZF9zdHlsZXMgJiYgYXBwZW5kX3N0eWxlcygkJC5yb290KTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgb3B0aW9ucy5wcm9wcyB8fCB7fSwgKGksIHJldCwgLi4ucmVzdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByZXN0Lmxlbmd0aCA/IHJlc3RbMF0gOiByZXQ7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghJCQuc2tpcF9ib3VuZCAmJiAkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIHN0YXJ0X2h5ZHJhdGluZygpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IsIG9wdGlvbnMuY3VzdG9tRWxlbWVudCk7XG4gICAgICAgIGVuZF9oeWRyYXRpbmcoKTtcbiAgICAgICAgZmx1c2goKTtcbiAgICB9XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxubGV0IFN2ZWx0ZUVsZW1lbnQ7XG5pZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgU3ZlbHRlRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgb25fbW91bnQgfSA9IHRoaXMuJCQ7XG4gICAgICAgICAgICB0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodGhpcy4kJC5vbl9kaXNjb25uZWN0KTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgU3ZlbHRlIGNvbXBvbmVudHMuIFVzZWQgd2hlbiBkZXY9ZmFsc2UuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBPYmplY3QuYXNzaWduKHsgdmVyc2lvbjogJzMuNDYuNCcgfSwgZGV0YWlsKSwgdHJ1ZSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbl9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9kZXYobm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlJywgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gWydjYXB0dXJlJ10gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01BZGRFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgIGNvbnN0IGRpc3Bvc2UgPSBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0QXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUsIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gcHJvcF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldFByb3BlcnR5JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhc2V0JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhJywgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJyAmJiAhKGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiAnbGVuZ3RoJyBpbiBhcmcpKSB7XG4gICAgICAgIGxldCBtc2cgPSAneyNlYWNofSBvbmx5IGl0ZXJhdGVzIG92ZXIgYXJyYXktbGlrZSBvYmplY3RzLic7XG4gICAgICAgIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIGFyZyAmJiBTeW1ib2wuaXRlcmF0b3IgaW4gYXJnKSB7XG4gICAgICAgICAgICBtc2cgKz0gJyBZb3UgY2FuIHVzZSBhIHNwcmVhZCB0byBjb252ZXJ0IHRoaXMgaXRlcmFibGUgaW50byBhbiBhcnJheS4nO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3Nsb3RzKG5hbWUsIHNsb3QsIGtleXMpIHtcbiAgICBmb3IgKGNvbnN0IHNsb3Rfa2V5IG9mIE9iamVjdC5rZXlzKHNsb3QpKSB7XG4gICAgICAgIGlmICghfmtleXMuaW5kZXhPZihzbG90X2tleSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgPCR7bmFtZX0+IHJlY2VpdmVkIGFuIHVuZXhwZWN0ZWQgc2xvdCBcIiR7c2xvdF9rZXl9XCIuYCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzIHdpdGggc29tZSBtaW5vciBkZXYtZW5oYW5jZW1lbnRzLiBVc2VkIHdoZW4gZGV2PXRydWUuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbi8qKlxuICogQmFzZSBjbGFzcyB0byBjcmVhdGUgc3Ryb25nbHkgdHlwZWQgU3ZlbHRlIGNvbXBvbmVudHMuXG4gKiBUaGlzIG9ubHkgZXhpc3RzIGZvciB0eXBpbmcgcHVycG9zZXMgYW5kIHNob3VsZCBiZSB1c2VkIGluIGAuZC50c2AgZmlsZXMuXG4gKlxuICogIyMjIEV4YW1wbGU6XG4gKlxuICogWW91IGhhdmUgY29tcG9uZW50IGxpYnJhcnkgb24gbnBtIGNhbGxlZCBgY29tcG9uZW50LWxpYnJhcnlgLCBmcm9tIHdoaWNoXG4gKiB5b3UgZXhwb3J0IGEgY29tcG9uZW50IGNhbGxlZCBgTXlDb21wb25lbnRgLiBGb3IgU3ZlbHRlK1R5cGVTY3JpcHQgdXNlcnMsXG4gKiB5b3Ugd2FudCB0byBwcm92aWRlIHR5cGluZ3MuIFRoZXJlZm9yZSB5b3UgY3JlYXRlIGEgYGluZGV4LmQudHNgOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFN2ZWx0ZUNvbXBvbmVudFR5cGVkIH0gZnJvbSBcInN2ZWx0ZVwiO1xuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50VHlwZWQ8e2Zvbzogc3RyaW5nfT4ge31cbiAqIGBgYFxuICogVHlwaW5nIHRoaXMgbWFrZXMgaXQgcG9zc2libGUgZm9yIElERXMgbGlrZSBWUyBDb2RlIHdpdGggdGhlIFN2ZWx0ZSBleHRlbnNpb25cbiAqIHRvIHByb3ZpZGUgaW50ZWxsaXNlbnNlIGFuZCB0byB1c2UgdGhlIGNvbXBvbmVudCBsaWtlIHRoaXMgaW4gYSBTdmVsdGUgZmlsZVxuICogd2l0aCBUeXBlU2NyaXB0OlxuICogYGBgc3ZlbHRlXG4gKiA8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuICogXHRpbXBvcnQgeyBNeUNvbXBvbmVudCB9IGZyb20gXCJjb21wb25lbnQtbGlicmFyeVwiO1xuICogPC9zY3JpcHQ+XG4gKiA8TXlDb21wb25lbnQgZm9vPXsnYmFyJ30gLz5cbiAqIGBgYFxuICpcbiAqICMjIyMgV2h5IG5vdCBtYWtlIHRoaXMgcGFydCBvZiBgU3ZlbHRlQ29tcG9uZW50KERldilgP1xuICogQmVjYXVzZVxuICogYGBgdHNcbiAqIGNsYXNzIEFTdWJjbGFzc09mU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50PHtmb286IHN0cmluZ30+IHt9XG4gKiBjb25zdCBjb21wb25lbnQ6IHR5cGVvZiBTdmVsdGVDb21wb25lbnQgPSBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudDtcbiAqIGBgYFxuICogd2lsbCB0aHJvdyBhIHR5cGUgZXJyb3IsIHNvIHdlIG5lZWQgdG8gc2VwYXJhdGUgdGhlIG1vcmUgc3RyaWN0bHkgdHlwZWQgY2xhc3MuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50RGV2IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBIdG1sVGFnSHlkcmF0aW9uLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlQ29tcG9uZW50VHlwZWQsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3N0eWxlcywgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQsIGFwcGVuZF9oeWRyYXRpb24sIGFwcGVuZF9oeWRyYXRpb25fZGV2LCBhcHBlbmRfc3R5bGVzLCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9odG1sX3RhZywgY2xhaW1fc3BhY2UsIGNsYWltX3N2Z19lbGVtZW50LCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVuZF9oeWRyYXRpbmcsIGVzY2FwZSwgZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSwgZXNjYXBlX29iamVjdCwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRBbGxDb250ZXh0cywgZ2V0Q29udGV4dCwgZ2V0X2FsbF9kaXJ0eV9mcm9tX3Njb3BlLCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzLCBnZXRfcm9vdF9mb3Jfc3R5bGUsIGdldF9zbG90X2NoYW5nZXMsIGdldF9zcHJlYWRfb2JqZWN0LCBnZXRfc3ByZWFkX3VwZGF0ZSwgZ2V0X3N0b3JlX3ZhbHVlLCBnbG9iYWxzLCBncm91cF9vdXRyb3MsIGhhbmRsZV9wcm9taXNlLCBoYXNDb250ZXh0LCBoYXNfcHJvcCwgaWRlbnRpdHksIGluaXQsIGluc2VydCwgaW5zZXJ0X2RldiwgaW5zZXJ0X2h5ZHJhdGlvbiwgaW5zZXJ0X2h5ZHJhdGlvbl9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfY3Jvc3NvcmlnaW4sIGlzX2VtcHR5LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtZXJnZV9zc3Jfc3R5bGVzLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcXVlcnlfc2VsZWN0b3JfYWxsLCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3JjX3VybF9lcXVhbCwgc3RhcnRfaHlkcmF0aW5nLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB0cnVzdGVkLCB1cGRhdGVfYXdhaXRfYmxvY2tfYnJhbmNoLCB1cGRhdGVfa2V5ZWRfZWFjaCwgdXBkYXRlX3Nsb3QsIHVwZGF0ZV9zbG90X2Jhc2UsIHZhbGlkYXRlX2NvbXBvbmVudCwgdmFsaWRhdGVfZWFjaF9hcmd1bWVudCwgdmFsaWRhdGVfZWFjaF9rZXlzLCB2YWxpZGF0ZV9zbG90cywgdmFsaWRhdGVfc3RvcmUsIHhsaW5rX2F0dHIgfTtcbiIsIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgbm9kZTtcbiAgY29uc3QgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qge3gseX09IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY29uc3Qge3RvcDp0LCBsZWZ0OmwsIGhlaWdodDpofSA9IHJlY3RcbiAgbGV0IHRvcCAgPSAteSArIHQgKyBoICsgM1xuICBsZXQgbGVmdCA9IC14ICsgbCAtIDVcbiAgbGV0IHtcbiAgICBkZXNjcmlwdGlvbixcbiAgICBpbmNvbXBsZXRlLFxuICAgIGNyaXRlcmlvbjEsXG4gICAgY3JpdGVyaW9uMixcbiAgICBoZWxwVXJsLFxuICAgIGltcGFjdCxcbiAgICBodG1sLFxuICAgIGFsbCxcbiAgICBhbnksXG4gICAgaGVscCxcbiAgICB0Z3MsXG4gICAgZ3JwLFxuICAgIGVsLFxuICB9ID0gbm9kZS5fYXhlX1xuXG4gIGZ1bmN0aW9uIHJlZm9ybWF0KGFycikge1xuICAgIGNvbnN0IHJneCA9IC8oW1xcZC4jOl0rKSggfFxcdyspL2dcbiAgICByZXR1cm4gYXJyLm1hcChpdGVtPT57XG4gICAgICBsZXQgeDEgPSBpdGVtLm1lc3NhZ2VcbiAgICAgIGNvbnN0IHgyID0geDEubWF0Y2gocmd4KVxuICAgICAgeDEgPSB4MS5yZXBsYWNlKC88L2csJyZsdDsnKS5yZXBsYWNlKC8+L2csJyZndDsnKVxuICAgICAgeDIgJiYgeDIuZmlsdGVyKHg9PngubGVuZ3RoPjIpLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIHgxID0geDEucmVwbGFjZShlbGVtZW50LCBgPGI+JHtlbGVtZW50fTwvYj5gKVxuICAgICAgfSlcbiAgICAgIHJldHVybiB4MVxuICAgIH0pXG4gIH1cbiAgYWxsID0gcmVmb3JtYXQoYWxsKVxuICBhbnkgPSByZWZvcm1hdChhbnkpXG5cbiAgbGV0IHN0eWxlXG4gIGlmIChncnAubWF0Y2goL3BhZ2UtLykpIHtcbiAgICBzdHlsZSA9IGB0b3A6JHt0b3B9cHg7bGVmdDowO3JpZ2h0OjA7bWFyZ2luOmF1dG87YFxuICB9IGVsc2Uge1xuICAgIHN0eWxlID0gYHRvcDowO2xlZnQ6MDtvcGFjaXR5OjA7YFxuICB9XG5cbiAgc2V0VGltZW91dCgoKT0+IHtcbiAgICBjb25zdCBwb3B1cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hMTF5LXBvcHVwJylcbiAgICBjb25zdCB7XG4gICAgICB3aWR0aDpwb3BXaWR0aCxcbiAgICAgIGhlaWdodDpwb3BIZWlnaHRcbiAgICB9ID0gcG9wdXAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgIGNvbnN0IHdpbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodFxuICAgIGNvbnN0IHdpbllPZmZzdCA9IHdpbmRvdy5wYWdlWU9mZnNldFxuICAgIGlmICh0b3ArcG9wSGVpZ2h0PndpbkhlaWdodC13aW5ZT2Zmc3QpIHtcbiAgICAgIHRvcCAtPSAocG9wSGVpZ2h0ICsgMzApXG4gICAgfVxuXG4gICAgY29uc3Qgd2luV2lkdGggPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAgY29uc3Qgd2luWE9mZnN0PSB3aW5kb3cucGFnZVhPZmZzZXRcbiAgICBpZiAobGVmdCtwb3BXaWR0aD53aW5XaWR0aC13aW5YT2Zmc3QpIHtcbiAgICAgIGxlZnQgLT0gKHBvcFdpZHRoIC0gMTgpIFxuICAgIH1cbiAgICBpZiAobm9kZS5zdHlsZS5wb3NpdGlvbj09PSdmaXhlZCcpIHtcbiAgICAgIC8vIGlmIGJveCBpbiBmaXhlZCBwb3NpdGlvbiwgcG9wdXAgdG9vKGFuZCB1cGRhdGUgdG9wIHBvc2l0aW9uKVxuICAgICAgcG9wdXAuc3R5bGUgPSBgdG9wOiR7dG9wLXdpbllPZmZzdH1weDtsZWZ0OiR7bGVmdH1weDtwb3NpdGlvbjpmaXhlZDtgXG4gICAgfSBlbHNlIHtcbiAgICAgIHBvcHVwLnN0eWxlID0gYHRvcDoke3RvcH1weDtsZWZ0OiR7bGVmdH1weDtgXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIHJhdGlvKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGNvbnRyYXN0UmF0aW8sXG4gICAgICBleHBlY3RlZENvbnRyYXN0UmF0aW8sXG4gICAgfSA9IG5vZGUuX2F4ZV8uYW55WzBdLmRhdGFcbiAgICBpZiAoY29udHJhc3RSYXRpbykge1xuICAgICAgcmV0dXJuIGBcbiAgICAgICwgY29udHJhc3QgcmF0aW86ICR7Y29udHJhc3RSYXRpb30sXG4gICAgICBleHBlY3RlZDogJHtleHBlY3RlZENvbnRyYXN0UmF0aW99LmBcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qge2dldENvbG9yLCBjb250cmFzdH0gPSB3aW5kb3cubWl0bS5mblxuICAgICAgY29uc3QgcmF0aW8gPSBjb250cmFzdCguLi5nZXRDb2xvcihlbCkpXG4gICAgICByZXR1cm4gYC4gQ29udHJhc3QgcmF0aW86ICR7cmF0aW99LmBcbiAgICB9XG4gIH1cblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBobGpzLmhpZ2hsaWdodEFsbCgpXG4gIH0sIDApO1xuXG4gIGZ1bmN0aW9uIGNvcHl0byhlKSB7XG4gICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hMTF5LWNvbnRlbnQnKS5pbm5lckhUTUw7XG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNvcGllZCB0byBjbGlwYm9hcmRcIik7XG4gICAgfSk7XG4gIH1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwiYTExeS1wb3B1cFwiIHtzdHlsZX0+XG4gIDxzcGFuIG9uOmNsaWNrPXtjb3B5dG99IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MTBweDt0b3A6MTBweDtjdXJzb3I6cG9pbnRlcjtcIj5cbiAgICA8c3ZnIHdpZHRoPVwiMTZweFwiIGhlaWdodD1cIjE2cHhcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgdmVyc2lvbj1cIjEuMVwiPlxuICAgICAgPGcgaWQ9XCJzdXJmYWNlMVwiPlxuICAgICAgPHBhdGggc3R5bGU9XCIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMCUsMCUsMCUpO2ZpbGwtb3BhY2l0eToxO1wiIGQ9XCJNIDEwLjg4MjgxMiA0LjAyNzM0NCBMIDEwLjg4MjgxMiAwIEwgMS43MzA0NjkgMCBMIDEuNzMwNDY5IDEyLjI2OTUzMSBMIDUuMTE3MTg4IDEyLjI2OTUzMSBMIDUuMTE3MTg4IDE2IEwgMTQuMjY5NTMxIDE2IEwgMTQuMjY5NTMxIDcuNDE3OTY5IFogTSAxMC44ODI4MTIgNS40NjQ4NDQgTCAxMi41MzUxNTYgNy4xMTcxODggTCAxMC44ODI4MTIgNy4xMTcxODggWiBNIDIuNzQ2MDk0IDExLjI1MzkwNiBMIDIuNzQ2MDk0IDEuMDE1NjI1IEwgOS44NjMyODEgMS4wMTU2MjUgTCA5Ljg2MzI4MSAzLjczMDQ2OSBMIDUuMTE3MTg4IDMuNzMwNDY5IEwgNS4xMTcxODggMTEuMjUzOTA2IFogTSA2LjEzNjcxOSAxNC45ODQzNzUgTCA2LjEzNjcxOSA0Ljc0NjA5NCBMIDkuODYzMjgxIDQuNzQ2MDk0IEwgOS44NjMyODEgOC4xMzY3MTkgTCAxMy4yNTM5MDYgOC4xMzY3MTkgTCAxMy4yNTM5MDYgMTQuOTg0Mzc1IFogTSA2LjEzNjcxOSAxNC45ODQzNzUgXCIvPlxuICAgICAgPC9nPlxuICAgIDwvc3ZnPiAgXG4gIDwvc3Bhbj5cbiAgPGRpdiBjbGFzcz1cImExMXktY29udGVudFwiPlxuICAgIDxoND57aGVscH08L2g0PlxuICAgIDxwPntkZXNjcmlwdGlvbn08L3A+XG4gICAgPHAgY2xhc3M9dGdzPjxiPnRhZ3M6PC9iPiB7dGdzfTwvcD5cbiAgICA8cD5cbiAgICAgIDxiPmNyaXRlcmlhOjwvYj5cbiAgICAgIHsjaWYgY3JpdGVyaW9uMX1cbiAgICAgICAgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiIGhyZWY9XCJ7Y3JpdGVyaW9uMS5saW5rfVwiPntjcml0ZXJpb24xLm5hbWV9PC9hPiwgXG4gICAgICB7L2lmfVxuICAgICAgeyNpZiBjcml0ZXJpb24yfVxuICAgICAgICA8YSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCIgaHJlZj1cIntjcml0ZXJpb24yLmxpbmt9XCI+e2NyaXRlcmlvbjIubmFtZX08L2E+LCBcbiAgICAgIHsvaWZ9XG4gICAgICA8YSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCIgaHJlZj1cIntoZWxwVXJsfVwiPntncnB9PC9hPlxuICAgIDwvcD5cbiAgICA8ZGV0YWlscyBvcGVuPlxuICAgICAgPHN1bW1hcnk+PGI+aW1wYWN0OjwvYj4ge2ltcGFjdH08L3N1bW1hcnk+XG4gICAgICB7I2lmIGFsbC5sZW5ndGh8fGFueS5sZW5ndGh9XG4gICAgICAgIDxoci8+XG4gICAgICAgIDxkaXYgY2xhc3M9cHJlPlxuICAgICAgICAgIHsjaWYgYWxsLmxlbmd0aD4xfVxuICAgICAgICAgICAgPGI+Rml4IEFMTCBvZiB0aGUgZm9sbG93aW5nOjwvYj5cbiAgICAgICAgICAgIDxvbD5cbiAgICAgICAgICAgIHsjZWFjaCBhbGwgYXMgY2F0fVxuICAgICAgICAgICAgICA8bGk+e0BodG1sIGNhdH08L2xpPlxuICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgPC9vbD5cbiAgICAgICAgICB7OmVsc2UgaWYgYWxsLmxlbmd0aD09PTF9XG4gICAgICAgICAgICB7QGh0bWwgYWxsWzBdfVxuICAgICAgICAgIHs6ZWxzZSBpZiBhbnkubGVuZ3RoPjF9XG4gICAgICAgICAgICA8Yj5GaXggT05FIG9mIHRoZSBmb2xsb3dpbmc6PC9iPlxuICAgICAgICAgICAgPG9sPlxuICAgICAgICAgICAgeyNlYWNoIGFueSBhcyBjYXR9XG4gICAgICAgICAgICAgIDxsaT57QGh0bWwgY2F0fTwvbGk+XG4gICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgICA8L29sPlxuICAgICAgICAgIHs6ZWxzZSBpZiBhbnkubGVuZ3RoPT09MX1cbiAgICAgICAgICAgIHtAaHRtbCBhbnlbMF19XG4gICAgICAgICAgey9pZn1cbiAgICAgICAgICB7I2lmIGluY29tcGxldGUgJiYgZ3JwPT09J2NvbG9yLWNvbnRyYXN0J31cbiAgICAgICAgICAgIHtyYXRpbygpfVxuICAgICAgICAgIHsvaWZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8aHIvPlxuICAgICAgey9pZn1cbiAgICAgIDxkaXYgY2xhc3M9cHJlPlxuICAgICAgICA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtaHRtbFwiPntodG1sfTwvY29kZT48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGV0YWlscz5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlPlxuLmExMXktcG9wdXAge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjI4LCAxOTYsIDAuNjUpO1xuICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoNHB4KTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IDJweDtcbiAgcGFkZGluZzogMCAxMHB4O1xuICBoZWlnaHQ6IGF1dG87XG4gIHdpZHRoOiAzNjBweDtcbiAgYm94LXNoYWRvdzogXG4gICAgcmdiKDAgMCAwIC8gMjUlKSAwcHggIDU0cHggNTVweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggLTEycHggMzBweCwgXG4gICAgcmdiKDAgMCAwIC8gMTIlKSAwcHggICA0cHggIDZweCwgXG4gICAgcmdiKDAgMCAwIC8gMTclKSAwcHggIDEycHggMTNweCwgXG4gICAgcmdiKDAgMCAwIC8gIDklKSAwcHggIC0zcHggIDVweDtcbn1cbmg0IHtcbiAgbWFyZ2luOiAxMHB4IDA7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbn1cbnAge1xuICBtYXJnaW46IDAuMnJlbSAwO1xuICBmb250LXNpemU6IDEycHg7XG59XG5kZXRhaWxzIHtcbiAgbWFyZ2luLWJvdHRvbTogOHB4O1xufVxuZGV0YWlscyBzdW1tYXJ5IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLnRncyB7XG4gIGZvbnQtZmFtaWx5OiBzZXJpZjtcbiAgdGV4dC1hbGlnbjogaW5oZXJpdDtcbn1cbi5wcmUge1xuICBmb250LXNpemU6IDExLjVweDtcbn1cbi5wcmUgb2wge1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmctaW5saW5lLXN0YXJ0OiAxNXB4O1xufVxucHJlIHtcbiAgZm9udC1mYW1pbHk6IHVpLW1vbm9zcGFjZSwgbW9ub3NwYWNlO1xuICB3aGl0ZS1zcGFjZTogYnJlYWstc3BhY2VzO1xuICBmb250LXNpemU6IDExcHg7XG4gIG1hcmdpbjogMDtcbn1cbnByZSBjb2RlIHtcbiAgcGFkZGluZzogNXB4O1xufVxuPC9zdHlsZT5cbiIsImNvbnN0IGNzcEFyciA9IFtcbiAgJ2RlZmF1bHQtc3JjJyxcbiAgJ2NoaWxkLXNyYycsXG4gICdjb25uZWN0LXNyYycsXG4gICdmb250LXNyYycsXG4gICdmcmFtZS1zcmMnLFxuICAnaW1nLXNyYycsXG4gICdtYW5pZmVzdC1zcmMnLFxuICAnbWVkaWEtc3JjJyxcbiAgJ29iamVjdC1zcmMnLFxuICAncHJlZmV0Y2gtc3JjJyxcbiAgJ3NjcmlwdC1zcmMnLFxuICAnc2NyaXB0LXNyYy1lbGVtJyxcbiAgJ3NjcmlwdC1zcmMtYXR0cicsXG4gICdzdHlsZS1zcmMnLFxuICAnc3R5bGUtc3JjLWVsZW0nLFxuICAnc3R5bGUtc3JjLWF0dHInLFxuICAnd29ya2VyLXNyYycsXG4gICdiYXNlLXVyaScsXG4gICdwbHVnaW4tdHlwZXMnLFxuICAnc2FuZGJveCcsXG4gICduYXZpZ2F0ZS10bycsXG4gICdmb3JtLWFjdGlvbicsXG4gICdmcmFtZS1hbmNlc3RvcnMnLFxuICAndXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cycsXG4gICdyZXBvcnQtdXJpJyxcbiAgJ3JlcG9ydC10bycsXG5dXG5jb25zdCBjc3BGZXRjaCA9IFtcbiAgJ2RlZmF1bHQtc3JjJyxcbiAgJ2NoaWxkLXNyYycsXG4gICdjb25uZWN0LXNyYycsXG4gICdmb250LXNyYycsXG4gICdmcmFtZS1zcmMnLFxuICAnaW1nLXNyYycsXG4gICdtYW5pZmVzdC1zcmMnLFxuICAnbWVkaWEtc3JjJyxcbiAgJ29iamVjdC1zcmMnLFxuICAncHJlZmV0Y2gtc3JjJyxcbiAgJ3NjcmlwdC1zcmMnLFxuICAnc3R5bGUtc3JjJyxcbiAgJ3dvcmtlci1zcmMnLFxuXVxuY29uc3QgY3NwRUF0dHIgPSBbXG4gICdzY3JpcHQtc3JjLWVsZW0nLFxuICAnc2NyaXB0LXNyYy1hdHRyJyxcbiAgJ3N0eWxlLXNyYy1lbGVtJyxcbiAgJ3N0eWxlLXNyYy1hdHRyJyxcbl1cbmNvbnN0IGNzcEluZm8gPSB7XG4gICdkZWZhdWx0LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2RlZmF1bHQtc3JjJyxcbiAgICBub3RlOiAnaXMgYSBmYWxsYmFjayBkaXJlY3RpdmUgZm9yIHRoZSBvdGhlciBmZXRjaCBkaXJlY3RpdmVzOiA8Yj5jaGlsZC1zcmM8L2I+LCA8Yj5jb25uZWN0LXNyYzwvYj4sIDxiPmZvbnQtc3JjPC9iPiwgPGI+aW1nLXNyYzwvYj4sIDxiPm1hbmlmZXN0LXNyYzwvYj4sIDxiPm1lZGlhLXNyYzwvYj4sIDxiPnByZWZldGNoLXNyYzwvYj4sIDxiPm9iamVjdC1zcmM8L2I+LCA8Yj5zY3JpcHQtc3JjKHNjcmlwdC1zcmMtZWxlbSwgc2NyaXB0LXNyYy1hdHRyKTwvYj4sIDxiPnN0eWxlLXNyYyhzdHlsZS1zcmMtZWxlbSwgc3R5bGUtc3JjLWF0dHIpPC9iPi4nXG4gIH0sXG4gICdjaGlsZC1zcmMnOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9jaGlsZC1zcmMnLFxuICAgIG5vdGU6ICdhbGxvd3MgdGhlIGRldmVsb3BlciB0byBjb250cm9sIG5lc3RlZCBicm93c2luZyBjb250ZXh0cyBhbmQgd29ya2VyIGV4ZWN1dGlvbiBjb250ZXh0cy4nXG4gIH0sXG4gICdjb25uZWN0LXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L2Nvbm5lY3Qtc3JjJyxcbiAgICBub3RlOiAncHJvdmlkZXMgY29udHJvbCBvdmVyIGZldGNoIHJlcXVlc3RzLCBYSFIsIGV2ZW50c291cmNlLCBiZWFjb24gYW5kIHdlYnNvY2tldHMgY29ubmVjdGlvbnMuJ1xuICB9LFxuICAnZm9udC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mb250LXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB3aGljaCBVUkxzIHRvIGxvYWQgZm9udHMgZnJvbS4nXG4gIH0sXG4gICdmcmFtZS1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mcmFtZS1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgbmVzdGVkIGJyb3dzaW5nIGNvbnRleHRzIGxvYWRpbmcgdXNpbmcgZWxlbWVudHMgc3VjaCBhcyAmbHQ7ZnJhbWUmZ3Q7IGFuZCAmbHQ7aWZyYW1lJmd0Oy4nXG4gIH0sXG4gICdpbWctc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvaW1nLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyB0aGF0IGltYWdlcyBjYW4gYmUgbG9hZGVkIGZyb20uJ1xuICB9LFxuICAnbWFuaWZlc3Qtc3JjJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvbWFuaWZlc3Qtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBVUkxzIHRoYXQgYXBwbGljYXRpb24gbWFuaWZlc3RzIG1heSBiZSBsb2FkZWQgZnJvbS4nXG4gIH0sXG4gICdtZWRpYS1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9tZWRpYS1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIFVSTHMgZnJvbSB3aGljaCB2aWRlbywgYXVkaW8gYW5kIHRleHQgdHJhY2sgcmVzb3VyY2VzIGNhbiBiZSBsb2FkZWQgZnJvbS4nXG4gIH0sXG4gICdvYmplY3Qtc3JjJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvb2JqZWN0LXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyBmcm9tIHdoaWNoIHBsdWdpbnMgY2FuIGJlIGxvYWRlZCBmcm9tLidcbiAgfSxcbiAgJ3ByZWZldGNoLXNyYyc6IHtcbiAgICBsZXZlbDogMyxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3ByZWZldGNoLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgVVJMcyBmcm9tIHdoaWNoIHJlc291cmNlcyBjYW4gYmUgcHJlZmV0Y2hlZCBmcm9tLidcbiAgfSxcbiAgJ3NjcmlwdC1zcmMnOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zY3JpcHQtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHRoZSBsb2NhdGlvbnMgZnJvbSB3aGljaCBhIHNjcmlwdCBjYW4gYmUgZXhlY3V0ZWQgZnJvbS4gSXQgaXMgYSBmYWxsYmFjayBkaXJlY3RpdmUgZm9yIG90aGVyIHNjcmlwdC1saWtlIGRpcmVjdGl2ZXM6IDxiPnNjcmlwdC1zcmMtZWxlbTwvYj4sIDxiPnNjcmlwdC1zcmMtYXR0cjwvYj4nXG4gIH0sXG4gICdzY3JpcHQtc3JjLWVsZW0nOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zY3JpcHQtc3JjLWVsZW0nLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgSmF2YVNjcmlwdCAmbHQ7c2NyaXB0Jmd0OyBlbGVtZW50cywgYnV0IG5vdCBpbmxpbmUgc2NyaXB0IGV2ZW50IGhhbmRsZXJzIGxpa2Ugb25jbGljay4nXG4gIH0sXG4gICdzY3JpcHQtc3JjLWF0dHInOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zY3JpcHQtc3JjLWF0dHInLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3IgSmF2YVNjcmlwdCBpbmxpbmUgZXZlbnQgaGFuZGxlcnMuIFRoaXMgaW5jbHVkZXMgb25seSBpbmxpbmUgc2NyaXB0IGV2ZW50IGhhbmRsZXJzIGxpa2Ugb25jbGljaywgYnV0IG5vdCBVUkxzIGxvYWRlZCBkaXJlY3RseSBpbnRvICZsdDtzY3JpcHQmZ3Q7IGVsZW1lbnRzLidcbiAgfSxcbiAgJ3N0eWxlLXNyYyc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3N0eWxlLXNyYycsXG4gICAgbm90ZTogJ2NvbnRyb2xzIGZyb20gd2hlcmUgc3R5bGVzIGdldCBhcHBsaWVkIHRvIGEgZG9jdW1lbnQuIFRoaXMgaW5jbHVkZXMgPGxpbms+IGVsZW1lbnRzLCBAaW1wb3J0IHJ1bGVzLCBhbmQgcmVxdWVzdHMgb3JpZ2luYXRpbmcgZnJvbSBhIExpbmsgSFRUUCByZXNwb25zZSBoZWFkZXIgZmllbGQ6IDxiPnN0eWxlLXNyYy1lbGVtPC9iPiwgPGI+c3R5bGUtc3JjLWF0dHI8L2I+J1xuICB9LFxuICAnc3R5bGUtc3JjLWVsZW0nOiB7XG4gICAgbGV2ZWw6IDEsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9zdHlsZS1zcmMnLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdmFsaWQgc291cmNlcyBmb3Igc3R5bGVzaGVldHMgJmx0O3N0eWxlJmd0OyBlbGVtZW50cyBhbmQgJmx0O2xpbmsmZ3Q7IGVsZW1lbnRzIHdpdGggcmVsPVwic3R5bGVzaGVldFwiLidcbiAgfSxcbiAgJ3N0eWxlLXNyYy1hdHRyJzoge1xuICAgIGxldmVsOiAxLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc3R5bGUtc3JjJyxcbiAgICBub3RlOiAnc3BlY2lmaWVzIHZhbGlkIHNvdXJjZXMgZm9yIGlubGluZSBzdHlsZXMgYXBwbGllZCB0byBpbmRpdmlkdWFsIERPTSBlbGVtZW50cy4nXG4gIH0sXG4gICd3b3JrZXItc3JjJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvd29ya2VyLXNyYycsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB2YWxpZCBzb3VyY2VzIGZvciBXb3JrZXIsIFNoYXJlZFdvcmtlciwgb3IgU2VydmljZVdvcmtlciBzY3JpcHRzLidcbiAgfSxcbiAgJ2Jhc2UtdXJpJzoge1xuICAgIGxldmVsOiAyLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvYmFzZS11cmknLFxuICAgIG5vdGU6ICdzcGVjaWZpZXMgdGhlIHBvc3NpYmxlIFVSTHMgdGhhdCB0aGUgJmx0O2Jhc2UmZ3Q7IGVsZW1lbnQgY2FuIHVzZS4nXG4gIH0sXG4gICdwbHVnaW4tdHlwZXMnOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9wbHVnaW4tdHlwZXMnLFxuICAgIG5vdGU6ICdsaW1pdHMgdGhlIHR5cGVzIG9mIHJlc291cmNlcyB0aGF0IGNhbiBiZSBsb2FkZWQgaW50byB0aGUgZG9jdW1lbnQgKGUuZy4gYXBwbGljYXRpb24vcGRmKS4gMyBydWxlcyBhcHBseSB0byB0aGUgYWZmZWN0ZWQgZWxlbWVudHMsICZsdDtlbWJlZCZndDsgYW5kICZsdDtvYmplY3QmZ3Q7JyxcbiAgICBkZXByZWNhdGVkOiB0cnVlXG4gIH0sXG4gICdzYW5kYm94Jzoge1xuICAgIGxldmVsOiAnMS4xLzInLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvc2FuZGJveCcsXG4gICAgbm90ZTogJ3NwZWNpZmllcyB0aGUgcG9zc2libGUgVVJMcyB0aGF0IHRoZSAmbHQ7YmFzZSZndDsgZWxlbWVudCBjYW4gdXNlLidcbiAgfSxcbiAgJ25hdmlnYXRlLXRvJzoge1xuICAgIGxldmVsOiAzLFxuICAgIGxpbms6ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvQ29udGVudC1TZWN1cml0eS1Qb2xpY3kvbmF2aWdhdGUtdG8nLFxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgd2hpY2ggYSBkb2N1bWVudCBjYW4gbmF2aWdhdGUgdG8gYnkgYW55IG1lYW4gKG5vdCB5ZXQgc3VwcG9ydGVkIGJ5IG1vZGVybiBicm93c2VycyBpbiBKYW4gMjAyMSkuJ1xuICB9LFxuICAnZm9ybS1hY3Rpb24nOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mb3JtLWFjdGlvbicsXG4gICAgbm90ZTogJ3Jlc3RyaWN0cyB0aGUgVVJMcyB3aGljaCB0aGUgZm9ybXMgY2FuIHN1Ym1pdCB0by4nXG4gIH0sXG4gICdmcmFtZS1hbmNlc3RvcnMnOiB7XG4gICAgbGV2ZWw6IDIsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9mcmFtZS1hbmNlc3RvcnMnLFxuICAgIG5vdGU6ICdyZXN0cmljdHMgdGhlIFVSTHMgdGhhdCBjYW4gZW1iZWQgdGhlIHJlcXVlc3RlZCByZXNvdXJjZSBpbnNpZGUgb2YgJmx0O2ZyYW1lJmd0OywgJmx0O2lmcmFtZSZndDssICZsdDtvYmplY3QmZ3Q7LCAmbHQ7ZW1iZWQmZ3Q7LCBvciAmbHQ7YXBwbGV0Jmd0OyBlbGVtZW50cy4nXG4gIH0sXG4gICd1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJzoge1xuICAgIGxldmVsOiAnPycsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS91cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzJyxcbiAgICBub3RlOiAnaW5zdHJ1Y3RzIHVzZXIgYWdlbnRzIHRvIHRyZWF0IGFsbCBvZiBhIHNpdGVcXCdzIGluc2VjdXJlIFVSTHMgKHRob3NlIHNlcnZlZCBvdmVyIEhUVFApIGFzIHRob3VnaCB0aGV5IGhhdmUgYmVlbiByZXBsYWNlZCB3aXRoIHNlY3VyZSBVUkxzICh0aG9zZSBzZXJ2ZWQgb3ZlciBIVFRQUykuIFRoaXMgZGlyZWN0aXZlIGlzIGludGVuZGVkIGZvciB3ZWIgc2l0ZXMgd2l0aCBsYXJnZSBudW1iZXJzIG9mIGluc2VjdXJlIGxlZ2FjeSBVUkxzIHRoYXQgbmVlZCB0byBiZSByZXdyaXR0ZW4uJ1xuICB9LFxuICAncmVwb3J0LXVyaSc6IHtcbiAgICBsZXZlbDogMSxcbiAgICBsaW5rOiAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0NvbnRlbnQtU2VjdXJpdHktUG9saWN5L3JlcG9ydC11cmknLFxuICAgIG5vdGU6ICdkaXJlY3RpdmUgaXMgZGVwcmVjYXRlZCBieSByZXBvcnQtdG8sIHdoaWNoIGlzIGEgVVJJIHRoYXQgdGhlIHJlcG9ydHMgYXJlIHNlbnQgdG8uJyxcbiAgICBkZXByZWNhdGVkOiB0cnVlXG4gIH0sXG4gICdyZXBvcnQtdG8nOiB7XG4gICAgbGV2ZWw6IDMsXG4gICAgbGluazogJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9Db250ZW50LVNlY3VyaXR5LVBvbGljeS9yZXBvcnQtdG8nLFxuICAgIG5vdGU6ICd3aGljaCBpcyBhIGdyb3VwbmFtZSBkZWZpbmVkIGluIHRoZSBoZWFkZXIgaW4gYSBqc29uIGZvcm1hdHRlZCBoZWFkZXIgdmFsdWUuJ1xuICB9LFxufVxuY29uc3QgcG9saWN5ID0ge1xuICAnbm9uZScgIDogJ1dvblxcJ3QgYWxsb3cgbG9hZGluZyBvZiBhbnkgcmVzb3VyY2VzLicsXG4gICdibG9iOicgOiAnUmF3IGRhdGEgdGhhdCBpc25cXCd0IG5lY2Vzc2FyaWx5IGluIGEgSmF2YVNjcmlwdC1uYXRpdmUgZm9ybWF0LicsXG4gICdkYXRhOicgOiAnT25seSBhbGxvdyByZXNvdXJjZXMgZnJvbSB0aGUgZGF0YSBzY2hlbWUgKGllOiBCYXNlNjQgZW5jb2RlZCBpbWFnZXMpLicsXG4gIFwiJ3NlbGYnXCI6ICdPbmx5IGFsbG93IHJlc291cmNlcyBmcm9tIHRoZSBjdXJyZW50IG9yaWdpbi4nLFxuICBcIid1bnNhZmUtaW5saW5lJ1wiOiAnJyxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNzcEFycixcbiAgY3NwSW5mbyxcbiAgY3NwRmV0Y2gsXG4gIGNzcEVBdHRyLFxuICBwb2xpY3ksXG59IiwiPHNjcmlwdD5cbmltcG9ydCB7b25Nb3VudH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7XG4gIGNzcEFycixcbiAgY3NwSW5mbyxcbiAgY3NwRmV0Y2gsXG4gIGNzcEVBdHRyLFxufSBmcm9tICcuL0NzcGRpcmVjdGl2ZSdcbmxldCBjc3AgPSB3aW5kb3cubWl0bS5pbmZvLmNzcFxubGV0IHJlcG9ydFRvID0gY3NwLnJlcG9ydFRvXG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zdCBmYWxsYmFjayA9IHRydWVcbiAgY29uc3Qge3BvbGljeX0gPSBjc3BbJ2RlZmF1bHQtc3JjJ10gfHwge31cbiAgaWYgKHBvbGljeSAmJiBwb2xpY3kubGVuZ3RoPjApIHtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIGNzcEZldGNoKSB7XG4gICAgICBpZiAoIWNzcFtpZF0pIHtcbiAgICAgICAgY3NwW2lkXSA9IHtwb2xpY3ksIGZhbGxiYWNrfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGlkIG9mIGNzcEVBdHRyKSB7XG4gICAgY29uc3QgcGFyID0gaWQucmVwbGFjZSgvLS57NH0kLywgJycpXG4gICAgY29uc3Qge3BvbGljeX0gPSBjc3BbcGFyXSB8fCB7fVxuICAgIGlmICghY3NwW2lkXSAmJiBwb2xpY3kpIHtcbiAgICAgIGNzcFtpZF0gPSB7cG9saWN5LCBmYWxsYmFja31cbiAgICB9XG4gIH1cbiAgaWYgKHJlcG9ydFRvIT09J0pTT04gRXJyb3IhJyAmJiByZXBvcnRUbz8ubGVuZ3RoID4gMTUpIHtcbiAgICBsZXQgY2IgPSByZXBvcnRUby5yZXBsYWNlKC9cXG4vZywnJykudHJpbSgpXG4gICAgaWYgKGNiWzBdPT09J3snICYmIGNiLnNsaWNlKC0xKT09PSd9Jykge1xuICAgICAgY2IgPSBKU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKGBbJHtjYn1dYCksIG51bGwsIDIpXG4gICAgICByZXBvcnRUbyA9IGNiLnJlcGxhY2UoL1xcW3xcXF0vZywgJycpLnJlcGxhY2UoL1xcbiAgL2csICdcXG4nKS50cmltKClcbiAgICB9XG4gIH1cbn0pXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInZib3hcIj5cbiAgPGI+Q29udGVudCBTZWN1cml0eSBQb2xpY3k8L2I+XG4gIDxwPlxuICAgIENTUCBvbjpcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvQ1NQXCI+TW96aWxsYTwvYT4sIFxuICAgIDxhIHRhcmdldD1ibGFuayBocmVmPVwiaHR0cHM6Ly9jb250ZW50LXNlY3VyaXR5LXBvbGljeS5jb20vXCI+Y29udGVudC1zZWN1cml0eS1wb2xpY3kuY29tPC9hPixcbiAgICA8YSB0YXJnZXQ9YmxhbmsgaHJlZj1cImh0dHBzOi8vY2hlYXRzaGVldHNlcmllcy5vd2FzcC5vcmcvY2hlYXRzaGVldHMvQ29udGVudF9TZWN1cml0eV9Qb2xpY3lfQ2hlYXRfU2hlZXQuaHRtbFwiPk9XQVNQLWNoZWF0LXNoZWV0PC9hPlxuICA8L3A+XG4gIDxkaXY+XG4gICAgeyNlYWNoIGNzcEFyciBhcyBpZCwgaX1cbiAgICB7I2lmIGNzcFtpZF19ICAgICAgXG4gICAgICA8ZGV0YWlscz48c3VtbWFyeSBjbGFzcz17Y3NwW2lkXS5mYWxsYmFjayA/ICdmYWxsYmFjaycgOiAnJ30+XG4gICAgICAgIHsjaWYgY3NwSW5mb1tpZF0ubGlua31cbiAgICAgICAgICB7aSsxfS57aWR9Oih7Y3NwW2lkXS5wb2xpY3kubGVuZ3RofSk8YSB0YXJnZXQ9YmxhbmsgaHJlZj17Y3NwSW5mb1tpZF0ubGlua30+PHNtYWxsPnZ7Y3NwSW5mb1tpZF0ubGV2ZWx9PC9zbWFsbD48L2E+XG4gICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICB7aSsxfS57aWR9Oih7Y3NwW2lkXS5wb2xpY3kubGVuZ3RofSk8c21hbGw+dntjc3BJbmZvW2lkXS5sZXZlbH08L3NtYWxsPlxuICAgICAgICB7L2lmfVxuICAgICAgPC9zdW1tYXJ5PlxuICAgICAgICB7I2lmIGNzcEluZm9baWRdLm5vdGV9XG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9XCJub3RlXCI+PHN1bW1hcnk+ZXhwYW5kLi4uPC9zdW1tYXJ5PlxuICAgICAgICAgICAgPHNtYWxsPntAaHRtbCBjc3BJbmZvW2lkXS5ub3RlfTwvc21hbGw+XG4gICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICB7L2lmfVxuICAgICAgICB7I2VhY2ggY3NwW2lkXS5wb2xpY3kgYXMgaXRlbSwgeH1cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbVwiPnt4KzF9OntpdGVtfTwvZGl2PlxuICAgICAgICB7L2VhY2h9XG4gICAgICA8L2RldGFpbHM+XG4gICAgey9pZn1cbiAgICB7L2VhY2h9XG4gICAgPGhyIC8+XG4gICAgPGRldGFpbHM+PHN1bW1hcnkgY2xhc3M9XCJyZXBvcnRcIj48Yj5yZXBvcnQtdG88L2I+Ojwvc3VtbWFyeT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzPVwibm90ZVwiPjxzdW1tYXJ5PmV4cGFuZC4uLjwvc3VtbWFyeT5cbiAgICAgICAgPHNtYWxsPntAaHRtbCAndXNlZCB0byBzcGVjaWZ5IGRldGFpbHMgYWJvdXQgdGhlIGRpZmZlcmVudCBlbmRwb2ludHMgdGhhdCBhIHVzZXItYWdlbnQgaGFzIGF2YWlsYWJsZSB0byBpdCBmb3IgZGVsaXZlcmluZyByZXBvcnRzIHRvLiBZb3UgY2FuIHRoZW4gcmV0cmlldmUgcmVwb3J0cyBieSBtYWtpbmcgYSByZXF1ZXN0IHRvIHRob3NlIFVSTHMuJ308L3NtYWxsPlxuICAgICAgPC9kZXRhaWxzPlxuICAgICAgPGRpdiBjbGFzcz1cIml0ZW1cIj57cmVwb3J0VG99PC9kaXY+XG4gICAgPC9kZXRhaWxzPlxuICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPlxuZGV0YWlscy5ub3RlIHtcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xuICBwYWRkaW5nLWJvdHRvbTogM3B4O1xuICBzdW1tYXJ5IHtcbiAgICBjb2xvcjogcmVkO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBmb250LXNpemU6IHgtc21hbGw7XG4gICAgbWFyZ2luLWxlZnQ6IC0xNHB4O1xuICAgIHBhZGRpbmctbGVmdDogMTRweDtcbiAgICBsaXN0LXN0eWxlOiBub25lO1xuICAgICY6Oi13ZWJraXQtZGV0YWlscy1tYXJrZXIge1xuICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG4gICAgJjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcbiAgICB9XG4gIH1cbn0gXG5zdW1tYXJ5LC5pdGVtIHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBzbWFsbDtcbiAgJjpob3ZlciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRibHVlO1xuICB9XG59XG5zdW1tYXJ5LmZhbGxiYWNrIHtcbiAgY29sb3I6IGRhcmtyZWQ7XG59XG4uaXRlbSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbiAgZm9udC1zaXplOiBzbWFsbGVyO1xuICBjb2xvcjogIzkxMDBjZDtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XG5jb25zdCBfYyA9ICdjb2xvcjogYmx1ZXZpb2xldCdcblxubGV0IGtleXMgPSBbXVxuJDogX2tleXMgPSBrZXlzXG5cbmZ1bmN0aW9uIHJlbG9hZEtleXMoKSB7XG4gIGNvbnNvbGUubG9nKCclY1JlbG9hZCBob3RrZXlzLicsIF9jKTtcbiAgY29uc3Qge21hY3Jva2V5czogbWtleX0gPSB3aW5kb3cubWl0bVxuICBrZXlzID0gW11cbiAgZm9yIChjb25zdCBpZCBpbiBta2V5KSB7XG4gICAga2V5cy5wdXNoKHtpZCwgdGl0bGU6IG1rZXlbaWRdLl90aXRsZX0pXG4gIH1cbn1cblxubGV0IG9ic2VydmVyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc3QgcXJ5ID0gJy5taXRtLWNvbnRhaW5lci5jZW50ZXInXG4gIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHFyeSlcbiAgY29uc3Qgbm9kZVZpc2libGUgPSBvYnMgPT4ge1xuICAgIGlmIChub2RlLmF0dHJpYnV0ZXMuc3R5bGUpIHtcbiAgICAgIHJlbG9hZEtleXMoKVxuICAgIH1cbiAgfVxuICBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG5vZGVWaXNpYmxlKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7YXR0cmlidXRlczogdHJ1ZX0pXG4gIHNldFRpbWVvdXQocmVsb2FkS2V5cywgMTAwMClcbn0pO1xuXG5vbkRlc3Ryb3koKCkgPT4ge1xuICBpZiAob2JzZXJ2ZXIpIHtcbiAgICBvYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICBvYnNlcnZlciA9IHVuZGVmaW5lZFxuICB9XG59KTtcblxuZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuICBjb25zdCBrZXkgPSBlLnRhcmdldC5kYXRhc2V0LmlkXG4gIGNvbnN0IGZuID0gbWl0bS5tYWNyb2tleXNba2V5XVxuICBsZXQgW3R5cCwgLi4uYXJyXSA9IGtleS5zcGxpdCgnOicpXG4gIGNvbnN0IG9wdCA9IHt9XG4gIGlmICh0eXA9PT0na2V5Jykge1xuICAgIGNvbnN0IHFjdGwgPSBrZXkubWF0Y2goLzwoW14+XSspPi8pXG4gICAgY29uc3QgcWFsdCA9IGtleS5tYXRjaCgveyhbXn1dKyl9LylcbiAgICBsZXQga1xuICAgIGlmIChxY3RsKSB7XG4gICAgICBvcHQuYWx0S2V5ID0gdHJ1ZVxuICAgICAgayA9IHFjdGxbMV0uc3Vic3RyKC0xKVxuICAgIH0gZWxzZSBpZiAocWFsdCkge1xuICAgICAgay5jdHJsS2V5ID0gdHJ1ZVxuICAgICAgayA9IHFhbHRbMV0uc3Vic3RyKC0xKVxuICAgIH0gZWxzZSB7XG4gICAgICBvcHQuYWx0S2V5ID0gdHJ1ZVxuICAgICAgb3B0LmN0cmxLZXkgPSB0cnVlXG4gICAgICBrID0gYXJyLnBvcCgpLnN1YnN0cigtMSlcbiAgICB9XG4gICAgb3B0LnNoaWZ0S2V5ID0gZS5zaGlmdEtleVxuICAgIG9wdC5jb2RlID0gYEtleSR7ay50b1VwcGVyQ2FzZSgpfWBcbiAgICBvcHQua2V5ID0gbWl0bS5mbi5jb2RlVG9DaGFyKG9wdClcbiAgfSBlbHNlIGlmICh0eXA9PT0nY29kZScpIHtcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXG4gICAgaWYgKHFjdGwpIHtcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxuICAgICAgYXJyID0gcWN0bFsxXS5zcGxpdCgnOicpXG4gICAgfSBlbHNlIGlmIChxYWx0KSB7XG4gICAgICBvcHQuYWx0S2V5ID0gdHJ1ZVxuICAgICAgYXJyID0gcWFsdFsxXS5zcGxpdCgnOicpXG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdC5jdHJsS2V5ID0gdHJ1ZVxuICAgICAgb3B0LmFsdEtleSAgPSB0cnVlXG4gICAgfVxuICAgIG9wdC5jb2RlID0gYXJyLnBvcCgpXG4gICAgb3B0LnNoaWZ0S2V5ID0gZS5zaGlmdEtleVxuICAgIG9wdC5rZXkgPSBtaXRtLmZuLmNvZGVUb0NoYXIob3B0KVxuICB9XG4gIGlmIChmbikge1xuICAgIGNvbnN0IG1hY3JvID0gZm4obmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBvcHQpKVxuICAgIG1pdG0uZm4ubWFjcm9BdXRvbWF0aW9uKG1hY3JvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxuZnVuY3Rpb24ga3RvU2hvdyhrKSB7XG4gIHJldHVybiBrLnNwbGl0KCcnKS5tYXAoeD0+YCR7eH1gKS5qb2luKCcgJylcbn1cblxuZnVuY3Rpb24ga2NvZGUob2JqKSB7XG4gIGNvbnN0IGtleSA9IG9iai5pZFxuICBjb25zdCB7Y29kZVRvQ2hhcjogY2hhcn0gPSBtaXRtLmZuXG4gIGxldCBbdHlwLCAuLi5hcnJdID0ga2V5LnNwbGl0KCc6JylcbiAgY29uc3Qgb3B0ID0ge31cbiAgbGV0IG1zZ1xuICBpZiAodHlwPT09J2tleScpIHtcbiAgICBjb25zdCBxY3RsID0ga2V5Lm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IHFhbHQgPSBrZXkubWF0Y2goL3soW159XSspfS8pXG4gICAgaWYgICAgICAocWN0bCkgeyBtc2cgPSBgY3RsIC4gLi4uIOKHviAke2t0b1Nob3cocWN0bFsxXSl9YCAgfVxuICAgIGVsc2UgaWYgKHFhbHQpIHsgbXNnID0gYGFsdCAuIC4uLiDih74gJHtrdG9TaG93KHFhbHRbMV0pfWAgIH1cbiAgICBlbHNlICAgICAgICAgICB7IG1zZyA9IGBjdGwgKyBhbHQg4oe+ICR7a3RvU2hvdyhhcnIucG9wKCkpfWB9XG4gIH0gZWxzZSBpZiAodHlwPT09J2NvZGUnKSB7XG4gICAgY29uc3QgcWN0bCA9IGtleS5tYXRjaCgvPChbXj5dKyk+LylcbiAgICBjb25zdCBxYWx0ID0ga2V5Lm1hdGNoKC97KFtefV0rKX0vKVxuICAgIGlmICAgICAgKHFjdGwpIHsgbXNnID0gJ2N0bCAuIC4uLiDih6ggJyttaXRtLmZuLmNvZGVUb1Nob3cocWN0bFsxXSl9XG4gICAgZWxzZSBpZiAocWFsdCkgeyBtc2cgPSAnYWx0IC4gLi4uIOKHqCAnK21pdG0uZm4uY29kZVRvU2hvdyhxYWx0WzFdKX1cbiAgICBlbHNlICAgICAgICAgICB7IG1zZyA9ICdjdGwgKyBhbHQg4oeoICcrbWl0bS5mbi5jb2RlVG9TaG93KGFyci5qb2luKCc6JykpfVxuICB9XG4gIHJldHVybiBtc2dcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveFwiPlxuICA8Yj5Ib3Qta2V5czo8L2I+XG4gIDx0YWJsZT5cbiAgICB7I2VhY2ggX2tleXMgYXMgb2JqLGl9XG4gICAgICA8dHI+XG4gICAgICAgIDx0ZCBjbGFzcz1cIm5vXCI+e2krMX08L3RkPlxuICAgICAgICA8dGQgY2xhc3M9XCJrY29kZVwiIGRhdGEtaWQ9e29iai5pZH0gb246Y2xpY2s9e2hhbmRsZUNsaWNrfT5cbiAgICAgICAgICB7a2NvZGUob2JqKX1cbiAgICAgICAgPC90ZD5cbiAgICAgICAgPHRkIGNsYXNzPVwidGl0bGVcIj57b2JqLnRpdGxlfTwvdGQ+XG4gICAgICA8L3RyPlxuICAgIHsvZWFjaH1cbiAgPC90YWJsZT5cbjwvZGl2PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPlxuICAudmJveCB7XG4gICAgY29sb3I6Ymx1ZTtcbiAgICBsZWZ0OiAwO1xuICAgIHJpZ2h0OiAwO1xuICB9XG4gIHRhYmxlIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBjb2xvcjogbWFyb29uO1xuICAgIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XG4gICAgdHI6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogcmdiYSgxOTksIDE2NiwgMTE2LCAwLjQ1Mik7XG4gICAgICAua2NvZGUge1xuICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICAgICAgJjpob3ZlciB7XG4gICAgICAgICAgY29sb3I6IHJlZDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGQge1xuICAgICAgYm9yZGVyOiAxcHggc29saWQgIzk5OTtcbiAgICAgIHBhZGRpbmctbGVmdDogNXB4O1xuICAgIH1cbiAgICAubm8ge1xuICAgICAgcGFkZGluZzogMDtcbiAgICAgIHdpZHRoOiAyNXB4O1xuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIH1cbiAgICAua2NvZGUge1xuICAgICAgZm9udC1mYW1pbHk6ICdDb3VyaWVyIE5ldycsIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgIH1cbiAgICAudGl0bGUge1xuICAgICAgZm9udC1mYW1pbHk6ICdHaWxsIFNhbnMnLCAnR2lsbCBTYW5zIE1UJywgQ2FsaWJyaSwgJ1RyZWJ1Y2hldCBNUycsIHNhbnMtc2VyaWY7XG4gICAgICB3aWR0aDogNTAlO1xuICAgIH1cbiAgfVxuPC9zdHlsZT4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gTm90ZTogVGhpcyByZWdleCBtYXRjaGVzIGV2ZW4gaW52YWxpZCBKU09OIHN0cmluZ3MsIGJ1dCBzaW5jZSB3ZeKAmXJlXG4vLyB3b3JraW5nIG9uIHRoZSBvdXRwdXQgb2YgYEpTT04uc3RyaW5naWZ5YCB3ZSBrbm93IHRoYXQgb25seSB2YWxpZCBzdHJpbmdzXG4vLyBhcmUgcHJlc2VudCAodW5sZXNzIHRoZSB1c2VyIHN1cHBsaWVkIGEgd2VpcmQgYG9wdGlvbnMuaW5kZW50YCBidXQgaW5cbi8vIHRoYXQgY2FzZSB3ZSBkb27igJl0IGNhcmUgc2luY2UgdGhlIG91dHB1dCB3b3VsZCBiZSBpbnZhbGlkIGFueXdheSkuXG52YXIgc3RyaW5nT3JDaGFyID0gLyhcIig/OlteXFxcXFwiXXxcXFxcLikqXCIpfFs6LF0vZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdpZnkocGFzc2VkT2JqLCBvcHRpb25zKSB7XG4gIHZhciBpbmRlbnQsIG1heExlbmd0aCwgcmVwbGFjZXI7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGluZGVudCA9IEpTT04uc3RyaW5naWZ5KFxuICAgIFsxXSxcbiAgICB1bmRlZmluZWQsXG4gICAgb3B0aW9ucy5pbmRlbnQgPT09IHVuZGVmaW5lZCA/IDIgOiBvcHRpb25zLmluZGVudFxuICApLnNsaWNlKDIsIC0zKTtcbiAgbWF4TGVuZ3RoID1cbiAgICBpbmRlbnQgPT09IFwiXCJcbiAgICAgID8gSW5maW5pdHlcbiAgICAgIDogb3B0aW9ucy5tYXhMZW5ndGggPT09IHVuZGVmaW5lZFxuICAgICAgPyA4MFxuICAgICAgOiBvcHRpb25zLm1heExlbmd0aDtcbiAgcmVwbGFjZXIgPSBvcHRpb25zLnJlcGxhY2VyO1xuXG4gIHJldHVybiAoZnVuY3Rpb24gX3N0cmluZ2lmeShvYmosIGN1cnJlbnRJbmRlbnQsIHJlc2VydmVkKSB7XG4gICAgLy8gcHJldHRpZXItaWdub3JlXG4gICAgdmFyIGVuZCwgaW5kZXgsIGl0ZW1zLCBrZXksIGtleVBhcnQsIGtleXMsIGxlbmd0aCwgbmV4dEluZGVudCwgcHJldHRpZmllZCwgc3RhcnQsIHN0cmluZywgdmFsdWU7XG5cbiAgICBpZiAob2JqICYmIHR5cGVvZiBvYmoudG9KU09OID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIG9iaiA9IG9iai50b0pTT04oKTtcbiAgICB9XG5cbiAgICBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShvYmosIHJlcGxhY2VyKTtcblxuICAgIGlmIChzdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBsZW5ndGggPSBtYXhMZW5ndGggLSBjdXJyZW50SW5kZW50Lmxlbmd0aCAtIHJlc2VydmVkO1xuXG4gICAgaWYgKHN0cmluZy5sZW5ndGggPD0gbGVuZ3RoKSB7XG4gICAgICBwcmV0dGlmaWVkID0gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIHN0cmluZ09yQ2hhcixcbiAgICAgICAgZnVuY3Rpb24gKG1hdGNoLCBzdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cmluZ0xpdGVyYWwgfHwgbWF0Y2ggKyBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChwcmV0dGlmaWVkLmxlbmd0aCA8PSBsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHByZXR0aWZpZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlcGxhY2VyICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2Uoc3RyaW5nKTtcbiAgICAgIHJlcGxhY2VyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmIG9iaiAhPT0gbnVsbCkge1xuICAgICAgbmV4dEluZGVudCA9IGN1cnJlbnRJbmRlbnQgKyBpbmRlbnQ7XG4gICAgICBpdGVtcyA9IFtdO1xuICAgICAgaW5kZXggPSAwO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIHN0YXJ0ID0gXCJbXCI7XG4gICAgICAgIGVuZCA9IFwiXVwiO1xuICAgICAgICBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBpdGVtcy5wdXNoKFxuICAgICAgICAgICAgX3N0cmluZ2lmeShvYmpbaW5kZXhdLCBuZXh0SW5kZW50LCBpbmRleCA9PT0gbGVuZ3RoIC0gMSA/IDAgOiAxKSB8fFxuICAgICAgICAgICAgICBcIm51bGxcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gXCJ7XCI7XG4gICAgICAgIGVuZCA9IFwifVwiO1xuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGtleSA9IGtleXNbaW5kZXhdO1xuICAgICAgICAgIGtleVBhcnQgPSBKU09OLnN0cmluZ2lmeShrZXkpICsgXCI6IFwiO1xuICAgICAgICAgIHZhbHVlID0gX3N0cmluZ2lmeShcbiAgICAgICAgICAgIG9ialtrZXldLFxuICAgICAgICAgICAgbmV4dEluZGVudCxcbiAgICAgICAgICAgIGtleVBhcnQubGVuZ3RoICsgKGluZGV4ID09PSBsZW5ndGggLSAxID8gMCA6IDEpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaXRlbXMucHVzaChrZXlQYXJ0ICsgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gW3N0YXJ0LCBpbmRlbnQgKyBpdGVtcy5qb2luKFwiLFxcblwiICsgbmV4dEluZGVudCksIGVuZF0uam9pbihcbiAgICAgICAgICBcIlxcblwiICsgY3VycmVudEluZGVudFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG4gIH0pKHBhc3NlZE9iaiwgXCJcIiwgMCk7XG59O1xuIiwiPHNjcmlwdD5cbmltcG9ydCBzdHJpbmdpZnkgZnJvbSBcImpzb24tc3RyaW5naWZ5LXByZXR0eS1jb21wYWN0XCI7XG5cbmV4cG9ydCBsZXQgZ2VuZXJhbCA9IHt9XG5leHBvcnQgbGV0IGpzb24gPSB7fVxuXG5sZXQga2V5cyA9IE9iamVjdC5rZXlzKGpzb24pIFxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9c3YtaXRlbT5cbnsjZWFjaCBrZXlzIGFzIGtleX1cbjxkZXRhaWxzIGNsYXNzPSdzdi1kYXRhIHN2LXtrZXl9IHN0e01hdGgudHJ1bmMoZ2VuZXJhbC5zdGF0dXMvMTAwKX14Jz5cbiAgPHN1bW1hcnkgY2xhc3M9c3YtdGl0bGU+e2tleX08L3N1bW1hcnk+XG4gIDxwcmUgY2xhc3M9c3Yte2dlbmVyYWwuZXh0fT57c3RyaW5naWZ5KGpzb25ba2V5XSl9PC9wcmU+XG48L2RldGFpbHM+XG57L2VhY2h9XG48L2Rpdj5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4uc3YtaXRlbSB7XG4gIHBhZGRpbmctbGVmdDogMTRweDtcbn1cbi5zdi10aXRsZSwgcHJlIHtcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcbiAgZm9udC1zaXplOiBzbWFsbDtcbiAgbWFyZ2luOiAwO1xuICAmLnN2LWh0bWwge1xuICAgIGZvbnQtc2l6ZTogeC1zbWFsbDtcbiAgfVxufVxuLnN2LXRpdGxlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRnb2xkZW5yb2R5ZWxsb3c7XG59XG4uc3YtcmVzcEJvZHkge1xuICBjb2xvcjogYmx1ZXZpb2xldDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgJjppcyguc3Q0eCwuc3Q1eCkge1xuICAgIGNvbG9yOiByZWQ7XG4gIH1cbn1cbi5zdi1yZXFzQm9keSB7XG4gIGNvbG9yOiBtZWRpdW12aW9sZXRyZWQ7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgb25Nb3VudCwgb25EZXN0cm95IH0gZnJvbSAnc3ZlbHRlJztcbiAgaW1wb3J0IEpzb24gZnJvbSAnLi9Kc29uLnN2ZWx0ZSc7XG5cbiAgbGV0IGxzdCA9IHt9XG4gIGxldCBvYmogPSB7cm93czogW119XG4gIGxldCBxdWVyeT0gZmFsc2U7XG4gIGxldCBwYXRoID0gdHJ1ZTtcbiAgbGV0IGJvZHkgPSB0cnVlO1xuICBcbiAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgcm93cyA9ICh3aW5kb3cuaW5uZXJIZWlnaHQtMTAwKS8xNy41XG4gICAgY29uc29sZS5sb2coe3Jvd3N9KVxuICAgIGNvbnN0IF9saW1pdF8gPSByb3dzXG4gICAgY29uc3QgX2NvdW50XyA9IHt0b3RhbDonaWQnfVxuICAgIGNvbnN0IF9kaXN0aW5jdF8gPSBbJ3Nlc3Npb24nXVxuICAgIGNvbnN0IF93aGVyZV89ICdpZD4wIG9yZGVyYnkgaWQ6ZCdcbiAgICBvYmogPSBhd2FpdCBtaXRtLmZuLnNxbExpc3Qoe19jb3VudF8sIF9kaXN0aW5jdF8sIF93aGVyZV8sIF9saW1pdF99LCAnbG9nJylcbiAgICBvYmoucm93cy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgbHN0W2l0ZW0uc2Vzc2lvbl0gPSBbXVxuICAgIH0pO1xuICB9KVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGRldGFpbENsaWNrKGUpIHtcbiAgICBjb25zdCBzcyA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnNzXG4gICAgaWYgKCFsc3Rbc3NdPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG9iaiA9IGF3YWl0IG1pdG0uZm4uc3FsTGlzdCh7X3doZXJlXzogYHNlc3Npb249JHtzc30gb3JkZXJieSBpZGB9LCAnbG9nJylcbiAgICAgIGxzdFtzc10gPSBvYmoucm93cy5tYXAoeCA9PiB7XG4gICAgICAgIHgubWV0YSA9IEpTT04ucGFyc2UoeC5tZXRhKVxuICAgICAgICBpZiAoeC5tZXRhLmdlbmVyYWwuZXh0PT09J2pzb24nKSB7XG4gICAgICAgICAgeC5kYXRhID0gSlNPTi5wYXJzZSh4LmRhdGEpXG4gICAgICAgICAgZGVsZXRlIHguZGF0YS5nZW5lcmFsXG4gICAgICAgICAgaWYgKHgubWV0YS5nZW5lcmFsLm1ldGhvZD09PSdHRVQnKSB7XG4gICAgICAgICAgICBkZWxldGUgeC5kYXRhLnJlcXNCb2R5XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4XG4gICAgICB9KVxuICAgICAgY29uc29sZS5sb2coc3MsIG9iai5yb3dzKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGV4cENsaWNrKGUpIHtcbiAgICBpZiAoYm9keSkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IGUuY3VycmVudFRhcmdldC5wYXJlbnROb2RlXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKGRldGFpbHMuYXR0cmlidXRlcy5vcGVuKSB7XG4gICAgICAgICAgZGV0YWlscy5jaGlsZHJlblsyXS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCcnKVxuICAgICAgICAgIGNvbnN0IGFycjEgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1HRVQsLm10LURFTEVURSkgZGV0YWlsczppcyguc3YtcmVzcEJvZHksLnN2LXJlc3BIZWFkZXIpJylcbiAgICAgICAgICBjb25zdCBhcnIyID0gZGV0YWlscy5xdWVyeVNlbGVjdG9yQWxsKCcuc3YtY29udGVudDppcygubXQtUFVULC5tdC1QT1NUKSBkZXRhaWxzOmlzKC5zdi1yZXFzQm9keSknKVxuICAgICAgICAgIGNvbnN0IGFycjMgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1SRURJUkVDVCkgZGV0YWlsczppcyguc3YtcmVzcEhlYWRlciknKVxuICAgICAgICAgIGNvbnN0IGFycjQgPSBkZXRhaWxzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdi1jb250ZW50OmlzKC5tdC1FUlJPUikgZGV0YWlsczppcyguc3YtcmVzcEJvZHkpJylcbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyMSkgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XG4gICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGFycjIpIHsgbm9kZS5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnJykgfVxuICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBhcnIzKSB7IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpIH1cbiAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgYXJyNCkgeyBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSB9XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhvc3QodXJsKSB7XG4gICAgY29uc3Qgb2JqID0gbmV3IFVSTCh1cmwpXG4gICAgbGV0IG1zZyA9IHBhdGggPyBvYmoucGF0aG5hbWUgOiBvYmoub3JpZ2luICsgb2JqLnBhdGhuYW1lXG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICBtc2cgKz0gb2JqLnNlYXJjaFxuICAgIH1cbiAgICByZXR1cm4gbXNnLmxlbmd0aD45MCA/IG1zZy5zbGljZSgwLCA5MCkrJy4uLicgOiBtc2dcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycl9tZXRob2QoaTIpIHtcbiAgICBjb25zdCB7bWV0aG9kLCBzdGF0dXN9ID0gaTIubWV0YS5nZW5lcmFsXG4gICAgY29uc3Qgc3QgPSBNYXRoLnRydW5jKHN0YXR1cy8xMDApXG4gICAgaWYgKHN0PT09Mykge1xuICAgICAgcmV0dXJuICdtdC1SRURJUkVDVCdcbiAgICB9IGVsc2UgaWYgKHN0PjMpIHtcbiAgICAgIHJldHVybiAnbXQtRVJST1InXG4gICAgfVxuICAgIHJldHVybiBgbXQtJHttZXRob2R9YCBcbiAgfVxuPC9zY3JpcHQ+XG5cbjxkaXY+XG48Yj5TcWxpdGUgTG9ncyE8L2I+XG48bGFiZWwgZm9yPXN2LWJvZHk+XG4gIDxpbnB1dCB0eXBlPWNoZWNrYm94IGlkPXN2LWJvZHkgYmluZDpjaGVja2VkPXtib2R5fSAvPmV4cC1ib2R5XG48L2xhYmVsPlxuPGxhYmVsIGZvcj1zdi1uby1ob3N0PlxuICA8aW5wdXQgdHlwZT1jaGVja2JveCBpZD1zdi1uby1ob3N0IGJpbmQ6Y2hlY2tlZD17cGF0aH0gLz5uby1ob3N0XG48L2xhYmVsPlxuPGxhYmVsIGZvcj1zdi1xdWVyeT5cbiAgPGlucHV0IHR5cGU9Y2hlY2tib3ggaWQ9c3YtcXVlcnkgYmluZDpjaGVja2VkPXtxdWVyeX0gLz5xdWVyeVxuPC9sYWJlbD5cbnsjZWFjaCBvYmoucm93cyBhcyBpdGVtfVxuICA8ZGV0YWlscyBjbGFzcz1zdi1zZXNzaW9uIGRhdGEtc3M9e2l0ZW0uc2Vzc2lvbn0gb246Y2xpY2s9e2RldGFpbENsaWNrfT5cbiAgICA8c3VtbWFyeSBjbGFzcz1zdi1tYWluPlxuICAgICAge2l0ZW0uc2Vzc2lvbn08c3BhbiBjbGFzcz1zdi10b3RhbD4oe2l0ZW0udG90YWx9KTwvc3Bhbj5cbiAgICA8L3N1bW1hcnk+XG4gICAgeyNpZiBsc3RbaXRlbS5zZXNzaW9uXS5sZW5ndGh9XG4gICAgICB7I2VhY2ggbHN0W2l0ZW0uc2Vzc2lvbl0gYXMgaTJ9XG4gICAgICAgIDxkZXRhaWxzIGNsYXNzPSdzdi1yb3dzJz5cbiAgICAgICAgICA8c3VtbWFyeSBcbiAgICAgICAgICBkYXRhLWlkPXtpMi5pZH1cbiAgICAgICAgICBkYXRhLXNzPXtpdGVtLnNlc3Npb259XG4gICAgICAgICAgY2xhc3M9J3N2LXRpdGxlIHN0e01hdGgudHJ1bmMoaTIubWV0YS5nZW5lcmFsLnN0YXR1cy8xMDApfXgnXG4gICAgICAgICAgb246Y2xpY2s9e2V4cENsaWNrfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPXN2LXtpMi5tZXRhLmdlbmVyYWwuc3RhdHVzfT57aTIubWV0YS5nZW5lcmFsLnN0YXR1c308L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1zdi17aTIubWV0YS5nZW5lcmFsLm1ldGhvZH0+e2kyLm1ldGEuZ2VuZXJhbC5tZXRob2QucGFkRW5kKDQsJy4nKX08L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1zdi17cGF0aD8ncGF0aCc6J2Z1bGxwYXRoJ30+e2hvc3QoaTIudXJsLCBwYXRoLCBxdWVyeSl9PC9zcGFuPlxuICAgICAgICAgIDwvc3VtbWFyeT5cbiAgICAgICAgICA8ZGV0YWlscyBjbGFzcz0nc3Ytcm93LWRhdGEgc3YtaGVhZGVyJz5cbiAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzPSdzdi10aXRsZSBzdi1oZWFkZXInPmhlYWRlcjwvc3VtbWFyeT5cbiAgICAgICAgICAgIDxKc29uIGpzb249e2kyLm1ldGF9Lz5cbiAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgICAgPGRldGFpbHMgY2xhc3M9J3N2LXJvdy1kYXRhIHN2LWNvbnRlbnQge2Vycl9tZXRob2QoaTIpfSc+XG4gICAgICAgICAgICA8c3VtbWFyeSBjbGFzcz0nc3YtdGl0bGUgc3YtY29udGVudCc+Y29udGVudDwvc3VtbWFyeT5cbiAgICAgICAgICAgIHsjaWYgaTIubWV0YS5nZW5lcmFsLmV4dD09PSdqc29uJ31cbiAgICAgICAgICAgICAgPEpzb24ganNvbj17aTIuZGF0YX0gZ2VuZXJhbD17aTIubWV0YS5nZW5lcmFsfSAvPlxuICAgICAgICAgICAgezplbHNlfVxuICAgICAgICAgICAgICA8cHJlIGNsYXNzPXN2LXtpMi5tZXRhLmdlbmVyYWwuZXh0fT57aTIuZGF0YX08L3ByZT5cbiAgICAgICAgICAgIHsvaWZ9XG4gICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICA8L2RldGFpbHM+ICAgICAgICBcbiAgICAgIHsvZWFjaH1cbiAgICB7OmVsc2V9XG4gICAgICBsb2FkaW5nLTEuLi4gICAgICAgICAgXG4gICAgey9pZn1cbiAgPC9kZXRhaWxzPlxuey9lYWNofVxuPC9kaXY+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuW3R5cGU9Y2hlY2tib3hdIHtcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbn1cbi5zdi1zZXNzaW9uIHtcbiAgc3VtbWFyeSB7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICYuc3YtbWFpbjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGdvbGRlbnJvZHllbGxvdztcbiAgICB9XG4gIH1cbn1cbi5zdi1yb3dzIHtcbiAgcGFkZGluZy1sZWZ0OiAxNnB4O1xufVxuLnN2LXJvdy1kYXRhIHtcbiAgcGFkZGluZy1sZWZ0OiAxNHB4O1xufVxuLnN2LXRvdGFsIHtcbiAgZm9udC1zaXplOiB4LXNtYWxsO1xuICB2ZXJ0aWNhbC1hbGlnbjogdGV4dC10b3A7XG4gIGNvbG9yOiBkYXJrbWFnZW50YTtcbn1cbi5zdi10aXRsZSwgLnN2LXJvdy1kYXRhIHByZSB7XG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IHNtYWxsO1xuICBtYXJnaW46IDA7XG4gICYuc3YtaHRtbCB7XG4gICAgZm9udC1zaXplOiB4LXNtYWxsO1xuICB9XG59XG5zdW1tYXJ5OmlzKC5zdDJ4KSB7XG4gIGNvbG9yOiMzMDA0N2U7XG59XG5zdW1tYXJ5OmlzKC5zdDN4LC5zdDR4LC5zdDV4KSB7XG4gIGNvbG9yOiAjYjQwMDAwO1xufVxuLnN2LVBPU1QsLnN2LVBVVCB7XG4gIGNvbG9yOiBjcmltc29uO1xufVxuLnN2LURFTEVURSB7XG4gIGNvbG9yOiByZWRcbn1cbi5zdi1wYXRoIHtcbiAgY29sb3I6IGRhcmtncmVlbjtcbn1cbi5zdi1mdWxscGF0aCB7XG4gIGNvbG9yOiBkYXJrbWFnZW50YTtcbn1cbi5zdi10aXRsZTpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z29sZGVucm9keWVsbG93O1xufVxuPC9zdHlsZT5cbiIsIi8vIGZlYXQ6IHN2ZWx0ZSByZWxhdGVkXG5jb25zdCB7ZGVmYXVsdDogQTExeVBvcHVwfSA9IHJlcXVpcmUoJy4vQTExeVBvcHVwLnN2ZWx0ZScpXG5jb25zdCB7ZGVmYXVsdDogQ3NwaGVhZGVyfSA9IHJlcXVpcmUoJy4vQ3NwaGVhZGVyLnN2ZWx0ZScpXG5jb25zdCB7ZGVmYXVsdDogSG90a2V5c30gICA9IHJlcXVpcmUoJy4vSG90a2V5cy5zdmVsdGUnKVxuY29uc3Qge2RlZmF1bHQ6IFNxbGl0ZX0gICAgPSByZXF1aXJlKCcuL3NxbGl0ZS5zdmVsdGUnKVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEExMXlQb3B1cCxcbiAgQ3NwaGVhZGVyLFxuICBIb3RrZXlzLFxuICBTcWxpdGVcbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgX3dzX3Bvc3RtZXNzYWdlID0gcmVxdWlyZSgnLi9fd3NfcG9zdG1lc3NhZ2UnKVxuY29uc3QgX3dzX2luaXRTb2NrZXQgPSByZXF1aXJlKCcuL193c19pbml0LXNvY2tldCcpXG5jb25zdCBfd3Nfc2NyZWVuc2hvdCA9IHJlcXVpcmUoJy4vX3dzX3NjcmVlbnNob3QnKVxuY29uc3QgX3dzX2xvY2F0aW9uID0gcmVxdWlyZSgnLi9fd3NfbG9jYXRpb24nKVxuY29uc3QgX3dzX29ic2VydmVyID0gcmVxdWlyZSgnLi9fd3Nfb2JzZXJ2ZXInKVxuY29uc3QgX3dzX2dlbmVyYWwgPSByZXF1aXJlKCcuL193c19nZW5lcmFsJylcbmNvbnN0IF93c19jc3BFcnIgPSByZXF1aXJlKCcuL193c19jc3AtZXJyJylcbmNvbnN0IF93c19tYWNyb3MgPSByZXF1aXJlKCcuL193c19tYWNyb3MnKVxuY29uc3QgX2MgPSAnY29sb3I6IHJlZCdcblxuX3dzX3Bvc3RtZXNzYWdlKClcbl93c19pbml0U29ja2V0KClcbl93c19zY3JlZW5zaG90KClcbl93c19sb2NhdGlvbigpXG5fd3Nfb2JzZXJ2ZXIoKVxuX3dzX2dlbmVyYWwoKVxuX3dzX2NzcEVycigpXG5fd3NfbWFjcm9zKClcbmNvbnNvbGUubG9nKCclY1dzOiB3cy1jbGllbnQgbG9hZGVkLi4uJywgX2MpXG53aW5kb3cubWl0bS5zdmVsdGUgPSByZXF1aXJlKCcuLi9fc3ZlbHRlJylcbiJdLCJuYW1lcyI6WyJfd3NfcG9zdG1lc3NhZ2UiLCJfYyIsIl93c19jbGllbnQiLCJyZXF1aXJlJCQwIiwiX3dzX21zZ1BhcnNlciIsIl93c19pbklmcmFtZSIsIl93c192ZW5kb3IiLCJyZXF1aXJlJCQxIiwicmVxdWlyZSQkMiIsIl93c19pbml0U29ja2V0IiwiX3NjcmVlbnNob3QiLCJfd3NfbmFtZXNwYWNlIiwiX3dzX3NjcmVlbnNob3QiLCJwbGF5Iiwic3FsaXRlIiwicmVxdWlyZSQkMyIsImxvY2F0aW9uIiwiaW5pdCIsIl93c19sb2NhdGlvbiIsIl93c19kZWJvdW5jZSIsIl93c19yb3V0ZSIsInJlcXVpcmUkJDQiLCJfd3Nfb2JzZXJ2ZXIiLCJfd3NfZ2VuZXJhbCIsIl93c19jc3BFcnIiLCJfd3NfbWFjcm9zIiwiY3NwSW5mbyIsImNzcEFyciIsImNzcEZldGNoIiwiY3NwRUF0dHIiLCJzdHJpbmdpZnkiLCJyZXF1aXJlJCQ1IiwicmVxdWlyZSQkNiIsInJlcXVpcmUkJDciLCJyZXF1aXJlJCQ4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBQ0FBLGlCQUFjLEdBQUcsTUFBTTtDQUN2QixFQUFFLFNBQVMsY0FBYyxFQUFFLEtBQUssRUFBRTtDQUNsQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0NBQ3hDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUM7Q0FDN0YsS0FBSztDQUNMLEdBQUc7Q0FDSCxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBQztDQUMzRDs7Q0NSQSxNQUFNQyxJQUFFLEdBQUcsaUJBQWdCO0FBQzNCO0tBQ0FDLFlBQWMsR0FBRyxNQUFNO0NBQ3ZCLEVBQUUsSUFBSSxVQUFTO0NBQ2YsRUFBRSxPQUFPO0NBQ1Q7Q0FDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQztDQUN2QixLQUFLO0NBQ0w7Q0FDQSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7Q0FDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUks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RUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLE1BQU0sRUFBRSxHQUFHO0NBQ2IsRUFBRSxNQUFNLEVBQUUsR0FBRztDQUNiLEVBQUUsTUFBTSxFQUFFLEdBQUc7Q0FDYixFQUFFLEdBQUcsRUFBRSxLQUFLO0NBQ1osRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxJQUFJLEVBQUUsR0FBRztDQUNYLEVBQUUsSUFBSSxFQUFFLEdBQUc7Q0FDWCxFQUFFLEVBQUUsR0FBRyxJQUFJO0NBQ1gsRUFBRSxFQUFFLEdBQUcsSUFBSTtDQUNYLEVBQUUsRUFBRSxHQUFHLElBQUk7Q0FDWCxFQUFFLEVBQUUs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QUFJLEdBQUcsSUFBSSxLQUFLO0NBQzVDLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDNUMsSUFBRztBQUNIO0NBQ0E7Q0FDQSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEtBQUs7Q0FDOUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUU7Q0FDOUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDO0NBQzNDLElBQUc7QUFDSDtDQUNBO0NBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU07Q0FDMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQztDQUN2QixJQUFHO0FBQ0g7Q0FDQTtDQUNBLEVBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksS0FBSztDQUM5QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRTtDQUM5QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7Q0FDM0MsSUFBRztBQUNIO0NBQ0EsRUFBRSxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEtBQUs7Q0FFNUMsSUFBSSxNQUFNLEVBQUUsR0FBRyxNQUFNLEdBQUU7Q0FDdkIsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztDQUM5QixJQUFJLE1BQU0sQ0FBQyxTQUFTLENB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
