module.exports = (match, resp) => {
  const ctype = resp.headers['content-type'];
  const atype = match.route.contentType;
  let search = false;
  if (atype && ctype) {
    search = atype.find(t => ctype.match(t));
  }
  return search;
}
