const c = require('ansi-colors')
const _match = require('./match')
const { ctype } = require('./content-type')

const { matched, searchFN } = _match

const allRequest = async function (reqs, responseHandler, _3d) {
  const search = searchFN('response', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag } } = global.mitm
  let resp, msg

  if (match && !_skipByTag(match, 'response')) {
    const { response, contentType, hidden } = match.route
    if (__flag.response && !match.hidden && !hidden) {
      msg = c.cyanBright(match.log)
      __args.fullog && console.log(msg) // feat: fullog
    }
    responseHandler.push(resp => {
      if (response) {
        if (contentType === undefined || ctype(match, resp)) {
          const resp2 = response(resp, reqs, match)
          resp2 && (resp = {
            ...resp,
            ...resp2
          })
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
