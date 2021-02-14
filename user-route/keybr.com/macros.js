const hello = 'world'

window.mitm.macros = {
  '/'() {
    console.log('olah')
    window.mitm.macrokeys = {
      'KeyA'() {
        alert('Alert KeyA')
      }
    }
  },
  zero: '0'
}
