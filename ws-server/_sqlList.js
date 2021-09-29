module.exports = async ({ data }) => {
  const rows = await mitm.fn.sqlList(data)
  return rows
}
