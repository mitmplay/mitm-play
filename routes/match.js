module.exports = (typ, {url, headers}) => {
  const routes = mitm.routes[typ];
  let arr;
  let log;

  for (let key in routes) {
    if (typ==='logs' || typ==='cache') {
      log = `>> ${typ} (${headers['content-type']}).match(${key})`;
      arr = (headers['content-type']+'').match(key);
    } else {
      const split = url.split(/([&?;,]|:\w|url)/);
      const path = `${split[0]}${split.length>1 ? '?' : ''}`;
      log = `>> ${typ} (${path}).match(${key})`;
      arr = url.match(key);
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
