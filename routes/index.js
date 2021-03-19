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
const wBlob = /^blob:http/
const wNull = /\/null$/
const response = {
  status: 200,
  headers: {},
  body: ''
}

module.exports = async ({ route, request, browserName }) => {
  const {
    __flag,
    argv: {
      proxy,
      verbose,
      nosocket,
    },
  } = global.mitm
  let reqs = await extract({ route, request, browserName })

  // catch unknown url scheme & handle by browser
  const { url } = reqs
  if (url.match(noURL) || url.match(wNull)) {
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

  const rqs2 = await _chngRequest(reqs, _3ds)
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
  const {match: _m} = _html
  if (!(_m && _m.route.ws) && !nosocket) {
    // --inject websocket client to html
    await _addWebSocket(reqs, responseHandler, _3ds)
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
      if (!rqs2 && __flag) {
        const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'
        if (_3ds) {
          if (__flag['no-namespace']) {
            console.log(c.redBright(`${browser[browserName]} no-namespace (${origin}${msg})`))
          }
        } else {
          if (__flag['referer-reqs']) {
            console.log(c.redBright.italic(`${browser[browserName]} referer-reqs (${origin}${msg})`))
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

async function Events (responseHandler, resp, reqs, route) {
  const { __args } = global.mitm
  let msg
  let count = 0
  const mtyp = []
  if (!__args.fullog && resp.log) { // feat: fullog
    msg = resp.log.msg
    count = 1
  }
  for (const fn of responseHandler) {
    const rsp2 = await fn(resp, reqs)
    if (rsp2) {
      if (!__args.fullog && rsp2.log) { // feat: fullog
        if (count===0) {
          msg = rsp2.log.msg
        } else {
          mtyp.push(rsp2.log.mtyp)
        }
        count ++
      }
      if (rsp2 === undefined) {
        break
      }
      resp = rsp2
    }
  }
  if (msg && !__args.fullog) { // feat: fullog
    if (mtyp.length) {
      msg += `[${mtyp.join(',')}]`
    }
    console.log(msg)  
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