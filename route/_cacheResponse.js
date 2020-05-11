const fs = require('fs-extra');
const _match = require('./match');
const { e_head } = require('./fetch');

function cacheResponse(arr, {url, headers, method}) {
  const match = _match(url, 'cache');
  if (match) {
    const {host, pathname} = new URL(url);
    const p = pathname.replace('/', '_');
    const stamp1 = `${host}/${p}`;
    const stamp2 = `${host}/resp/${p}`;
    const fpath1 = `${mitm.home}/cache/${stamp1}${match.rt.ext}`;
    const fpath2 = `${mitm.home}/cache/${stamp2}.json`;
    if (fs.existsSync(fpath1)) {
      const body = fs.readFileSync(fpath1);
      const {status, headers} = JSON.parse(fs.readFileSync(fpath2));
      return {status, headers, body};
    } else {
      arr.push((response) => { 
        const {status, headers, body} = response;
        const resp = JSON.stringify({status, headers}, null, 2);
        fs.ensureFile(fpath1, err => {
          fs.writeFile(fpath1, body, err => {
            err && console.log('>> Error write cache1', err);
          })
        })
        fs.ensureFile(fpath2, err => {
          fs.writeFile(fpath2, resp, err => {
            err && console.log('>> Error write cache2', err);
          })
        })
        return response; 
      });  
    }
  }
}

module.exports = cacheResponse;
