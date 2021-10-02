module.exports = async ({ data }) => {
  const updated = await mitm.fn.sqlUpd(data)
  return updated
}
