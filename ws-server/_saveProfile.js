// feat: profile
const {fs} = global.mitm.lib

module.exports = ({ data }) => {
  const { fpath, content } = data
  fs.writeFile(fpath, content, err0 => {
    err0 && console.log('Error write file', fpath, err0)
  })
  return 'OK'
}
