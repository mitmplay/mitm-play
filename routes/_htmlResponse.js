/* eslint-disable camelcase */
const c = require('ansi-colors')
const _match = require('./match')
const _inject = require('./inject')

const { matched, searchFN, searchKey } = _match
const { script_src, e_head, injectWS } = _inject

const htmlResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('html', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __flag, fn: { _skipByTag } } = global.mitm

  if (match && !_skipByTag(match, 'html')) {
    const { argv } = global.mitm
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('text/html')) {
        const len = match.log.length
        // feat: activity
        if (argv.activity) {
          const [actyp, actag] = argv.activity.split(':')
          if (actag && match.route.tags.match(`(^| )${actag}( |$)`)) {
            global.mitm.activity = {} // init rec/play sequences
          }
        }
        if (__flag.html && !match.hidden && !match.route.hidden) {
          console.log(`${'-'.repeat(len)}\n${c.yellowBright(match.log)}`)
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
            const jsLib = matched(searchKey('jsLib'), reqs)
            injectWS(resp, reqs.url, jsLib)
          }
        }
      }
      return resp
    })
    return match
  }
}

module.exports = htmlResponse
