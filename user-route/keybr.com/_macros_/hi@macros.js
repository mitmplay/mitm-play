// module.exports = () => {
  require('../_svelte_')

  const lol = require('./test')
  const hello = 'hi macros'

  window.mitm.macros = {
      one: '1',
      two: '2',
      thr: '3',
      fou: '4',
  }
  console.log(lol)
  // return window.mitm.macros
// }