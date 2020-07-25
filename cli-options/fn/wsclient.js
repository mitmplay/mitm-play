const fs = require('fs-extra');

const rpath = require.resolve('../../socketclnt');
const _body = fs.readFileSync(rpath)+'';

module.exports = function ({url}) {
  const {argv, routes, client, fn} = global.mitm;
  const namespace = fn.nameSpace(url);
  let macros = [];
  if (namespace && routes[namespace].macros) {
    const m = {...routes[namespace].macros}
    for (let i in m) {
      macros.push(`\n    "${i}": ${m[i]+''}`);
    }
  }
  macros =  `,\n  "macros": {${macros.join(',')}\n  }\n}`
  let json = {
    argv,
    client,
    routes,
    files: {
      log_events: {},
      cache_events: {},
      route_events: {},
    },
  };
  json = JSON.stringify(json, null, 2);
  let result = json.replace(/\n}$/g, macros);
  result = `window.mitm = ${result};\n_src()`;
  return _body.replace('_src()',`${result}`);
};
