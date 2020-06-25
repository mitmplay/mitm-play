const {searchArr, matched} = require('./match');

function proxyRequest(reqs) {
  const {url} = reqs;
  const nopro = matched(searchArr({typ: 'noproxy', url}), reqs);
  const proxy = matched(searchArr({typ: 'proxy', url}), reqs);
  return nopro ? false : proxy;
}

module.exports = proxyRequest;
