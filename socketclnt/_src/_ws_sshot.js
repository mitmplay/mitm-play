module.exports = () => {
  const {hostname: host} = location;
  let namespace;
  for (let id in mitm.routes) {
    if (host.match(id)) {
      namespace = id;
      break;
    }
  }
  console.log('>> init screenshot');
  const route = mitm.routes[namespace];
  if (route && route.screenshot) {
    console.log('>> log screenshot');
    document.querySelector('html').addEventListener("click", function(e) {
      const arr = document.querySelectorAll(route.screenshot.selector);
      const fname = location.pathname
      .replace(/^\//,'')
      .replace(/\//g,'-');
      for (let el of arr) {
        let node = e.target;
        while (el!==node && node!==document.body) {
          node = node.parentNode;
        }
        if (node!==document.body) {
          ws__send('screenshot', {namespace, host, fname});
          return;
        }
      }
    });
  }
  // setTimeout(() => {
  //   ws__send('screenshot', {host});
  // }, 1000);
};
