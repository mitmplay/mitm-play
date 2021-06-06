const c = require('ansi-colors')
const _3rdparties = require('../routes/_3rdparties')
const _jsResponse = require('../routes/_jsResponse')
const _chngRequest = require('../routes/_chngRequest')
const _cssResponse = require('../routes/_cssResponse')
const _logResponse = require('../routes/_logResponse')
const _jsonResponse = require('../routes/_jsonResponse')
const _htmlResponse = require('../routes/_htmlResponse')
const _chgResponse = require('../routes/_chgResponse')
const _proxyRequest = require('../routes/_proxyRequest')
const _skipResponse = require('../routes/_skipResponse')
const _mockResponse = require('../routes/_mockResponse')
const _addWebSocket = require('../routes/_addWebSocket')
const _cacheResponse = require('../routes/_cacheResponse')
const Events = require('./events')

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const noURL = /^(brave|edge):\/\//
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

module.exports = async (page, client, reqEvent) => {
  const {
    fn,
    __flag,
    argv: {
      proxy,
      verbose,
      nosocket,
    },
  } = global.mitm

  const {
    requestId,
    responseStatusCode,
    responseHeaders= [],
    request: {
      url, 
      method, 
      postData,
      headers: requestHeaders
    }
  } = reqEvent

  // catch unknown url scheme & handle by browser
  if (url.match(noURL) || url.match(wNull)) {
    return {response, fulfill: true}
  } else if (url.match(brExt)) {
    return
  } else if (url.match(wBlob)) {
    return
  }

  const { origin, referer } = requestHeaders
  const oriRef = fn._tldomain(origin||referer)

  const pageUrl = page.url()
  const reqs = {
    requestId,
    method,
    body: postData,
    browserName: 'chromium',
    headers: requestHeaders,
    pageUrl,
    oriRef,
    page,
    url
  }
  const _3ds = _3rdparties(reqs)
  const matchSkip = await _skipResponse(reqs, _3ds)
  if (matchSkip) {
    if (__flag.skip && !matchSkip.hidden) {
      console.log(c.grey(matchSkip.log))
    }
    return
  }

  const rqs2 = await _chngRequest(reqs, _3ds)
  if (rqs2) {
    reqs = { ...reqs, ...rqs2 }
    if (verbose) {
      const msg = JSON.stringify(reqs.headers)
      const log = msg.length <= 100 ? msg : msg.slice(0, 100) + '...'
      console.log(c.redBright(`>>> ${'request'.padEnd(8, ' ')} (${log})`))
    }
  }

  const route = {
    continue: async function() {
      await client.send('Fetch.continueRequest', { requestId })
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
    const response = await Events(responseHandler, resp, reqs)
    return {response, fulfill: true} // fulfill
  } else if (mock===false) {
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
  if (!(_m1.route.ws) && !(_m2.route.ws) && !nosocket) {
    // --inject websocket client to html
    await _addWebSocket(reqs, responseHandler, _3ds)
  }

  if (resp) {
    const response = await Events(responseHandler, resp, reqs)
    return {response, fulfill: true} // fulfill
  } else {
    return {request: reqs, rqs2, responseHandler, _3ds} // not fulfill
  }
}

