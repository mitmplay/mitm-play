module.exports = () => {
  const {fn: {fs,mock}} = global.mitm;

  const rpath = require.resolve('../socketclnt');
  const _body = fs.readFileSync(rpath)+'';
  
  const _global_vars = () => {
    const {argv} = global.mitm;
    let _g = {argv};
    _g = JSON.stringify(_g, null, 2);
    _g = `window.mitm = ${_g};\nsrc()`;
    _g = _body.replace('src()',`${_g}`);
    return {body: `window.mitm = ${_g}`};
  };
  
  global.mitm.routes = {
    default: {
      // cache: {'application/x-ww':  { ext: '.json' }},
      // log:   {'application/json':  { ext: '.json' }},
      // skip:  {'.(jpeg|jpg|png|svg|gif|ico|mp4)': {}},
      mock: {
        '/mitm-play/websocket.js': {
          resp: _global_vars,
        },
        '/mock': {resp: mock},
      },
    }
  };
};
