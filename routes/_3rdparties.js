const c = require('ansi-colors');
const nameSpace = require('./namespace');

function thirdparty({url, headers}) {
  const {tldomain} = global.mitm.fn;
  const {origin, referer} = headers;
  let domain = tldomain(url);

  if (!nameSpace(domain)) {
    if (origin && nameSpace(domain)) return;
    if (referer && nameSpace(referer)) return;
    console.log(c.redBright(`>> no-namespace (${domain})`));
    return {namespace: domain};
  }
}

module.exports = thirdparty;
