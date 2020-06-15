const c = require('ansi-colors');
const _match = require('./match');
const ext = require('./filepath/ext');
const _ctype = require('./content-type');
const filesave = require('./filesave/filesave');
const metaResp = require('./filesave/meta-resp');
const jsonResp = require('./filesave/json-resp');
const fpathflat = require('./filepath/fpath-flat');

const {matched,searchFN} = _match;

function logResponse(reqs, responseHandler) {
  const search = searchFN('log', reqs);
  const match = matched(search, reqs);
  if (match) {
    const stamp = (new Date).toISOString().replace(/[:-]/g, '');
    let {fpath1, fpath2} = fpathflat({match, reqs, stamp});
    responseHandler.push(resp => {
      if (_ctype(match, resp)) {
        console.log(c.bold.blueBright(match.log));
        fpath1 = `${fpath1}.${ext(resp)}`;
        const meta = metaResp({reqs, resp});
        const body = jsonResp({reqs, resp, match});
        filesave({fpath1, body}, {fpath2, meta}, 'flatten log');
        if (match.route.response) {
          const resp2 = match.route.response(resp);
          resp2 && (resp = {...resp, ...resp2});
        }        
      }
      return resp; 
    });
  }
}

module.exports = logResponse;
