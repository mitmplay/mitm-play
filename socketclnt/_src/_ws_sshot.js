module.exports = () => {
  const {hostname: host} = location;
  let route;
  for (let id in mitm.routes) {
    if (host.match(id)) {
      route = mitm.routes[id];
      break;
    }
  }
  console.log('>> init sshot');
  if (document.body && route && route.sshot) {
    console.log('>> log sshot');
    document.body.addEventListener("click", e => {
      const arr = document.querySelectorAll(route.sshot);
      for (let id of arr) {
        if (e.target===arr[id]) {
          ws__send('sshot', {host});
          break;
        }
      }
    }, true);
  }
  setTimeout(() => {
    ws__send('sshot', {host});
  }, 1000);
};
