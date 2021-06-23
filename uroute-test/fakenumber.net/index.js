const css = `
#share-buttons,
.footer-social,
.sec-head-row,
.description {
  display: none !important;
}`;
const route = {
  url: 'https://fakenumber.net/',
  css:  {'/css/style': `=>${css}`},
  // "mock:lol": {
  //   '#201:clean:google.+.com': ''
  // },
  // 'cache:css-js clean': {
  //   '/js': {
  //     contentType: ['script'],
  //     tags: ['tags']
  //   },
  //   '/css': {
  //     contentType: ['css'],
  //     tags: ['tags', 'togs']
  //   }
  // },
}
module.exports = route;
