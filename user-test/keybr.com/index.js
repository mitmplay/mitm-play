const preset = {
  clear: {
    title: 'clear tags',
    tags: []
  },
  default: {
    title: 'Default tags for common operation',
    tags:[
      'active',
      'css:no-ads~css',
      'mock:no-ads',
    ]
  }
}

const css = `
.Body-header,.Body-aside {
  display: none !important;
}`
;
const route = {
  urls: {
    keybr: 'https://keybr.com/',
  },
  proxy: ['keybr.com'],
  'mock:no-ads': {
    'cloudflareinsights.com': '',
    '#201:google.+.com': '',
    'doubleclick.net': '',
    'cookiebot.com': '',
    'btloader.com': '',
    'pub.network': '',
  },
  css: {
    'GET:no-ads~wow:/assets/[a-z0-9]+': `=>${css}`,
  },
  html: {
    '/df': {
      tags: 'no-ads~wiw'
    }
  },
  preset
}
module.exports = route;
