module.exports = nspace => {
  const {router,routes} = global.mitm;
  for (let id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      return id;
    }
  }
  for (let id in router.default._domain_) {
    if (nspace.match(router.default._domain_[id])) {
      return 'default';
    }
  }
}
