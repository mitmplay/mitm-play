const _root = /^[\t ]*\/((.+)|$)/
const _home = /^[\t ]*~(\/(.+)|$)/
const _route = /^[\t ]*\.\.\/(.+)/
const _nmspace = /^[\t ]*\.\/(.+)/

function filePath (file, match, path) {
  const { fn: { home }, __args, routes } = global.mitm
  let fmatch, fpath

  if (path) {
    fpath = file
  } else {
    fmatch = file.match(_root)
    if (fmatch) {
      fpath = fmatch[1] ? `/${fmatch[1]}` : '/'
    } else {
      fmatch = file.match(_home)
      if (fmatch) {
        fpath = fmatch[1] ? home(`~/${fmatch[1]}`) : home(`~`)
      } else {
        fmatch = file.match(_route)
        if (fmatch) {
          fpath = `${__args.route}/${fmatch[1]}`
        } else {
          fmatch = file.match(_nmspace)
          const nspath = `${__args.route}/${match.namespace}`
          if (fmatch) {
            fpath = `${nspath}/${fmatch[1]}`
          } else {
            const { workspace: ws } = routes._global_
            const workspace = match.workspace || ws
            fpath = workspace ? `${workspace}/${file}` : `${nspath}/${file}`
          }
        }
      }
    }
  }
  let id = 1
  for (const key of match.arr.slice(1)) {
    fpath = fpath.replace(`:${id}`, key)
    id++
  }
  return fpath.replace(/\/\/+/,'/')
}

module.exports = filePath
