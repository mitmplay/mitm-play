const c = require('ansi-colors');
const {fn: {tldomain,nameSpace}} = global.mitm;

function thirdparty({url, headers}) {
  const {origin, referer} = headers;
  const domain = tldomain(url);

  if (!nameSpace(domain)) {
    if (origin  && nameSpace((new URL(origin).host))) return;
    if (referer && nameSpace((new URL(referer).host))) return;
    return true;
  }
}

module.exports = thirdparty;
