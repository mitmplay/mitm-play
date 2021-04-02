const {watcher} = global.mitm.fn
watcher(['./reload'])
const lol = require('./reload')

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