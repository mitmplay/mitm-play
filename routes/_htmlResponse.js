const _match = require('./match');
const _fetch = require('./fetch');
const {script_src,e_end} = _fetch;

function htmlResponse(arr, reqs) {
  const match = _match('html', reqs);
  if (match) {
    arr.push(resp => {   
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/html')) {
        console.log(match.log);
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
