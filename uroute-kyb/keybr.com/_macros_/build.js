// [Ctrl] + [Alt] + [A] => run hotkey KeyA
// [Ctrl] + [Shift] => Hide / Show Buttons
const {macros} = window.mitm
let _body1 = require('./macros')
if (typeof _body1==='function') {
  _body1 = _body1()
}
let global = require('../../_global_/_macros_/macros')
if (typeof global==='function') { 
  global = global()
}
window.mitm.macros = {
  ...global,
  ...macros,
  ..._body1,
}
