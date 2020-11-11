const c = require('ansi-colors')
const { extract, fetch } = require('./fetch')
const _3rdparties = require('./_3rdparties')
const _jsResponse = require('./_jsResponse')
const _chngRequest = require('./_chngRequest')
const _cssResponse = require('./_cssResponse')
const _logResponse = require('./_logResponse')
const _jsonResponse = require('./_jsonResponse')
const _htmlResponse = require('./_htmlResponse')
const _chgResponse = require('./_chgResponse')
const _proxyRequest = require('./_proxyRequest')
const _skipResponse = require('./_skipResponse')
const _mockResponse = require('./_mockResponse')
const _addWebSocket = require('./_addWebSocket')
const _cacheResponse = require('./_cacheResponse')

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const noURL = /(brave|edge|chrome-extension):\/\//
const wNull = /\/null$/
const _resp = {
  status: 200,
  headers: {},
  body: ''
}

module.exports = async ({ route, request, browserName }) => {
  const { browsers, router, argv: { nosocket, proxy, verbose } } = global.mitm
  let reqs = extract({ route, request, browserName })
  const { logs } = router._global_.config

  const _page = reqs.headers['xplay-page']
  if (_page) {
    reqs.page = await browsers[browserName].currentTab(_page)
  }

  // catch unknown url scheme & handle by browser
  if (reqs.url.match(noURL) || reqs.url.match(wNull)) {
    routeCall(route, 'fulfill', _resp)
    return
  } else if (reqs.url.match(/blob:http/)) {
    routeCall(route, 'continue')
    return
  }

  const _3ds = _3rdparties(reqs)
  const matchSkip = await _skipResponse(reqs, _3ds)
  const { origin, pathname } = new URL(reqs.url)
  if (matchSkip) {
    if (logs.skip && !matchSkip.hidden) {
      console.log(c.grey(matchSkip.log))
    }
    routeCall(route, 'continue')
    return
  }

  const rqs2 = await _chngRequest(reqs, _3ds)
  if (rqs2) {
    reqs = { ...reqs, ...rqs2 }
    if (verbose) {
      const msg = JSON.stringify(reqs.headers)
      const log = msg.length <= 100 ? msg : msg.slice(0, 100) + '...'
      console.log(c.redBright(`>>> request (${log})`))
    }
  }

  if (await _mockResponse({ reqs, route }, _3ds)) {
    return
  }

  const responseHandler = []
  // --resp can be undefined or local cached & can skip logs (.nolog)
  const { match, resp } = await _cacheResponse(reqs, responseHandler, _3ds)

  // --order is important, log must not contain the body modification
  await _logResponse(reqs, responseHandler, _3ds, match)

  // --order is important, no need second time inject ws in _addWebSocket
  const matchHtml = await _htmlResponse(reqs, responseHandler, _3ds)

  await _jsonResponse(reqs, responseHandler, _3ds)
  await _cssResponse(reqs, responseHandler, _3ds)
  await _jsResponse(reqs, responseHandler, _3ds)
  await _chgResponse(reqs, responseHandler, _3ds)

  if (!(matchHtml && matchHtml.route.ws) && !nosocket) {
    // --inject websocket client to html
    await _addWebSocket(reqs, responseHandler, _3ds)
  }

  if (resp) {
    Events(responseHandler, resp, reqs, route)
  } else {
    if (responseHandler.length) { // fetch from remote server
      fetch(route, browserName, reqs, function (resp) {
        Events(responseHandler, resp, reqs, route)
      })
    } else { // not handle
      if (proxy && await _proxyRequest(reqs, _3ds)) {
        reqs.proxy = proxy
      }

      if (!rqs2 && logs) {
        const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'
        if (_3ds) {
          if (logs['no-namespace']) {
            console.log(c.redBright(`${browser[browserName]} no-namespace (${origin}${msg})`))
          }
        } else {
          if (logs['referer-reqs']) {
            console.log(c.redBright.italic(`${browser[browserName]} referer-reqs (${origin}${msg})`))
          }
        }
      }
      const { headers, method, body: postData } = reqs
      routeCall(route, 'continue', { headers, method, postData })
    }
  }
}

function Events (responseHandler, resp, reqs, route) {
  for (const fn of responseHandler) {
    const resp2 = fn(resp, reqs)
    if (resp2 === undefined) {
      break
    }
    resp = resp2
  }
  routeCall(route, 'fulfill', resp)
}

function routeCall(route, cmd, params) {
  const { headers } = params || {}
  if (headers) {
    delete headers['xplay-page']
    delete headers['xplay-session']  
  }
  route[cmd](params)
}