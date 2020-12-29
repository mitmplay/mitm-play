const c = require('ansi-colors')
const _fetch = require('make-fetch-happen')
const { cookieToObj, objToCookie } = require('./filesave/cookier')

async function extract ({ request: r, browserName }) {
  const headers = r.headers()
  cookieToObj(headers) // feat: cookie autoconvert
  let page
  if (headers['xplay-page']) {
    const { browsers } = global.mitm
    page = await browsers[browserName].currentTab(headers['xplay-page'])
  }
  return {
    method: r.method(),
    body: r.postData(),
    url: r.url(),
    browserName,
    headers,
    page
  }
}

function fetch (route, browserName, { url, proxy, ...reqs }, handler) {
  const { fn, argv } = global.mitm
  const opts = { redirect: true }
  if (argv.redirect && argv.redirect !== true) {
    opts.redirect = 'manual'
  }
  if (proxy) {
    if (proxy === true) {
      const _proxy = fn._proxy()
      _proxy && (opts.proxy = _proxy)
    } else {
      opts.proxy = proxy
    }
    opts.proxy && (opts.noProxy = fn._noproxy())
  }

  const okCallback = resp => {
    const _headers = resp.headers.raw()
    let status = resp.status
    if (proxy && argv.verbose) {
      const { origin, pathname } = new URL(url)
      console.log(c.grey(`>>> proxy (${origin}${pathname})`))
    }
    let headerSize = 42
    const headers = {}
    for (const key in _headers) {
      const arr = _headers[key]
      const len = arr.length
      if (key === 'set-cookie') {
        headers[key] = arr
      } else {
        headers[key] = arr.join(',')
      }
      headerSize += (len * (key.length + 4))
      headerSize += (len * 4 + arr.join('').length)
    }
    if (status === 301 || status === 302) {
      if (argv.redirect === 'browser') {
        route.continue({ headers, status })
      } else if (argv.redirect === 'manual') {
        const url = headers.location
        if (url) {
          delete headers.location
          delete headers['content-security-policy']
          headers['content-type'] = 'text/html'
          route.fulfill({
            headers,
            body: `
Redirect...
<script>window.location = '${url}';</script>
          `
          })
        }
        return
      }
    }
    resp.buffer().then(body => {
      if (status === undefined) {
        status = headers['x-app-status']
      }
      if (status >= 400) {
        console.log(c.redBright(`[${reqs.method}] ${url} => ${status}`))
        console.log(c.red(`${body}`))
      }
      headers['header-size'] = `${headerSize} ~est`
      handler({ url, status, headers, body })
    })
  }

  function delay (t) {
    return new Promise(resolve => setTimeout(resolve, t))
  }

  const fetchRetry = async (url, opt, n) => {
    for (let i = 1; i <= n; i++) {
      try {
        if (global.mitm.argv.debug) {
          console.log(c.yellowBright(`URL:${url}`))
        }
        const headers = {...opt.headers}
        if (typeof headers.cookie !== 'string') {
          objToCookie(headers) // feat: cookie autoconvert
        }  
        const resp = await _fetch(url, {...opt, headers})
        okCallback(resp)
        break
      } catch (err) {
        if ((err.code === 'ECONNRESET' || err.code === 'ENETUNREACH') && i <= n) {
          console.log(c.yellowBright(`RETRY:${i}`), url)
          await delay(2500)
        } else {
          throw err
        }
      }
    }
  }
  delete reqs.headers.host // fetch will fail if host part of reqs headers
  // delete reqs.headers['connection'];
  // delete reqs.headers['accept-language'];
  // delete reqs.headers['accept-encoding'];
  if (typeof (global.mitm.argv.browser[browserName]) === 'string' && reqs.body === null && (reqs.method === 'POST' || reqs.method === 'PUT')) {
    console.log(c.red.bgYellowBright(`>>> WARNING!!! ${reqs.method} having request payload NULL!, might be a bug from browser? Please use --${browserName} without browser path.`))
  }
  if (argv.debug) {
    const { method } = reqs
    console.log(method, opts)
  }
  fetchRetry(url, { ...reqs, ...opts }, 2)
}

module.exports = {
  extract,
  fetch
}
