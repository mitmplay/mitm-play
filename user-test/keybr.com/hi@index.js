const {requires} = global.mitm.fn
const [lol] = requires('./reload')

lol(0)

const route = {
  urls: {
    keybh: 'https://keybr.com/',
  },  
  'html:hi': {
    'GET:/url': {
      tags: 'there-are',
      amir: ''
    },
  }
}
module.exports = route;