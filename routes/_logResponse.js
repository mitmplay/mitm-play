const c = require('ansi-colors');
const _match = require('./match');
const _ctype = require('./content-type');
const logLazy = require('./filesave/log-lazy');
const logFlatten = require('./filesave/log-flatten');

const {matched,searchFN} = _match;

function logResponse(arr, reqs) {
  const search = searchFN('log', reqs);
  const match = matched(search, reqs);
  if (match) {
    arr.push(resp => {
      if (_ctype(match, resp)) {
        console.log(c.bold.blueBright(match.log));
        if (mitm.argv.lazylog) {
          logLazy(match, reqs, resp);
        } else {
          logFlatten(match, reqs, resp);
        }
        if (match.route.resp) {
          const resp2 = match.route.resp(resp);
          resp2 && (resp = {...resp, ...resp2});
        }        
      }
      return resp; 
    });
  }
}

module.exports = logResponse;
