var brc = / *([)]+)/
var rmv = /(&&|\|\|)/
var lgc = /like|[<=>]{1}=?/i
var rgx = /(&& +[\w%_/(.):~]+ *|\|\| +[\w%_/(.):~]+ *|[\w%_/(.):~]+ *)(like|[<=>]?=?)(.+)/i
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
module.exports = parse

