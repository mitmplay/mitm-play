const {fs} = global.mitm.lib
const _path = require('path')

function flist (path, file = false) {
  path = _path.normalize(path).replace(/\\/, '/')
  const filter = f => {
    const ls = fs.lstatSync(`${path}/${f}`)
    const fl = ls.isFile()
    return file ? fl : !fl
  }
  const exist = fs.existsSync(path)
  return exist ? fs.readdirSync(path).filter(filter) : []
}

module.exports = flist
