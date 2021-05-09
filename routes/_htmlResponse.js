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
  const { __args, __flag } = global.mitm
  let resp, msg

  if (match) {
    responseHandler.push(async resp => {
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('text/html')) {
        const { el, js, src, ws, response, hidden} = match.route
        msg = c.yellowBright(match.log)
        // feat: activity
        if (__args.activity) {
          if (!match.route.tags) {
            msg += c.red(' activity but no tags!')
          } else {
            const [actyp, actag] = __args.activity.split(':')
            if (actag && match.route.tags.match(`(^| )${actag}( |$)`)) {
              global.mitm.activity = {} // init rec/play sequences
              const color = {rec: 'red', mix: 'magenta'}[actyp] || 'blueBright'
              msg +=  c[color]( `[${actyp}:${actag}]`)
            }
          }
        }
        if (typeof (match.route) === 'string') {
          resp.body = match.route
        } else {
          if (js) {
            const inject = _inject[el] || e_head
            resp.body = inject(resp.body, js)
          }
          if (src) {
            resp.body = script_src(resp.body, src)
          }
          if (response) {
            let resp2 = response(resp, reqs, match)
            if (typeof resp2 === 'object' && 'then' in resp2) {
              resp2 = await resp2
            }
            resp2 && (resp = {
              ...resp,
              ...resp2
            })
          }
          if (ws) {
            setSession(reqs, true) // feat: session
            const jsLib = matched(searchKey('jsLib'), reqs)
            injectWS(resp, reqs.url, jsLib)
          }
        }
        if (!__flag.html || match.hidden || hidden) {
          msg = ''
        } else {
          const len = match.log.length
          msg = `${'-'.repeat(len)}\n${msg}`
          __args.fullog && console.log(msg) // feat: fullog
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
