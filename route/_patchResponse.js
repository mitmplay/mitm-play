const _match = require('./match');
const _fetch = require('./fetch');
const _initWebsocket = require('../socketclnt');

function patchResponse(arr, {url, headers, method}) {
  const match = _match(url, 'patch');
  if ((headers.accept+'').indexOf('text/html') > -1 && match) {
    arr.push(({status, headers, body}) => { 
      const el = _fetch[match.rt.el] || _fetch.e_end;
      return {status, headers, body: el(body, match.rt.js)}; 
    });
  }
}

module.exports = patchResponse;
