const fs = require('fs-extra')
const https = require('https')
const WebSocket = require('ws')
const c = require('ansi-colors')
const website = require('./website')
const msgParser = require('./msg-parser')
const path = `${global.__app}/cert`

function noop() {}
function heartbeat() {
  console.log('pong:', this._page)
  this.isAlive = true;
}

module.exports = () => {
  const servers = https.createServer({
    cert: fs.readFileSync(`${path}/selfsigned.crt`),
    key: fs.readFileSync(`${path}/selfsigned.key`)
  }, website())

  const wss = new WebSocket.Server({ server: servers, path: '/ws' })
  wss.on('connection', connection)
  console.log(c.yellow('Listen:3001'))
  global.wsservers = wss
  servers.listen(3001)

  wss.isAlive = function(fn, ms=500) {
    // console.log('PING!!!')
    const arr = []
    wss.clients.forEach(function each(ws) {
      // console.log('init:', ws._page)
      ws.isAlive = false;
      arr.push(ws)
    });  
    setTimeout(() => {
      arr.forEach(function each(ws) {
        console.log(c.blueBright(`ping: ${ws._page}`))
        ws.ping(noop);
      });  
      setTimeout(() => {
        // console.log('Check status!!!')
        arr.forEach(function each(ws) {
          if (ws.isAlive === false) {
            console.log(c.redBright(`noresp: ${ws._page}`))
            ws.terminate()
          };
        });
        fn && fn(arr)
      }, 100)
    }, ms)
  }

  function connection (wsclient, request) {
    const { origin, host } = request.headers
    const { __flag } = global.mitm

    wsclient.isAlive = true;
    wsclient.on('pong', heartbeat);

    if (__flag['ws-connect']) {
      console.log(c.red('>>> ws-connect:'), `${c.redBright(host)}${c.blueBright(request.url)}`)
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
    wsclient._page = `${_host}:${page}`

    function incoming (data) {
      msgParser(wsclient, data)
    }

    wsclient.on('message', incoming)
    wsclient.send('connected')
  }
}
