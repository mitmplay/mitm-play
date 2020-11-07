// create file: ~/user-route/keybr.com/index.js & add this content:
const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
 
const route = {
  url: 'https://keybr.com',
  tags: [],
  'mock:no-ads': {
    'doubleclick.net': '',
    'a.pub.network': '',
    'google.+.com': '',
  },
  'css:no-ads': {
    '/assets/[a-z0-9]+': `=>${css}`
  },
}
module.exports = route;