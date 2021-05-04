const css = `
.Body-header,.Body-aside {
  display: none !important;
}`
;
const route = {
  urls: {
    keybr: 'https://keybr.com/',
  },
  proxy: ['keybr.com'],
  'mock:1.no-ads': {
    '#201:google.+.com': '',
    'doubleclick.net': '',
  },
  'mock:2.scenario 1.no-ads': {
    // ':2.scenario-#404:/api/login': 'What you need is not here',
    'GET:/account': {
      response: r => {
        r.body = 'Hi There'
      },
      tags: ['widi'],
      ws: true
    },
    // ':2.scenario-2:/api/login': '...',
  },
  // 'css:1.no-ads active': { 
  //   'GET#202:/assets/[a-z0-9]+': `=>${css}`
  // },
  // workspace: '_assets_/',
  // 'cache:select~1': { 
  //   '.(pn|sv)g$': {
  //     contentType: ['image'],
  //     tags: 'image'
  //   }
  // },
  // 'log:select~2': {},
  // 'log:select~3': {},
  // log: {
  //   'POST:/lol': {
  //     contentType: ['html'],
  //     tags: '4.logging'
  //   }
  // },
  // 'response:active': {},
  // 'html:active': {
  //   'GET:dodol:/z$': {
  //     tags: 'in-html',
  //     ws: true
  //   },
  // },
  preset: {
    clear: {
      title: 'clear tags',
      tags: []
    },
    default: {
      title: 'Default tags for common operation',
      tags:[
        'active',
        'css:1.no-ads',
        'mock:1.no-ads',
        'mock:2.scenario',
        'tag3:image',
        'tag3:url:2.scenario-#404',
        // '2.scenario',
        // '2.scenario-#404',
        // '2.scenario-2',
        // '4.logging',
        // 'dodol',
        // 'html:active',
        // 'image',
        // 'response:active',
        // 'select~1',
        // 'tag3:4.logging',
        // 'tag3:url:2.scenario-2',
        // 'tag3:url:dodol',
        // 'url:2.scenario-#404',
        // 'url:2.scenario-2',
        // 'url:dodol'
      ]
    }
  }
}
module.exports = route;
