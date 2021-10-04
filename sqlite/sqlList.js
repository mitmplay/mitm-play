const c = require('ansi-colors')
const parse  = require('./parse')
const select = require('./select')
const { logmsg } = global.mitm.fn

async function sqlList(data) {
  try {
    let pagination
    let pre = mitm.db('kv').select('*')
    if (data) {
      let msg
      let ttl
      data = parse(data)
      if (Array.isArray(data)) {
        const {pre:p, msg:m} = select(pre, data)
        pre = p 
        msg = m
      } else {
        msg = c.green(`where:${JSON.stringify(data)}`)
        const {_where_, _limit_, _offset_, _pages_} = data
        if (_limit_) {
          pre = select(mitm.db('kv').select('id'), parse(_where_)).pre
          pre = pre.limit(_limit_).offset(_offset_!==undefined ? _offset_ : 0)
          pre = mitm.db('kv').where('id', 'in', pre)
        } else {
          pre = select(pre, parse(_where_)).pre
        }
        if (_pages_) {
          ttl = select(mitm.db('kv'), parse(_where_)).pre.count('id', {as: 'ttl'})
          logmsg(...Object.values(ttl.toSQL().toNative()))
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
    logmsg(...Object.values(pre.toSQL().toNative()))
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
