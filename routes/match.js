const searchFN = (typ, {url, headers}) => {
  return function search(namespace) {
    if (!mitm.routes[namespace]) {
      return;
    }

    const routes = mitm.routes[namespace][typ];
  
    for (let key in routes) {
      const split = url.split(/([&?;,]|:\w|url)/);
      const path = `${split[0]}${split.length>1 ? '?' : ''}`;
      const arr = path.match(key);

      if (arr && routes[key]) {
        const {host, pathname} = new URL(url);
        const log = `>> ${typ} (${path}).match(${key})`;
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
  };
};

const matched = (search, {url, headers}) => {
  const {tldomain} = global.mitm.fn;

  let domain = tldomain(url);
  let match = search(domain);

  if (!match && headers.referer) {
    const {origin, referer} = headers;
    let orref = tldomain(origin || referer);
    const route = mitm.routes[orref]
    let exclude = false;
    if (route && route.exclude) {
      exclude = route.exclude.find(e => domain.match(e)); 
    }
    if (!exclude) {
      match = search(orref);
    }        
  } 
  if (!match) {
    match = search('default');
  };
  // console.log('>> Match', tld, !!match)
  return match;
}

module.exports = {
  searchFN,
  matched,
}
