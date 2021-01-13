const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
const route = {
  'mock:1.no-ads': {
    '/www.google-analytics.com/(analytics.js)': {
      file: ':1'
    },
    '#201:google.+.com': '',
    'doubleclick.net': '',
    ':test:test.com': ''
  },
  mock: {
    '!:2.scenario~#404:/api/login': 'What you need is not here',
    ':2.scenario~1:/api/login': '...', 
    ':2.scenario~2:/api/login': '...', 
  },
  css: { 
    'GET#202!:1.no-ads:/assets/[a-z0-9]+': `=>${css}`
  },
  cache: {
    '/': {
      contentType: ['json'],
      tags: '3.caching'
    }
  },
  log: {
    '/': {
      contentType: ['html'],
      tags: '4.logging'
    }
  },
}
module.exports = route;