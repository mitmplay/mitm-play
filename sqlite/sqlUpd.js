const {c} = global.mitm.lib
const parse = require('./parse')
const sqlIns = require('./sqlIns')
const sqlList = require('./sqlList') 
const {argv, fn: {logmsg}} = global.mitm

async function sqlUpd(data={}, tbl='kv') {
  try {
    let msg = JSON.stringify(data)
    msg = c.green(`set:${msg.length>97?`${msg.slice(0, 97)}...`:msg}`)
    logmsg(c.blueBright(`(*${c.redBright('sqlUpd')} ${msg}*)`))
    const {id, _upd_, _distinct_, _where_, _limit_, _offset_, _pages_, ...obj} = data
    obj.dtu = mitm.db.fn.now()
    let pre = mitm.db(tbl)
    let updated
    if (_upd_ && id) {
      updated = 'id & _upd_ detected, cannot update!'
    } else if (_upd_ || id) {
      if (id) {
        pre = pre.where({id}).update(obj)
      } else {
        pre = pre.whereRaw(...parse(_upd_)).update(obj)
      }
      if (argv.debug?.includes('W') || argv.showsql) {
        msg = Object.values(pre.toSQL().toNative()).join(' ')
        logmsg(msg.length>110?`${msg.slice(0,110)}...`:msg)
      }
      updated = await pre
      if (updated===0 && _upd_) {
        pre = mitm.db(tbl).insert(obj)
        if (argv.debug?.includes('W') || argv.showsql) {
          msg = Object.values(pre.toSQL().toNative()).join(' ')
          logmsg(msg.length>110?`${msg.slice(0,110)}...`:msg)
        }
        updated = await pre
      }
      if (_where_) {
        const result = await sqlList({_distinct_, _where_, _limit_, _offset_, _pages_}, tbl)
        result.updated = updated
        return result
      }
    } else {
      updated = 'No id OR where, cannot update!'
    }
    return {updated}  
  } catch (error) {
    console.log(c.red(JSON.stringify(error)))
    return error
  }
}
module.exports = sqlUpd
