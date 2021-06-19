const { logmsg } = global.mitm.fn
// feat: markdown
module.exports = () => {
  const { __args, path, fn } = global.mitm 
  const { _sort } = fn
  const {app, route} = path
  const data = {_readme_: {}}
  global.mitm.files.markdown.forEach(fpath => {
    let fapp = fpath.replace(app, '')
    let froute = fpath.replace(route, '')
    let section = (fapp!==fpath && !fpath.match('/user-route/') ? '<b>Mitm-play</b>' : froute.split('/')[1])
    if (data[section]===undefined) {
      data[section] = {}
    }
    const arr = fpath.split('/')
    const title = arr.pop()
    const path = arr.join('/')
    // const content = global.mitm.source[fpath]
    if (fpath.match('mitm-play/README.md')) {
      section = '_readme_'
    }
    data[section][fpath] = {
      path,
      title,
      fpath,
      // content
    }
  })
  data['<b>Mitm-play</b>'] = _sort(data['<b>Mitm-play</b>'])
  if (__args.verbose) {
    logmsg(data)
  }
  return data
}
