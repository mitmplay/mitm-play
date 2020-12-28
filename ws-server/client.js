/* eslint-disable camelcase */
const fs = require('fs-extra')
const c = require('ansi-colors')

module.exports = () => {
  /**
   * use only by client
   */

  // ex: ws__help();
  //    => _help({})
  function _help () {
    let messages
    const note = Object.keys(global.mitm.wscmd).map(x => {
      if (x.match(/^\$/)) {
        x = x.replace(/^\$/, '')
        messages = `ws__send('${x}',...)`
      } else {
        messages = `ws_${x}(...)`
      }
      return `* ${messages}`
    }).join('\n')
    const data =
`Available functions:\n\n${note}\n
Double check on client implementation "ws_***()".
On browser console type "ws"`
    const msg = `_help${JSON.stringify({ data })}`
    console.log('_help', msg)
    this.send(msg)
  }

  // ex: ws__ping("there")
  //    => _ping({data:"there"})
  function _ping (json) {
    let { data } = json
    data = typeof (data) === 'string' ? data : JSON.stringify(data)
    const msg = `_ping${JSON.stringify({ data })}`
    console.log('_ping', msg)
    this.send(msg)
    return data
  }

  // ex: ws__open({url: "https://google.com"})
  //    => _open({data:{url: "https://google.com"}})
  const _open = function (json) {
    const msg = `_open${JSON.stringify(json)}`
    console.log('_open', msg)
    this.send(msg)
  }

  // ex: ws__style({query: 'body', style: 'background: red;'})
  //    => _style({data:{query: 'body', style: 'background: red;'}})
  const _style = function (json) {
    let { data, _all } = json
    data = `_style${JSON.stringify({ data })}`
    console.log('_style', data)
    global.broadcast.call(this, { data, _all })
  }

  function $routes ({ data }) {
    const { stringify } = global.mitm.fn

    if (data === '*') {
      return Object.keys(global.mitm.routes).map(x => {
        return `>>> ${x}\n${stringify(global.mitm.routes[x])}`
      }).join('\n')
    } else if (!data) {
      return Object.keys(global.mitm.routes)
    } else {
      for (const id in global.mitm.routes) {
        if (id.match(data)) {
          const r = global.mitm.routes[id]
          return global.mitm.fn.stringify(r)
        }
      }
    }
  }

  async function _screenshot (data, { path, page }) {
    const err = await fs.ensureFile(path)
    if (err) {
      console.log(c.redBright('(*error saving screenshot*)'), path)
    } else {
      try {
        console.log(c.green('(*screenshot*)'))
        await page.screenshot({ path })
      } catch (error) {
        console.log(c.redBright('(*error screenshot*)'), error)
      }
    }
  }

  let _stamp = []
  const delayCapture = global._debounce(async function (data) {
    const { namespace, host, fname, browser, _page, session } = data
    const page = await global.mitm.browsers[browser].currentTab(_page)
    const { routes, path: { home }, argv: { group } } = global.mitm
    const stamp = _stamp[0]
    let at = 'sshot'
    _stamp = []
    if (namespace && routes[namespace]) {
      const { screenshot } = routes[namespace]
      if (screenshot && screenshot.at) {
        at = `${screenshot.at}`
      }
    }

    let root
    if (group) {
      root = `${home}/${browser}/_${group}/log`
    } else {
      root = `${home}/${browser}/log`
    }
    let path
    if (at.match(/^\^/)) {
      at = at.slice(1)
      path = `${root}/${session}/${at}/${stamp}-${host}--`
    } else {
      path = `${root}/${session}/${stamp}--${at}@${host}--`
    }
    path += `${fname||'_'}.png`
    _screenshot(data, { path, page })
  }, 400, 'screenshot')

  function $screenshot ({ data }) {
    const { _page } = data
    const { __page } = global.mitm
    if (_page) {
      _stamp.push((new Date()).toISOString().replace(/[:-]/g, ''))
      try {
        const _session = Object.keys(__page[_page].session).pop()
        data.session = `${_page}-${_session}`
        delayCapture(data)
      } catch (error) {
        console.log(error)
        debugger
      }
    } else {
      console.log('no session in _page', __page)
    }
  }

  function $csp_error ({ data }) {
    const { path: { home }, session } = global.mitm
    const { namespace, host, fname, cspviolation } = data
    const body = JSON.stringify(cspviolation, null, 2)
    const stamp = (new Date()).toISOString().replace(/[:-]/g, '')
    let at = 'csp'
    if (namespace && global.mitm.routes[namespace]) {
      const { csp_error } = global.mitm.routes[namespace]
      if (csp_error && csp_error.at) {
        at = `${csp_error.at}`
      }
    }
    let path
    if (at.match(/^\^/)) {
      at = at.slice(1)
      path = `${home}/log/${session}/${at}/${stamp}-${host}--${fname}.json`
    } else {
      path = `${home}/log/${session}/${stamp}--${at}@${host}--${fname}.json`
    }
    fs.ensureFile(path, err => {
      if (err) {
        console.log(c.redBright('>>> Error saving csp'), path)
      } else {
        fs.writeFile(path, body, err => {
          err && console.log(c.redBright('>>> Error write'), err)
        })
      }
    })
  }

  return {
    _style,
    _help,
    _ping,
    _open,
    $routes,
    $csp_error,
    $screenshot
  }
}
