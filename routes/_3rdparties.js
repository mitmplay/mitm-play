const { fn: { _tldomain, _nameSpace } } = global.mitm

function thirdparty ({ url, headers }) {
  const { origin, referer } = headers
  const domain = _tldomain(url)

  if (!_nameSpace(domain)) {
    if (origin && _nameSpace((new URL(origin).host))) return
    if (referer && _nameSpace((new URL(referer).host))) return
    return true
  }
}

module.exports = thirdparty
