const { e_head } = require('./fetch');
const _initWebsocket = require('../socketclnt');

function addWebSocket(arr, {url, headers, method}) {
  if ((headers.accept+'').indexOf('text/html') > -1) {
    arr.push(({status, headers, body}) => { 
      return {status, headers, body: e_head(body, _initWebsocket)}; 
    });
  }
}

module.exports = addWebSocket;
