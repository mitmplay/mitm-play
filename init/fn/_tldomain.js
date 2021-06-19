const c = require('ansi-colors')
const rgxDomain = /^\w+:\/\/([\w-.]+)/
const { logmsg } = global.mitm.fn

function _tldomain (fullpath) {
  if (typeof (fullpath) !== 'string' || fullpath.match(/^chrome/)) {
    return fullpath
  }
  const match = fullpath.match(rgxDomain)
  if (match) {
    return match[1]
  } else {
    logmsg(c.redBright(`>>> Error _tldomain ${fullpath}`))
    return '**tld-error**'
  }
}

module.exports = _tldomain
