const {searchArr, matched} = require('./match');

function skipResponse(reqs) {
  const {url} = reqs;
  const search = searchArr({typ: 'skip', url});
  return matched(search, reqs);
}

module.exports = skipResponse;
