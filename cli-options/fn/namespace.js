module.exports = nspace => {
  const {routes} = global.mitm;
  for (let id in routes) {
    if (nspace.match(routes[id]._regex_)) {
      return id;
    }
  }
}
