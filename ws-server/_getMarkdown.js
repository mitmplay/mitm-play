// feat: markdown
module.exports = () => {
  const data = {}
  global.mitm.files.markdown.forEach(fpath => {
    const arr = fpath.split('/')
    const title = arr.pop()
    const path = arr.join('/')
    // const content = global.mitm.source[fpath]
    data[fpath] = {
      path,
      title,
      fpath,
      // content
    }
  })
  return data
}
