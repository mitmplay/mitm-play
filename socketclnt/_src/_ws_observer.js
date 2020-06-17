const _ws_namespace = require('./_ws_namespace');
const _ws_vendor = require('./_ws_vendor');

module.exports = () => {
  const {hostname: host} = location;
  const namespace = _ws_namespace();
  const browser = _ws_vendor();
  let sshot = {}, nodes = {};
  
  const route = window.mitm.routes[namespace];
  if (route && route.screenshot) {
    const {observer: ob} = route.screenshot;
    for (let id in ob) {
      let el = {};
      if (ob[id]===true) {
        el = {
          title: 'notitle',
          insert: true,
          remove: true,
        }
      } else {
        let arr = ob[id].split(':');
        arr[1].split(',').map(e => {
          el[e] = true;
        })
        el.title = arr[0];
      }
      sshot[id] = el;
      nodes[id] = {
        insert: false,
        remove: true,
      };
    }
  }

  let debunk, fname;
  const callback = function() {
    debunk && clearTimeout(debunk);
    debunk = setTimeout(() => {
      for (let id in nodes) {
        const el = document.querySelectorAll(id);
        if (el.length) {
          if (!nodes[id].insert) {
            nodes[id].insert = true;
            if (nodes[id].remove!==undefined) {
              nodes[id].remove = false;
            }
            if (sshot[id].insert) {
              fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
              fname = `${fname}-${sshot[id].title}-insert`;
              window.ws__send('screenshot', {namespace, host, fname, browser});
            }
          }
        } else {
          if (!nodes[id].remove) {
            nodes[id].remove = true
            nodes[id].insert = false;
            if (sshot[id].remove) {
              fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
              fname = `${fname}-${sshot[id].title}-remove`;
              window.ws__send('screenshot', {namespace, host, fname, browser});
            }
          }
        }
      }
    }, 100);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });  
  })
}
