const { script_src } = require('./fetch');

function replaceCSP(csp) {
  csp = csp.replace(/default-src[^;]+;/g, '');
  csp = csp.replace(/connect-src[^;]+;/g, '');
  csp = csp.replace(/script-src[^;]+;/g, '');
  csp = csp.replace(/style-src[^;]+;/g, '');
  return csp;
}

const headerchg = headers => {
  let csp;
  if (headers['content-security-policy']) {
    csp = replaceCSP(headers['content-security-policy']);
    headers['content-security-policy'] = csp;
  } else if (headers['content-security-policy-report-only']) {
    csp = replaceCSP(headers['content-security-policy-report-only']);
    headers['content-security-policy-report-only'] = csp;
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
