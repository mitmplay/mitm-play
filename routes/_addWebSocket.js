const { script_src } = require('./fetch');

function addWebSocket(arr, reqs) {
  if ((reqs.headers.accept+'').indexOf('text/html') > -1) {
    arr.push(resp => { 
      resp.body = script_src(resp.body, ['websocket.js']);
      return resp;
    });
  }
}

module.exports = addWebSocket;
