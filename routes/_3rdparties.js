const c = require('ansi-colors');
const nameSpace = require('./namespace');

function thirdparty({url, headers}) {
  const {origin, referer} = headers;
  const {
    spliter,
    fn: {tldomain}
  } = global.mitm;

  let domain = tldomain(url);

  if (!nameSpace(domain)) {
    if (origin && nameSpace(domain)) return;
    if (referer && nameSpace(referer)) return;
    console.log(c.redBright(`>> no-namespace (${url.split(spliter)[0]})`));
    return {namespace: domain};
  }
}

module.exports = thirdparty;
