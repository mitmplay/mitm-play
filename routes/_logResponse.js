const fs = require('fs-extra');
const _match = require('./match');

function logResponse(arr, reqs) {
  const match = _match('log', reqs);
  if (match) {
    console.log(match.log);
    const {host, pathname} = match;
    const ex = match.route.ext || '';
    const stamp = (new Date).toISOString().replace(/:/g, '_');
    const fpath = `${mitm.home}/log/${host}/${stamp}${pathname}${ex}`;
    arr.push(resp => { 
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
