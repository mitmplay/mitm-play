module.exports = () => {
  const rpath = require.resolve('../socketclnt');
  const _body = global.mitm.fn.fs.readFileSync(rpath)+'';
  
  const _global_vars = () => {
    const {argv} = global.mitm;
    let _g = {argv};
    _g = JSON.stringify(_g, null, 2);
    _g = `window.mitm = ${_g};\n_src()`;
    _g = _body.replace('_src()',`${_g}`);
    return {body: `window.mitm = ${_g}`};
  };
  
  const mock = {
    '/mitm-play/websocket.js': {
      resp: _global_vars,
    },
  }
  global.mitm.__mock = mock;
  global.mitm.routes = {
    default: {mock}
  };
};
