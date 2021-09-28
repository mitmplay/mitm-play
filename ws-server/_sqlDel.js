module.exports = async ({ data={} }) => {
  const rows = await mitm.db('kv').del().where(data)
  return rows
}
