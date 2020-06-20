const fs = require('fs-extra');

const rpath = require.resolve('../../socketclnt');
const _body = fs.readFileSync(rpath)+'';

module.exports = function () {
  const {argv,routes} = global.mitm;
  let _g = {
    argv,
    routes,
    files: {
      log_events: {},
      cache_events: {},
      route_events: {},
    }
  };
  _g = JSON.stringify(_g, null, 2);
  _g = `window.mitm = ${_g};\n_src()`;
  _g = _body.replace('_src()',`${_g}`);    
  return `window.mitm = ${_g}`;
};
