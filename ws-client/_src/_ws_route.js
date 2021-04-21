/* global location */
const _ws_namespace = require('./_ws_namespace')

module.exports = () => {
  const namespace = _ws_namespace()
  return window.mitm.routes[namespace]
}
