function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setSession (reqs, session) {
  const { page, url } = reqs
  if (page && session) {
    const id = (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '')
    let _session
    if (session === true) {
      _session = `session-${id}`
      global.mitm.__page[page._page].session[_session] = { url, log: [] }
    } else {
      _session = `${session}||${id}`
    }
    typeof session === 'number' && sleep(session)
    page.setExtraHTTPHeaders({ 'xplay-page': page._page, 'xplay-session': _session })
  }
}

module.exports = setSession
