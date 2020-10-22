/* eslint-disable camelcase */
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

function e_head (body, fn) {
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

function e_end (body, fn) {
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

module.exports = {
  script_src,
  source,
  e_head,
  e_end
}
