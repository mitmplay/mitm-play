const fs = require('fs-extra')
const c = require('ansi-colors')
const _match = require('./match')
const _ext = require('./filepath/ext')
const { ctype } = require('./content-type')
const changeStatus = require('./change-status')
const resetCookies = require('./reset-cookies')
const filesave = require('./filesave/filesave')
const metaResp = require('./filesave/meta-resp')
const fpathcache = require('./filepath/fpath-cache')
const { logmsg } = global.mitm.fn

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const { matched, searchFN } = _match

const cacheResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('cache', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag, fn: { tilde } } = global.mitm
  let resp, resp2, msg

  if (match) {
    const { url, browserName } = reqs
    const { route } = match
    const { response, hidden } = route

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
      const fpath0 = fpath2.replace(/_\d+_/,'_') // feat: seq
      if (!fs.existsSync(fpath2)) {
        if (fpath0!==fpath2 && fs.existsSync(fpath0)) {
          msg += c.red(`[${fpath2.match(/\$\/(.+)\.json/)[1]}]`)
          fpath1 = fpath1.replace(/_\d+_/,'_') // feat: seq
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
            return { match: undefined, resp: undefined }
          }
          if (setCookie && __args.cookie) {
            headers['set-cookie'] = resetCookies(setCookie)
          }
          remote = false
          const body = await fs.readFile(fname1)
          resp = { url, status, headers, body }
          changeStatus(match, resp)
          if (response) {
            resp2 = response(resp, reqs, match)
            if (resp2 instanceof Promise) {
              resp2 = await resp2
            }
            resp2 && (resp = {
              ...resp,
              ...resp2
            })
          }
          const fname = fname1.split('/').pop()
          if (actyp && route.seq) {
            msg += c.blueBright(`[${actyp}:${fname}]`)
          } else {
            msg += `:${fname}`
          }
        } catch (error) {
          const msg1 = `${browser[browserName]} cache er (${tilde(fpath1)})`
          if (__args.fullog) {
            const msg2 = `    Error in ${error}`
            logmsg(c.bgYellowBright.bold.red(`${msg1}\n${msg2}`)) // feat: fullog  
          } else {
            logmsg(c.bgYellowBright.bold.red(msg1))
          }
          resp = {
            url,
            status: 500,
            headers: {'content-type': 'text/plain'},
            body: `Mitm-play - Cache error!\n\nError in ${error}`.replace(', ','\n')
          }
        }
        if (!__flag.cache || match.hidden || hidden) {
          msg = ''
        } else {
          msg = route.path ? c.green(msg) :  c.greenBright(msg)
          __args.fullog && logmsg(msg) // feat: fullog  
        }
        resp.log = msg ? {msg, mtyp: 'cache'} : undefined
      }
    }
    if (remote) {
      // get from remote
      const que = async resp => {
        changeStatus(match, resp)
        // feat: activity
        const fname1 = `${fpath1}.${_ext(resp)}`
        if (!route.seq && fname1.match(/~\w+_\d+_/)) { // feat: seq
            msg = c.grey(msg)
            const msg2 = `[${actyp}:${fname1.split('/').pop()}]`
            msg += actyp==='play' ? c.red(msg2) : c.cyan(msg2)
            __args.fullog && logmsg(msg) // feat: fullog
        } else if (ctype(match, resp)) {
          const fname = fname1.split('/').pop()
          msg = c.magentaBright(msg)
          if (route.seq && actyp) {
            const color = {mix: 'magenta'}[actyp] || 'red'
            msg += c[color](`[${actyp}:${fname}]`)
          } else {
            msg += `:${fname}`
          }
          if (__flag.cache && !match.hidden) {
            if (hidden !== 2) {
              __args.fullog && logmsg(msg) // feat: fullog
            }
          }
          const meta = metaResp({ reqs, resp })
          const body = resp.body
          filesave({ fpath1: fname1, body }, { fpath2, meta }, 'cache')
          if (response) {
            resp2 = response(resp, reqs, match)
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
        if (!__flag.cache || match.hidden || hidden) {
          msg = ''
        }
        resp.log = msg ? {msg, mtyp: 'cache'} : undefined // feat: fullog
        return resp // back to events loop call in fetch
      }
      que._rule = 'cache' 
      responseHandler.push(que)
      resp = undefined
    }
  }
  return { match, resp }
}

module.exports = cacheResponse
