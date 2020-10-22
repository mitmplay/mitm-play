module.exports = nspace => {
  const { router, routes } = global.mitm
  for (const id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      return id
    }
  }
}
