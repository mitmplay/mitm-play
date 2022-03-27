const css = `
body>div,.Body-header,.Body-aside {
  display: none !important;
}`;

const route = {
  url: 'https://keybr.com',
  'mock:no-ads': {
    'cloudflareinsights.com': '',
    '#201:google.+.com': '',
    'doubleclick.net': '',
    'cookiebot.com': '',
    'btloader.com': '',
    'pub.network': '',
  },
  css: {
    'GET:no-ads:/assets/[a-z0-9]+': `=>${css}`,
  },
}
module.exports = route;
