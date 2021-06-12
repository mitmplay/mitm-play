const c = require('ansi-colors')
const WebSocket = require('ws')

module.exports = () => {
// ex: broadcast({data:"there"});
  function broadcast ({ data, _all }) {
    const { __flag } = global.mitm
    const pages = []
    const that = this
    data = typeof (data) === 'string' ? data : JSON.stringify(data)
    global.wsservers.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        if (_all || client !== that) {
          pages.push(client._page)
          client.send(data)
        }
      }
    })
    if (__flag['ws-broadcast']) {
      const msg = JSON.stringify(data)
      if (msg.length > 97) {
        console.log(c.blue('>>> ws-broadcast: `%s...`'), msg.slice(0, 97))
      } else {
        console.log(c.blue('>>> ws-broadcast: `%s`'), msg)
      }
    }
  }

  // ex: emitpage({data:"there", regex: "window"});
  function emitpage ({ data, regex }) {
    const pages = []
    data = typeof (data) === 'string' ? data : JSON.stringify(data)
    global.wsservers.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN && client._page.match(regex)) {
        pages.push(client._page)
        client.send(data)
      }
    })
    global.wsserver.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN && client._page.match(regex)) {
        pages.push(client._page)
        client.send(data)
      }
    })
    console.log('emitpage', data, pages)
  }
  global.broadcast = broadcast
  global.emitpage = emitpage

  return {
    broadcast,
    emitpage
  }
}
