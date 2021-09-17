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
    keybr: 'https://www.keybr.com/',
  },
  screenshot: {},
  proxy: [':proxy:keybr.com'],
  skip: [':skipper:google','woff2'],
  'mock:no-ads': {
    ':ads:cloudflareinsights.com': '',
    '#201:ads:google.+.com': '',
    ':ads:doubleclick.net': '',
    ':ads:cookiebot.com': '',
    ':ads:btloader.com': '',
    ':ads:pub.network': '',
  },
  css: {
    'GET:no-ads~wow:/assets/[a-z0-9]+': {
      response(resp, reqs, match) {
        resp.body = `${resp.body}\n${css}`
        // console.log(match.tags)
      },
      tags: ['tag3']
    },
  },
  mock: {
    '/df': {
      file(reqs, match) {
        match.path = '_assets_'
        return 'me@error.json'
      },
      tags: 'no-ads~wiw'
    }
  },
  // cache: {
  //   '/df': {
  //     file(reqs, match) {
  //       const path = 'path'
  //       const file = 'file'
  //       return {path, file}
  //     },
  //   }
  // },
  // html: {
  //   '/': null
  // },
  preset
}
module.exports = route;
