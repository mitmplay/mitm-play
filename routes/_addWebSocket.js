const { script_src, e_head } = require('./inject');

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
      if (h['content-security-policy'] || h['content-security-policy-report-only']) {
        resp.body = script_src(resp.body, ['websocket.js']);
        headerchg(h);
      } else {
        let el = global.mitm.fn.wsclient();
        const script = `\n<script>${el}</script>\n`;
        let b = resp.body+'';
        let h = b.match(/<head[^>]*>/i);
        !h && (h = b.match(/<html[^>]*>/i));
      
        if (h) {
          b = b.replace(h[0], `${h[0]}${script}`);
        } else {
          b = `${script}${b}`;
        }
        resp.body = b;
      }
      return resp;
    });
  }
}

module.exports = addWebSocket;
