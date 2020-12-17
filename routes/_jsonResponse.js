const c = require('ansi-colors')
const _match = require('./match')
const { matched, searchFN } = _match

const jsonResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('json', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag } } = global.mitm
  let resp, msg

  if (match && !_skipByTag(match, 'json')) {
    const { response, hidden } = match.route
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('application/json')) {
        if (__flag.json && !match.hidden && !hidden) {
          msg = c.yellowBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
        }
        if (typeof (match.route) === 'string') {
          resp.body = match.route
        } else {
          if (response) {
            const resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        }
      }
      resp.log = msg ? {msg, mtyp: 'json'} : undefined // feat: fullog
      return resp
    })
    resp = undefined
  }
  return { match, resp }
}

module.exports = jsonResponse
