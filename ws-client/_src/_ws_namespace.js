/* global location */
module.exports = () => {
  const { hostname: host } = location
  let namespace

  function toRegex (str) {
    return str.replace(/\./g, '\\.').replace(/\?/g, '\\?')
  }

  for (const key in window.mitm.routes) {
    if (host.match(toRegex(key.replace(/~/g, '[^.]*')))) {
      namespace = key
      break
    }
  }
  return namespace
}
