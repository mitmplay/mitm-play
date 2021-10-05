module.exports = async ({data:{q, tbl} }) => {
  const rows = await mitm.fn.sqlList(q, tbl)
  return rows
}
