module.exports =  () => {
  let {fn, argv: {proxy}} = global.mitm;
  const options = {headless: false};

  // Browser only support cli --proxy='httpp://proxy-with-value'
  // const _proxy = fn._proxy();
  // if (proxy===true && _proxy) {
  //   proxy = _proxy;
  // }
  if (typeof(proxy)==='string') {
    const bypass = fn._noproxy();
    global.mitm._noproxy = bypass;
    const match = proxy.match(/:\/\/([^:]+):([^@]+)@/);
    if (match) {
      const [,username,password] = match;
      const server = proxy.replace(`${username}:${password}@`, '');
      options.proxy = {
        bypass,
        server,
        username,
        password,
      }
    } else {
      const server = proxy;
      options.proxy = {
        bypass,
        server,
      }
    }
  }
  console.log('options', options);
  return options;
}
