module.exports = () => {
  const routes = {}
  const {
    __tag1,
    __tag2,
    __tag3,
    __tag4
  } = global.mitm
  const data = {
    routes,
    _tags_: {
      __tag1,
      __tag2,
      __tag3,
      __tag4
    }
  }
  for (const domain in global.mitm.routes) {
    const title = domain
    const { path } = global.mitm.routes[domain]
    const content = global.mitm.source[domain]
    routes[domain] = {
      path,
      title,
      content
    }
  }
  return data
}
