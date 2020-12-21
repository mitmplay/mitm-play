// feat: markdown
module.exports = () => {
  const data = {}
  const { _sortLength } = global.mitm.fn
  const {app, route} = global.mitm.path
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
    data[section][fpath] = {
      path,
      title,
      fpath,
      // content
    }
  })
  data['<b>Mitm-play</b>'] = _sortLength(data['<b>Mitm-play</b>'])
  return data
}
