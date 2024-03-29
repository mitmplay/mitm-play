const _match = require('./match')
const inject = require('./inject')
const setSession = require('./set-session')
const { xtype } = require('./content-type')
const changeStatus = require('./change-status')
const resetCookies = require('./reset-cookies')
const filePath = require('./filepath/file-path')

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const { matched, searchFN, searchKey } = _match
const { source, injectWS } = inject

const {
  __page,
  fn:{tilde},
  lib:{c, fs},
} = global.mitm

const mock = ({ url }, match) => {
  const resp = {
    url,
    status: 200,
    headers: {
      'content-type': 'text/plain',
      'access-control-allow-origin': '*'
    },
    body: '// Hello mock! - mitm-play'
  }
  changeStatus(match, resp)
  return resp
}

const mockResponse = async function ({ reqs }, _3d) {
  const search = searchFN('mock', reqs)
  const { __args, __flag } = global.mitm
  const match = _3d ? search('_global_') : matched(search, reqs)
  let resp, msg = ''

  if (match) {
    const { response, hidden, ws } = match.route
    resp = mock(reqs, match)
    let otyp
    if (typeof (match.route) === 'string') {
      resp.body = match.route
    } else {
      let { file, js } = match.route
      if (typeof file === 'function') {
        file = file(reqs, match)
        if (file instanceof Promise) {
          file = await file
        }
        if (file===false) {
          return          
        }
      }
      if (file || js) {
        const {path: p1, route: {path: p2}} = match
        let path = p1 || p2
        otyp = typeof file
        if (otyp==='object') {
          file.path && (path = file.path)
          file.file && (file = file.file)
        }

        if (file) {
          file = filePath(match, path, file)
          const apath = file.split('/')
          file = apath.pop()
          const _root = apath.join('/')

          const arr = file.match(/\.\w+$/)
          const ext = arr ? arr[0] : '.???'
          const typ = xtype[ext.slice(1)]
          let fcache, fpath1, fllog1, fllog2
          if (path && path.match(/https?:\//)) {
            fcache = `remote: ${file}`
            const bdy = await fetch(`${path}/${file}`, {
              mode: "cors",
              method: "GET",
              credentials: "omit"
            });
            resp.body = await bdy.text()
          } else {
            if (typ) {
              fcache = file.replace(ext, `~${reqs.method}_`) + ext
            } else {
              fcache = `${file}~${reqs.method}_.json`
            }
            fpath1 = `${_root}/${fcache}`
            fllog1 = fcache
            if (arr && await fs.pathExists(fpath1)) {
              resp.body = await fs.readFile(fpath1)
            } else {
              fcache = typ ? file : `${file}.json`
              fpath1 = `${_root}/${fcache}`
              fllog2 = fcache
              if (await fs.pathExists(fpath1)) {
                resp.body = await fs.readFile(fpath1)
              } else {
                const b = browser[reqs.browserName]
                msg = c.bgYellowBright.bold.red(`${b} mock err (${fllog1} or ${fllog2}) did not exists!`)
                console.log(msg)
                return
              }
            }
          }
          if (__args.verbose && fpath1) {
            match.log += `[${tilde(fpath1)}]`
          } else {
            match.log += `[${fcache}]`
          }
          const [,fheader] = fcache.split('@')
          let fpath2 = `${_root}/$/${fheader}`
          if (!(fheader && await fs.pathExists(fpath2))) {
            fpath2 = `${_root}/$/${fcache}`
            if (!await fs.pathExists(fpath2)) {
              fpath2 = false
            }
          }
          if (fpath2) {
            const json = JSON.parse(await fs.readFile(fpath2))
            const { general: { status }, setCookie, respHeader: headers } = json
            if (setCookie?.length && __args.cookie) {
              headers['set-cookie'] = resetCookies(setCookie)
            }
            resp.status = status
            resp.headers = headers
          } else {
            match.log += '!?'
            if (typ) {
              resp.headers['content-type'] = typ
            } else {
              msg = c.redBright('>>> WARNING: Need a proper file extension')
              __args.fullog && console.log(msg) // feat: fullog
            }
          }
        } else if (js) {
          resp.body = source(resp.body, js)
          resp.headers['content-type'] = 'application/javascript'
        }
      }
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
      if (ws && resp.headers['content-type'].match('/html')) {
        setSession(reqs, {session:true, msg: '_htmlResponse'}) // feat: session
        const jsLib = matched(searchKey('jsLib'), reqs)
        injectWS(resp, reqs.url, jsLib)
      } else if (ws===false) {
        const url   = new URL(reqs.url)
        const macro = url.searchParams.get('mitm')
        const pgid  = reqs.headers["xplay-page"]
        const page  = __page[pgid]
        if (macro) {
          page.macro = macro
        }
      }
    }
    if (!__flag.mock || match.hidden || hidden) {
      msg = ''
    } else {
      msg = c.cyanBright(match.log) + msg
      __args.fullog && console.log(msg) // feat: fullog
    }
    resp.log = msg ? {msg, mtyp: 'mock'} : undefined // feat: fullog
    return {match, resp}
  }
}

module.exports = mockResponse
// https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse