// const c = require('ansi-colors');
const filesave = require('./filesave');
const metaResp = require('./meta-resp');
const jsonResp = require('./json-resp');
const flatFilepath = require('../filepath/flat-filepath');

module.exports = (match, reqs, resp) => {
  const stamp = (new Date).toISOString().replace(/[:-]/g, '');
  let {fpath1, fpath2, ext} = flatFilepath({match, reqs, resp, stamp});
  const meta = metaResp({reqs, resp});
  const body = jsonResp({reqs, resp, match});
  if (match.route.log && ext!=='json') {
    fpath1 += '.json';
  }
  filesave({fpath1, body}, {fpath2, meta}, 'flatten log');
}
