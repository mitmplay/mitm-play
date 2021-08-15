const t64 = 'Wabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZh'
const _c = 'color: #bada55'

const nanoid = (size = 8) => {
  let id = ''
  while (size-- > 0) {
    id += t64[Math.random() * 64 | 0]
  }
  return id
}

module.exports = () => {
  const { _ws } = window

  // ex: ws_broadcast('_style{"data":{"q":"*","css":"color:blue;"}}')
  // ex: ws_broadcast('_ping{"data":"Hi!"}')
  window.ws_broadcast = (json, _all = true) => {
    const msg = { data: json, _all }
    _ws.send(`broadcast${JSON.stringify(msg)}`)
  }

  // ex: ws_emitpage('_style{"data":{"q":"*","css":"color:blue;"}}')
  // ex: ws_emitpage('_ping{"data":"Hi!"}')
  window.ws_emitpage = (json, regex = '') => {
    const msg = { data: json, regex }
    _ws.send(`emitpage${JSON.stringify(msg)}`)
  }

  // ex: ws__style({"q":"*","css":"color:blue;"})
  window.ws__style = (json, _all = true) => {
    const msg = { data: json, _all }
    _ws.send(`_style${JSON.stringify(msg)}`)
  }

  // ex: ws__ping('Hi!')
  window.ws__ping = (json) => {
    const msg = { data: json }
    _ws.send(`_ping${JSON.stringify(msg)}`)
  }

  // ex: ws__help()
  window.ws__help = () => {
    _ws.send('_help{}')
  }

  // ex: ws__open({url:'https://google.com'})
  window.ws__open = (json) => {
    const msg = { data: json }
    _ws.send(`_open${JSON.stringify(msg)}`)
  }

  window.ws__send = (cmd, data, handler) => {
    const { __flag } = window.mitm
    const id = nanoid()
    const key = `${cmd}:${id}`
    window._ws_queue[key] = handler || (w => {})

    setTimeout(function () {
      if (window._ws_queue[key]) {
        delete window._ws_queue[key]
        console.log('%cWs: ws timeout!', _c, key)
      }
    }, 5000)
    const params = `${key}${JSON.stringify({ data })}`
    _ws.send(params)
  }
}
