const {fn: {home, nameSpace}} = global.mitm;

function typTags(typs, namespace) {
  const tags = mitm.__tag4[namespace][typs] || [];
  return [].concat(typs, tags);
}

const searchArr = ({typ: typs, url}) => {
  const {router,routes} = global.mitm;

  return function(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }

    if (routes[namespace]) {
      const list = typTags(typs, namespace);
      for (let typ of list) {
        let obj = router[namespace][typ];
        let arr = routes[namespace][typ] || [];
        for (let str of arr) {
          if (obj && url.match(obj[str])) {
            return str;
          }
        }
      }
    }
  };
};

const searchFN = (typs, {url}) => {
  const {router,routes} = global.mitm;

  return function search(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }

    let workspace = routes[namespace].workspace;
    if (workspace) {
      workspace = home(workspace);
    }

    const list = typTags(typs, namespace);

    for (let typ of list) {
      const obj = router[namespace][typ];
      const route = routes[namespace][typ];
  
      for (let key in route) {
        const arr = url.match(obj[key]);
  
        if (arr) {
          const {host, origin, pathname, search} = new URL(url);
          const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
          const log = `>> ${typ} (${origin}${msg}).match(${key})`;
          return {
            contentType: obj[`${key}~contentType`],
            route: route[key],
            workspace,
            namespace,
            pathname,
            search,
            host,
            url,
            key,
            arr,
            log,
          }
        }
      }  
    }
  };
};

const searchKey = key => {
  const {router,routes} = global.mitm;

  return function search(nspace) {
    const namespace = nameSpace(nspace);
    if (!namespace) {
      return;
    }

    return routes[namespace][key];
  };
};

const matched = (search, {url, headers}) => {
  const {tldomain} = global.mitm.fn;
  const {origin, referer} = headers;

  let domain = tldomain(url);
  let match = search(domain);

  if (!match && (origin || referer)) {
    let orref = tldomain(origin || referer);
    match = search(orref);
  } 
  if (!match) {
    match = search('_global_');
  }
  // console.log('>> Match', tld, !!match)
  return match;
}

module.exports = {
  searchArr,
  searchKey,
  searchFN,
  matched,
}
