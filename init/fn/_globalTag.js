const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

function checkOverWritten(id, obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (obj[id][key]!==value) {
      logmsg(c.red(`Warning: overwritten ${id}.${key}`))
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
  if (__tag2._global_===undefined) {
    __tag2._global_ = {}
  }

  // _global_.config.args
  // _global_.config.logs
  let {args, logs: flag}  = _global_.config

  for (const [key, value] of Object.entries(__tag2._global_)) {
    if (value.state) { // feat: reset __args
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
    if (value.state) { // feat: reset __args
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
      logmsg(c.red(`Warning: overwritten args.${key}`))
    }
  }
  for (const [key, value] of Object.entries(_flag)) {
    if (obj.flag[key]!==value) {
      logmsg(c.red(`Warning: overwritten flag.${key}`))
    }
  }
  // halt if it having incorrect args 
  if (obj.args.activity!==undefined && typeof obj.args.activity!=='string') {
    logmsg(c.red(`args.${c.yellow('activity')} must be a string!!!`))
    process.exit()
  }
  return obj
}

module.exports = _globalTag
