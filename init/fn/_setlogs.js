const _logs = function (_silent = false) {
  return {
    'ws-receive': !_silent,
    'ws-broadcast': !_silent,
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
  const { _global_: _g1 } = global.mitm.__tag2
  const { _global_: _g2 } = global.mitm.routes
  const { _global_: _g3 } = global.mitm.router
  let logs = {}
  if (_g1) {
    for (const id in _g1) {
      if (id.match('config:') && _g1[id]) {
        logs = {
          ...logs,
          ..._g2[id].logs
        }
      }
    }
  }
  if (_g2.config && _g2.config.logs) {
    logs = {
      ...logs,
      ..._g2.config.logs
    }
  }
  if (_g3) {
    _g3.config === undefined && (_g3.config = {})
    _g3.config.logs = {
      ..._logs(logs.silent),
      ...logs
    }
  }
}

module.exports = _setlogs
