const fs = require('fs-extra');
const _match = require('./match');

function logResponse(arr, reqs) {
  const match = _match('logs', reqs);
  if (match) {
    const { url } = reqs;
    const {host, pathname} = match;
    const p = pathname.replace('/', '_');
    const stamp = (new Date).toISOString().replace(/:/g, '_');
    const fpath = `${mitm.home}/log/${host}/${stamp}${p}${match.route.ext}`;
    arr.push((resp) => { 
      fs.ensureFile(fpath, err => {
        fs.writeFile(fpath, resp.body, err => {
          err && console.log('>> Error write log', err);
        })
      })
      return resp; 
    });
  }
}

module.exports = logResponse;
