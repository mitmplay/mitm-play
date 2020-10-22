module.exports = ({ data }) => {
  const client = {
    ...global.mitm.client,
    ...data
  }

  global.mitm.client = client
  const serial = JSON.stringify({ data: client })

  global.broadcast({ data: `_setClient${serial}` })
  return client
}
