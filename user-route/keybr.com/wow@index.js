const route = {
  urls: {
    keybw: 'https://keybr.com/',
  },
  'mock:2.scenario 1.no-ads': {
    'GET:/account': {
      response: r => {
        r.body = 'Hi There'
      },
      tags: ['widi'],
      ws: true
    },
  },
  cache: {
    '!:/assets/(.+).css': {
      contentType: ['css', 'image'],
      path: '_assets_/',
      file: ':1.css ',
      // tags: '3.caching',
      // debug: true
    }
  },
  'html:wow': {
    'GET:/url': {
      // tags: 'in-html',
      widi: ''
    },
  }  
}
module.exports = route;