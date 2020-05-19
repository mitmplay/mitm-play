const _match = require('./match');
const {matched,searchFN} = _match;

function chgRequest(reqs) {
  const search = searchFN('headers', reqs);
  const match = matched(search, reqs);
  if (match) {
    console.log(match.log);
    const _headers = match.route;
    const {headers} = reqs;
    for (let key in _headers) {
      headers[key] = _headers[key];
    }
  };
}

module.exports = chgRequest;
