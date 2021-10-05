const c = require('ansi-colors')
const parse  = require('./parse')
const {argv, fn: {logmsg}} = global.mitm

async function sqlUpd(data={}, tbl='kv') {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlUpd')} ${msg}*)`))
    const {id, _add_, _where_, ...obj} = data
    obj.dtu = mitm.db.fn.now()
    let pre = mitm.db(tbl)
    let updated
    if (_where_ && id) {
      updated = 'id & where detected, cannot update!'
    } else if (_where_ || id) {
      if (id) {
        pre = pre.where({id}).update(obj)
      } else {
        pre = pre.whereRaw(...parse(_where_)).update(obj)
      }
      if (argv.debug) {
        logmsg(...Object.values(pre.toSQL().toNative()))
      }
      updated = await pre
      if (updated===0 && _where_ && _add_) {
        pre = mitm.db(tbl).insert(obj)
        if (argv.debug) {
          logmsg(...Object.values(pre.toSQL().toNative()))
        }
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