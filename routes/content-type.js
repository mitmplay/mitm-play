function ctype(match, resp) {
  const atype = match.route.contentType;
  const ctype = resp.headers['content-type'] || 'text';

  if (atype.length && ctype) {
    return atype.find(t => {
      const rgx = match.contentType[t]
      const rtn = ctype.match(rgx);
      return rtn;
    });
  } else {
    return false;
  }
}

const xtype = {
  js: 'application/javascript',
  json: 'application/json',
  map: 'application/json',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  html: 'text/html',
  text: 'text/plain',
  ico: 'image/x-icon',
  png: 'image/png',
  gif: 'image/gif',
  png: 'image/png',
  css: 'text/css',
};

module.exports = {
  ctype,
  xtype,
}
