const express = require('express')
const app = express()

module.exports = () => {
  const {path, fn: {_wsmitm, _wsclient}} = mitm

  app.use(express.static(path.home))
  app.use('/mitm-image', express.static(path.route));

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