const {c} = global.mitm.lib
const parse = require('./parse')
const select = require('./select')
const sqlList = require('./sqlList') 
const {argv, fn: {logmsg}} = global.mitm

async function sqlIns(data={}, tbl='kv') {
  try {
    let msg = JSON.stringify(data)
    msg = c.green(`set:${msg.length>97?`${msg.slice(0, 97)}...`:msg}`)
    logmsg(c.blueBright(`(*${c.redBright('sqlIns')} ${msg}*)`))
    const {id, _del_, _hold_, _distinct_, _where_, _limit_, _offset_, _pages_, ...obj} = data
    obj.dtc = mitm.db.fn.now()
    obj.dtu = mitm.db.fn.now()
    let pre
    let arr
    let inserted
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
    if (argv.debug?.includes('W') || argv.showsql) {
      arr && logmsg(...arr)
      msg = Object.values(pre.toSQL().toNative()).join(' ')
      logmsg(msg.length>110?`${msg.slice(0,110)}...`:msg)
    }
    if (_where_) {
      const result = await sqlList({_distinct_, _where_, _limit_, _offset_, _pages_}, tbl)
      result.inserted = inserted
      return result
    }
    inserted = await pre
    return {inserted}
  } catch (error) {
    console.log(c.red(JSON.stringify(error)))
    return error
  }
}
module.exports = sqlIns
