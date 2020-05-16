module.exports = (typ, {url, headers}) => {
  const {tldomain} = global.mitm.fn;
  let namespace = undefined;

  function search(namespace, referer) {
    // if (namespace==='googleapis.com' && typ==='js') {
    //   debugger;
    // }

    if (!mitm.routes[namespace]) {
      return;
    }

    const routes = mitm.routes[namespace][typ];
    let arr,log;
  
    for (let key in routes) {
      if (typ==='logs' || typ==='cache') {
        log = `>> ${typ} (${headers['content-type']}).match(${key})`;
        arr = (headers['content-type']+'').match(key);
      } else {
        const split = url.split(/([&?;,]|:\w|url)/);
        const path = `${split[0]}${split.length>1 ? '?' : ''}`;
        log = `>> ${typ} (${path}).match(${key})`;
        arr = path.match(key);
      }
      if (arr && routes[key]) {
        const {host, pathname} = new URL(url);
        return {
          route: routes[key],
          pathname,
          host,
          url,
          key,
          arr,
          log,
        }
      }
    }
  }

  let domain = tldomain(url);
  let match = search(domain);
  const tld = domain;

  if (!match && headers.referer) {
    domain = tldomain(headers.referer);
    match = search(domain);
  } 
  if (!match) {
    domain = 'default';
    match = search('domain');
  };
  // console.log('>> Match', tld, typ, !!match)
  return match;
}
