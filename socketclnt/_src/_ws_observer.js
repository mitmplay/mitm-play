module.exports = () => {
  const {hostname: host} = location;
  let namespace, sshot = {}, nodes = {};
  for (let id in mitm.routes) {
    if (host.match(id)) {
      namespace = id;
      break;
    }
  }
  console.log('>> init screenshot');
  const route = mitm.routes[namespace];
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
    };
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
              ws__send('screenshot', {namespace, host, fname});
            }
          }
        } else {
          if (!nodes[id].remove) {
            nodes[id].remove = true
            nodes[id].insert = false;
            if (sshot[id].remove) {
              fname = location.pathname.replace(/^\//,'').replace(/\//g,'-');
              fname = `${fname}-${sshot[id].title}-remove`;
              ws__send('screenshot', {namespace, host, fname});
            }
          }
        }
      }
    }, 100);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });  
  })
}
