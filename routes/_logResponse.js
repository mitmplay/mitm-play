const c = require('ansi-colors');
const _match = require('./match');
const logLazy = require('./log-lazy');
const logFlatten = require('./log-flatten');
const contentType = require('./content-type');

const {matched,searchFN} = _match;

function logResponse(arr, reqs) {
  const search = searchFN('log', reqs);
  const match = matched(search, reqs);
  if (match) {
    const {method} = reqs;
    arr.push(resp => {
      if (contentType(match, resp)) {
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
