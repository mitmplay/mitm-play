const { e_head, script_src } = require('./fetch');
const _initWebsocket = require('../socketclnt');

function addWebSocket(arr, reqs) {
  if ((reqs.headers.accept+'').indexOf('text/html') > -1) {
    arr.push(resp => { 
      return {
        ...resp,
        body: e_head(resp.body, [_initWebsocket])
      }; 
    });
  }
}

module.exports = addWebSocket;
