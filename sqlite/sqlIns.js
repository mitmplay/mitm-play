const c = require('ansi-colors')
const parse  = require('./parse')
const select = require('./select')
const {argv, fn: {logmsg}} = global.mitm

async function sqlIns(data={}, tbl='kv') {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlIns')} ${msg}*)`))
    const {id, _del_, _hold_, _limit_, ...obj} = data
    obj.dtc = mitm.db.fn.now()
    obj.dtu = mitm.db.fn.now()
    let pre
    let arr
    if (_del_||_hold_) {
      if (_del_) {
        pre = select(mitm.db(tbl), parse(_del_)).pre.del()
        arr = Object.values(pre.toSQL().toNative())
        await pre
      }
      if (_hold_) {
        pre = select(mitm.db(tbl).select('id'), parse(_hold_)).pre
        pre = pre.limit(-1).offset(_limit_ || 1)
        pre = mitm.db(tbl).where('id', 'in', pre).del()
        arr = Object.values(pre.toSQL().toNative())
        await pre
      }
    }
    pre = mitm.db(tbl).insert(obj)
    if (argv.debug) {
      arr && logmsg(...arr)
      logmsg(...Object.values(pre.toSQL().toNative()))
    }
    return await pre
  } catch (error) {
    return error
  }
}
module.exports = sqlIns