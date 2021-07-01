const { root, filename } = require('./file-util')

module.exports = ({ match, reqs, stamp }) => {
  let {host, route: {at, contentType}} = match
  const {page, url, headers, method} = reqs
  const fpath = filename(match, '-')

  const _pageId = headers['xplay-page']
  let _sessionId = headers['xplay-session']
  let _session = undefined
  if (_sessionId && _pageId) {
    const _page = global.mitm.__page[_pageId]
    if (_page && _page.session) {
      if (!_sessionId.match(/[a-z]+~[0-9]+/)) {
        const [id1, id2] = _sessionId.split('||')
        _sessionId = headers[id1] || `_base-${id2}`
        if (_page.session[_sessionId] === undefined) {
          _page.session[_sessionId] = { url, log: [] }
        }
      }
      _session = _page.session[_sessionId]
    }
  }
  if (_sessionId===undefined) {
    _sessionId = page._session
  }

  if (at === undefined) {
    at = contentType.join('-')
  }

  let stamp1, stamp2
  if (at.match(/^\^/)) {
    at = at.slice(1)
    stamp1 = `${at}/${stamp}-${host}${fpath}` // feat: session stamp
    stamp2 = `${at}/$/${stamp}-${host}${fpath}`
  } else {
    stamp1 = `${stamp}--${at}@${host}${fpath}`
    stamp2 = `$/${stamp}--${at}@${host}${fpath}`
  }

  // const { session } = global.mitm
  const session = `${_pageId}-${_sessionId}`
  const _root = root(reqs, 'log')
  const fpath1 = `${_root}/${session}/${stamp1}`
  const fpath2 = `${_root}/${session}/${stamp2}.json`

  if (_session && _session.log) {
    _session.log.push({
      method,
      fpath1,
      fpath2,
      url,
    })
  }
  return { fpath1, fpath2 }
}
