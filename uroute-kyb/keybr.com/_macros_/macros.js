const _c = 'color: cornflowerblue'

const rbuttons = {
  'Right|#1445d733': async function () {
    console.log('%cMacro: Clicked on "Right" button', 'color:#bc0099')
  },
  'Two|#1445d733': async function () {
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
      console.log('%cMacro: olleh >< hello', _c, hello)
      const keys = {
        'code:KeyA'(_e) {
          console.log(`%cMacro: ${_e.code}`, _c, _e)
        },
        'code:{KeyA:KeyB}'(_e) {
          console.log(`%Alt w/ 2 keys: ${_e.code}`, _c, _e)
        },
        'key:hi'(_e) {
          const {fn,svelte} = window.mitm
          fn.svelte(svelte.App, 'ElectricLavender')
        },
        'code:Enter'(_e) {
          console.log(`%cPress Enter: ${_e.code}`, _c, _e)
        },
        'key:us'(_e) {
          console.log(`%cUS Country`, _c, _e)
        },
        'key:u'(_e) {
          console.log(`%cU Char`, _c, _e)
        }
      }
      keys['code:KeyA'       ]._title = 'this is KeyA'
      keys['key:hi'          ]._title = 'Show Svelte App'
      keys['code:{KeyA:KeyB}']._title = 'this is {KeyA}'
      keys['code:Enter'      ]._title = 'this is Enter'
      keys['key:us'          ]._title = 'this is us'
      keys['key:u'           ]._title = 'this is u'

      window.mitm.fn.hotKeys (keys)
      window.mitm.autofill = ['input[type="password"] => password']
      window.mitm.autobuttons  = rbuttons
      window.mitm.rightbuttons = rbuttons
      window.mitm.leftbuttons  = rbuttons
      return observeOnce
    },
    zero: '0'
  }
}
