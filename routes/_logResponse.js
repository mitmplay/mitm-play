const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const {matched,searchFN} = _match;

function logResponse(arr, reqs) {
  const search = searchFN('log', reqs);
  const match = matched(search, reqs);
  if (match) {
    console.log(c.bold.gray(match.log));
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
