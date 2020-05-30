module.exports = (match, resp) => {
  let atype = resp.headers['content-type'];
  let search = false;
  if (atype) {
    let ctype = atype[0];
    const {contentType} = match.route;
    if (contentType) {
      search = contentType.find(typ => ctype.match(typ));
    }
  }
  return search;   
}
