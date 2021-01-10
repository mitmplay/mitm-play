const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
const route = {
  'mock:no-ads': {
    'google.+.com': '',
    'doubleclick.net': '',
  },
  mock: {
    '!:scenario~#404:/api/login': 'What you need is not here',
    ':scenario~1:/api/login': '...', 
    ':scenario~2:/api/login': '...', 
  },
  css: { 
    'GET!:no-ads:/assets/[a-z0-9]+': `=>${css}`
  },
  log: {
    '/': {
      contentType: ['html']
    }
  },
}
module.exports = route;