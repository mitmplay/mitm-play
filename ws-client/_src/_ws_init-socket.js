/* global WebSocket */
/* eslint-disable camelcase */
const _ws_msgParser = require('./_ws_msg-parser')
const _ws_inIframe = require('./_ws_in-iframe')

module.exports = () => {
  window._ws_queue = {}
  window._ws_connect = {}
  window._ws_connected = false

  const onopen = data => {
    console.timeEnd('ws: onopen')
    window._ws_connected = true
    for (const key in window._ws_connect) {
      console.warn(window._ws_connect[key] + '')
      window._ws_connect[key](data)
    }
  }

  const onclose = function () {
    console.log('ws: Connection is closed')
  }

  const onmessage = function (event) {
    _ws_msgParser(event, event.data)
  }

  const url = `wss://localhost:3001/ws?page=${_ws_inIframe()}&url=${document.URL.split('?')[0]}`
  const ws = new WebSocket(url)
  console.time('ws: onopen')
  window._ws = ws

  setTimeout(() => {
    ws.onopen = onopen
    ws.onclose = onclose
    ws.onmessage = onmessage
  }, 1) // minimize intermitten
}
