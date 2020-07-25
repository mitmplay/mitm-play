module.exports = () => {
  const {hostname: host} = location;
  let namespace;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  for (let key in window.mitm.routes) {
    if (host.match(toRegex(key))) {
      namespace = key;
      break;
    }
  }
  return namespace;
}