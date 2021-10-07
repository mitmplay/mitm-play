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
        const parsed = parse(_where_)
        if (_limit_) {
          pre = select(mitm.db(tbl).select('id'), parsed).pre
          pre = pre.limit(_limit_).offset(_offset_===undefined ? 0 : _offset_)
          pre = mitm.db(tbl).where('id', 'in', pre)
          if (parsed[2]) {
            const order = parsed[2].map(x=>{
              const ord = x.split(':')
              if (ord.length===1) {
                return {column: ord[0], order: 'asc'}
              } else {
                return {column: ord[0], order: {a:'asc',d:'desc'}[ord[1]]}
              }
            })
            pre = pre.orderBy(order)
          }
        } else {
          pre = select(pre, parsed).pre
        }
        if (_pages_) {
          ttl = select(mitm.db(tbl), parsed).pre.count('id', {as: 'totalrow'})
          pagination = {
            limit: _limit_,
            offset: _offset_,
            ...(await ttl)[0],
          }
          if (parsed[2]) {
            pagination.orderby = parsed[2].join(' ')
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
      return {rows}
    }
  } catch (error) {
    return error
  }
}
module.exports = sqlList
