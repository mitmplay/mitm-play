const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const _ext = require('./filepath/ext');
const _ctype = require('./content-type');
const filesave = require('./filesave/filesave');
const jsonResp = require('./filesave/json-resp');
const cacheFilepath = require('./filepath/cache-filepath');

const {matched,searchFN} = _match;

function cacheResponse(arr, reqs) {
  const search = searchFN('cache', reqs);
  const match = matched(search, reqs);

  if (match) {
    // console.log(match.log);
    const {url} = reqs;
    let {fpath1, fpath2} = cacheFilepath(match, reqs);
    let resp2;

    if (fs.existsSync(fpath2)) {
      // get from cache
      console.log(c.greenBright(`>> cache (${fpath1})`));
      const {status, headers} = JSON.parse(fs.readFileSync(fpath2));
      fpath1 = `${fpath1}.${_ext({headers})}`;
      const body = fs.readFileSync(fpath1);
      resp = {url, status, headers, body};
      if (match.route.resp) {
        resp2 = match.route.resp(resp);
        resp2 && (resp = {...resp, ...resp2})
      }
      return resp;
    } else {
      // get from remote
      arr.push(resp => {
        if (_ctype(match, resp)) {
          const ext = _ext(resp);
          let {body, ...r} = resp;
          fpath1 = `${fpath1}.${ext}`;
          console.log(c.magentaBright(`>> cache (${fpath1})`));
          body = jsonResp({reqs, resp, ext});
          const meta = JSON.stringify(r, null, 2);
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
}

module.exports = cacheResponse;
