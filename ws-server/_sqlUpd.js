module.exports = async ({data:{q, tbl} }) => {
  const updated = await mitm.fn.sqlUpd(q, tbl)
  return updated
}
