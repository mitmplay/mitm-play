const fs = require('fs-extra')
const rpath = require.resolve('../ws-client/ws-client.js.map')

let wsclientJsMap = fs.readFileSync(rpath)

module.exports = () => {
  const { argv, fn: { _tldomain, _nameSpace } } = global.mitm

  const mock = {
    '!:hidden:/mitm-play/mitm.js': {
      response: resp => {
        resp.body = global.mitm.fn._wsmitm(resp)
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/play.json': {
      response: async (resp, reqs, match) => {
        const data = JSON.parse(reqs.body)
        const result = await global.mitm.wscmd.$autofill({data})
        resp.body = result
        resp.headers['content-type'] = 'application/json'
      }
    },
    '!:hidden:/mitm-play/macros.js': {
      response: resp => {
        let body = ''
        const namespace = _nameSpace(_tldomain(resp.url))
        if (namespace) {
          const [app, domain] = namespace.split('@')
          if (namespace.match('@')) {
            path = `${argv.route}/${domain}/_bundle_/${app}@macros.js`
          } else {
            path = `${argv.route}/${app}/_bundle_/macros.js`
          }
          if (fs.existsSync(path)) {
            body = `${fs.readFileSync(path)}`
          } else {
            path = `${argv.route}/_global_/_bundle_/macros.js`
            if (fs.existsSync(path)) {
              body = `${fs.readFileSync(path)}`
            }
          }
        }
        resp.body = body
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/ws-client.js$': {
      response: resp => {
        resp.body = global.mitm.fn._wsclient()
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/ws-client.js.map': {
      response: resp => {
        resp.body = wsclientJsMap
        resp.headers['content-type'] = 'application/json'
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
