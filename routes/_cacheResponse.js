const fs = require('fs-extra')
const c = require('ansi-colors')
const _match = require('./match')
const _ext = require('./filepath/ext')
const { ctype } = require('./content-type')
const resetCookies = require('./reset-cookies')
const filesave = require('./filesave/filesave')
const metaResp = require('./filesave/meta-resp')
const fpathcache = require('./filepath/fpath-cache')

const { matched, searchFN } = _match

const cacheResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('cache', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { _skipByTag, tilde } } = global.mitm
  let resp, resp2, msg

  if (match && !_skipByTag(match, 'cache')) {
    const { url } = reqs
    const { route } = match
    const { response, hidden } = route
    const { argv } = global.mitm

    let { fpath1, fpath2 } = fpathcache({ match, reqs })
    let remote = true
    // feat: activity
    let actyp, actag
    msg = match.log
    if (__args.activity) {
      [actyp, actag] = __args.activity.split(':')
    }
    if ((!actyp || actyp==='play' || (actyp==='mix' && !route.seq)) && fs.existsSync(fpath2)) {
      // get from cache
      try {
        const json = JSON.parse(await fs.readFile(fpath2))
        const { general: { status }, setCookie, respHeader: headers } = json
        if (!ctype(match, { headers })) {
          return { match: undefined, resp }
        }
        if (setCookie && __args.cookie) {
          headers['set-cookie'] = resetCookies(setCookie)
        }
        fpath1 = `${fpath1}.${_ext({ headers })}`
        if (__flag.cache && !match.hidden && !hidden) {
          if (!__args.ommit.cache) {
            if (actyp && route.seq) {
              msg += c.blueBright(`[${actyp}:${fpath1.split('/').pop()}]`)
            }
            msg = route.path ? c.green(msg) :  c.greenBright(msg)
            __args.fullog && console.log(msg) // feat: fullog
          }
        }
        const body = await fs.readFile(fpath1)
        resp = { url, status, headers, body }
        if (response) {
          resp2 = response(resp, reqs, match)
          resp2 && (resp = { ...resp, ...resp2 })
        }
        remote = false
      } catch (error) {
        const msg1 = c.red(`>>> cache (${tilde(fpath1)})`)
        const msg2 = c.red(`   Error in ${error}`)
        msg = `${msg1}\n${msg2}`
        __args.fullog && console.log(msg) // feat: fullog
        resp = {}
      }
      resp.log = msg ? {msg, mtyp: 'cache'} : undefined
    }
    if (remote) {
      // get from remote
      responseHandler.push(async resp => {
        // feat: activity
        if (!route.seq && fpath1.match(/~\w+_\d+_/)) { // feat: seq
          if (__flag.cache && !match.hidden) {
            msg = c.grey(msg)
            const msg2 = `[${actyp}:${fpath1.split('/').pop()}]`
            msg += actyp==='play' ? c.red(msg2) : c.cyan(msg2)
            __args.fullog && console.log(msg) // feat: fullog
          }
        } else if (ctype(match, resp)) {
          msg = c.magentaBright(msg)
          fpath1 = `${fpath1}.${_ext(resp)}`
          if (route.seq && actyp) {
            const color = {rec: 'red', mix: 'magenta'}[actyp] || 'cyan'
            msg += c[color](`[${actyp}:${fpath1.split('/').pop()}]`)
          }
          if (__flag.cache && !match.hidden) {
            if (hidden !== 2) {
              __args.fullog && console.log(msg) // feat: fullog
            }
          }
          const meta = metaResp({ reqs, resp })
          const body = resp.body
          filesave({ fpath1, body }, { fpath2, meta }, 'cache')
          if (response) {
            resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        }
        resp.log = msg ? {msg, mtyp: 'cache'} : undefined // feat: fullog
        return resp // back to events loop call in fetch
      })
    }
    resp = undefined
  }
  return { match, resp }
}

module.exports = cacheResponse
