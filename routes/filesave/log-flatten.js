const c = require('ansi-colors');
const filesave = require('./filesave');
const jsonResp = require('./json-resp');
const flatFilepath = require('../filepath/flat-filepath');

module.exports = (match, reqs, resp) => {
  let {url, status, headers, body} = resp;
  let {method} = reqs;
  const stamp = (new Date).toISOString().replace(/[:-]/g, '');
  const {fpath1, fpath2, ext} = flatFilepath(match, resp, stamp);
  const meta = JSON.stringify({url, method, status, headers}, null, 2);
  body = jsonResp({reqs, resp, ext, meta: true});
  filesave({fpath1, body}, {fpath2, meta}, 'flatten log');
}
