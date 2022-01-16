const initSocket = require('./init-socket')

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

module.exports = () => {
  logmsg(c.red('\n[ws-server/index.js]'))
  logmsg(c.whiteBright('RUN SERVER!'))
  initSocket()
}
