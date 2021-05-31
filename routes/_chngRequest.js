const c = require('ansi-colors')
const _match = require('./match')
const setSession = require('./set-session')
const { cookieToObj, objToCookie } = require('./filesave/cookier')

const { matched, searchFN } = _match

const chgRequest = async function (reqs, _3d) {
  const search = searchFN('request', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm

  let result = match
  if (result) {
    const { request, session, hidden } = match.route
    if (__flag.request && !match.hidden && !hidden) {
      if (!match.url.match('/mitm-play/websocket')) {
        if (!__args.ommit.request) {
          console.log(c.cyanBright(match.log))
        }
      }
    }
    setSession(reqs, {session, persist:true, msg: '_chngRequest'})
    if (request) {
      let reqs2 = request(reqs, match)
      if (typeof reqs2 === 'object' && 'then' in reqs2) {
        reqs2 = await reqs2
      }
      result = {
        ...reqs,
        ...reqs2
      }
    } else {
      result = reqs
    }
  }
  return result // false or request object
}

module.exports = chgRequest
