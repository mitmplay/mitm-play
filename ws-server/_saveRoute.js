const fs = require('fs-extra')
const { logmsg } = global.mitm.fn

module.exports = ({ data }) => {
  const { fpath, content } = data
  fs.writeFile(fpath, content, err0 => {
    err0 && logmsg('Error write file', fpath, err0)
  })
  return 'OK'
}
