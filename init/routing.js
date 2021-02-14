const fs = require('fs-extra')
// const logs = require('./fn/logs');

const hotKeys = obj => {
  window.mitm.macrokeys = {
    ...window.mitm.macrokeys,
    ...obj
  }
}

const autoclick = () => {
  setTimeout(() => {
    document.querySelector('.btn-autofill').click()
  }, 1000)
}

module.exports = () => {
  const { argv, fn: { _tldomain, _nameSpace } } = global.mitm

  const mock = {
    '!:hidden:/mitm-play/mitm.js': {
      response: resp => {
        resp.body = global.mitm.fn._wsmitm(resp)
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/macros.js': {
      response: resp => {
        let global = ''; let body = ''; let path;
        path = `${argv.route}/_global_/macros.js`
        if (fs.existsSync(path)) {
          global = `${fs.readFileSync(path)}`
        }
        const namespace = _nameSpace(_tldomain(resp.url))
        if (namespace) {
          const [app, domain] = namespace.split('@')
          path = `${argv.route}/${domain||app}/macros.js`
          if (fs.existsSync(path)) {
            body = `${fs.readFileSync(path)}`
          }
          if (domain) {
            path = `${argv.route}/${domain}/${app}@macros.js`
            if (fs.existsSync(path)) {
              const body2 = `${fs.readFileSync(path)}`
              body = `(function(global, macro1) {
  // file: ${app}@macros.js
  ${body2.replace(/\n/g, '\n  ')}
  // macros.js + ${app}@macros.js
  const {macros: macro2} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ...macro2,
  }
})((function() {
  // file: _global_/macros.js
  ${global.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})(), (function() {
  // file: macros.js
  ${body.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})())`
            }
          } else {
            body = `(function(global) {
  // file: macros.js
  ${body.replace(/\n/g, '\n  ')}
  const {macros: macro1} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
  }
})((function() {
  // file: _global_/macros.js
  ${global.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})())`
          }
        }
        resp.body = 
`// [Ctrl]+[Shift] => Hide/Show Buttons
if (window._ws_connect===undefined) {
  window._ws_connect = {}
};\n
window.mitm.fn.autoclick = ${autoclick + ''};\n
window.mitm.fn.hotKeys = ${hotKeys + ''};\n
window.mitm._macros_ = () => {
  window.mitm.macrokeys = {};
};\n
window._ws_connect.macrosOnMount = data => {
  console.log('macros code executed after ws open', data)
};\n
${body};\n`
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/ws-client.js': {
      response: resp => {
        resp.body = global.mitm.fn._wsclient()
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/jslib/([\\w-]+.js)': {
      response: (resp, reqs, match) => {
        const path = `${global.__app}/plugins/js-lib/${match.arr[1]}`
        if (fs.existsSync(path)) {
          resp.body = fs.readFileSync(path)
          resp.headers['content-type'] = 'application/javascript'
        }
      }
    }
  }
  const mockr = {
    '!:hidden:/mitm-play/mitm.js': new RegExp('\\/mitm-play\\/mitm\\.js'),
    '!:hidden:/mitm-play/chance.js': new RegExp('\\/mitm-play\\/chance\\.js'),
    '!:hidden:/mitm-play/macros.js': new RegExp('\\/mitm-play\\/macros\\.js'),
    '!:hidden:/mitm-play/ws-client.js': new RegExp('\\/mitm-play\\/ws-client\\.js')
  }
  global.mitm.__mockr = mockr
  global.mitm.__mocks = mock // feat: __mocks
  global.mitm.source = {}
  global.mitm.routes = {
    _global_: {
      mock,
      config: {
        logs: {},
        args: {}
      }
    }
  }

  global.mitm.router = {
    _global_: {
      _namespace_: /_global_/,
      mock: mockr,
      config: {
        logs: {},
        args: {}
      }
    }
  }
  global.mitm.__tag2 = {}
  global.mitm.__tag3 = {}
  global.mitm.__tag4 = {}
}
