module.exports = () => {
  const files = {}
  const {
    __tag1,
    __tag2,
    __tag3,
    __tag4
  } = global.mitm
  const data = {
    files,
    _tags_: {
      __tag1,
      __tag2,
      __tag3,
      __tag4
    }
  }
  for (const domain in global.mitm.routes) {
    const { path: fpath } = global.mitm.routes[domain]
    if (fpath) {
      const arr = fpath.split('/')
      arr.pop()
      const path = arr.join('/')
      const content = global.mitm.source[domain]
      const title = domain
      files[domain] = {
        path,
        title,
        fpath,
        content
      }
    }
  }
  return data
}
