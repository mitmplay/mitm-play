/* global WebSocket */
/* eslint-disable camelcase */
const _ws_msgParser = require('./_ws_msg-parser')
const _ws_inIframe = require('./_ws_in-iframe')
const _ws_vendor = require('./_ws_vendor')
const _c = 'color: #bada55'

module.exports = () => {
  window._ws_queue = {}
  window._ws_connected = false
  const {__args, __flag} = window.mitm

  if (window._ws_connect===undefined) {
    window._ws_connect = {}
  }

  const onopen = data => {
    function ws_send() {
      for (const key in window._ws_connect) {
        const fn = window._ws_connect[key]
        window._ws_connected_send = true
        console.log(`%cWs: ${fn+''}`, _c)
        fn(data)
      }
    }

    if (__flag['ws-connect']) {
      console.log('%cWs: open connection', _c)
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
      console.log('%cWs: close connection', _c)
    }
  }

  const onmessage = function (e) {
    if (__flag['on-message']) {
      console.log('%cWs: on-message:', _c, e.data)
    }
    _ws_msgParser(e, e.data)
  }
  
  const connect = __args.nosocket===undefined
  if (connect || (window.chrome && chrome.tabs)) {
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
  }
  if (__flag['ws-connect']) {
    console.log(`%cWs: ${connect ? 'init' : 'off'} connection`, _c)
  }
}
