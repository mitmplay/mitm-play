const c = require('ansi-colors');
const _match = require('./match');
const ext = require('./filepath/ext');
const {ctype} = require('./content-type');
const filesave = require('./filesave/filesave');
const metaResp = require('./filesave/meta-resp');
const jsonResp = require('./filesave/json-resp');
const fpathflat = require('./filepath/fpath-flat');

const {matched,searchFN} = _match;

function logResponse(reqs, responseHandler, _3d, cache) {
  const search = searchFN('log', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  const {routes, fn: {skipByTag}} = global.mitm;
  const {logs} = routes._global_.config;

  if (match && !skipByTag(match, 'log')) {
    const {hidden, log, response} = match.route;
    const stamp = (new Date).toISOString().replace(/[:-]/g, '');
    responseHandler.push(resp => {
      if (ctype(match, resp)) {
        if (cache && ctype(cache, resp) && cache.route.nolog) {
          return resp; 
        }
        let {fpath1, fpath2} = fpathflat({match, reqs, stamp});
        if (logs.log) {
          if (!hidden) {
            console.log(c.bold.blueBright(match.log));
          }
        }
        if (log) {
          //complete r/resp json log
          fpath1 = `${fpath1}.json`;
        } else {
          fpath1 = `${fpath1}.${ext(resp)}`;
        }
        const meta = metaResp({reqs, resp});
        const body = jsonResp({reqs, resp, match});
        filesave({fpath1, body}, {fpath2, meta}, 'log');
        if (response) {
          const resp2 = response(resp, match);
          resp2 && (resp = {...resp, ...resp2});
        }        
      }
      return resp; 
    });
  }
}

module.exports = logResponse;
