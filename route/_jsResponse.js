const _match = require('./match');

function jsResponse(arr, reqs) {
  const match = _match('js', reqs);
  if (match) {
    arr.push((resp) => {
      const contentType = `${headers['content-type']}`;
      if (contentType.match('application/javascript')) { 
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

module.exports = jsResponse;
