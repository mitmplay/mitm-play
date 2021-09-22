const c = require('ansi-colors')
const _global = require('./global')
const _client = require('./client')
const $getLog = require('./_getLog')
const $restart = require('./_restart')
const $autofill = require('./_autofill')
const $getCache = require('./_getCache')
const $getRoute = require('./_getRoute')
const $openHome = require('./_openHome')
const $codeHome = require('./_codeHome')
const $saveTags = require('./_saveTags')
const $saveRoute = require('./_saveRoute')
const $screencap = require('./_screencap')
const $clearLogs = require('./_clearLogs')
const $setClient = require('./_setClient')
const $openFolder = require('./_openFolder')
const $getContent = require('./_getContent')
const $getProfile = require('./_getProfile') // feat: profile
const $saveProfile = require('./_saveProfile')
const $getMarkdown = require('./_getMarkdown')
const $getMContent = require('./_getMContent')
const { logmsg } = global.mitm.fn

// accessible from client
const wscmd = {
  ..._global(),
  ..._client(),
  $getMContent,
  $getMarkdown,
  $saveProfile,
  $getProfile,
  $getContent,
  $openFolder,
  $setClient,
  $clearLogs,
  $screencap,
  $saveRoute,
  $saveTags,
  $openHome,
  $codeHome,
  $getRoute,
  $getCache,
  $autofill,
  $restart,
  $getLog
}
global.mitm.wscmd = wscmd

module.exports = async (client, data) => {
  const { __flag } = global.mitm
  const msg = `${data}`
  if (__flag['ws-message']) {
    const _msg = msg.length > 97 ? `${msg.slice(0, 97)}...` : msg
    logmsg(c.blue(`>>> ws-message:`),_msg)
  }
  const arr = msg.replace(/\s+$/, '').match(/^ *([\w:]+) *(\{.*)/)
  if (arr) {
    let [, cmd, json] = arr
    try {
      if (typeof (json) === 'string') {
        json = JSON.parse(json)
      }
    } catch (error) {
      console.error(json, error)
    }
    if (wscmd[cmd]) {
      wscmd[cmd].call(client, json)
    } else {
      const cmd2 = `$${cmd.split(':')[0]}`
      if (wscmd[cmd2]) {
        let data = wscmd[cmd2].call(client, json)
        if (data instanceof Promise) {
          data = await data
        }
        client.send(`${cmd}${JSON.stringify({ data })}`)
      }
    }
  }
}
