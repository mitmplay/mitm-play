const route = {
  workspace: '_assets_/',
  'cache:select~1': { 
    '.(pn|sv)g$': {
      contentType: ['image'],
      tags: 'image'
    }
  },
  mock: { 
    ':resp~#200:c33bb71d63ce5996.woff2': '// What you need is not here 200',
    ':resp~#201:c33bb71d63ce5996.woff2': '// What you need is not here 201',
  },
  'log:select~2': {},
  'log:select~3': {},
  log: {
    'POST:/lol': {
      contentType: ['html'],
      tags: '4.logging'
    }
  },
  'response:active': {},
  'html:active': {
    'GET:dodol:/z$': {
      tags: 'in-html',
      ws: true
    },
  },
}
module.exports = route;
