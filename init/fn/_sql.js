const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

var brc = / *([)]+)/
var rmv = /^(and|or) /i
var lgc = /like|[<=>]{1}=?/i
var rgx = /(or +[\w%_/(.):]+ *|and +[\w%_/(.):]+ *|[\w%_/(.):]+ *)(like|[<=>]?=?)(.+)/i

// parse('(field3 like ar% lol) or (wow = wew)')
// result: "(field3 like ?) OR (wow = ?)" arr: ['ar% lol', 'wew']
function parse(data, rcv=1) {
  let orderby = []
  if (typeof data==='string') {
    data = data.trim()
    if (rcv===1) {
      const order = data.split(/orderby +/i)
      if(order.length>1) {
        data = order[0]
        orderby = order[1].split(/ +/)
      }
    }
    let arr = data.match(rgx)
    if (arr) {
      data = arr.slice(1,4)
      let last = data.slice(-1)[0]
      if (last.match(rgx)) {
        data.pop()
        const pre = last.match(rmv)
        if (pre) {
          data = data.concat(pre[0].toUpperCase())
          last = last.replace(rmv, '')
        }
        data = data.concat(parse(last, 0)).filter(x=>x!=='')
      } else if (data[1]==='') {
        data = data.join('')
      }
    }
  }
  if (rcv===1 && Array.isArray(data)) {
    let arr2 = []
    let params = ''
    let result = ''
    let combine = false
    for (let v of data) {
      if (combine) {
        if (v.match(rmv)) {
          combine = false
          const bracket = params.match(brc)
          if (bracket) {
            params = params.replace(brc,'')
            v = `${bracket[1]} ${v}`
          } else {
            v = ` ${v}`
          }
          arr2.push(params.trim())
          result += `?${v}`
          params  = ''
        } else {
          params += v
        }
      } else {
        if (v.match(lgc)) {
          combine = true
        } 
        result += v==='like' ? 'LIKE ' : v
      }
    }
    if (params) {
      const bracket = params.match(brc)
      if (bracket) {
        params = params.replace(brc,'')
        result += `?${bracket[1].trim()}`
      } else {
        result += `?`
      }
      arr2.push(params.trim())

    }
    data = [result, arr2, orderby]
  }
  return data
}

async function sqlList(data) {
  try {
    let pre = mitm.db('kv').select('*')
    if (data) {
      let msg
      let order = []
      data = parse(data)
      if (Array.isArray(data)) {
        const [result, arr2] = data
        msg = c.green(`where:${result}, ${JSON.stringify(arr2)}`)
        if (data.length>2 && data[2].length) {
          order = data[2].map(x=>{
            const ord = x.split(':')
            if (ord.length===1) {
              return {column: ord[0], order: 'asc'}
            } else {
              return {column: ord[0], order: {a:'asc',d:'desc'}[ord[1]]}
            }
          })
          const msg2 = order.map(x=>Object.values(x).join(' ')).join(', ')
          msg += ` order:${msg2}`
        }
        pre = pre.whereRaw(...(data.slice(0,2))).orderBy(order)
      } else {
        msg = c.green(`where:${JSON.stringify(data)}`)
        pre = pre.where(data)
      }
      logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlList')} ${msg}*)`))
    }
    const rows = await pre
    return rows
  } catch (error) {
    return error
  }
}

async function sqlDel(data) {
  try {
    let msg
    data = parse(data)
    let pre = mitm.db('kv')
    if (Array.isArray(data)) {
      const [result, arr2] = data
      msg = c.green(`where:${result}, ${JSON.stringify(arr2)}`)
      pre = pre.whereRaw(...data)
    } else {
      msg = c.green(`where:${JSON.stringify(data)}`)
      pre = pre.where(data)
    }
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlDel')} ${msg}*)`))
    const deleted = await pre.del()
    return deleted
  } catch (error) {
    return error
  }
}

async function sqlIns(data={}) {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlIns')} ${msg}*)`))
    data = {
      ...data,
      dtc: mitm.db.fn.now(),
      dtu: mitm.db.fn.now()
    }
    const inserted = await mitm.db('kv').insert(data)
    return inserted
  } catch (error) {
    return error
  }
}

async function sqlUpd(data={}) {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlUpd')} ${msg}*)`))
    const {id, ...obj} = data
    obj.dtu = mitm.db.fn.now()
    const updated = await mitm.db('kv').where({id}).update(obj)
    return updated
  } catch (error) {
    return error
  }
}

module.exports = {
  sqlList,
  sqlIns,
  sqlUpd,
  sqlDel,
}
// await mitm.fn.sqlIns({hst: 'demo2', grp: 'group2', typ: 'type2', name: 'name2', value: 'value2'})
// await mitm.fn.sqlIns({hst: 'demo3', grp: 'group3', typ: 'type3', name: 'name3', value: 'value3'})
// await mitm.fn.sqlList({})