const c = require('ansi-colors')
const initSocket = require('./init-socket')
const { logmsg } = global.mitm.fn

module.exports = () => {
  logmsg(c.red('\n[ws-server/index.js]'))
  logmsg(c.whiteBright('RUN SERVER!'))
  initSocket()
}
