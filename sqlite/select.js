const {c} = global.mitm.lib

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
module.exports = select