module.exports = async ({ data }) => {
  const inserted = await mitm.fn.sqlIns(data)
  return inserted
}
