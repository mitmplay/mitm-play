const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const cacheFilepath = require('./cache-filepath');
const {matched,searchFN} = _match;

function cacheResponse(arr, reqs) {
  const search = searchFN('cache', reqs);
  const match = matched(search, reqs);

  if (match) {
    console.log(match.log);
    const {fpath1, fpath2} = cacheFilepath(match, reqs);

    if (fs.existsSync(fpath1)) {
      // get from cache
      console.log(c.greenBright(`>> cache (${fpath1})`));
      const body = fs.readFileSync(fpath1);
      const {status, headers} = JSON.parse(fs.readFileSync(fpath2));
      return {status, headers, body};
    } else {
      // get from remote
      arr.push(resp => { 
        const {body, ...r} = resp;
        const resp2 = JSON.stringify(r, null, 2);
        console.log(c.magentaBright(`>> cache (${fpath1})`));
        fs.ensureFile(fpath1, err => {
          fs.writeFile(fpath1, body, err => {
            err && console.log('>> Error write cache1', err);
          })
        })
        fs.ensureFile(fpath2, err => {
          fs.writeFile(fpath2, resp2, err => {
            err && console.log('>> Error write cache2', err);
          })
        })
        return resp; 
      });  
    }
  }
}

module.exports = cacheResponse;
