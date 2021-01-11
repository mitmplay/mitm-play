const c = require('ansi-colors')
const _match = require('./match')
const ext = require('./filepath/ext')
const { ctype } = require('./content-type')
const changeStatus = require('./change-status')
const filesave = require('./filesave/filesave')
const metaResp = require('./filesave/meta-resp')
const jsonResp = require('./filesave/json-resp')
const fpathflat = require('./filepath/fpath-flat')

const { matched, searchFN } = _match

const logResponse = async function (reqs, responseHandler, _3d, cache) {
  const search = searchFN('log', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag } } = global.mitm
  let resp, msg

  if (match && !_skipByTag(match, 'log')) {
    const { log, response, hidden } = match.route
    const stamp = (new Date()).toISOString().replace(/[:-]/g, '')
    responseHandler.push((resp, reqs) => {
      changeStatus(match, resp)
      const mtype = ctype(match, resp)
      if (mtype) {
        if (cache) {
          const f = typ => mtype.match(typ)
          const arr = cache.route.contentType.filter(f)
          // applied if contentType is the same scope
          if (arr.length && !cache.route.log) {
            resp.log = undefined
            return resp
          }
        }
        let { fpath1, fpath2 } = fpathflat({ match, reqs, stamp })
        if (__flag.log && !match.hidden && !hidden) {
          msg = c.bold.blueBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
        }
        if (log) {
          // complete r/resp json log
          fpath1 = `${fpath1}.json`
        } else {
          fpath1 = `${fpath1}.${ext(resp)}`
        }
        const meta = metaResp({ reqs, resp })
        const body = jsonResp({ reqs, resp, match })
        filesave({ fpath1, body }, { fpath2, meta }, 'log')
        if (response) {
          const resp2 = response(resp, reqs, match)
          resp2 && (resp = { ...resp, ...resp2 })
        }
      }
      resp.log = msg ? {msg, mtyp: 'log'} : undefined // feat: fullog
      return resp
    })
    resp = undefined
  }
  return { match, resp }
}

module.exports = logResponse
