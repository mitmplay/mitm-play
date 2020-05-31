const c = require('ansi-colors');
const filesave = require('./filesave');
const metaResp = require('./meta-resp');
const jsonResp = require('./json-resp');
const flatFilepath = require('../filepath/flat-filepath');

module.exports = (match, reqs, resp) => {
  const stamp = (new Date).toISOString().replace(/[:-]/g, '');
  const {fpath1, fpath2} = flatFilepath(match, resp, stamp);
  const meta = metaResp({reqs, resp});
  const body = jsonResp({meta, resp});
  filesave({fpath1, body}, {fpath2, meta}, 'flatten log');
}
