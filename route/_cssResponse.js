const _match = require('./match');

function jsonResponse(arr, reqs) {
  const match = _match('css', reqs);
  if (match) {
    arr.push((resp) => {
      const contentType = `${headers['content-type']}`;
      if (contentType.match('text/css')) { 
        let resp2;
        if (match.rt.resp) {
          resp2 = match.rt.resp(resp);
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

module.exports = jsonResponse;
