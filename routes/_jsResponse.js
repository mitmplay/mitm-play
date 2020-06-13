const c = require('ansi-colors');
const _match = require('./match');
const addReplaceBody = require('./add-replace-body');
const {matched,searchFN} = _match;

function jsResponse(reqs, responseHandler) {
  const search = searchFN('js', reqs);
  const match = matched(search, reqs);
  if (match) {
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('javascript')) {
        console.log(c.cyanBright(match.log));
        if (typeof(match.route)==='string') {
          resp.body = addReplaceBody(resp.body, match);
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

module.exports = jsResponse;
