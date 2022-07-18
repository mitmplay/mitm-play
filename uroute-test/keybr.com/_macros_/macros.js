const rbuttons = {
  'right1|yellow': async function () {console.log('right' )},
  'dright|yellow': async function () {console.log('dright')},
}
const lbuttons = {
  'left1|yellow': async function () {console.log('left1')},
  'left2|yellow': async function () {console.log('left2')},
  'left3|yellow': async function () {console.log('left3')},
}
module.exports = () => {
  const oneOnce = async function() {
    console.log('oneOnce')
  }
  return {
    '/'() {
      console.log('olah')
      const keys = {
        'code:KeyB'() {
          console.log('KeyB')
          alert('Alert KeyB')
        }
      }
      keys['code:KeyB']._title = 'Print on console'

      const {mitm} = window 
      mitm.fn.hotKeys(keys)
      mitm.autofill = ['input[type="password"] => password']
      mitm.rightbuttons = rbuttons
      mitm.autobuttons  = rbuttons
      mitm.leftbuttons  = lbuttons
      return oneOnce
    },
    zero: '0'
  }
}