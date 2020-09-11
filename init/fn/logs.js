const logs = function(_silent=false) {
  return {
    'ws-receive':    _silent ? false : true,
    'ws-broadcast':  _silent ? false : true,
    'no-namespace':  _silent ? false : true,
    'browser-reqs':  _silent ? false : true,
    silent:  _silent ? false : false, //ok
    skip:    _silent ? false : false, //ok
    nosocket:_silent ? false : true, //ok
    request: _silent ? false : true, //ok
    mock:    _silent ? false : true, //ok
    cache:   _silent ? false : true, //ok
    log:     _silent ? false : true, //ok
    html:    _silent ? false : true, //ok
    json:    _silent ? false : true, //ok
    css:     _silent ? false : true, //ok
    js:      _silent ? false : true, //ok
    response:_silent ? false : true, //ok
  }
}

module.exports = logs;
