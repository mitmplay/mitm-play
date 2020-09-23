const _logs = function(_silent=false) {
  return {
    'ws-receive':    _silent ? false : true,
    'ws-broadcast':  _silent ? false : true,
    'no-namespace':  _silent ? false : true,
    'referer-reqs':  _silent ? false : true,
    silent:  _silent ? false : false, //ok
    skip:    _silent ? false : true,
    nosocket:_silent ? false : true,
    request: _silent ? false : true,
    mock:    _silent ? false : true,
    cache:   _silent ? false : true,
    log:     _silent ? false : true,
    html:    _silent ? false : true,
    json:    _silent ? false : true,
    css:     _silent ? false : true,
    js:      _silent ? false : true,
    response:_silent ? false : true,
  }
}

function setRouterConfigLogs() {
  const {_global_: _g1} = global.mitm.__tag2;
  const {_global_: _g2} = global.mitm.routes;
  const {_global_: _g3} = global.mitm.router;
  let logs = {};
  if (_g1) {
    for (let id in _g1) {
      if (id.match('config:') && _g1[id]) {
        logs = {
          ...logs,
          ..._g2[id].logs,
        }
      }
    }
  }
  if (_g2.config && _g2.config.logs) {
    logs = {
      ...logs,
      ..._g2.config.logs,
    }  
  }
  if (_g3) {
    _g3.config===undefined && (_g3.config = {})
    _g3.config.logs = {
      ..._logs(logs.silent),
      ...logs
    };
  }  
}

module.exports = setRouterConfigLogs;
