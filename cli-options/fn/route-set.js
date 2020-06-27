const c = require('ansi-colors');
const stringify = require('./stringify');
const typA = ['skip','exclude','noproxy','proxy'];
const typO = ['request','response','mock','cache','log','html','json','css','js'];

function routeSet(r, namespace, print=false) {  
  global.mitm.routes[namespace] = r;
  if (namespace==='default') {
    global.mitm.routes.default.mock = {
      ...global.mitm.routes.default.mock,
      ...global.mitm.__mock
    }
  }
  const router = {};
  for (let typ of typA) {
    if (r[typ]) {
      router[typ] = {};
      for (let str of r[typ]) {
        router[typ][str] = new RegExp(str);
      }  
    }
  }
  for (let typ of typO) {
    if (r[typ]) {
      router[typ] = {};
      for (let str in r[typ]) {
        router[typ][str] = new RegExp(str);
        const site = r[typ][str];
        if (site && site.contentType) {
          const contentType = {};
          for (let typ2 of site.contentType) {
            if (contentType[typ2]) {
              const ct = site.contentType.join("', '");
              throw [
                `contentType should be unique:`,
                `${namespace}.${typ}['${str}'].contentType => ['${ct}']`];
            }
            contentType[typ2] = new RegExp(typ2);
          }
          router[typ][`${str}~contentType`] = contentType;
        }
      }
    }
  }
  global.mitm.router[namespace] = router;
  router._namespace_ = new RegExp(`(^${namespace}|.${namespace})`);
  if (!global.mitm.data.nolog && global.mitm.argv.verbose) {
    const msg = `>> ${namespace}\n${stringify(global.mitm.routes[namespace])}`;
    print && console.log(c.blueBright(msg));  
  }
  return r;
}

module.exports = routeSet;
