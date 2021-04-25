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

(function(global) {
  // file: macros.js
  const hello = 'global'
  
  window.mitm.macros = {global: '0'}
  
  const {macros: macro1} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
  }
})((function() {
  // file: _global_/macros.js
  const hello = 'global'
  
  window.mitm.macros = {global: '0'}
  
  // pass to function params
  return window.mitm.macros
})());
