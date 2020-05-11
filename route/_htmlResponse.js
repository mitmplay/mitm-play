const _match = require('./match');
const _fetch = require('./fetch');

function htmlResponse(arr, reqs) {
  const match = _match('html', reqs);
  if ((reqs.headers.accept+'').indexOf('text/html') > -1 && match) {
    arr.push(({status, headers, body}) => { 
      const el = _fetch[match.rt.el] || _fetch.e_end;
      return {status, headers, body: el(body, match.rt.js)}; 
    });
  }
}

module.exports = htmlResponse;
