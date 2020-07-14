const { 
  HTTP_PROXY, NO_PROXY,
  http_proxy, no_proxy,
} = process.env;

module.exports =  () => {
  const {argv: {proxy}} = global.mitm;
  const options = {headless: false};

  if (typeof(proxy)==='string') {
    let opts = {bypass: ''};
    opts.server = proxy;
    const match = opts.server.match(/(\w+):(\w+)@/);
    if (match) {
      const [,username,password] = match;
      opts.server = opts.server.replace(`${username}:${password}@`, '');
      options.proxy = {
        ...opts,
        username,
        password,
      }
    } else {
      options.proxy = {...opts}
    }
  }
  console.log('options', options);
  return options;
}
