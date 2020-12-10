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
  const { router, fn: { _skipByTag, tilde } } = global.mitm
  let resp, resp2

  if (match && !_skipByTag(match, 'cache')) {
    const { url } = reqs
    const { route } = match
    const { response, session, hidden } = route
    const { logs } = router._global_.config
    const { argv } = global.mitm

    let { fpath1, fpath2 } = fpathcache({ match, reqs })
    let remote = true
    if (!argv.activity && fs.existsSync(fpath2)) {
      // get from cache
      try {
        const json = JSON.parse(await fs.readFile(fpath2))
        const { general: { status }, setCookie, respHeader: headers } = json
        if (!ctype(match, { headers })) {
          return { match: undefined, resp }
        }
        if (argv.cookie) {
          headers['set-cookie'] = resetCookies(setCookie)
        }
        fpath1 = `${fpath1}.${_ext({ headers })}`
        if (logs.cache && !match.hidden && !hidden) {
          if (!argv.ommit.cache) {
            if (match.route.path) {
              console.log(c.green(match.log))
            } else {
              console.log(c.greenBright(match.log))
            }
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
        console.log(c.red(`>>> cache (${tilde(fpath1)})`))
        console.log(c.red(`   Error in ${error}`))
      }
    }
    if (remote) {
      // get from remote
      responseHandler.push(async resp => {
        if (argv.activity && !match.route.recs) {
          if (logs.cache && !match.hidden) {
            console.log(c.grey(match.log))
          }
        } else if (ctype(match, resp)) {
          fpath1 = `${fpath1}.${_ext(resp)}`
          if (logs.cache && !match.hidden) {
            if (hidden !== 2) {
              console.log(c.magentaBright(match.log))
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
        return resp // back to events loop call in fetch
      })
    }
  }
  return { match, resp }
}

module.exports = cacheResponse
