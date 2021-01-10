const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
const route = {
  url: 'https://keybr.com',
  'mock:no-ads': {
    'google.+.com': '',
    'doubleclick.net': '',
    // 'a.pub.network': '',
  },
  'css:no-ads': {
    'GET:no-ads:/assets/[a-z0-9]+': `=>${css}`,
    'GET:no-ads~1:/assets/[a-z0-9]+': `=>${css}`,
    // 'GET:/main/css': `=>${css}`,
    'GET:/asset2/[a-z0-9]+': {
      tags: 'no-ads~2'
    }
  },
  'log': {
    '/': {
      contentType: ['html'],
      // tags: 'loll'
    }
  },
}
module.exports = route;
