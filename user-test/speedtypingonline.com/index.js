const css = `
#cookieConsentPopup,#loginOrRegister,#infoOpContainer,#main-header,#rightSkyAd,#ttFeatures,#rectAdWrap,#leadAd,#main,footer {
  display: none !important;
}
#centerConsole,#cc_offset,body {
  padding: 0;
  margin: 0;
}`;

const route = {
  title: 'speedtypingonline.com',
  url: 'https://www.speedtypingonline.com/typing-test',
  screenshot: {
    selector: '[type=button],[type=submit],button,a',
  },
  // workspace: '/_cache_', 
  tags: [],
  'cache:_test~01': {
    '/css/_.+': {
      contentType: ['css'],
    }
  },
  'cache:_test~02': {
    '/css/(_.+).css': {
      contentType: ['css'],
      file: '_assets_/:1',
    }
  },
  'cache:_test~03': {
    '/css/(_.+).css': {
      contentType: ['css'],
      path: '_assets_',
      file: ':1',
    }
  },
  'cache:_test~04': {
    '/css/(_.+).css': {
      contentType: ['css'],
      path: '~/_assets_',
      file: ':1',
    }
  },
  'cache:_test~05': {
    '/css/(_.+).css': {
      contentType: ['css'],
      path: '/_assets_',
      file: ':1',
    }
  },
  'cache:_test~22': {
    '/css/(_.+).css': {
      contentType: ['css'],
      file: '_assets_/:1',
      seq: true,
    }
  },
  'css:remove-ads~css': {
    'GET:/css/_a_main': `=>${css}`,
  },
  // response: {
  //   '/getData': {
  //     response(resp, reqs, match) {
  //       resp.headers['content-type'] = 'text/html/application/json'
  //     }
  //   }
  // },
  request: {
    '/getData': {
      request(reqs) {
        reqs.headers.cookie['newcookie'] = 'hi'
      }
    }
  },
  log: {
    '/': {
      contentType: ['json'],
      tags: 'log-req/resp'
    },
    '/getData': {
      contentType: ['text'],
      tags: 'log-req/resp'
    },
  },
  html: {
    '/typing-test$': {
      tags: 'activity',
      // ws: true
    }
  },
}
module.exports = route;