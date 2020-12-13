/* eslint-disable camelcase */
const c = require('ansi-colors')
const _match = require('./match')
const { injectWS } = require('./inject')
const setSession = require('./set-session')
const { matched, searchKey, searchArr } = _match

const addWebSocket = async function (reqs, responseHandler, _3d) {
  const { __flag, fn: { _nameSpace } } = global.mitm
  const { url, headers, browserName } = reqs
  const accpt = headers.accept + ''
  const { origin, referer } = headers
  if (origin || referer) {
    return
  }
  if (accpt === '*/*' || accpt.indexOf('text/html') > -1) {
    const search = searchArr({ typ: 'nosocket', url, browserName })
    const match = _3d ? search('_global_') : matched(search, reqs)
    setSession(reqs, true)
    if (match) {
      if (__flag.nosocket && !match.hidden) {
        const { origin, pathname } = new URL(url)
        console.log(c.redBright(`>>> nosocket (${origin}${pathname})`))
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
        return resp
      })
    }
  }
}

module.exports = addWebSocket
