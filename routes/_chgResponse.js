const c = require('ansi-colors')
const _match = require('./match')
const { ctype } = require('./content-type')
const changeStatus = require('./change-status')

const { matched, searchFN } = _match

const allRequest = async function (reqs, responseHandler, _3d) {
  const search = searchFN('response', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag } } = global.mitm
  let resp, msg

  if (match && !_skipByTag(match, 'response')) {
    const { response, contentType, hidden } = match.route
    responseHandler.push(async resp => {
      changeStatus(match, resp)
      if (response) {
        if (contentType === undefined || ctype(match, resp)) {
          let resp2 = response(resp, reqs, match)
          if (typeof resp2 === 'object' && 'then' in resp2) {
            resp2 = await resp2
          }
          resp2 && (resp = {
            ...resp,
            ...resp2
          })
        }
        if (!__flag.response || match.hidden || hidden) {
          msg = ''
        } else {
         msg = c.cyanBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'response'} : undefined // feat: fullog
      return resp
    })
    resp = undefined
  }
  return { match, resp }
}

module.exports = allRequest
