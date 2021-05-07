const fs = require('fs-extra')
const rpath = require.resolve('../../ws-client/ws-client')

module.exports = function () {
  return fs.readFileSync(rpath) + ''
}
