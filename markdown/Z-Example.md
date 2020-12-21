<details><summary><b>Namespace</b></summary>

# Namespace
```js
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
  tags: ['remove-ads'],
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
```
</details>

<details><summary><b>Global Namespace</b></summary>

# Global Namespace
```js
const route = {
  tags: ['remove-ads'],
  'mock:remove-ads': {
    'GET:googlesyndication.com': '',
    'GET:googletagservices.com': '',
    'GET:google-analytics.com': '',
    'GET:doubleclick.net': '',
  },
  mock: {
    'GET:lijit.com': '',
    'GET:sovrn.com': '',
  },
  'args:activity~a.rec': {
    activity: 'rec:activity',
  },
  'args:activity~b.mix': {
    activity: 'mix:activity',
  },
  'args:activity~c.play': {
    activity: 'play:activity',
  },
  args: {
    relaxcsp: true,
    cookie: true,
  },
  'flag:test': {
    mock: false,
    css: false,
  },
  flag: {
    'referer-reqs': false,
    'no-namespace': false,
    websocket: true,
    skip: false,
    mock: true,
    css: true
  },
}
module.exports = route
```
</details>
