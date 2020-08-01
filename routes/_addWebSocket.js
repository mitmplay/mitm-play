const _match = require('./match');
const { script_src } = require('./inject');
const {fn: {tldomain,nameSpace}} = global.mitm;

const {matched,searchKey} = _match;

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
      const {headers: h, status} = resp;
      const contentType = h['content-type'];
      const redirect = (status+'').match(/^30\d/);
      if (!redirect && contentType.match('text/html')) {
        const jsLib = matched(searchKey('jsLib'), reqs);
        const js = ['mitm.js'];
        if (nameSpace(reqs.url)) {
          js.push('macros.js');
        }
        js.push('websocket.js');
        if (jsLib) {
          js.push.apply(js, jsLib.map(x => `jslib/${x}`));
        }
        resp.body = script_src(resp.body, js);
        // headerchg(h);
      }
      return resp;
    });
  }
}

module.exports = addWebSocket;
