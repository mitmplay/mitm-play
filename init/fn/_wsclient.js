const {fs} = global.mitm.lib
const rpath = require.resolve('../../ws-client/ws-client')

module.exports = function () {
  return fs.readFileSync(rpath) + ''
}
