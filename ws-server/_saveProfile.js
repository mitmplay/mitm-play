// feat: profile
const fs = require('fs-extra')

module.exports = ({ data }) => {
  const { fpath, content } = data
  fs.writeFile(fpath, content, err => {
    err && console.log('Error write file', fpath, err)
  })
  return 'OK'
}
