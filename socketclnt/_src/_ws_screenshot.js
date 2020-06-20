const _ws_namespace = require('./_ws_namespace');
const _ws_vendor = require('./_ws_vendor');

module.exports = () => {
  const {hostname: host} = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
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
          const params = {namespace, host, fname, browser};
          window.ws__send('screenshot', params);
          return;
        }
      }
    });
  }
};
