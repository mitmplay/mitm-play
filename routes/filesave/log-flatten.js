const c = require('ansi-colors');
const filesave = require('./filesave');
const flatFilepath = require('../filepath/flat-filepath');

module.exports = (match, resp, method) => {
  let {url, status, headers, body} = resp;
  const stamp = (new Date).toISOString().replace(/[:-]/g, '');
  const {fpath1, fpath2, ext} = flatFilepath(match, resp, stamp);
  const meta = JSON.stringify({url, method, status, headers}, null, 2);
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
  filesave({fpath1, body}, {fpath2, meta}, 'flatten log');
}