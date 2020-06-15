const _match = require('./match');
const _ctype = require('./content-type');

const {matched,searchFN} = _match;

function allRequest(reqs, responseHandler) {
  const search = searchFN('response', reqs);
  const match = matched(search, reqs);
  if (match) {
    const {response, contentType} = match.route;
    responseHandler.push(resp => {
      if (response) {
        if (contentType===undefined || _ctype(match, resp)) {
          const resp2 = response(resp);
          resp2 && (resp = {
            ...resp,
            ...resp2
          });
        }
      }
      return resp;
    });
  }
}

module.exports = allRequest;
