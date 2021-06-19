const { logmsg } = global.mitm.fn

module.exports = ({ data }) => {
  const { folders } = data

  global.mitm.fn._clear({
    delete: 'log',
    folders
  })

  const json = { ok: 'OK' }
  logmsg(data)
  return json
}
