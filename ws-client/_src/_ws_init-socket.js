/* global WebSocket */
/* eslint-disable camelcase */
const _ws_msgParser = require('./_ws_msg-parser')
const _ws_inIframe = require('./_ws_in-iframe')
const _ws_vendor = require('./_ws_vendor')

module.exports = () => {
  window._ws_queue = {}
  window._ws_connected = false
  const { __flag } = window.mitm

  if (window._ws_connect===undefined) {
    window._ws_connect = {}
  }

  const onopen = data => {
    function ws_send() {
      for (const key in window._ws_connect) {
        window._ws_connected_send = true
        console.warn(window._ws_connect[key] + '')
        window._ws_connect[key](data)
      }
    }

    if (__flag['ws-connect']) {
      console.log('ws: open connection')
    }

    console.timeEnd('ws')
    window._ws_connected = true

    setTimeout(ws_send, 1) // minimize intermitten
    setTimeout(() => {
      if (!window._ws_connected_send) {
        console.error('RETRY..........')
        ws_send()
      }
    }, 10) // minimize intermitten     
  }

  const onclose = function () {
    if (__flag['ws-connect']) {
      console.log('ws: close connection')
    }
  }

  const onmessage = function (e) {
    // if (__flag['ws-connect']) {
    //   console.log('on-message:', e.data)
    // }
    _ws_msgParser(e, e.data)
  }
  
  const vendor = ['firefox', 'webkit'].includes(_ws_vendor())
  const pre = vendor ? 'ws' : 'wss'
  const prt = vendor ? '3002' : '3001'
  const url = `${pre}://localhost:${prt}/ws?page=${_ws_inIframe()}&url=${document.URL.split('?')[0]}`
  let ws
  try {
    ws = new WebSocket(url)    
  } catch (error) {
    console.error(error)
  }
  console.time('ws')
  window._ws = ws

  ws.onopen = onopen
  ws.onclose = onclose
  ws.onmessage = onmessage
  if (__flag['ws-connect']) {
    console.log('ws: init connection')
  }
}
