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
        let global = ''; let body = ''
        const namespace = _nameSpace(_tldomain(resp.url))
        if (namespace) {
          const path = `${argv.route}/${namespace}/macros.js`
          if (fs.existsSync(path)) {
            body = fs.readFileSync(path)
          }
        }
        const path = `${argv.route}/_global_/macros.js`
        if (fs.existsSync(path)) {
          global = (fs.readFileSync(path) + '').replace(/\n/, '\n  ')
        }
        resp.body = 
`if (window._ws_connect===undefined) {
  window._ws_connect = {}
}\n
window.mitm.fn.autoclick = ${autoclick + ''};\n
window.mitm.fn.hotKeys = ${hotKeys + ''};\n
window.mitm._macros_ = () => {
  window.mitm.macrokeys = {};
  ${global}
};\n
window._ws_connect.macrosOnMount = data =>
console.log('macros code executed after ws open', data)
${body}`
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
