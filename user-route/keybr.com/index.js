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
    'GET:nested:/assets/[a-z0-9]+': `=>${css}`,
    ':content:/main/css': `=>${css}`
  },
  'log': {
    '/': {
      contentType: ['html'],
      // tags: 'loll'
    }
  },
}
module.exports = route;
