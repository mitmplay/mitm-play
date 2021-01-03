const fs = require('fs-extra')
const https = require('https')
const WebSocket = require('ws')
const c = require('ansi-colors')
const website = require('./website')
const msgParser = require('./msg-parser')
const path = `${global.__app}/cert`

module.exports = () => {
  const servers = https.createServer({
    cert: fs.readFileSync(`${path}/selfsigned.crt`),
    key: fs.readFileSync(`${path}/selfsigned.key`)
  }, website())

  const wss = new WebSocket.Server({ server: servers, path: '/ws' })
  wss.on('connection', connection)
  console.log('Listen:3001')
  global.wsservers = wss
  servers.listen(3001)  

  function connection (client, request) {
    const { origin, host } = request.headers
    const { __flag } = global.mitm
    if (__flag['ws-connect']) {
      console.log(c.red('>>> ws-connect:'), `${host}${request.url}`)
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

    function incoming (data) {
      msgParser(client, data)
    }

    client.on('message', incoming)
    client.send('connected')
  }
}
