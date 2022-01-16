const {_tldomain,_nameSpace} = global.mitm.fn

function thirdparty ({ url, headers }) {
  if (!_nameSpace(_tldomain(url))) {
    const { origin, referer } = headers
    let reff = origin || referer
    if (typeof reff==='string') {
      const obj = new URL(reff)
      if (obj && _nameSpace(obj.host)) {
        return
      }
    }
    return true
  }
}

module.exports = thirdparty
