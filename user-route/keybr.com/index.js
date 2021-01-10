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
    'GET:resp#404:/api/login': 'What you need is not here',
  },
  css: { 
    'GET:no-ads:/assets/[a-z0-9]+': `=>${css}`
  },
  log: {
    '/': {
      contentType: ['html']
    }
  },
}
module.exports = route;