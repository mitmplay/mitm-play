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
    const {method} = reqs;
    arr.push(resp => {
      if (_ctype(match, resp)) {
        console.log(c.bold.blueBright(match.log));
        if (mitm.argv.lazylog) {
          logLazy(match, resp, method);
        } else {
          logFlatten(match, resp, method);
        }
      }
      return resp; 
    });
  }
}

module.exports = logResponse;
