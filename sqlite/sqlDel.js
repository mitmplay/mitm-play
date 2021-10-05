const c = require('ansi-colors')
const parse  = require('./parse')
const select = require('./select')
const {argv, fn: {logmsg}} = global.mitm

async function sqlDel(data, tbl='kv') {
  try {
    let arr
    let msg
    data = parse(data)
    let pre = mitm.db(tbl)
    if (Array.isArray(data)) {
      const [result, arr2] = data
      msg = c.green(`where:${result}, ${JSON.stringify(arr2)}`)
      pre = pre.whereRaw(...data).del()
    } else {
      msg = c.green(`where:${JSON.stringify(data)}`)
      const {id, _hold_, _limit_} = data
      if (_hold_) {
        pre = select(pre.select('id'), parse(_hold_)).pre
        pre = pre.limit(-1).offset(_limit_ || 1)
        pre = mitm.db(tbl).where('id', 'in', pre)
      }
      if (id) {
        pre = pre.orWhere({id})
      }
      pre = pre.del()
      arr = Object.values(pre.toSQL().toNative())
      await pre
    }
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlDel')} ${msg}*)`))
    if (argv.debug) {
      arr && logmsg(...arr)
      logmsg(...Object.values(pre.toSQL().toNative()))
    }
    const deleted = await pre
    return deleted
  } catch (error) {
    return error
  }
}
module.exports = sqlDel