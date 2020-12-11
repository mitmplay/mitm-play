const { root, filename } = require('./file-util')
const filePath = require('./file-path')

module.exports = ({ match, reqs }) => {
  let { host, route: { at, path, file } } = match
  const { argv, activity } = global.mitm
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
  let _root
  if (path) {
    _root = filePath(path, match)
  }
  if (typeof file === 'function') {
    file = file(reqs, match)
  }
  if (file) {
    file = filePath(file, match, path)
    if (_root === undefined) {
      const apath = file.split('/')
      file = apath.pop()
      _root = apath.join('/')
    }
  }
  if (_root === undefined) {
    _root = root(reqs, 'cache')
  }
  const { method } = reqs
  if (file) {
    let fname = `${file}~${method}`
    // feat: activity
    if (argv.activity && match.route.recs) {
      const activity = global.mitm.activity
      if (activity[fname]===undefined) {
        activity[fname] = -1
      }
      activity[fname] += 1
      if (activity[fname]>0) {
        fname += `@${activity[fname]}`
      }
    }
    fpath1 = `${_root}/${fname}`
    fpath2 = `${_root}/$/${fname}.json`
  } else {
    fpath1 = `${_root}/${stamp1}~${method}`
    fpath2 = `${_root}/${stamp2}~${method}.json`
  }
  return { fpath1, fpath2 }
}
