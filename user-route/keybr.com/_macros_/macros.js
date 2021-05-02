const rbuttons = {
  'right|yellow'() {
    console.log('right')
  },
}
const lbuttons = {
  'left1|yellow'() {
    console.log('left')
  },
  'left2|yellow'() {
    console.log('left')
  },
  'left3|yellow'() {
    console.log('left')
  },
}
module.exports = () => {
  const hello = 'world'
  return {
    '/'() {
      console.log('olah')
      window.mitm.macrokeys = {
        'KeyA'() {
          console.log('KeyA')
          alert('Alert KeyA')
        }
      }
      window.mitm.autofill = ['input[type="password"] => password']
      window.mitm.rightbuttons = rbuttons
      window.mitm.autobuttons  = rbuttons
      window.mitm.leftbuttons  = lbuttons
    },
    zero: '0'
  }
}