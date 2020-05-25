const fs = require('fs-extra');
const c = require('ansi-colors');
const ctype = require('./ext');
const _match = require('./match');
const contentType = require('./content-type');
const cacheFilepath = require('./cache-filepath');

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
      const body = fs.readFileSync(`${fpath1}.${ctype({headers})}`);
      return {status, headers, body};
    } else {
      // get from remote
      arr.push(resp => {
        if (contentType(match, resp)) {
          const ext = ctype(resp);
          const {body, ...r} = resp;
          const resp2 = JSON.stringify(r, null, 2);
          console.log(c.magentaBright(`>> cache (${fpath1})`));
          fs.ensureFile(`${fpath1}.${ext}`, err => {
            fs.writeFile(`${fpath1}.${ext}`, body, err => {
              err && console.log('>> Error write cache1', err);
            })
          })
          fs.ensureFile(fpath2, err => {
            fs.writeFile(fpath2, resp2, err => {
              err && console.log('>> Error write cache2', err);
            })
          })  
        }
        return resp; 
      });  
    }
  }
}

module.exports = cacheResponse;
