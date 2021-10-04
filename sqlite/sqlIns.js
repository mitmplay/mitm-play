const c = require('ansi-colors')
const parse  = require('./parse')
const select = require('./select')
const { logmsg } = global.mitm.fn

async function sqlIns(data={}) {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlIns')} ${msg}*)`))
    const {id, _del_, _hold_, _limit_, ...obj} = data
    obj.dtc = mitm.db.fn.now()
    obj.dtu = mitm.db.fn.now()
    let pre
    if (_del_||_hold_) {
      if (_del_) {
        pre = select(mitm.db('kv'), parse(_del_)).pre.del()
        logmsg(...Object.values(pre.toSQL().toNative()))
        await pre
      }
      if (_hold_) {
        pre = select(mitm.db('kv').select('id'), parse(_hold_)).pre
        pre = pre.limit(-1).offset(_limit_ || 1)
        pre = mitm.db('kv').where('id', 'in', pre).del()
        logmsg(...Object.values(pre.toSQL().toNative()))
        await pre
      }
    }
    pre = mitm.db('kv').insert(obj)
    logmsg(...Object.values(pre.toSQL().toNative()))
    return await pre
  } catch (error) {
    return error
  }
}
module.exports = sqlIns