/* eslint-disable camelcase */
function css_src (body, src) {
  const el = src.map(el => {
    return `<link href="${el}" rel="stylesheet">`
  }).join('\n')
  let b = body + ''
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>\n${el}`)
  } else {
    const h = b.match(/(<html[^>]*>)/i)
    if (h) {
      b = b.replace(h[0], `${h[0]}\n${el}`)
    } else {
      b = `${el}\n${b}`
    }
  }
  return b
}

function script_src (body, src) {
  const el = src.map(el => {
    const arr = el.match(/\.m:js/)
    let path = ''
    if (arr) {
      path += el.replace(arr[0], '.js')
      return `<script nonce src="${path}" type="module"></script>`
    } else {
      path += el
      return `<script nonce src="${path}"></script>`
    }
  }).join('\n')
  let b = body + ''
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>\n${el}`)
  } else {
    const h = b.match(/(<html[^>]*>)/i)
    if (h) {
      b = b.replace(h[0], `${h[0]}\n${el}`)
    } else {
      b = `${el}\n${b}`
    }
  }
  return b
}

function source (body, src) {
  const el = src.map(el => `(${el})();`).join('\n')
  return `${body}\n${el}`
}

function head (body, fn) {
  const el = fn.map(el => `(${el})();`).join('\n')
  const script = `\n<script>${el}</script>\n`
  let b = body + ''
  let h = b.match(/<head[^>]*>/i)
  !h && (h = b.match(/<html[^>]*>/i))

  if (h) {
    b = b.replace(h[0], `${h[0]}${script}`)
  } else {
    b = `${script}${b}`
  }
  return b
}

function body (body, fn) {
  const el = fn.map(el => `(${el})();`).join('\n')
  const script = `\n<script>${el}</script>\n`
  let b = body + ''
  if (b.match(/<\/body>/i)) {
    b = b.replace(/<\/body>/i, `${script}</body>`)
  } else if (b.match(/<\/html>/i)) {
    b = b.replace(/<\/html>/i, `${script}</html>`)
  } else {
    b = b + script
  }
  return b
}

function replaceCSP (csp) {
  csp = csp.replace(/default-src[^;]+;/g, '')
  csp = csp.replace(/connect-src[^;]+;/g, '')
  csp = csp.replace(/script-src[^;]+;/g, '')
  csp = csp.replace(/style-src[^;]+;/g, '')
  return csp
}

const addCsp = (headers, url, csp) => {
  const policy= headers[csp]
  const fn = ()=>{
    let reportTo = ''
    if (headers['report-to']) {
      reportTo = headers['report-to']
    }
    const {origin, pathname} = new URL(url)
    const cspurl = `${origin}${pathname}`
    const csplog = {}
    csplog[csp]  = {
      policy, 
      reportTo
    }

    mitm.info.csp[cspurl] = {
      ...mitm.info.csp[cspurl],
      ...csplog,
    }
  }
  if (policy) {
    headers[csp] = replaceCSP(policy)
    setTimeout(fn, 0)
  }
}

function injectWS (resp, url, jsLib=[]) {
  const { __args, fn: { _tldomain, _nameSpace } } = global.mitm
  const js = [
    '/mitm-play/mitm.js',
    '/mitm-play/ws-client.js'
  ]

  let {body, headers} = resp
  body = `${body}`

  // do not change JS load order! 
  if (__args.a11y || _nameSpace(_tldomain(url))) {
    body = css_src(body, ['/mitm-play/macros.css', '/mitm-play/ws-client.css'])
    js.push('/mitm-play/macros.js')
  }
  js.push('/mitm-play/jslib/selector.js')

  if (__args.a11y) { //# a11y
    if (!jsLib.includes('axe.js')) {
      body = css_src(body, ['/mitm-play/highlight.css'])
      jsLib.push('highlight.js')
      jsLib.push('axe.js')
    }
  }
  js.push.apply(js, jsLib.map(x => `/mitm-play/jslib/${x}`))
  if (__args.a11y) { //# a11y
    body = css_src(body, ['/mitm-play/axe-run.css'])
    js.push('/mitm-play/axe-run.js')
  }

  resp.body = script_src(body, js)
  addCsp(headers, url, 'content-security-policy')
  addCsp(headers, url, 'content-security-policy-report-only')
  if (__args.csp==='nosts' && headers['strict-transport-security']) {
    delete headers['strict-transport-security']
  }
}
module.exports = {
  script_src,
  injectWS,
  css_src,
  source,
  head,
  body
}
