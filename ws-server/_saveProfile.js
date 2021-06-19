// feat: profile
const fs = require('fs-extra')
const { logmsg } = global.mitm.fn

module.exports = ({ data }) => {
  const { fpath, content } = data
  fs.writeFile(fpath, content, err => {
    err && logmsg('Error write file', fpath, err)
  })
  return 'OK'
}
