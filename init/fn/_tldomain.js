const {
  lib:{c},
  fn: {logmsg}
} = global.mitm
const rgxDomain = /^\w+:\/\/([\w-.]+)/

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
