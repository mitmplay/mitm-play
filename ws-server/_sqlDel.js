module.exports = async ({ data }) => {
  const deleted = await mitm.fn.sqlDel(data)
  return deleted
}
