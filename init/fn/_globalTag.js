const c = require('ansi-colors')

// feat: _global_.args
function _globalTag() {
  const {routes: {_global_}, __tag2} = global.mitm
  if (_global_.config===undefined) {
    _global_.config = {args: {}, logs: {}}
  } else {
    if (_global_.config.args===undefined) {
      _global_.config.args = {}
    }
    if (_global_.config.logs===undefined) {
      _global_.config.logs = {}
    }
  }

  let obj = {args: {}, logs: {}}
  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value) {
      const [id] = key.split(':')
      if (id==='args' || id==='logs') {
        obj[id] = {..._global_[key], ...obj[id]}
      }
    }
  }
  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value) {
      if (key.split(':')[0]==='config') {
        obj.args = {...obj.args, ..._global_[key].args}
        obj.logs = {...obj.logs, ..._global_[key].logs}
      }
    }
  }
  const cfg  = _global_.config
  const args = _global_.args ? {..._global_.args, ...cfg.args} : cfg.args
  const logs = _global_.logs ? {..._global_.logs, ...cfg.logs} : cfg.logs
  obj.args = {...obj.args, ...args}
  obj.logs = {...obj.logs, ...logs}
return obj  
}

module.exports = _globalTag
