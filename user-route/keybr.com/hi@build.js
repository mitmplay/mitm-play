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
  const lol = require('./_macros_/test')
  const hello = 'hi macros'
  
  window.mitm.macros = {
      one: '1',
      two: '2'
  }
  console.log(lol)
  // macros.js + hi@macros.js
  const {macros: macro2} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ...macro2,
  }
})((function() {
  // file: _global_/macros.js
  const hello = 'global'
  
  window.mitm.macros = {global: '0'}
  
  // pass to function params
  return window.mitm.macros
})(), (function() {
  // file: macros.js
  const hello = 'world'
  
  window.mitm.macros = {
    '/'() {
      console.log('olah')
      window.mitm.macrokeys = {
        'KeyA'() {
          console.log('KeyA')
          alert('Alert KeyA')
        }
      }
      window.mitm.autobuttons = {
        'one|yellow'() {
          console.log('one')
          return [
            'input[type="password"] => password'
          ]
        },
      }
    },
    zero: '0'
  }
  
  // pass to function params
  return window.mitm.macros
})());
