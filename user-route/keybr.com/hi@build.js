// [Ctrl] + [Alt] + [A] => run hotkey KeyA
// [Ctrl] + [Shift] => Hide / Show Buttons
if (window._ws_connect===undefined) {
  window._ws_connect = {}
};

window.mitm.fn.autoclick = () => {
  setTimeout(() => {
    document.querySelector('.btn-autofill').click()
  }, 1000)
};

window.mitm.fn.hotKeys = obj => {
  window.mitm.macrokeys = {
    ...window.mitm.macrokeys,
    ...obj
  }
};

window.mitm._macros_ = () => {
  window.mitm.macrokeys = {};
};

window._ws_connect.macrosOnMount = data => {
  console.log('macros code executed after ws open', data)
};

(function(global, macro1) {
  // file: hi@macros.js
  let _body2 = require('./hi@macros.js')
  if (typeof _body2==='function') {
    _body1 = _body2()
  }
  // macros.js + hi@macros.js
  const {macros: macro2} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ...macro2,
  }
})((function() {
  // file: _global_/macros.js
  let _global = require('../_global_/macros')
  if (typeof _global==='function') { return _global()
  } else if (_global!==undefined ) { return _global }
})(), (function() {
  // file: macros.js
  let _body1 = require('./macros')
  if (typeof _body1==='function') { return _body1()
  } else if (_body1!==undefined ) { return _body1 }
})());
