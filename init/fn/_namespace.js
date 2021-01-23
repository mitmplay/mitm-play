module.exports = nspace => {
  const { router, routes } = global.mitm
  for (let id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      const {_subns} = routes[id]
      const ns = _subns || id
      // console.log('R:',nspace, ns)
      return ns
    }
  }
}
