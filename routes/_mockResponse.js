const fs = require('fs-extra')
const c = require('ansi-colors')
const _match = require('./match')
const inject = require('./inject')
const { xtype } = require('./content-type')
const changeStatus = require('./change-status')
const resetCookies = require('./reset-cookies')
const filePath = require('./filepath/file-path')

const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const { matched, searchFN } = _match
const { source } = inject

const mock = ({ url }, match) => {
  const resp = {
    url,
    status: 200,
    headers: {
      'content-type': 'text/plain',
      'access-control-allow-origin': '*'
    },
    body: 'Hello mock! - mitm-play'
  }
  changeStatus(match, resp)
  return resp
}

const mockResponse = async function ({ reqs, route }, _3d) {
  const search = searchFN('mock', reqs)
  const { __args, __flag } = global.mitm
  const match = _3d ? search('_global_') : matched(search, reqs)
  let resp, msg = ''

  if (match && match.route.debug) {
    debugger
  }

  if (match) {
    const { response, hidden } = match.route
    resp = mock(reqs, match)
    if (typeof (match.route) === 'string') {
      resp.body = match.route
    } else {
      let { file, js } = match.route
      if (typeof file === 'function') {
        file = file(reqs, match)
        if (!file) {
          return false
        }
      }
      if (file || js) {
        const { path } = match.route
        if (file) {
          file = filePath(match, path, file)
          const apath = file.split('/')
          file = apath.pop()
          const _root = apath.join('/')

          let fileMethod, fpath1, fpath2
          const arr = file.match(/\.\w+$/)
          if (arr) {
            fileMethod = file.replace(arr[0], `~${reqs.method}_`) + arr[0]
          }
          let xfile = fileMethod
          fpath1 = `${_root}/${fileMethod}`
          if (await fs.pathExists(fpath1)) {
            resp.body = await fs.readFile(fpath1)
            file = fileMethod
          } else {
            xfile = file
            fpath1 = `${_root}/${file}`
            if (await fs.pathExists(fpath1)) {
              resp.body = await fs.readFile(fpath1)
            } else {
              const b = browser[reqs.browserName]
              msg = c.bgYellowBright.bold.red(`${b} mock err (${_root}/${fileMethod} or ${file}) did not exists!`)
              console.log(msg)
              route.continue()
              return false
            }
          }
          match.log += `[${xfile}]`
          const xfile2 = xfile.split('@')[0]
          if (await fs.pathExists(`${_root}/$/${xfile}.json`)) {
            fpath2 = `${_root}/$/${xfile}.json`
          } else if (xfile2 !== xfile) {
            if (await fs.pathExists(`${_root}/$/${xfile2}.json`)) {
              fpath2 = `${_root}/$/${xfile2}.json`
            }
          }
          if (fpath2) {
            const json = JSON.parse(await fs.readFile(fpath2))
            const { general: { status }, setCookie, respHeader: headers } = json
            if (setCookie && __args.cookie) {
              headers['set-cookie'] = resetCookies(setCookie)
            }
            resp.status = status
            resp.headers = headers
          } else {
            match.log += '!?'
            const ext = file.match(/\.(\w+)$/)
            if (ext) {
              resp.headers['content-type'] = xtype[ext[1]]
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
        const resp2 = response(resp, reqs, match)
        if (typeof resp2 === 'object' && 'then' in resp2) {
          resp2 = await resp2
        }
        resp2 && (resp = {
          ...resp,
          ...resp2
        })
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
