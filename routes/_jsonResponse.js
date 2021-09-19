const c = require('ansi-colors')
const _match = require('./match')
const changeStatus = require('./change-status')
const { logmsg } = global.mitm.fn
const { matched, searchFN } = _match

const jsonResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('json', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm

  if (match) {
    const { response, hidden } = match.route
    const que = async resp => {
      let msg
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('application/json')) {
        if (typeof (match.route) === 'string') {
          resp.body = match.route
        } else {
          if (response) {
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
        }
        if (!__flag.json || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.yellowBright(match.log)
          __args.fullog && logmsg(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'json'} : undefined // feat: fullog
      return resp
    }
    que._rule = 'json'
    responseHandler.push(que)
  }
  return { match }
}

module.exports = jsonResponse
