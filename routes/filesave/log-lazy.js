// const c = require('ansi-colors');
const filesave = require('./filesave');
const metaResp = require('./meta-resp');
const jsonResp = require('./json-resp');
const logFilepath = require('../filepath/log-filepath');

let debunk;
let _queue = [];

module.exports = (match, reqs, resp) => {
  _queue.push({match, reqs, resp});
  debunk && clearTimeout(debunk);
  debunk = setTimeout(function() {
    const queue = _queue;
    _queue = [];

    let allpath;
    let _path = {};
    let _index = 0;
    const stamp = (new Date).toISOString().replace(/[:-]/g, '');
    for (let {match, reqs, resp} of queue) {
      const fn = logFilepath(match, resp, stamp);
      const {pathname} = match;
      if (!_path[pathname]) {
        _path[pathname] = true;
        allpath = fn('-00');
        _index = 0;
      } else {
        _index += 1;
        allpath = fn(`-${(_index+'').padStart(2,'0')}`);
      }
      let {fpath1, fpath2} = allpath;
      const meta = metaResp({reqs, resp});
      const body = jsonResp({reqs, resp, match});
      filesave({fpath1, body}, {fpath2, meta}, 'lazy log');
    }
   }, 5000);  
}
