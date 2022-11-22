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
#ezoic-pub-ad-placeholder-110,
#ezoic-pub-ad-placeholder-111,
.Body-header,.Body-aside {
  display: none !important;
}`
;
const route = {
  urls: {
    keybr: 'https://www.keybr.com/?mitm=keyb1',
    keyb2: 'https://www.keybr.com/?mitm=hi',
  },
  screenshot: {},
  // jsLib: ['axe.js'],
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
    '/mock' : {file: './mock.json'},
    '/mock2': {
      file(reqs, match) {
        match.path = '.' // superseded match.route.path
        return 'mock2.html'
      },
      response(resp, reqs, match) {
        let {body} = resp
        body += '<h2>there!</h2>'
        return {body} // {status, headers, body} or false to skip
      },
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
