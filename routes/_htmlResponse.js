const _match = require('./match');
const _fetch = require('./fetch');
const {e_end} = _fetch;

function htmlResponse(arr, reqs) {
  const match = _match('html', reqs);
  if (match) {
    arr.push((resp) => {
      
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/html')) {
        console.log(match.log);
        let resp2;
        if (match.rt.resp) {
          resp2 = match.rt.resp(resp);
        }
        resp = {
          ...resp,
          ...resp2,
        };
        if (match.rt.js) {
          const inject = _fetch[match.rt.el] || e_end;
          resp.body = inject(resp.body, match.rt.js);
        }
      }
      return resp;
    });
  }
}

module.exports = htmlResponse;
