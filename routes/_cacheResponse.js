const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const _ext = require('./filepath/ext');
const _ctype = require('./content-type');
const filesave = require('./filesave/filesave');
const metaResp = require('./filesave/meta-resp');
const cacheFilepath = require('./filepath/cache-filepath');

const {matched,searchFN} = _match;
const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME).replace(/\\/g, '/');

function cacheResponse(reqs, responseHandler) {
  const search = searchFN('cache', reqs);
  const match = matched(search, reqs);
  let resp, resp2;

  if (match) {
    const {url} = reqs;
    let {fpath1, fpath2} = cacheFilepath({match, reqs});

    if (fs.existsSync(fpath2)) {
      // get from cache
      const {
        status,
        respHeader: headers
      } = JSON.parse(fs.readFileSync(fpath2));
      fpath1 = `${fpath1}.${_ext({headers})}`;
      console.log(c.greenBright( `>> cache (${fpath1.replace(home, '~')})`));
      const body = fs.readFileSync(fpath1);
      resp = {url, status, headers, body};
      if (match.route.resp) {
        resp2 = match.route.resp(resp);
        resp2 && (resp = {...resp, ...resp2})
      }
    } else {
      // get from remote
      responseHandler.push(resp => {
        if (_ctype(match, resp)) {
          fpath1 = `${fpath1}.${_ext(resp)}`;
          console.log(c.magentaBright(`>> cache (${fpath1.replace(home, '~')})`));
          const meta = metaResp({reqs, resp});
          const body = resp.body;
          filesave({fpath1, body}, {fpath2, meta}, 'cache');
          if (match.route.resp) {
            resp2 = match.route.resp(resp);
            resp2 && (resp = {...resp, ...resp2})
          }
        }
        return resp;
      });
    }
  }
  return {match, resp};
}

module.exports = cacheResponse;
