const c = require('ansi-colors');
const stringify = require('./stringify');

function routeSet(routes, namespace, print=false) {
  global.mitm.routes[namespace] = routes;
  if (namespace==='default') {
    global.mitm.routes.default.mock = {
      ...global.mitm.routes.default.mock,
      ...global.mitm.__mock
    }
  }
  if (!global.mitm.data.nolog && global.mitm.argv.verbose) {
    const msg = `>> ${namespace}\n${stringify(global.mitm.routes[namespace])}`;
    print && console.log(c.blueBright(msg));  
  }
  return routes;
}

module.exports = routeSet;
