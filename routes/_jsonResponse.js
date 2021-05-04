const c = require('ansi-colors')
const _match = require('./match')
const changeStatus = require('./change-status')

const { matched, searchFN } = _match

const jsonResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('json', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm
  let resp, msg

  if (match) {
    const { response, hidden } = match.route
    responseHandler.push(resp => {
      changeStatus(match, resp)
      const contentType = `${resp.headers['content-type']}`
      if (contentType && contentType.match('application/json')) {
        if (typeof (match.route) === 'string') {
          resp.body = match.route
        } else {
          if (response) {
            const resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        }
        if (!__flag.json || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.yellowBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
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
