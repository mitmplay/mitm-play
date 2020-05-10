const fs = require('fs-extra');
const { addJS } = require('./fetch');

function logResponse(arr, {url, headers, method}) {
  if (headers.accept && headers.accept.indexOf('text/css') > -1) {
    const {host, pathname: p} = new URL(url);
    const stamp = (new Date).toISOString().replace(/:/g, '_');
    const fpath = `${mitm.home}/log/${host}/${stamp}.css`;
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
