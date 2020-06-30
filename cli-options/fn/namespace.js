module.exports = nspace => {
  const {router,routes} = global.mitm;
  for (let id in routes) {
    if (nspace.match(router[id]._namespace_)) {
      return id;
    }
  }
}
