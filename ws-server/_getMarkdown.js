// feat: markdown
module.exports = () => {
  const { __args, path, fn } = global.mitm 
  const { _sortLength } = fn
  const {app, route} = path
  const data = {_readme_: {}}
  global.mitm.files.markdown.forEach(fpath => {
    let fapp = fpath.replace(app, '')
    let froute = fpath.replace(route, '')
    let section = (fapp!==fpath ? '<b>Mitm-play</b>' : froute.split('/')[1])
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
  const sorted = _sortLength(data['<b>Mitm-play</b>'])
  data['<b>Mitm-play</b>'] = sorted
  if (__args.verbose && __args.verbose.match('getMarkdown')) {
    console.log(data)
  }
  return data
}
