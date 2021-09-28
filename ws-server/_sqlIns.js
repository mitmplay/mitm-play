module.exports = async ({ data={} }) => {
  const result = await mitm.db('kv').insert(data)
  return result
}
