const c = require('ansi-colors')
const _match = require('./match')
const { ctype } = require('./content-type')

const { matched, searchFN } = _match

const allRequest = async function (reqs, responseHandler, _3d) {
  const search = searchFN('response', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __flag, fn: { _skipByTag } } = global.mitm

  if (match && !_skipByTag(match, 'response')) {
    const { response, contentType, hidden } = match.route
    if (__flag.response && !match.hidden && !hidden) {
      console.log(c.cyanBright(match.log))
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
      return resp
    })
  }
}

module.exports = allRequest
