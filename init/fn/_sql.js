const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

var brc = / *([)]+)/
var rmv = /(&&|\|\|)/
var lgc = /like|[<=>]{1}=?/i
var rgx = /(&& +[\w%_/(.):]+ *|\|\| +[\w%_/(.):]+ *|[\w%_/(.):]+ *)(like|[<=>]?=?)(.+)/i
var grp = {'&&': 'AND', '||': 'OR'}

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
        const match = last.match(rmv)
        if (match) {
          last = last.split(rmv)
          data = data.concat(last[0], match[0])
          last = last.slice(2).join('')
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
      v = v.trim()
      if (combine) {
        if (v.match(rmv)) {
          combine = false
          const bracket = params.match(brc)
          if (bracket) {
            params = params.replace(brc,'')
            v = `${bracket[1]} ${grp[v]}`
          } else {
            v = ` ${grp[v]}`
          }
          arr2.push(params.trim())
          result += `?${v} `
          params  = ''
        } else {
          params += v
        }
      } else {
        if (v.match(lgc)) {
          combine = true
          result += `${v.toUpperCase()} `
        } else {
          result += `${v} `
        }
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
      arr2.push(params)
    }
    data = [result, arr2, orderby]
  }
  return data
}

function select(pre, data) {
  let order = []
  const [result, arr2] = data
  let msg = c.green(`where:${result}`)
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
    msg +=  c.green(` orderby:${msg2}`)
  }
  msg +=`, ${JSON.stringify(arr2)}`
  pre.whereRaw(...(data.slice(0,2))).orderBy(order)
  return {pre, msg}
}

async function sqlList(data) {
  try {
    let pre = mitm.db('kv').select('*')
    if (data) {
      let msg
      data = parse(data)
      if (Array.isArray(data)) {
        const {pre:p, msg:m} = select(pre, data)
        pre = p 
        msg = m
      } else {
        msg = c.green(`where:${JSON.stringify(data)}`)
        pre = pre.where(data)
      }
      logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlList')} ${msg}*)`))
    } else {
      logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlList')}*)`))
    }
    console.log(...Object.values(pre.toSQL().toNative()))
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
      pre = pre.whereRaw(...data).del()
    } else {
      msg = c.green(`where:${JSON.stringify(data)}`)
      pre = pre.where(data).del()
    }
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlDel')} ${msg}*)`))
    console.log(...Object.values(pre.toSQL().toNative()))
    const deleted = await pre
    return deleted
  } catch (error) {
    return error
  }
}

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
        console.log(...Object.values(pre.toSQL().toNative()))
        await pre
      }
      if (_hold_) {
        pre = select(mitm.db('kv').select('id'), parse(_hold_)).pre
        pre = pre.limit(-1).offset(_limit_ || 1)
        pre = mitm.db('kv').where('id', 'in', pre).del()
        console.log(...Object.values(pre.toSQL().toNative()))
        await pre
      }
    }
    pre = mitm.db('kv').insert(obj)
    console.log(...Object.values(pre.toSQL().toNative()))
    return await pre
  } catch (error) {
    return error
  }
}

async function sqlUpd(data={}) {
  try {
    const msg = c.green(`set:${JSON.stringify(data)}`)
    logmsg(c.blueBright(`(*sqlite ${c.redBright('sqlUpd')} ${msg}*)`))
    const {id, _where_, ...obj} = data
    obj.dtu = mitm.db.fn.now()
    let pre = mitm.db('kv')
    let updated
    if (_where_ && id) {
      updated = 'id & where detected, cannot update!'
    } else if (_where_ || id) {
      if (id) {
        pre = pre.where({id}).update(obj)
      } else {
        pre = pre.whereRaw(...parse(_where_)).update(obj)
      }
      console.log(...Object.values(pre.toSQL().toNative()))
      updated = await pre
    } else {
      updated = 'id OR where, cannot update!'
    }
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