const _match = require('./match')
const setSession = require('./set-session')
const { cookieToObj, objToCookie } = require('./filesave/cookier')

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

const { matched, searchFN } = _match

const chgRequest = async function (reqs, _3d) {
  const search = searchFN('request', reqs)
  const match = _3d ? search('_global_') : matched(search, reqs)
  const { __args, __flag } = global.mitm

  let result = {}
  if (match) {
    const { request, session, hidden } = match.route
    if (__flag.request && !match.hidden && !hidden) {
      if (!match.url.match('/mitm-play/websocket')) {
        if (!__args.ommit.request) {
          logmsg(c.cyanBright(match.log))
        }
      }
    }
    setSession(reqs, {session, persist:true, msg: '_chngRequest'})
    if (request) {
      let reqs2 = request(reqs, match)
      if (reqs2 instanceof Promise) {
        reqs2 = await reqs2
      }
      if (reqs2) {
        result = {...reqs, ...reqs2}
      } else if (reqs2===false) {
        return
      }
    } else {
      result = reqs
    }
  }
  return result // false or request object
}

module.exports = chgRequest
