const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const _ext = require('./filepath/ext');
const _ctype = require('./content-type');
const filesave = require('./filesave/filesave');
const metaResp = require('./filesave/meta-resp');
const fpathcache = require('./filepath/fpath-cache');

const {matched,searchFN} = _match;

function cacheResponse(reqs, responseHandler) {
  const search = searchFN('cache', reqs);
  const match = matched(search, reqs);
  const {fn: {tilde}} = global.mitm;
  let resp, resp2;

  if (match) {
    const {url} = reqs;
    const {hidden, response} = match.route;
    let {fpath1, fpath2} = fpathcache({match, reqs});
 
    let remote = true;
    if (fs.existsSync(fpath2)) {
      // get from cache
      try {
        const {
          status,
          respHeader: headers
        } = JSON.parse(fs.readFileSync(fpath2));
        fpath1 = `${fpath1}.${_ext({headers})}`;
        if (!global.mitm.argv.ommit.cache && !hidden) {
          console.log(c.greenBright(`>> cache (${tilde(fpath1)}).match(${match.key})`));
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
        if (_ctype(match, resp)) {
          fpath1 = `${fpath1}.${_ext(resp)}`;
          if (hidden!==2) {
            console.log(c.magentaBright(`>> cache (${tilde(fpath1, '~')}).match(${match.key})`));
          }
          const meta = metaResp({reqs, resp});
          const body = resp.body;
          filesave({fpath1, body}, {fpath2, meta}, 'cache');
          if (response) {
            resp2 = response(resp);
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
