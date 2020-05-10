function patchReqHeader(route, {url, headers}) {
  headers = Object.assign({}, headers, {
    foo: 'bar', // set "foo" header
    origin: undefined, // remove "origin" header
  });      

  //console.log(url);
  route.continue({ headers });
}

module.exports = patchReqHeader;
