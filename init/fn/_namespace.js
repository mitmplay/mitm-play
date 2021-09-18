module.exports = nspace => {
  const { router, routes } = global.mitm
  for (let id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      const {_childns: c} = routes[id]
      const _subns = c ? c._subns : '' // feat: chg to child namespace
      return  _subns || id
    }
  }
}
