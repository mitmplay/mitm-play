const c = require('ansi-colors');
const _match = require('./match');
const addReplaceBody = require('./add-replace-body');
const {matched,searchFN} = _match;

function cssResponse(reqs, responseHandler, _3d) {
  const search = searchFN('css', reqs);
  const match =  _3d ? search('_global_') : matched(search, reqs);
  if (match) {
    const {response} = match.route;
    responseHandler.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('text/css')) {
        console.log(c.greenBright(match.log));
        if (typeof(match.route)==='string') {
          resp.body = addReplaceBody(resp.body, match);
        } else {        
          if (response) {
            const resp2 = response(resp);
            resp2 && (resp = {...resp, ...resp2});
          }
        }
      }
      return resp;
    });
  }
}

module.exports = cssResponse;
