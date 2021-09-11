/* eslint-disable camelcase */
const _ws_postmessage = require('./_ws_postmessage')
const _ws_initSocket = require('./_ws_init-socket')
const _ws_screenshot = require('./_ws_screenshot')
const _ws_location = require('./_ws_location')
const _ws_observer = require('./_ws_observer')
const _ws_general = require('./_ws_general')
const _ws_cspErr = require('./_ws_csp-err')
const _ws_macros = require('./_ws_macros')
const _c = 'color: red'

_ws_postmessage()
_ws_initSocket()
_ws_screenshot()
_ws_location()
_ws_observer()
_ws_general()
_ws_cspErr()
_ws_macros()
console.log('%cWs: ws-client loaded...', _c)

const {default: Hotkeys} = require('../svelte/Hotkeys.svelte')
window.mitm.svelte = {
  Hotkeys
}