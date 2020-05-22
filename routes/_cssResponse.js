const _match = require('./match');
const {matched,searchFN} = _match;

function cssResponse(arr, reqs) {
  const search = searchFN('css', reqs);
  const match = matched(search, reqs);
  if (match) {
    arr.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/css')) {
        console.log(match.log);
        if (typeof(match.route)==='string') {
          const token = match.route.match(/^[ \n]*=>/);
          if (token) {
            resp.body += match.route.replace(token[0],'');
          } else {
            resp.body = match.route;
          }
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

module.exports = cssResponse;
