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
    mock: !_silent,
    request: !_silent,
    cache: !_silent,
    html: !_silent,
    json: !_silent,
    css: !_silent,
    js: !_silent,
    log: !_silent,
    response: !_silent
  }
}

function _setlogs () {
  const { _argv, __tag2, routes, router, fn: { _globalTag } } = global.mitm
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
  const silent = _logs(logs.silent)
  global.mitm.argv = argv
  const logs2 = {}
  if (_gRouter) {
    if (logs.websocket) {
      logs2['ws-broadcast'] = true
      logs2['ws-message'] = true
      logs2['ws-connect'] = true
      logs2['mitm-mock']  = true
    }
    _gRouter.config === undefined && (_gRouter.config = {})
    if (argv.debug || argv.verbose) {
      logs2['ws-broadcast'] = true
      logs2['ws-message'] = true
      logs2['ws-connect'] = true
      logs2['frame-load'] = true
      logs2['page-load']  = true
      logs2['mitm-mock']  = true
      logs2['file-log']   = true
      logs2['file-md']    = true
    }
    _gRouter.config.logs = { ...silent, ...logs, ...logs2 }
    _gRouter.config.args = args
  }
  // feat: _global_.flag
  const gt = _globalTag()
  global.mitm.__args = { ...gt.args, ..._argv }  
  global.mitm.__flag = { ...silent,...gt.flag, ...logs2}
}

module.exports = _setlogs
