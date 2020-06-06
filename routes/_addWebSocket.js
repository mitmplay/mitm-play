const { script_src } = require('./fetch');

const headerchg = headers => {
  if (headers['some-header-key']) {
    //action...
  }
}

function addWebSocket(arr, reqs) {
  if ((reqs.headers.accept+'').indexOf('text/html') > -1) {
    arr.push(resp => { 
      resp.body = script_src(resp.body, ['websocket.js']);
      headerchg(resp.headers);
      return resp;
    });
  }
}

module.exports = addWebSocket;
