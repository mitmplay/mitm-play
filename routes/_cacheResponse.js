const fs = require('fs-extra');
const _match = require('./match');

function cacheResponse(arr, reqs) {
  const match = _match('cache', reqs);
  if (match) {
    console.log(match.log);
    const {host, pathname} = match;

    const stamp1 = `${host}${pathname}`;
    const stamp2 = `${host}/_${pathname}`;

    const ex = match.route.ext || '';
    const cache = `${mitm.home}/cache`;
    const fpath1 = `${cache}/${stamp1}${ex}`;
    const fpath2 = `${cache}/${stamp2}.json`;

    if (fs.existsSync(fpath1)) {
      console.log(`>>       (${fpath1})`);
      const body = fs.readFileSync(fpath1);
      const {status, headers} = JSON.parse(fs.readFileSync(fpath2));
      return {status, headers, body};
    } else {
      arr.push(resp => { 
        const {body, ...r} = resp;
        const resp2 = JSON.stringify(r, null, 2);
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
