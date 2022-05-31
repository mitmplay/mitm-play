const {mitm} = global
const {fs}   = mitm.lib

const contentType = {
  css: 'text/css',
  js: 'application/javascript',
}
contentType['js.map'] = 'application/json'

function mockClient(resp, path, ex) {
  resp.body = fs.readFileSync(`${path}.${ex}`)
  resp.headers['content-type'] = contentType[ex]
}

function mockMacros(resp, reqs, ex) {
  const {__page, argv, fn: {_tldomain, _nameSpace}} = mitm
  const namespace = _nameSpace(_tldomain(resp.url))
  let path = ''
  let path2 = ''
  if (namespace) {
    const refURL = new URL(reqs.headers.referer)
    const macro = refURL.searchParams.get('mitm')
    const [app, domain] = namespace.split('@')
    const pgid = reqs.headers["xplay-page"]
    const page = __page[pgid]

    if (macro) {
      path = `${argv.route}/${domain||app}/_bundle_/${macro}@macros`
      page.macro = macro
    } else if (page.macro) {
      path = `${argv.route}/${domain||app}/_bundle_/${page.macro}@macros`
    } else if (namespace.match('@')) {
      path = `${argv.route}/${domain}/_bundle_/${app}@macros`
    } else {
      path = `${argv.route}/${app}/_bundle_/macros`
    }
  }
  if (path) {
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
  const {app}  = mitm.path
  const a11y   = `${app}/a11y/axe-run` //# a11y
  const client = `${app}/ws-client/ws-client`
  const mock = {
    '!:hidden:/mitm-play/mitm.js': {
      response: (resp, reqs) => {
        resp.body = mitm.fn._wsmitm(resp, reqs)
        resp.headers['content-type'] = 'application/javascript'
      }
    },
    '!:hidden:/mitm-play/play.json': {
      response: async (resp, reqs) => {
        const data = JSON.parse(reqs.body)
        const result = await mitm.wscmd.$autofill({data})
        resp.headers['content-type'] = 'application/json'
        resp.body = JSON.stringify(result)
      }
    },
    '!:hidden:/mitm-play/screnshot.json': {
      response: (resp, reqs) => {
        const data = JSON.parse(reqs.body)
        const result = mitm.wscmd.$screenshot({data})
        resp.headers['content-type'] = 'application/json'
        resp.body = JSON.stringify(result)
      }
    },
    '!:hidden:/mitm-play/macros.js':       { response: (resp, reqs) => mockMacros(resp, reqs, 'js')  },
    '!:hidden:/mitm-play/macros.css':      { response: (resp, reqs) => mockMacros(resp, reqs, 'css') },
    '!:hidden:/mitm-play/axe-run.js$':     { response: resp => mockClient(resp,   a11y, 'js'     )},
    '!:hidden:/mitm-play/axe-run.css$':    { response: resp => mockClient(resp,   a11y, 'css'    )},
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
  mitm.__mocks = mock // feat: __mocks

  mitm.routes = {
    _global_: {
      config: {
        args: {},
        logs: {},
      },
      mock
    }
  }

  mitm.router = {
    _global_: {
      config: {
        args: {},
        logs: {},
      },
      _namespace_: /_global_/
    }
  }
}
