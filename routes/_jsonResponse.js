const c = require('ansi-colors');
const _match = require('./match');
const {matched,searchFN} = _match;

function jsonResponse(reqs, responseHandler) {
  const search = searchFN('json', reqs);
  const match = matched(search, reqs);
  if (match) {
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('application/json')) {
        console.log(c.yellowBright(match.log));
        if (typeof(match.route)==='string') {
          resp.body = match.route;
        } else {        
          if (match.route.resp) {
            const resp2 = match.route.resp(resp);
            resp2 && (resp = {...resp, ...resp2});
          }
        }
      }
      return resp;
    });
  }
}

module.exports = jsonResponse;
