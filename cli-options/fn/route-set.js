const c = require('ansi-colors');
const stringify = require('./stringify');
const typA = ['skip','exclude','noproxy','proxy'];
const typO = ['request','response','mock','cache','log','html','json','css','js'];

function routeSet(r, namespace, print=false) {  
  global.mitm.routes[namespace] = r;
  if (namespace==='_global_') {
    global.mitm.routes._global_.mock = {
      ...global.mitm.routes._global_.mock,
      ...global.mitm.__mock
    }
  }
  // Compile regex into router
  const router = {};
  const namespaces = [];
  const namespacer = {};
  router._namespace_ = new RegExp(`(^${namespace}|.${namespace})`);
  for (let typ of typA) {
    if (r[typ]) {
      router[typ] = {};
      for (let str of r[typ]) {
        const regex =  new RegExp(str);
        router[typ][str] = regex;
        if (namespace==='_global_') {
          namespaces.push(str);
          namespacer[str] = regex;
        }
      }  
    }
  }
  for (let typ of typO) {
    if (r[typ]) {
      router[typ] = {};
      for (let str in r[typ]) {
        const regex =  new RegExp(str);
        router[typ][str] = regex;
        const site = r[typ][str];
        if (namespace==='_global_') {
          namespaces.push(str);
          namespacer[str] = regex;
        }
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
  if (namespace==='_global_') {
    global.mitm.routes[namespace]._domain_ = namespaces;
    global.mitm.router[namespace]._domain_ = namespacer;
  }
  if (!global.mitm.data.nolog && global.mitm.argv.verbose) {
    const msg = `>> ${namespace}\n${stringify(global.mitm.routes[namespace])}`;
    print && console.log(c.blueBright(msg));  
  }
  return r;
}

module.exports = routeSet;
