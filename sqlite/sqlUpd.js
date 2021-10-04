const c = require('ansi-colors')
const parse  = require('./parse')
const { logmsg } = global.mitm.fn

async function sqlUpd(data={}) {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlUpd')} ${msg}*)`))
    const {id, _add_, _where_, ...obj} = data
    obj.dtu = mitm.db.fn.now()
    let pre = mitm.db('kv')
    let updated
    if (_where_ && id) {
      updated = 'id & where detected, cannot update!'
    } else if (_where_ || id) {
      if (id) {
        pre = pre.where({id}).update(obj)
      } else {
        pre = pre.whereRaw(...parse(_where_)).update(obj)
      }
      logmsg(...Object.values(pre.toSQL().toNative()))
      updated = await pre
      if (updated===0 && _where_ && _add_) {
        pre = mitm.db('kv').insert(obj)
        logmsg(...Object.values(pre.toSQL().toNative()))
        updated = await pre
      }
    } else {
      updated = 'id OR where, cannot update!'
    }
    return updated  
  } catch (error) {
    return error
  }
}
module.exports = sqlUpd