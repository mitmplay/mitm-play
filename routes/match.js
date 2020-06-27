const {fn: {nameSpace}} = global.mitm;

const searchArr = ({typ, url}) => {
  const {router,routes} = global.mitm;

  return function(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }

    if (routes[namespace]) {
      let obj = router[namespace][typ];
      let arr = routes[namespace][typ] || [];
      for (let str of arr) {
        if (url.match(obj[str])) {
          return str;
        }
      }  
    }
  };
};

const searchFN = (typ, {url}) => {
  const {router,routes} = global.mitm;

  return function search(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }

    const obj = router[namespace][typ];
    const route = routes[namespace][typ];
    const spliter = global.mitm.spliter;

    for (let key in route) {
      const split = url.split(spliter);
      const path = `${split[0]}${split.length>1 ? '?' : ''}`;
      const arr = path.match(obj[key]);

      if (arr) {
        const {host, pathname} = new URL(url);
        const log = `>> ${typ} (${path}).match(${key})`;
        return {
          contentType: router[key],
          route: route[key],
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
  const {origin, referer} = headers;

  let domain = tldomain(url);
  let match = search(domain);

  if (!match && (origin || referer)) {
    let orref = tldomain(origin || referer);
    const route = global.mitm.routes[orref]
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
  }
  // console.log('>> Match', tld, !!match)
  return match;
}

module.exports = {
  searchArr,
  searchFN,
  matched,
}
