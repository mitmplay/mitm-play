// create file: ~/user-route/keybr.com/index.js & add this content:
const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
 
const route = {
  url: 'https://keybr.com',
  tags: ['no-ads'],
  'mock:1.no-ads~g': {
    'doubleclick.net': '',
    'a.pub.network': '',
    'GET:2.err~#4:google.+.com': '',
    'GET:3.in-mock:/test': {
      tags: ['3.in-mock~1  3.in-mock~2']
    }
  },
  css: {
    'GET:dodl:/test': `=>${css}`,
    'GET:no-ads:/assets/[a-z0-9]+': `=>${css}`
  },
  'log:sample-tag2': {
    'GET:sample-tag1:/tag1': {
      contentType: ['html'],
      tags: 'sample-tag0 sample-tag3',
    }
  },
  html: {
    'GET:sample-tag1:/tag2': {
      tags: 'sample-tag2',
      log: true
    }
  }
}
module.exports = route;