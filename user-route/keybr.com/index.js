const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
const route = {
  url: 'https://keybr.com',
  'mock:no-ads': {
    'doubleclick.net': '',
    'a.pub.network': '',
    'google.+.com': '',
  },
  'css:no-ads': { 
    '/assets/[a-z0-9]+': `=>${css}`
  },
  'log': {
    'GET:/log1': {
      contentType: ['html']
    }
  },
}
module.exports = route;










//'no-ads'
// create file: ~/user-route/keybr.com/index.js & add this content:
// :sample-tag1
// tags: 'sample-tag1',
//:1.no-ads~g
    // 'GET:/test': {
    //   //tags: '3.in-mock~1'
    // }
    //:parent-tag': {
    // 'GET:/test': `=>${css}`,
    // 'GET:hide-content:/assets/[a-z0-9]+': `=>${css}`
    // html: {
    //   'GET:/html1': {
    //     tags: 'sample-tag1 hide-content',
    //     log: true
    //   },
    //   'GET:/assets/[a-z0-9]+': {
    //     tags: 'hide-content',
    //     log: true
    //   },
    // }
  