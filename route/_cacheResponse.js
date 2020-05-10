const fs = require('fs-extra');
const { addJS } = require('./fetch');

function cacheResponse(arr, {url, headers, method}) {
  if (headers.accept && headers.accept.indexOf('text/html') > -1) {
    const {host, pathname: p} = new URL(url);
    const stamp1 = `${host}/${p.replace('/', '_')}`;
    const stamp2 = `${host}/resp/${p.replace('/', '_')}`;
    const fpath1 = `cache/${stamp1}.html`;
    const fpath2 = `cache/${stamp2}.js`;
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
