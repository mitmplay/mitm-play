const express = require('express')

module.exports = () => {
  const app = express()
  const { fn: { _wsmitm, _wsclient } } = global.mitm

  app.use(express.static(global.mitm.path.home))
  app.get('/mitm-play/mitm.js', (req, res) => {
    const _body = _wsmitm(req)
    res.type('.js')
    res.send(_body)
  })

  app.get('/mitm-play/websocket.js', (req, res) => {
    const _body = _wsclient()
    res.type('.js')
    res.send(_body)
  })

  app.get('/', (req, res) => {
    res.send('Hi Mitm-play!')
  })

  return app
}