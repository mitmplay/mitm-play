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
      // html: {
      //   '.+': {
      //     resp({headers}) {
      //       let csp = headers['content-security-policy'];
      //       csp && (csp[0] = csp[0].replace(/'(strict)[^ ]+/g, ''));
      //       return {headers}
      //     }
      //   }
      // },
      //   'www.google.com/search': {
      //     // resp,
      //     el: 'e_end', //or e_head
      //     js: [googlJS, hello], //JS is injected at the end of html body
      //   },
      // },
      // js: {'.js$': {resp}},
    }
  };
  // https://twitter.com/search?q=covid&src=typed_query  
  // console.log(`>> default\n${stringify(routes.default)}`);
};

// const googlJS = function() {
//   // remove unecessary html elements from google search result
//   document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
//   document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
//   document.querySelectorAll('.g-blk').forEach(n=>n.remove())
// };
