const fs = require('fs-extra')
const c = require('ansi-colors')
const _match = require('./match')
const inject = require('./inject')
const { xtype } = require('./content-type')
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
    body: ''
  }
}

const mockResponse = async function ({ reqs, route }, _3d) {
  const search = searchFN('mock', reqs)
  const { fn: { _skipByTag }, router } = global.mitm
  const match = _3d ? search('_global_') : matched(search, reqs)

  if (match && !_skipByTag(match, 'mock')) {
    let { response, file, js } = match.route
    if (router._global_.config.logs.mock) {
      if (!match.url.match('/mitm-play/websocket')) {
        console.log(c.cyanBright(match.log))
      }
    }
    let resp = mock(reqs)
    if (typeof (match.route) === 'string') {
      resp.body = match.route
    } else {
      if (response || file || js) {
        if (response) {
          const resp2 = response(resp, reqs, match)
          resp2 && (resp = { ...resp, ...resp2 })
        } else if (file) {
          let id = 1
          for (const key of match.arr.slice(1)) {
            file = file.replace(`:${id}`, key)
            id++
          }
          const ext = file.match(/\.(\w+)$/)
          if (ext) {
            const fpath = filePath(file, match)
            resp.body = `${await fs.readFile(fpath)}`
            resp.headers['content-type'] = xtype[ext[1]]
          } else {
            console.log(c.redBright('>>> ERROR: Need a proper file extension'))
          }
        } else if (js) {
          resp.body = source(resp.body, js)
          resp.headers['content-type'] = 'application/javascript'
        }
      } else {
        resp.body = 'Hello mock! - mitm-play'
      }
    }
    route.fulfill(resp)
    return true
  }
}

module.exports = mockResponse
// https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse
