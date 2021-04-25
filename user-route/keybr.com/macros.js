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
}