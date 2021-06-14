/* eslint-disable camelcase */
const c = require('ansi-colors')
const _match = require('./match')
const { injectWS } = require('./inject')
const setSession = require('./set-session')
const { matched, searchKey, searchArr } = _match
const noWS = /(css|script|image)/

const addWebSocket = async function (reqs, responseHandler, _3d) {
  const { __args, __flag, fn: { _nameSpace } } = global.mitm
  const { url, pageUrl, headers, browserName,oriRef } = reqs
  const { origin, pathname } = new URL(url)
  const accpt = headers.accept + ''
  let resp, msg

  if (oriRef) {
    if (!url.match(oriRef)) {
      return
    } else if (!pageUrl.match(origin)) {
      return
    }
  }

  if (accpt.indexOf('text/html') > -1) {
    let search, match
    if (__args.nosocket===true) {
      msg = c.red(`>>> nosocket to all html`)
      console.log(msg) // feat: fullog
      return
    } else {
      search = searchArr({ typ: 'nosocket', url, browserName })
      match = _3d ? search('_global_') : matched(search, reqs)  
    }
    setSession(reqs, {session:true, msg: '_addWebSocket'}) // feat: session
    if (match) { // no adding web-socket
      if (!match.hidden) {
        msg = c.redBright(`>>> nosocket (${origin}${pathname})`)
        __args.fullog && console.log(msg) // feat: fullog
      }
    } else {
      responseHandler.push(resp => {
        if (!_nameSpace(url)) {
          return
        }
        const { headers: h, status } = resp
        const contentType = h['content-type']
        const redirect = (status + '').match(/^30\d/)
        if (!redirect && contentType && contentType.match('text/html')) {
          const jsLib = matched(searchKey('jsLib'), reqs)
          injectWS(resp, url, jsLib)
        }
        resp.log = msg ? {msg, mtyp: 'nosocket'} : undefined // feat: fullog
        return resp
      })
    }
  }
}

module.exports = addWebSocket
