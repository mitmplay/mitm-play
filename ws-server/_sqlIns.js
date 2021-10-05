module.exports = async ({data:{q, tbl} }) => {
  const inserted = await mitm.fn.sqlIns(q, tbl)
  return inserted
}
