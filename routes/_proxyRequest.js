const {searchArr, matched} = require('./match');

function proxyRequest(reqs, _3d) {
  const {url} = reqs;
  const search1 = searchArr({typ: 'noproxy', url});
  const search2 = searchArr({typ: 'proxy', url});
  let nopro, proxy;
  if (_3d) {
    nopro = search1('_global_');
    proxy = search2('_global_');
  } else { //match to domain|origin|referer|_global_
    nopro = matched(search1, reqs);
    proxy = matched(search2, reqs);  
  }
  return nopro ? false : proxy;
}

module.exports = proxyRequest;
