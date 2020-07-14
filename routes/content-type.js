function ctype(match, resp) {
  const atype = match.route.contentType;
  const ctype = resp.headers['content-type'];

  if (atype && ctype) {
    return atype.find(t => ctype.match(match.contentType[t]));
  } else {
    return false;
  }
}

const xtype = {
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  html: 'text/html',
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
