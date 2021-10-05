module.exports = async ({data:{q, tbl} }) => {
  const deleted = await mitm.fn.sqlDel(q, tbl)
  return deleted
}
