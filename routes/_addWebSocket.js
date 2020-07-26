const { script_src, e_head } = require('./inject');
const {fn: {tldomain,nameSpace}} = global.mitm;

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

function addWebSocket(reqs, responseHandler) {
  if ((reqs.headers.accept+'').indexOf('text/html') > -1) {
    responseHandler.push(resp => {
      const {headers: h} = resp;
      const contentType = h['content-type'];
      if (contentType.match('text/html')) {
        const js = ['mitm.js'];
        if (nameSpace(reqs.url)) {
          js.push('macros.js');
        }
        js.push('websocket.js');
        js.push('chance.js');
        resp.body = script_src(resp.body, js);
        // headerchg(h);
      }
      return resp;
    });
  }
}

module.exports = addWebSocket;
