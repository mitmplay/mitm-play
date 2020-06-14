module.exports = (match, resp) => {
  const atype = match.route.contentType;
  const ctype = resp.headers['content-type'];

  if (atype && ctype) {
    return atype.find(t => ctype.match(t));
  } else {
    return false;
  }
}
