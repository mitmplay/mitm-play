module.exports = async ({ data='' }) => {
  const pre = mitm.db('kv').select('ns', 'grp', 'typ', 'name', 'value')
  let rows
  if (data) {
    rows = await pre.where(data)
  } else {
    rows = await pre
  }
  return rows
}
