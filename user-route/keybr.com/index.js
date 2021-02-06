const css = `
.Body-header,.Body-aside {
  display: none !important;
}`
;
const route = {
  urls: {
    keybr: 'https://keybr.com/',
  },
  'mock:1.no-ads': {
    '#201:google.+.com': '',
    'doubleclick.net': '',
  },
  'mock:2.scenario 1.no-ads': {
    ':2.scenario-#404:/api/login': 'What you need is not here',
    ':2.scenario-1:/api/login': '...',
    ':2.scenario-2:/api/login': '...',
  },
  'css:1.no-ads    active': { 
    'GET#202:/assets/[a-z0-9]+': `=>${css}`
  },
  workspace: '_assets_/',
  'cache:select~1': { 
    '.(pn|sv)g$': {
      contentType: ['image'],
      tags: 'image'
    }
  },
  'log:select~2': {},
  'log:select~3': {},
  log: {
    '/lol': {
      contentType: ['html'],
      tags: '4.logging'
    }
  },
  'response:active': {},
  'html:active': {
    'GET:dodol:/': {
      tags: 'in-html',
      ws: true
    },
  },
  preset: {
    default: [
      '1.no-ads',
      // '2.scenario',
      // '2.scenario-#404',
      // '2.scenario-2',
      // '4.logging',
      // 'active',
      // 'css:1.no-ads',
      // 'dodol',
      // 'html:active',
      // 'image',
      // 'mock:1.no-ads',
      // 'mock:2.scenario',
      // 'response:active',
      // 'select~1',
      // 'tag3:4.logging',
      // 'tag3:image',
      // 'tag3:url:2.scenario-#404',
      // 'tag3:url:2.scenario-2',
      // 'tag3:url:dodol',
      // 'url:2.scenario-#404',
      // 'url:2.scenario-2',
      // 'url:dodol'
    ]
  }
}
module.exports = route;