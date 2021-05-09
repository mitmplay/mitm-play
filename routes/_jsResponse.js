const c = require('ansi-colors')
const _match = require('./match')
const changeStatus = require('./change-status')
const addReplaceBody = require('./add-replace-body')
const { matched, searchFN } = _match

const jsResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('js', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm
  let resp, msg

  if (match) {
    const { response, hidden } = match.route
    responseHandler.push(async resp => {
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('javascript')) {
        if (typeof (match.route) === 'string') {
          resp.body = addReplaceBody(resp.body, match)
        } else {
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
        }
        if (!__flag.js || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.cyanBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'js'} : undefined // feat: fullog
      return resp
    })
    resp = undefined
  }
  return { match, resp }
}

module.exports = jsResponse
