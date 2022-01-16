// feat: profile
const {
  lib:{fs},
  fn:{logmsg},
} = global.mitm

module.exports = ({ data }) => {
  const { fpath, content } = data
  fs.writeFile(fpath, content, err0 => {
    err0 && logmsg('Error write file', fpath, err0)
  })
  return 'OK'
}
