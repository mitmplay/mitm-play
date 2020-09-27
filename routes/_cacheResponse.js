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

const cacheResponse = async function (reqs, responseHandler, _3d) {
  const search = searchFN('cache', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  const {router, fn: {_skipByTag, tilde}} = global.mitm;
  const {logs} = router._global_.config;
  let resp, resp2;

  if (match && !_skipByTag(match, 'cache')) {
    const {url} = reqs;
    const {route} = match;
    const {response, session, hidden} = route;

    let {fpath1, fpath2} = fpathcache({match, reqs}); 
    let remote = true;
    if (fs.existsSync(fpath2)) {
      // get from cache
      try {
        const json = JSON.parse(await fs.readFile(fpath2));
        const {setCookie,general:{status},respHeader:headers} = json;
        if (!ctype(match, {headers})) {
          return {match: undefined, resp};
        }
        if (session) {
          const path = session===true ? '' : session;
          global.mitm.fn._session(match.host, path);
          global.mitm._session_ = true;
        }
        if (setCookie && global.mitm.argv.cookie) {
          headers['set-cookie'] = resetCookies(setCookie);
        }
        fpath1 = `${fpath1}.${_ext({headers})}`;
        if (logs.cache) {
          if (!global.mitm.argv.ommit.cache && !hidden) {
            if (match.route.path) {
              console.log(c.redBright(match.log));
            } else {
              console.log(c.greenBright(match.log));
            }
          }
        }  
        const body = await fs.readFile(fpath1);
        resp = {url, status, headers, body};
        if (response) {
          resp2 = response(resp);
          resp2 && (resp = {...resp, ...resp2})
        }
        remote = false;  
      } catch (error) {
        console.log(c.red(`>> cache (${tilde(fpath1)})`));
        console.log(c.red(`   Error in ${error}`));
      }
    }
    if (remote) {
      // get from remote
      responseHandler.push(resp => {
        if (ctype(match, resp)) {
          if (session) {
            const path = session===true ? '' : session;
            global.mitm.fn._session(match.host, path);
            global.mitm._session_ = true;
          }
          fpath1 = `${fpath1}.${_ext(resp)}`;
          if (logs.cache) {
            if (hidden!==2) {
              console.log(c.magentaBright(match.log));
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
