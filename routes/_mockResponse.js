const fs = require('fs-extra')
const c = require('ansi-colors')
const _match = require('./match')
const inject = require('./inject')
const { xtype } = require('./content-type')
const resetCookies = require('./reset-cookies')
const filePath = require('./filepath/file-path')

const { matched, searchFN } = _match
const { source } = inject

const mock = ({ url }) => {
  return {
    url,
    status: 200,
    headers: {
      'content-type': 'text/plain'
    },
    body: 'Hello mock! - mitm-play'
  }
}

const mockResponse = async function ({ reqs, route }, _3d) {
  const search = searchFN('mock', reqs)
  const { fn: { _skipByTag }, router } = global.mitm
  const match = _3d ? search('_global_') : matched(search, reqs)

  if (match && !_skipByTag(match, 'mock')) {
    let resp = mock(reqs)
    if (typeof (match.route) === 'string') {
      resp.body = match.route
    } else {
      let { path, file, js } = match.route
      if (typeof file === 'function') {
        file = file(reqs, match)
        if (!file) {
          return false
        }
      }
      if (file || js) {
        if (file) {
          let _root
          if (path) {
            _root = filePath(path, match)
          }
          file = filePath(file, match, path)
          if (_root === undefined) {
            const apath = file.split('/')
            file = apath.pop()
            _root = apath.join('/')
          }
          const fpath1 = `${_root}/${file}`
          const fpath2 = `${_root}/$/${file}.json`
          if (await fs.pathExists(fpath1)) {
            resp.body = `${await fs.readFile(fpath1)}`
          } else {
            console.log(c.redBright(`>>> ERROR: ${fpath1} did not exists!`))
            route.continue()
            return false
          }
          if (await fs.pathExists(fpath2)) {
            const json = JSON.parse(await fs.readFile(fpath2))
            const { general: { status }, setCookie, respHeader: headers } = json
            if (setCookie && global.mitm.argv.cookie) {
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
              console.log(c.redBright('>>> WARNING: Need a proper file extension'))
            }
          }
        } else if (js) {
          resp.body = source(resp.body, js)
          resp.headers['content-type'] = 'application/javascript'
        }
      }
      const { response } = match.route
      if (response) {
        const resp2 = response(resp, reqs, match)
        resp2 && (resp = { ...resp, ...resp2 })
      }
    }
    if (router._global_.config.logs.mock) {
      if (!match.url.match('/mitm-play/websocket')) {
        console.log(c.cyanBright(match.log))
      }
    }
    route.fulfill(resp)
    return true
  }
}

module.exports = mockResponse
// https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse
