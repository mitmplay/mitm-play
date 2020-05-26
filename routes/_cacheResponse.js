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
    const {fpath1, fpath2} = cacheFilepath(match, reqs);

    if (fs.existsSync(fpath2)) {
      // get from cache
      console.log(c.greenBright(`>> cache (${fpath1})`));
      const {status, headers} = JSON.parse(fs.readFileSync(fpath2));
      const body = fs.readFileSync(`${fpath1}.${_ext({headers})}`);
      return {status, headers, body};
    } else {
      // get from remote
      arr.push(resp => {
        if (_ctype(match, resp)) {
          const ext = _ext(resp);
          let {body, ...r} = resp;
          const meta = JSON.stringify(r, null, 2);
          console.log(c.magentaBright(`>> cache (${fpath1})`));
          body = jsonResp({reqs, resp, ext});
          filesave({fpath1: `${fpath1}.${ext}`, body}, {fpath2, meta}, 'cache');
        }
        return resp; 
      });  
    }
  }
}

module.exports = cacheResponse;
