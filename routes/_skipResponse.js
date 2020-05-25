const c = require('ansi-colors');
const {matched} = require('./match');
const nameSpace = require('./name-space');

function skipResponse(reqs) {
  const {url} = reqs;

  function search(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }
 
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
