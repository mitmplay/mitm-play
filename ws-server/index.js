const initSocket = require('./init-socket')

const {c} = global.mitm.lib

module.exports = () => {
  console.log(c.red('[ws-server/index.js]'))
  console.log(c.red('RUN SERVER!'))
  initSocket()
}
