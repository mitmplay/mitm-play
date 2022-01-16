const {fs} = global.mitm.lib

const contentType = {
  css: 'text/css',
  js: 'application/javascript',
}
contentType['js.map'] = 'application/json'

function mockClient(resp, path, ex) {
  resp.body = fs.readFileSync(`${path}.${ex}`)
  resp.headers['content-type'] = contentType[ex]
}

function mockMacros(resp, ex) {
  const { argv, fn: { _tldomain, _nameSpace } } = global.mitm
  const namespace = _nameSpace(_tldomain(resp.url))
  let path = ''
  let path2 = ''
  if (namespace) {
    const [app, domain] = namespace.split('@')
    if (namespace.match('@')) {
      path = `${argv.route}/${domain}/_bundle_/${app}@macros`
    } else {
      path = `${argv.route}/${app}/_bundle_/macros`
    }
    path2 = `${path}.${ex}`
    if (fs.existsSync(path2)) {
      mockClient(resp, path, ex)
    } else {
      path = `${argv.route}/_global_/_bundle_/macros`
      path2 = `${path}.${ex}`
      if (fs.existsSync(path2)) {
        mockClient(resp, path, ex)
      }
    }
  }
}

module.exports = () => {
  const {app} = global.mitm.path
  const client = `${app}/ws-client/ws-client`
  const mock = {
    '!:hidden:/mitm-play/mitm.js': {
      response: (resp, reqs) => {
        resp.body = global.mitm.fn._wsmitm(resp, reqs)
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/play.json': {
      response: async (resp, reqs) => {
        const data = JSON.parse(reqs.body)
        const result = await global.mitm.wscmd.$autofill({data})
        resp.headers['content-type'] = 'application/json'
        resp.body = JSON.stringify(result)
      }
    },
    '!:hidden:/mitm-play/screnshot.json': {
      response: (resp, reqs) => {
        const data = JSON.parse(reqs.body)
        const result = global.mitm.wscmd.$screenshot({data})
        resp.headers['content-type'] = 'application/json'
        resp.body = JSON.stringify(result)
      }
    },
    '!:hidden:/mitm-play/macros.js':       { response: resp => mockMacros(resp, 'js')  },
    '!:hidden:/mitm-play/macros.css':      { response: resp => mockMacros(resp, 'css') },
    '!:hidden:/mitm-play/ws-client.js$':   { response: resp => mockClient(resp, client, 'js'     )},
    '!:hidden:/mitm-play/ws-client.css$':  { response: resp => mockClient(resp, client, 'css'    )},
    '!:hidden:/mitm-play/ws-client.js.map':{ response: resp => mockClient(resp, client, 'js.map' )},
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
    '!:hidden:/mitm-play/mitm.js':      /\/mitm-play\/mitm\.js/,
    '!:hidden:/mitm-play/chance.js':    /\/mitm-play\/chance\.js/,
    '!:hidden:/mitm-play/macros.js':    /\/mitm-play\/macros\.js/,
    '!:hidden:/mitm-play/ws-client.js': /\/mitm-play\/ws-client\.js/,
  }
  global.mitm.__mockr = mockr
  global.mitm.__mocks = mock // feat: __mocks
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
}
