const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const _ext = require('./filepath/ext');
const {ctype} = require('./content-type');
const filesave = require('./filesave/filesave');
const metaResp = require('./filesave/meta-resp');
const fpathcache = require('./filepath/fpath-cache');

const {matched,searchFN} = _match;

function resetCookies(setCookie) {
  cookies = [];
  for (let item of setCookie) {
    const {_elapsed, ...rest} = item;
    let cookie = [];
    for (let key in rest) {
      if (key==='expires') {
        const now = new Date();
        const time = now.getTime();
        now.setTime(time + _elapsed);
        cookie.push(`expires=${now.toGMTString()}`);
      } else if (rest[key]===true) {
        cookie.push(`${key}`);
      } else {
        cookie.push(`${key}=${rest[key]}`);
      }
    }
    cookies.push(cookie.join('; '));
  }
  return cookies;
}

function cacheResponse(reqs, responseHandler, _3d) {
  const search = searchFN('cache', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  const {routes, fn: {skipByTag, tilde}} = global.mitm;
  const {logs} = routes._global_.config;
  let resp, resp2;

  if (match && !skipByTag(match, 'cache')) {
    const {url} = reqs;
    const {route} = match;
    const {response, session, hidden} = route;
    const {host, origin, pathname} = new URL(url);

    let {fpath1, fpath2} = fpathcache({match, reqs}); 
    let remote = true;
    if (fs.existsSync(fpath2)) {
      // get from cache
      try {
        const {
          setCookie,
          general: {status},
          respHeader: headers,
        } = JSON.parse(fs.readFileSync(fpath2));
        if (!ctype(match, {headers})) {
          return {match: undefined, resp};
        }
        if (session) {
          const path = session===true ? '' : session;
          global.mitm.fn.session(host, path);
          global.mitm._session_ = true;
        }
        if (setCookie && global.mitm.argv.cookie) {
          headers['set-cookie'] = resetCookies(setCookie);
        }
        fpath1 = `${fpath1}.${_ext({headers})}`;
        if (logs.cache) {
          if (!global.mitm.argv.ommit.cache && !hidden) {
            const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
            console.log(c.greenBright(`>> cache (${origin}${msg}).match(${match.key})`));
          }  
        }
        const body = fs.readFileSync(fpath1);
        resp = {url, status, headers, body};
        if (response) {
          resp2 = response(resp);
          resp2 && (resp = {...resp, ...resp2})
        }
        remote = false;  
      } catch (error) {
        console.log(c.red(`>> cache (${tilde(fpath1)})`));
        console.log(c.red('   Error in JSON.parse(...)'));
      }
    }
    if (remote) {
      // get from remote
      responseHandler.push(resp => {
        if (ctype(match, resp)) {
          if (session) {
            const path = session===true ? '' : session;
            global.mitm.fn.session(host, path);
            global.mitm._session_ = true;
          }
          fpath1 = `${fpath1}.${_ext(resp)}`;
          if (logs.cache) {
            if (hidden!==2) {
              const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
              console.log(c.magentaBright(`>> cache (${origin}${msg}).match(${match.key})`));
            }
          }
          const meta = metaResp({reqs, resp});
          const body = resp.body;
          filesave({fpath1, body}, {fpath2, meta}, 'cache');
          if (response) {
            resp2 = response(resp, match);
            resp2 && (resp = {...resp, ...resp2})
          }
        }
        return resp; // back to events loop call in fetch
      });
    }
  }
  return {match, resp};
}

module.exports = cacheResponse;
