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
    'GET:/main/css': `=>${css}`
  },
  'log': {
    '/': {
      contentType: ['html'],
      // tags: 'loll'
    }
  },
}
module.exports = route;
