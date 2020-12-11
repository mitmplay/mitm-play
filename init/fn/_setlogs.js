const _logs = function (_silent = false) {
  return {
    'mitm-mock': false,
    'ws-connect': false,
    'ws-message': false,
    'ws-broadcast': false,
    'no-namespace': !_silent,
    'referer-reqs': !_silent,
    silent: false, // ok
    skip: !_silent,
    nosocket: !_silent,
    request: !_silent,
    mock: !_silent,
    cache: !_silent,
    log: !_silent,
    html: !_silent,
    json: !_silent,
    css: !_silent,
    js: !_silent,
    response: !_silent
  }
}

function _setlogs () {
  const { _argv, __tag2, routes, router } = global.mitm
  const { _global_: _gTag2 } = __tag2
  const { _global_: _gRoutes } = routes
  const { _global_: _gRouter } = router
  let logs = {}
  let args = {}
  if (_gTag2) {
    for (const id in _gTag2) {
      if (id.match('config:') && _gTag2[id]) {
        logs = { ...logs, ..._gRoutes[id].logs }
        args = { ...args, ..._gRoutes[id].args }
      }
    }
  }
  if (_gRoutes.config) {
    if (_gRoutes.config.logs) { logs = { ...logs, ..._gRoutes.config.logs } }
    if (_gRoutes.config.args) { args = { ...args, ..._gRoutes.config.args } }
  }
  // re-set argv from _global_ namespace and re-apply from original argv
  const argv = { ...args, ..._argv }
  global.mitm.argv = argv
  if (_gRouter) {
    if (logs.websocket) {
      logs['mitm-mock'] = true
      logs['ws-connect'] = true
      logs['ws-message'] = true
      logs['ws-broadcast'] = true
    }
    _gRouter.config === undefined && (_gRouter.config = {})
    _gRouter.config.logs = { ..._logs(logs.silent), ...logs }
    _gRouter.config.args = args
    if (argv.debug || argv.verbose) {
      _gRouter.config.logs['mitm-mock'] = true
      _gRouter.config.logs['ws-connect'] = true
      _gRouter.config.logs['ws-message'] = true
      _gRouter.config.logs['ws-broadcast'] = true
    }
  }
}

module.exports = _setlogs
