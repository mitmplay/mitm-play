module.exports = ({ data }) => {
  const { folders } = data

  global.mitm.fn._clear({
    delete: 'log',
    folders
  })

  const json = { ok: 'OK' }
  console.log(data)
  return json
}
