const {searchArr, matched} = require('./match');
const typ = 'proxy';

function skipResponse(reqs) {
  const {url} = reqs;
  return matched(searchArr({typ, url}), reqs);
}

module.exports = skipResponse;
