const _ws_namespace = require('./_ws_namespace');

module.exports = () => {
  const {hostname: host} = location;
  let namespace = _ws_namespace();

  function cspError(e) {
    const fname = location.pathname
    .replace(/^\//,'')
    .replace(/\//g,'-');
    const {
      blockedURI,
      disposition,
      documentURI,
      effectiveDirective,
      isTrusted,
      lineNumber,
      originalPolicy,
      referrer,
      sourceFile,
      timeStamp,
      type,
      violatedDirective,
    } = e;
    const cspviolation = {
      blockedURI,
      disposition,
      documentURI,
      effectiveDirective,
      isTrusted,
      lineNumber,
      originalPolicy,
      referrer,
      sourceFile,
      timeStamp,
      type,
      violatedDirective,
    };

    if (window.mitm.client.csp) {
      console.log('>> CSP:', cspviolation);
    }

    // window.ws__send('csp_error', {
    //   namespace,
    //   host,
    //   fname,
    //   cspviolation,
    // });
  };

  document.addEventListener('securitypolicyviolation', cspError);
}
  