const _match = require('./match');
const { addJS } = require('./fetch');
const _initWebsocket = require('../socketclnt');

function patchResponse(arr, {url, headers, method}) {
  const match = _match(url, 'patch');
  if (match) {
    arr.push(({status, headers, body}) => { 
      return {status, headers, body: addJS(body, match.rt.js)}; 
    });
  }
}

module.exports = patchResponse;
