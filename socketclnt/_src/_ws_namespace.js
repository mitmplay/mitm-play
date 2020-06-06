module.exports = () => {
  const {hostname: host} = location;
  let namespace;
  for (let id in mitm.routes) {
    if (host.match(id)) {
      namespace = id;
      break;
    }
  }
  return namespace;
}