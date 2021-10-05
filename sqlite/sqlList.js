const c = require('ansi-colors')
const parse  = require('./parse')
const select = require('./select')
const {argv, fn: {logmsg}} = global.mitm

async function sqlList(data, tbl='kv') {
  try {
    let ttl
    let pagination
    let pre = mitm.db(tbl).select('*')
    if (data) {
      let msg
      data = parse(data)
      if (Array.isArray(data)) {
        const {pre:p, msg:m} = select(pre, data)
        pre = p 
        msg = m
      } else {
        msg = c.green(`where:${JSON.stringify(data)}`)
        const {_where_, _limit_, _offset_, _pages_} = data
        if (_limit_) {
          pre = select(mitm.db(tbl).select('id'), parse(_where_)).pre
          pre = pre.limit(_limit_).offset(_offset_!==undefined ? _offset_ : 0)
          pre = mitm.db(tbl).where('id', 'in', pre)
        } else {
          pre = select(pre, parse(_where_)).pre
        }
        if (_pages_) {
          ttl = select(mitm.db(tbl), parse(_where_)).pre.count('id', {as: 'ttl'})
          pagination = {
            limit: _limit_,
            offset: _offset_,
            ...(await ttl)[0],
          }  
        }
      }
      logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlList')} ${msg}*)`))
    } else {
      logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlList')}*)`))
    }
    if (argv.debug) {
      ttl && logmsg(...Object.values(ttl.toSQL().toNative()))
      logmsg(...Object.values(pre.toSQL().toNative()))
    }
    const rows = await pre
    if (pagination) {
      return {pagination, rows}
    } else {
      return rows
    }
  } catch (error) {
    return error
  }
}
module.exports = sqlList
