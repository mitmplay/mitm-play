const c = require('ansi-colors');
const {matched} = require('./match');

function skipResponse(reqs) {
  const {url} = reqs;

  function search(namespace) {
    if (mitm.routes[namespace]) {
      const {skip} = mitm.routes[namespace];
      if (skip) {
        let result;
        for (let val of skip) {
          result = url.match(val);
          if (result) {
            console.log(c.grey(`>> skip (${val})`));
            return true;
          }
        }  
      }
    }
  };
  return matched(search, reqs);
}

module.exports = skipResponse;
