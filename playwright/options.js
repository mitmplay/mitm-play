const { 
  HTTP_PROXY, NO_PROXY,
  http_proxy, no_proxy,
} = process.env;

module.exports =  () => {
  const options = {headless: false};
  let {argv: {proxy}} = global.mitm;

  let bypass = NO_PROXY || no_proxy || '';
  const _proxy = HTTP_PROXY || http_proxy;

  if (proxy===true && _proxy) {
    proxy = _proxy;
  }
  if (typeof(proxy)==='string') {
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
