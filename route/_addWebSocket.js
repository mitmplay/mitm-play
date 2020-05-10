const { addJS } = require('./fetch');
const _initWebsocket = require('../socketclnt');

function addWebSocket(arr, {url, headers, method}) {
  if (headers.accept && headers.accept.indexOf('text/html') > -1) {
    arr.push(({status, headers, body}) => { 
      return {status, headers, body: addJS(body, _initWebsocket)}; 
    });
  }
}

module.exports = addWebSocket;
