/* eslint-disable camelcase */
const c = require('ansi-colors')
const _match = require('./match')
const _inject = require('./inject')
const setSession = require('./set-session')
const changeStatus = require('./change-status')

const { matched, searchFN, searchKey } = _match
const { script_src, e_head, injectWS } = _inject

const htmlResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('html', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag } } = global.mitm
  let resp, msg

  if (match && !_skipByTag(match, 'html')) {
    responseHandler.push(resp => {
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('text/html')) {
        msg = c.yellowBright(match.log)
        const len = match.log.length
        // feat: activity
        if (__args.activity) {
          const [actyp, actag] = __args.activity.split(':')
          if (actag && match.route.tags.match(`(^| )${actag}( |$)`)) {
            global.mitm.activity = {} // init rec/play sequences
            const color = {rec: 'red', mix: 'magenta'}[actyp] || 'blueBright'
            msg +=  c[color]( `[${actyp}:${actag}]`)
          }
        }
        if (__flag.html && !match.hidden && !match.route.hidden) {
          console.log(`${'-'.repeat(len)}`)
          __args.fullog && console.log(msg) // feat: fullog
        }
        if (typeof (match.route) === 'string') {
          resp.body = match.route
        } else {
          const { el, js, src, response, ws } = match.route
          if (js) {
            const inject = _inject[el] || e_head
            resp.body = inject(resp.body, js)
          }
          if (src) {
            resp.body = script_src(resp.body, src)
          }
          if (response) {
            const resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
          if (ws) {
            setSession(reqs, true) // feat: session
            const jsLib = matched(searchKey('jsLib'), reqs)
            injectWS(resp, reqs.url, jsLib)
          }
        }
      }
      resp.log = msg ? {msg, mtyp: 'html'} : undefined // feat: fullog
      return resp
    })
    resp = undefined
  }
  return { match, resp }
}

module.exports = htmlResponse
