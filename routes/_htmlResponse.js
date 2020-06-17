const c = require('ansi-colors');
const _match = require('./match');
const inject = require('./inject');
const {matched,searchFN} = _match;
const {script_src,e_end} = inject;

function htmlResponse(reqs, responseHandler) {
  const search = searchFN('html', reqs);
  const match = matched(search, reqs);
  if (match) {
    const {el, js, src, response} = match.route;
    responseHandler.push(resp => {   
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/html')) {
        const len = match.log.length;
        console.log(`${'-'.repeat(len)}\n${c.yellowBright(match.log)}`);
        if (typeof(match.route)==='string') {
          resp.body = match.route;
        } else {        
          if (response) {
            const resp2 = response(resp);
            resp2 && (resp = {...resp, ...resp2});
          }
          if (js) {
            const inject = inject[el] || e_end;
            resp.body = inject(resp.body, js);
          }
          if (src) {     
            resp.body = script_src(resp.body, src);
          }
        }
      }
      return resp;
    });
  }
}

module.exports = htmlResponse;
