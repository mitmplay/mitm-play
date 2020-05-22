const _match = require('./match');
const {matched,searchFN} = _match;

function jsonResponse(arr, reqs) {
  const search = searchFN('json', reqs);
  const match = matched(search, reqs);
  if (match) {
    arr.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('application/json')) {
        console.log(match.log);
        if (typeof(match.route)==='string') {
          resp.body = match.route;
        } else {        
          let resp2;
          if (match.route.resp) {
            resp2 = match.route.resp(resp);
          }
          resp = {
            ...resp,
            ...resp2,
          };
        }
      }
      return resp;
    });
  }
}

module.exports = jsonResponse;
