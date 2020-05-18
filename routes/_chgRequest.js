const {matched} = require('./match');

function chgRequest(reqs) {
  const {url} = reqs;

  function search(namespace) {
    if (mitm[namespace]) {
      let result;
      for (let key in mitm[namespace].routes.skip) {
        result = url.match(key);
        if (result) {
          return true;
        }
      }  
    }
  };
  return matched(search, reqs);
}

module.exports = chgRequest;
