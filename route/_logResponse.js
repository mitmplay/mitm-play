const fs = require('fs-extra');
const _match = require('./match');

function logResponse(arr, reqs) {
  const match = _match('logs', reqs);
  if (match) {
    const { url } = reqs;
    const {host, pathname} = new URL(url);
    const p = pathname.replace('/', '_');
    const stamp = (new Date).toISOString().replace(/:/g, '_');
    const fpath = `${mitm.home}/log/${host}/${stamp}${p}${match.rt.ext}`;
    arr.push((response) => { 
      fs.ensureFile(fpath, err => {
        fs.writeFile(fpath, response.body, err => {
          err && console.log('>> Error write log', err);
        })
      })
      return response; 
    });
  }
}

module.exports = logResponse;
