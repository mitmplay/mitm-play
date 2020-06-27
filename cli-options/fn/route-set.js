const c = require('ansi-colors');
const stringify = require('./stringify');

function routeSet(r, namespace, print=false) {
  r._regex_ = new RegExp(`(^${namespace}|.${namespace})`);
  global.mitm.routes[namespace] = r;
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
  return r;
}

module.exports = routeSet;
