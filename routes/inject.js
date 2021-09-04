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

const headerchg = headers => {
  let csp
  if (headers['content-security-policy']) {
    csp = replaceCSP(headers['content-security-policy'])
    headers['content-security-policy'] = csp
  } else if (headers['content-security-policy-report-only']) {
    csp = replaceCSP(headers['content-security-policy-report-only'])
    headers['content-security-policy-report-only'] = csp
  }
}

function injectWS (resp, url, jsLib) {
  const { __args, fn: { _tldomain, _nameSpace } } = global.mitm
  const js = ['/mitm-play/mitm.js', '/mitm-play/ws-client.js']
  let {body, headers} = resp
  body = `${body}`

  // do not change JS load order! 
  if (_nameSpace(_tldomain(url))) {
    if (__args.svelte) {
      body = css_src(body, ['/mitm-play/macros.css'])
    }
    js.push('/mitm-play/macros.js')
  }
  js.push('/mitm-play/jslib/selector.js')
  if (jsLib) {
    js.push.apply(js, jsLib.map(x => `/mitm-play/jslib/${x}`))
  }
  resp.body = script_src(body, js)
  if (__args.csp) {
    headerchg(headers)
    if (__args.csp==='nosts' && headers['strict-transport-security']) {
      delete headers['strict-transport-security']
    }
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
