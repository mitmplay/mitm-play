const _match = require('./match')
const changeStatus = require('./change-status')
const addReplaceBody = require('./add-replace-body')

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

const { matched, searchFN } = _match

const jsResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('js', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm

  if (match) {
    const { response, hidden } = match.route
    const que = async resp => {
      let msg
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('javascript')) {
        if (typeof (match.route) === 'string') {
          resp.body = addReplaceBody(resp.body, match)
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
        if (!__flag.js || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.cyanBright(match.log)
          __args.fullog && logmsg(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'js'} : undefined // feat: fullog
      return resp // back to events loop call in fetch
    }
    que._rule = 'js'
    responseHandler.push(que)
  }
  return { match }
}

module.exports = jsResponse
