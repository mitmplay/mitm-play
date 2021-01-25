const _root = /^[\t ]*\/((.+)|$)/
const _home = /^[\t ]*~(\/(.+)|$)/
const _route = /^[\t ]*\.\.\/(.+)/
const _nmspace = /^[\t ]*\.\/(.+)/

function detectHome(match, file) {
  const { fn: { home }, __args, routes } = global.mitm
  let fmatch, fpath

  file = file.trim()
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
        const nspace = match.namespace.split('@').pop()
        const nspath = `${__args.route}/${nspace}`
        if (fmatch) {
          fpath = `${nspath}/${fmatch[1]}`
        } else {
          const { _global_ } = global.mitm.routes
          const workspace = match.workspace || _global_.workspace
          fpath = workspace ? `${workspace}/${file}` : `${nspath}/${file}`
        }
      }
    }
  }
  return fpath
}

function filePath (match, path, file) {
  let fpath = ''

  if (path) {
    fpath += detectHome(match, path)
    fpath += file.trim()
  } else {
    fpath += detectHome(match, file)
  }

  let id = 1
  for (const key of match.arr.slice(1)) {
    fpath = fpath.replace(`:${id}`, key)
    id++
  }
  return fpath.replace(/\/\/+/,'/')
}

module.exports = filePath
