var rmv = /^(and|or) /i
var rgx = /(or +\w+ *|and +\w+ *|\w+ *)(LIKE|[<=>]?=?)(.+)/i

// where('field1 >= argument1 and field2 < argument2 or field3 like argument3')
// (11) ['field1 ', '>=', 'argument1 ', 'and', 'field2 ', '<', 'argument2 ', 'or', 'field3 ', 'like', 'argument3']
function parse(data) {
  if (typeof data==='string') {
    data = data.trim()
    let arr = data.match(rgx)
    if (arr) {
      data = arr.slice(1,4)
      let last = data.slice(-1)[0]
      if (last.match(rgx)) {
        data.pop()
        const pre = last.match(rmv)
        if (pre) {
          data = data.concat(pre[1].toUpperCase())
          last = last.replace(rmv, '')
        }
        data = data.concat(parse(last)).filter(x=>x!=='')
      } else if (data[1]==='') {
        data = data.join('')
      }
    }
    console.log('where:', data)
  }
  return data
}

function chain(pre, arr) {
  function builder() {
    let exc = this
    let cmd = 'where'
    let id = arr.indexOf('OR')
    if (id>-1) {
      const opt = arr.slice(0, id)
      exc = exc[cmd](...opt)
      arr = arr.slice(id+1)
      cmd = 'orWhere'
    } else {
      id = arr.indexOf('AND')
      if (id>-1) {
        const opt = arr.slice(0, id)
        exc = exc[cmd](...opt)
        arr = arr.slice(id+1)
        cmd = 'andWhere'
      } 
    }
    if (id>-1) {
      return builder.call(exc)
    } else {
      return exc[cmd](...arr)
    }

  }
  return pre.where(builder)
}

async function sqlList(data) {
  try {
    let pre = mitm.db('kv').select('*')
    if (data) {
      data = parse(data)
      if (Array.isArray(data)) {
        // pre = pre.where(...data)
        pre = chain(pre, data) 
      } else {
        pre = pre.where(data)
      }
    }
    const rows = await pre
    return rows      
  } catch (error) {
    return error
  }
}

async function sqlDel(data) {
  try {
    let pre = await mitm.db('kv').del()
    data = parse(data)
    if (Array.isArray(data)) {
      // pre = pre.where(...data)
      pre = chain(pre, data) 
    } else {
      pre = pre.where(data)
    }
    const deleted = await pre
    return deleted      
  } catch (error) {
    return error
  }
}

async function sqlIns(data={}) {
  try {
    const inserted = await mitm.db('kv').insert(data)
    return inserted      
  } catch (error) {
    return error
  }
}

module.exports = {
  sqlList,
  sqlIns,
  sqlDel,
}
// await mitm.fn.sqlIns({hst: 'demo2', grp: 'group2', typ: 'type2', name: 'name2', value: 'value2'})
// await mitm.fn.sqlList({})