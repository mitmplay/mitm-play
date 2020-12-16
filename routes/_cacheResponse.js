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
    if ((!actyp || actyp==='play' || (actyp==='mix' && !route.seq)) ) {
      // get from cache
      let getFromCache = true
      const fpath0 = fpath2.replace(/_\d+_/,'')
      if (!fs.existsSync(fpath2)) {
        if (fpath0!==fpath2 && fs.existsSync(fpath0)) {
          msg += c.red(`[${fpath2.match(/\$\/(.+)\.json/)[1]}]`)
          fpath1 = fpath1.replace(/_\d+_/,'')
          fpath2 = fpath0
        } else {
          getFromCache = false
        }
      }
      if (getFromCache) {
        try {
          const json = JSON.parse(await fs.readFile(fpath2))
          const { general: { status }, setCookie, respHeader: headers } = json
          const fname1 = `${fpath1}.${_ext({ headers })}`
          if (!ctype(match, { headers })) {
            return { match: undefined, resp }
          }
          if (setCookie && __args.cookie) {
            headers['set-cookie'] = resetCookies(setCookie)
          }
          if (__flag.cache && !match.hidden && !hidden) {
            if (!__args.ommit.cache) {
              if (actyp && route.seq) {
                msg += c.blueBright(`[${actyp}:${fname1.split('/').pop()}]`)
              }
              msg = route.path ? c.green(msg) :  c.greenBright(msg)
              __args.fullog && console.log(msg) // feat: fullog
            }
          }
          remote = false
          const body = await fs.readFile(fname1)
          resp = { url, status, headers, body }
          if (response) {
            resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        } catch (error) {
          const msg1 = c.red(`>>> cache (${tilde(fpath1)})`)
          const msg2 = c.red(`   Error in ${error}`)
          msg = `${msg1}\n${msg2}`
          __args.fullog && console.log(msg) // feat: fullog
          resp = {
            url,
            status: 500,
            headers: {'content-type': 'text/plain'},
            body: `Mitm-play - Cache error!\n\nError in ${error}`.replace(', ','\n')
          }
        }
        resp.log = msg ? {msg, mtyp: 'cache'} : undefined
      }
    }
    if (remote) {
      // get from remote
      responseHandler.push(async resp => {
        // feat: activity
        const fname1 = `${fpath1}.${_ext(resp)}`
        if (!route.seq && fname1.match(/~\w+_\d+_/)) { // feat: seq
          if (__flag.cache && !match.hidden) {
            msg = c.grey(msg)
            const msg2 = `[${actyp}:${fname1.split('/').pop()}]`
            msg += actyp==='play' ? c.red(msg2) : c.cyan(msg2)
            __args.fullog && console.log(msg) // feat: fullog
          }
        } else if (ctype(match, resp)) {
          msg = c.magentaBright(msg)
          if (route.seq && actyp) {
            const color = {mix: 'magenta'}[actyp] || 'red'
            msg += c[color](`[${actyp}:${fname1.split('/').pop()}]`)
          }
          if (__flag.cache && !match.hidden) {
            if (hidden !== 2) {
              __args.fullog && console.log(msg) // feat: fullog
            }
          }
          const meta = metaResp({ reqs, resp })
          const body = resp.body
          filesave({ fpath1: fname1, body }, { fpath2, meta }, 'cache')
          if (response) {
            resp2 = response(resp, reqs, match)
            resp2 && (resp = { ...resp, ...resp2 })
          }
        }
        resp.log = msg ? {msg, mtyp: 'cache'} : undefined // feat: fullog
        return resp // back to events loop call in fetch
      })
      resp = undefined
    }
  }
  return { match, resp }
}

module.exports = cacheResponse
