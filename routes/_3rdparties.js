const { fn: { _tldomain, _nameSpace } } = global.mitm

function thirdparty ({ url, headers }) {
  if (!_nameSpace(_tldomain(url))) {
    const { origin, referer } = headers
    let reff = origin || referer
    if (!(reff===undefined || reff===null)) {
      if (_nameSpace((new URL(reff).host))) {
        return
      }
    }
    return true
  }
}

module.exports = thirdparty
