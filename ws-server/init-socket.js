const express = require('express')
const fs = require('fs-extra')
const https = require('https')
const WebSocket = require('ws')
const c = require('ansi-colors')
const msgParser = require('./msg-parser')
const path = `${global.__app}/cert`

module.exports = () => {
  const { fn: { _wsmitm, _wsclient }, router } = global.mitm
  const app = express()
  const servers = https.createServer({
    cert: fs.readFileSync(`${path}/selfsigned.crt`),
    key: fs.readFileSync(`${path}/selfsigned.key`)
  }, app)
  const wss = new WebSocket.Server({ server: servers, path: '/ws' })
  servers.listen(3001)

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

  function connection (client, request) {
    const { logs } = router._global_.config
    const { origin, host } = request.headers
    if (logs['ws-connect']) {
      console.log(c.red('connected'), `${host}${request.url}`)
    }
    let _host
    try {
      if (origin !== 'null') {
        _host = (new URL(origin)).host
      } else {
        _host = 'null'
      }
    } catch (error) {
      console.log(c.redBright('>>> Error init Socket'), error)
    }
    const page = request.url.match(/page=(\w+)/)[1]
    client._page = `${_host}:${page}`

    if (page === 'window' && !global.mitm._session_) {
      global.mitm.fn._session(_host)
    }

    function incoming (data) {
      msgParser(client, data)
    }

    client.on('message', incoming)
    client.send('connected')
  }
  wss.on('connection', connection)
  global.wsservers = wss
}
