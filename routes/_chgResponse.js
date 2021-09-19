const c = require('ansi-colors')
const _match = require('./match')
const { ctype } = require('./content-type')
const changeStatus = require('./change-status')

const { logmsg } = global.mitm.fn
const { matched, searchFN } = _match

const allRequest = async function (reqs, responseHandler, _3d) {
  const search = searchFN('response', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm

  if (match) {
    const { response, contentType, hidden } = match.route
    const que = async resp => {
      let msg
      changeStatus(match, resp)
      if (response) {
        if (contentType === undefined || ctype(match, resp)) {
          let resp2 = response(resp, reqs, match)
          if (resp2 instanceof Promise) {
            resp2 = await resp2
          }
          if (resp2) {
            resp = {...resp, ...resp2}
          } else if (resp2===false) {
            return
          }
        }
        if (!__flag.response || match.hidden || hidden) {
          msg = ''
        } else {
         msg = c.cyanBright(match.log)
          __args.fullog && logmsg(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'response'} : undefined // feat: fullog
      return resp
    }
    que._rule = 'response'
    responseHandler.push(que)
  }
  return { match }
}

module.exports = allRequest
