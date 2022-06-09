/* global location */
const _ws_namespace = require('./_ws_namespace')

module.exports = () => {
  const namespace = _ws_namespace()
  let route = window.mitm.routes[namespace]
  if (route) {
    const {_subns: s} = route._childns
    if (s && mitm.routes[s]) {
      route= mitm.routes[s]
    }  
  }
  return route
}
