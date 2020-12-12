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
  const cfg  = _global_.config
  const args = _global_.args ? {...cfg.args, ..._global_.args} : cfg.args
  const logs = _global_.logs ? {...cfg.logs, ..._global_.logs} : cfg.logs

  let obj = {args, logs}
  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value) {
      if (key.split(':')[0]==='config') {
        obj = {...obj, ..._global_[key]}
      }
    }
  }
  for (const [key, value] of Object.entries(__tag2._global_)) {
    console.log(`${key}: ${value}`);
    if (value) {
      const [id] = key.split(':')
      if (id==='args' || id==='logs') {
        if (config) {
          obj[id] = {..._global_[key], ...obj[id]}
        }
      }
    }
  }
  return obj  
}

module.exports = _globalTag
