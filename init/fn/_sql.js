var brc = / *([)]+)/
var rmv = /^(and|or) /i
var lgc = /like|[<=>]{1}=?/i
var rgx = /(or +[\w%_/(.):]+ *|and +[\w%_/(.):]+ *|[\w%_/(.):]+ *)(like|[<=>]?=?)(.+)/i

// parse('(field3 like ar% lol) or (wow = wew)')
// result: "(field3 like ?) OR (wow = ?)" arr: ['ar% lol', 'wew']
function parse(data, rcv=1) {
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
      const bracket = params.match(/ *([)]+)/)
      if (bracket) {
        params = params.replace(/ *([)]+)/,'')
        result += `?${bracket[1].trim()}`
      } else {
        result += `?`
      }
      arr2.push(params.trim())

    }
    console.log({data, whereRaw: `${result}, ${JSON.stringify(arr2)}`})
    data = [result, arr2]
  }
  return data
}

async function sqlList(data) {
  try {
    let pre = mitm.db('kv').select('*')
    if (data) {
      data = parse(data)
      if (Array.isArray(data)) {
        pre = pre.whereRaw(...data)
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
      pre = pre.whereRaw(...data)
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