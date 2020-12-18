const c = require('ansi-colors')

function checkOverWritten(id, obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (obj[id][key]!==value) {
      console.log(c.red(`Warning: overwritten ${id}.${key}`))
    }
  }
}

// feat: _global_.flag
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

  // _global_.config.args
  // _global_.config.logs
  let {args, logs: flag}  = _global_.config

  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value) {
      if (key.split(':')[0]==='config') {
        // ie: _global_['config:test'].args
        // ie: _global_['config:test'].flag
        args = {...args, ..._global_[key].args}
        flag = {...flag, ..._global_[key].logs}
      }
    }
  }
  // _global_.args
  // _global_.flag
  _global_.args && (args =  {...args, ..._global_.args})
  _global_.flag && (flag =  {...flag, ..._global_.flag})

  let obj = {args, flag}
  const _args = {...args}
  const _flag = {...flag}

  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value) {
      const [id] = key.split(':')
      if (id==='args' || id==='flag') {
        // ie: _global_['args:test'].args
        // ie: _global_['args:test'].flag
        obj[id] = {...obj[id], ..._global_[key]}
      }
    }
  }

  for (const [key, value] of Object.entries(_args)) {
    if (obj.args[key]!==value) {
      console.log(c.red(`Warning: overwritten args.${key}`))
    }
  }
  for (const [key, value] of Object.entries(_flag)) {
    if (obj.flag[key]!==value) {
      console.log(c.red(`Warning: overwritten flag.${key}`))
    }
  }
  return obj
}

module.exports = _globalTag
