const c = require('ansi-colors');
const stringify = require('./stringify');
const logs = require('./logs');

const typA = ['nosocket','skip','noproxy','proxy'];
const typO = ['request','response','mock','cache','log','html','json','css','js'];

function toRegex(str) {
  return new RegExp(str.replace(/\./g, '\\.').replace(/\?/g, '\\?'));
}

function routeSet(r, namespace, print=false) {  
  global.mitm.routes[namespace] = r;
  if (namespace==='_global_') {
    if (r.config) {
      if (r.config.logs) {
          r.config.logs = {
            ...logs(r.config.logs.silent),
            ...r.config.logs,
          }
      } else {
        r.config.logs = logs();
      }
    } else {
      r.config = {logs: logs()};
    }
    global.mitm.routes._global_.mock = {
      ...global.mitm.routes._global_.mock,
      ...global.mitm.__mock
    }
  }
  // Compile regex into router
  const router = {};
  router._namespace_ = toRegex(`(^${namespace}|.${namespace})`);
  for (let typ of typA) {
    if (r[typ]) {
      router[typ] = {};
      for (let str of r[typ]) {
        const regex = toRegex(str);
        router[typ][str] = regex;
      }  
    }
  }
  for (let typ of typO) {
    if (r[typ]) {
      router[typ] = {};
      for (let str in r[typ]) {
        const regex =  toRegex(str);
        router[typ][str] = regex;
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
            contentType[typ2] = toRegex(typ2);
          }
          router[typ][`${str}~contentType`] = contentType;
        }
      }
    }
  }
  global.mitm.router[namespace] = router;
  if (!global.mitm.data.nolog && global.mitm.argv.verbose) {
    const msg = `>> ${namespace}\n${stringify(global.mitm.routes[namespace])}`;
    print && console.log(c.blueBright(msg));  
  }
  return r;
}

module.exports = {
  routeSet,
  toRegex,
};
