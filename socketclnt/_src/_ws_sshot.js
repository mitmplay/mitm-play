const _ws_namespace = require('./_ws_namespace');

module.exports = () => {
  const {hostname: host} = location;
  let namespace = _ws_namespace();
  const route = window.mitm.routes[namespace];
  if (route && route.screenshot) {
    const {selector} = route.screenshot;
    document.querySelector('html').addEventListener('click', function(e) {
      const arr = document.querySelectorAll(selector);
      const fname = location.pathname
      .replace(/^\//,'')
      .replace(/\//g,'-');
      for (let el of arr) {
        let node = e.target;
        while (el!==node && node!==document.body) {
          node = node.parentNode;
        }
        if (node!==document.body) {
          window.ws__send('screenshot', {namespace, host, fname});
          return;
        }
      }
    });
  }
};
