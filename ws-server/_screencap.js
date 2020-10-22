module.exports = ({ data }) => {
  const { imageUrl, ...o } = data
  const json = { ok: 'OK' }
  console.log(o)
  return json
}
