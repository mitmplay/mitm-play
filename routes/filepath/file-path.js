const _home = /^[\t ]*~\/(.+)/
const _route = /^[\t ]*\.\.\/(.+)/
const _nmspace = /^[\t ]*\.\/(.+)/

function filePath (file, match) {
  const { fn: { home }, argv, routes } = global.mitm
  let fmatch, fpath

  fmatch = file.match(_home)
  if (fmatch) {
    fpath = home(`~/${fmatch[1]}`)
  } else {
    fmatch = file.match(_route)
    if (fmatch) {
      fpath = `${argv.route}/${fmatch[1]}`
    } else {
      fmatch = file.match(_nmspace)
      if (fmatch) {
        fpath = `${argv.route}/${match.namespace}/${fmatch[1]}`
      } else {
        const { workspace: ws } = routes._global_
        const workspace = match.workspace || ws
        fpath = workspace ? `${workspace}/${file}` : file
      }
    }
  }
  return fpath
}

module.exports = filePath
