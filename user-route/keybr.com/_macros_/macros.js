// const {default:App} = require('../_svelte_/VBox.svelte')
const _c = 'color: cornflowerblue'

const rbuttons = {
  'Right|#1445d733': async function () {
    console.log('%cMacro: Clicked on "Right" button', 'color:#bc0099')
  },
}

module.exports = () => {
  const hello = 'world'

  async function observeOnce() {
    console.log('%cMacro: execute after observer once', _c)
  }

  return {
    '/'() {
      // new App({ target: document.body })
      console.log('%cMacro: olleh >< hello', _c, hello)
      window.mitm.macrokeys = {
        'code:KeyA'(_e) {
          console.log(`%cMacro: ${_e.code}`, _c, _e)
        },
        'code:{KeyA}'(_e) {
          console.log(`%cAlt Macro: ${_e.code}`, _c, _e)
        },
        'key:us'(_e) {
          console.log(`%cUS Country`, _c, _e)
        },
        'key:u'(_e) {
          console.log(`%cU Char`, _c, _e)
        }
      }

      window.mitm.autofill = ['input[type="password"] => password']
      window.mitm.autobuttons  = rbuttons
      // window.mitm.rightbuttons = rbuttons
      // window.mitm.leftbuttons  = rbuttons
      return observeOnce
    },
    zero: '0'
  }
}
