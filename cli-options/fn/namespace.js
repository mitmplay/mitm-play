module.exports = nspace => {
  const {router,routes} = global.mitm;
  for (let id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      return id;
    }
  }
  for (let id in router._global_._domain_) {
    if (nspace.match(router._global_._domain_[id])) {
      return '_global_';
    }
  }
}
