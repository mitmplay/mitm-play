const fs = require('fs-extra');
const c = require('ansi-colors');
const flatFilepath = require('./flat-filepath');

module.exports = (match, resp, method) => {
  let {url, status, headers, body} = resp;
  const stamp = (new Date).toISOString().replace(/[:-]/g, '');
  const {fpath1, fpath2, ext} = flatFilepath(match, resp, stamp);
  const resp2 = JSON.stringify({url, method, status, headers}, null, 2);
  if (ext==='json') {
    try {
      const contentLength = headers['content-length'];
      if (contentLength && contentLength[0]!=='0') {
        body = JSON.stringify(JSON.parse(`${body}`), null, 2);
      }
    } catch (error) {
      console.log(c.redBright(`>> Error JSON.stringify`));
      console.log(error);
    }
  }
  fs.ensureFile(fpath1, err => {
    fs.writeFile(fpath1, body , err => {
      err && console.log('>> Error write log', err);
    })
  })
  fs.ensureFile(fpath2, err => {
    fs.writeFile(fpath2, resp2, err => {
      err && console.log('>> Error write cache2', err);
    })
  })
}