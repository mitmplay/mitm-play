const _match = require('./match')
const jformat = require('./jformat')
const ext = require('./filepath/ext')
const { ctype } = require('./content-type')
const changeStatus = require('./change-status')
const filesave = require('./filesave/filesave')
const metaResp = require('./filesave/meta-resp')
const jsonResp = require('./filesave/json-resp')
const fpathflat = require('./filepath/fpath-flat')

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

const { matched, searchFN } = _match

const logResponse = async function (reqs, responseHandler, _3d, cache) {
  const search = searchFN('log', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: {sqlIns} } = global.mitm

  if (match) {
    const { db, log, response, hidden } = match.route
    const stamp = (new Date()).toISOString().replace(/[:-]/g, '')
    const que = async (resp, reqs) => {
      let msg
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
          if (resp2 instanceof Promise) {
            resp2 = await resp2
          }
        }
        if (resp2) {
          resp = {...resp, ...resp2}
        } else if (resp2===false) {
          return 
        }
        const meta = metaResp({ reqs, resp })
        let body = jformat(jsonResp({ reqs, resp, match }), resp, __args)
        if (db) {
          let css = __args.session
          const rec = {
            namespace: match.namespace,
            session:   css ? resp.headers[css] || null : reqs.headers['xplay-session'],
            route:     match.key,
            status:   `${resp.status} ${reqs.method.toLowerCase()}`,
            url:       reqs.url,
            meta:      JSON.stringify(meta, null, 2),
            data:      body,
          }
          sqlIns(rec, 'log')
        }
        filesave({ fpath1, body }, { fpath2, meta }, 'log')
        if (!__flag.log || match.hidden || hidden) {
          msg = ''
        } else {
          msg = c.bold.blueBright(match.log)
          __args.fullog && logmsg(msg) // feat: fullog
        }
      }
      resp.log = msg ? {msg, mtyp: 'log'} : undefined // feat: fullog
      return resp // back to events loop call in fetch
    }
    que._rule = 'log'
    responseHandler.push(que)
  }
  return { match }
}

module.exports = logResponse
