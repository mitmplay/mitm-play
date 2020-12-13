const c = require('ansi-colors')
const _match = require('./match')
const addReplaceBody = require('./add-replace-body')
const { matched, searchFN } = _match

const jsResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('js', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __flag, fn: { _skipByTag } } = global.mitm

  if (match && !_skipByTag(match, 'js')) {
    const { response, hidden } = match.route
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('javascript')) {
        if (__flag.js && !match.hidden && !hidden) {
          console.log(c.cyanBright(match.log))
        }
        if (typeof (match.route) === 'string') {
          resp.body = addReplaceBody(resp.body, match)
        } else {
          if (response) {
            const resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        }
      }
      return resp
    })
  }
}

module.exports = jsResponse
