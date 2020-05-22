const _match = require('./match');
const _fetch = require('./fetch');
const {matched,searchFN} = _match;
const {script_src,e_end} = _fetch;

function htmlResponse(arr, reqs) {
  const search = searchFN('html', reqs);
  const match = matched(search, reqs);
  if (match) {
    arr.push(resp => {   
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/html')) {
        const len = match.log.length;
        console.log(`${'-'.repeat(len)}\n${match.log}`);
        let resp2;
        if (match.route.resp) {
          resp2 = match.route.resp(resp);
        }
        resp = {
          ...resp,
          ...resp2,
        };
        if (match.route.js) {
          const inject = _fetch[match.route.el] || e_end;
          resp.body = inject(resp.body, match.route.js);
        }
        if (match.route.src) {     
          resp.body = script_src(resp.body, match.route.src);
        }
      }
      return resp;
    });
  }
}

module.exports = htmlResponse;
