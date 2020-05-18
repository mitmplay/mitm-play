const fs = require('fs-extra');
const _match = require('./match');
const {matched,searchFN} = _match;

function filename(pathname, reqs) {
  const accept = reqs.headers.accept || '';
  const secFet = reqs.headers['sec-fetch-dest'] || '';
  const arr = pathname.split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
  }
  file2 = file.split('.');
  if (file2.length===1) {
    if (accept.indexOf('html')>-1) {
      file2.push('html');
    } else if (accept.indexOf('css')>-1) {
      file2.push('css');
    } else if (secFet.indexOf('script')>-1) {
      file2.push('js');
    }
  }
  arr.push(file2.join('.'));
  const fullpath = arr.join('/');
  // console.log('fullpath', pathname, fullpath);
  return fullpath;
}

function cacheResponse(arr, reqs) {
  const search = searchFN('cache', reqs);
  const match = matched(search, reqs);

  if (match) {
    console.log(match.log);
    const {host, pathname: f} = match;
    const fullpath = filename(f, reqs);

    const stamp1 = `${host}${fullpath}`;
    const stamp2 = `${host}/$${fullpath}`;

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
