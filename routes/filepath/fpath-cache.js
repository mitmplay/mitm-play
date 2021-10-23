const { root, filename } = require('./file-util')
const filePath = require('./file-path')

module.exports = async ({ reqs, match }) => {
  let { host, route: { at, path, file } } = match
  const { __args } = global.mitm
  const fpath = filename(match)
  let fpath1, fpath2;

  (at === undefined) && (at = '')

  let stamp1, stamp2
  if (at.match(/^\^/)) {
    at = at.slice(1)
    stamp1 = `${at}/${host}${fpath}`
    stamp2 = `${at}/${host}/$${fpath}`
  } else {
    at && (at = `/${at}`)
    stamp1 = `${host}${at}${fpath}`
    stamp2 = `${host}${at}/$${fpath}`
  }
  let otyp
  let _root
  if (typeof file === 'function') {
    file = file(reqs, match)
    if (file instanceof Promise) {
      file = await file
    }
    if (file===false) {
      return {fpath1: '', fpath2: ''} // feat: skip cache!
    }
    if (match.path) {
      path = match.path
    }
    otyp = typeof file
    if (otyp==='object') {
      file.path && (path = file.path)
      file.file && (file = file.file)
    }
  }
  if (file) {
    file = filePath(match, path, file)
    const apath = file.split('/')
    file = apath.pop()
    _root = apath.join('/')
  }
  if (_root === undefined) {
    _root = root(reqs, 'cache')
  }
  const { method } = reqs
  if (file) {
    const id = `${file}~${method}_`
    let fname = id
    // feat: activity
    if (__args.activity && match.route.seq) {
      const { activity } = global.mitm
      if (activity[id]===undefined) {
        activity[id] = -1
      }
      activity[id] += 1
      if (activity[id]>0) {
        const no = `${activity[id]}`
        fname += `${no.padStart(3, '0')}_`  // feat: seq
      }
    }
    fpath1 = `${_root}/${fname}`
    fpath2 = `${_root}/$/${fname}.json`
  } else {
    fpath1 = `${_root}/${stamp1}~${method}_`
    fpath2 = `${_root}/${stamp2}~${method}_.json`
  }
  return { fpath1, fpath2 }
}
