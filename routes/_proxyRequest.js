const {searchArr, matched} = require('./match');
const typ = 'proxy';

function proxyRequest(reqs) {
  const {url} = reqs;
  return matched(searchArr({typ, url}), reqs);
}

module.exports = proxyRequest;
