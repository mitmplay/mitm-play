const { root, filename } = require('./file-util')

module.exports = ({ match, reqs, stamp }) => {
  let { host, route: { at, contentType } } = match
  const fpath = filename(match, '-')

  if (at === undefined) {
    at = contentType.join('-')
  }

  let stamp1, stamp2
  if (at.match(/^\^/)) {
    at = at.slice(1)
    stamp1 = `${at}/${stamp}-${host}${fpath}`
    stamp2 = `${at}/$/${stamp}-${host}${fpath}`
  } else {
    stamp1 = `${stamp}--${at}@${host}${fpath}`
    stamp2 = `$/${stamp}--${at}@${host}${fpath}`
  }

  const { session } = global.mitm
  const _root = root(reqs, 'log')
  const fpath1 = `${_root}/${session}/${stamp1}`
  const fpath2 = `${_root}/${session}/${stamp2}.json`
  if (reqs.headers['xplay-page'] && reqs.headers['xplay-session']) {
    const _page = global.mitm.__page[reqs.headers['xplay-page']]
    if (_page && _page.session) {
      const _session = _page.session[reqs.headers['xplay-session']]
      if (_session && _session.log) {
        _session.log.push({
          method: reqs.method,
          url: reqs.url,
          fpath1,
          fpath2
        })
      }
    }
  }
  return { fpath1, fpath2 }
}
