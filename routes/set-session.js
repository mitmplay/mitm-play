const c = require('ansi-colors')

const { logmsg } = global.mitm.fn

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let old_id;
async function setSession (reqs, {session, persist=false, msg=''}) {
  const { page, url, headers } = reqs
  if (page && session && (!page._persist || persist)) {
    const id = (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '')
    if (old_id===id) {
      return
    }
    old_id = id
    let _session
    if (session === true) {
      _session = `session~${id}`
      global.mitm.__page[page._page].session[_session] = { msg, url, log: [] }
    } else {
      _session = `${session}||${id}`
    }
    typeof session === 'number' && sleep(session)
    page.setExtraHTTPHeaders({ 'xplay-page': page._page, 'xplay-session': _session })
    headers['xplay-session'] = _session
    const { origin } = new URL(url)
    if (persist) {
      page._persist = true
      logmsg(c.magenta(`>>> session: ${id} ${msg} ${origin}**`))
    } else {
      logmsg(c.magenta(`>>> session: ${id} ${msg} ${origin}`))
    }
  }
}

module.exports = setSession
