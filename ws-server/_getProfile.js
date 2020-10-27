// feat: profile
module.exports = () => {
  const data = {}
  global.mitm.files.profile.forEach(fpath => {
    const arr = fpath.split('/')
    const title = arr.pop()
    const path = arr.join('/')
    const content = global.mitm.source[fpath]
    data[fpath] = {
      path,
      title,
      fpath,
      content
    }
  })
  return data
}
