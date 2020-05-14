const _match = require('./match');

function cssResponse(arr, reqs) {
  const match = _match('css', reqs);
  if (match) {
    arr.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/css')) {
        console.log(match.log);
        let resp2;
        if (match.route.resp) {
          resp2 = match.route.resp(resp);
        }
        resp = {
          ...resp,
          ...resp2,
        };
      }
      return resp;
    });
  }
}

module.exports = cssResponse;
