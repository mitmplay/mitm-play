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
  const { __args, __flag } = global.mitm
  let resp, msg

  if (match) {
    const { log, response, hidden } = match.route
    const stamp = (new Date()).toISOString().replace(/[:-]/g, '')
    responseHandler.push(async (resp, reqs) => {
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
        if (log) {
          // complete r/resp json log
          fpath1 = `${fpath1}.json`
        } else {
          fpath1 = `${fpath1}.${ext(resp)}`
        }
        let resp2
        if (response) {
          resp2 = response(resp, reqs, match)
          if (typeof resp2 === 'object' && 'then' in resp2) {
            resp2 = await resp2
          }
        }
        if (resp2===false) {
          return 
        } else if (resp2) {
          resp = {...resp, ...resp2}
        }
        const meta = metaResp({ reqs, resp })
        const body = jsonResp({ reqs, resp, match })
        filesave({ fpath1, body }, { fpath2, meta }, 'log')
        if (!__flag.log || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.bold.blueBright(match.log)
          __args.fullog && console.log(msg) // feat: fullog
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
