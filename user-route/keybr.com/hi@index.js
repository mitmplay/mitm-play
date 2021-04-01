const {watcher} = global.mitm.fn
watcher(__dirname, ['hi@index.js', 'reload.js'])
const lol = require('./reload.js')

lol()

const route = {
  urls: {
    keyb2: 'https://keybr.com/',
  },  
  'html:hi': {
    'GET:/url': {
      // tags: 'in-html',
      amir: ''
    },
  }
}
module.exports = route;