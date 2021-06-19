const { logmsg } = global.mitm.fn

module.exports = ({ data }) => {
  const { imageUrl, ...o } = data
  const json = { ok: 'OK' }
  logmsg(o)
  return json
}
