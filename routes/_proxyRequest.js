const {searchArr, matched} = require('./match');

function proxyRequest(reqs, _3d) {
  const {url} = reqs;
  const search1 = searchArr({typ: 'noproxy', url});
  const search2 = searchArr({typ: 'proxy', url});
  if (_3d) {
    const nopro = search1('_global_');
    const proxy = search2('_global_');
  } else {
    const nopro = matched(search1, reqs);
    const proxy = matched(search2, reqs);  
  }
  return nopro ? false : proxy;
}

module.exports = proxyRequest;
