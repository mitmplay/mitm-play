const fs = require('fs-extra')
const c = require('ansi-colors')

module.exports = () => ({
  generateBundle ({ file }, _, isWrite) {
    if (isWrite) {
      setTimeout(() => {
        let body = fs.readFileSync(file) + ''
        body = body.replace('module.exports = index;', 'index();')

        fs.writeFile(file, body, err => {
          err && console.log(c.redBright('>>> Error write bundle'), err)
        })
      }, 10)
    }
  }
})
