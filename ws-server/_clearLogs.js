module.exports = ({ data }) => {
  const { browserName } = data

  global.mitm.fn._clear({
    delete: 'log',
    browserName
  })

  const json = { ok: 'OK' }
  console.log(data)
  return json
}
