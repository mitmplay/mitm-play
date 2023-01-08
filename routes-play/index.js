const _3rdparties     = require('../routes/_3rdparties')
const _jsResponse     = require('../routes/_jsResponse')
const _chgRequest     = require('../routes/_chgRequest')
const _chgResponse    = require('../routes/_chgResponse')
const _cssResponse    = require('../routes/_cssResponse')
const _logResponse    = require('../routes/_logResponse')
const _jsonResponse   = require('../routes/_jsonResponse')
const _htmlResponse   = require('../routes/_htmlResponse')
const _proxyRequest   = require('../routes/_proxyRequest')
const _skipResponse   = require('../routes/_skipResponse')
const _mockResponse   = require('../routes/_mockResponse')
const _addWebSocket   = require('../routes/_addWebSocket')
const _cacheResponse  = require('../routes/_cacheResponse')
const { objToCookie } = require('../routes/filesave/cookier')
const { Events, routeCall } = require('./events')
const { extract, fetch    } = require('./fetch')

const {c} = global.mitm.lib

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const noURL = /^(puffin|brave|edge):\/\//
const brExt = /^chrome-\w+:\/\//
const wBlob = /^blob:http/
const wNull = /\/null$/
const response = {
  status: 200,
  headers: {},
  body: ''
}
const _route = {route:{}}
const nohttp = /https?:\/\//

module.exports = async ({ route, request, browserName }) => {
  const {
    __args,
    __flag,
    argv: {
      proxy,
      verbose,
    },
  } = global.mitm
  let reqs = await extract({ route, request, browserName })

  // catch unknown url scheme & handle by browser
  const { url } = reqs
  if (url.match(noURL) || url.match(wNull)) {
    routeCall(route, 'fulfill', response)
    return
  } else if (url.match(brExt)) {
    // fix: Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: chrome-extension
    route.continue(); // Needed by Chrome Plugins
    return
  } else if (url.match(wBlob)) {
    routeCall(route, 'continue')
    return
  }

  const _3ds = _3rdparties(reqs)
  const matchSkip = await _skipResponse(reqs, _3ds)
  if (matchSkip) {
    if (__flag.skip && !matchSkip.hidden) {
      console.log(c.grey(matchSkip.log))
    }
    routeCall(route, 'continue')
    return
  }

  const rqs2 = await _chgRequest(reqs, _3ds)
  if (rqs2) {
    reqs = { ...reqs, ...rqs2 }
    if (verbose) {
      const msg = JSON.stringify(reqs.headers)
      const log = msg.length <= 100 ? msg : msg.slice(0, 100) + '...'
      console.log(c.redBright(`>>> ${'request'.padEnd(8, ' ')} (${log})`))
    }
  }

  const responseHandler = []
  const mock = await _mockResponse({ reqs, route }, _3ds)
  if (mock) {
    const { match, resp } = mock
    if (match.route.log) {
      // remove match as no contentType 
      await _logResponse(reqs, responseHandler, _3ds)
    }
    await Events(responseHandler, resp, reqs, route)
    return // fulfill
  } else if (mock===false) {
    route.continue()
    return
  }

  // --resp can be undefined or local cached & can skip __flag (.nolog)
  const { match, resp } = await _cacheResponse(reqs, responseHandler, _3ds)
  // --order is important, no need second time inject ws in _addWebSocket
  const [_resp,_html] = await Promise.all([
    _chgResponse( reqs, responseHandler, _3ds),
    _htmlResponse(reqs, responseHandler, _3ds),
    _jsonResponse(reqs, responseHandler, _3ds),
    _cssResponse( reqs, responseHandler, _3ds),
    _jsResponse(  reqs, responseHandler, _3ds),
    _logResponse( reqs, responseHandler, _3ds, match)
  ])
  const {match: _m1=_route} = _html
  const {match: _m2=_route} = _resp
  if (
    _m1.route.ws===undefined && 
    _m2.route.ws===undefined) {
    // --inject websocket client to html
    if ([undefined, 'off'].includes(__args.nosocket)) {
      await _addWebSocket(reqs, responseHandler, _3ds)
    }
  }

  if (resp) {
    await Events(responseHandler, resp, reqs, route)
  } else {
    if (responseHandler.length) { // fetch from remote server
      if (proxy && await _proxyRequest(reqs, _3ds)) {
        reqs.proxy = proxy
      }
      fetch(route, browserName, reqs, async function (resp) {
        await Events(responseHandler, resp, reqs, route)
      })
    } else { // not handle
      const { origin, pathname } = new URL(url)
      const host = origin.replace(nohttp,'')
      if (!rqs2 && __flag) {
        let msg = `${host}${pathname}`
        if (msg.length > 95) {
          msg = `${msg.slice(0, 95)}...`
        }
        msg = `${c.red('(')}${c.grey(msg)}${c.red(')')}`
        if (_3ds) {
          if (__flag['no-namespace']) {
            console.log(c.redBright(`${browser[browserName]} no-namespace ${msg}`))
          }
        } else {
          if (__flag['referer-reqs']) {
            console.log(c.redBright.italic(`${browser[browserName]} referer-reqs ${msg}`))
          }
        }
      }
      const { headers, method, body: postData } = reqs
      if (typeof headers.cookie !== 'string') {
        objToCookie(headers) // feat: cookie autoconvert
      }  
      routeCall(route, 'continue', { headers, method, postData })
    }
  }
}
