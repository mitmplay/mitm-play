const c = require('ansi-colors');
const _match = require('./match');
const {matched,searchFN} = _match;

const chgRequest = async function (reqs, _3d) {
  const search = searchFN('request', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  const {router, fn: {_skipByTag}} = global.mitm;
  const {logs} = router._global_.config;

  let result = match && !_skipByTag(match, 'request');
  if (result) {
    const {hidden, request} = match.route;
    if (logs.request) {
      if (!match.url.match('/mitm-play/websocket')) {
        if (!global.mitm.argv.ommit.request && !hidden) {
          console.log(c.cyanBright(match.log));
        }
      }
    }
    if (request) {
      const reqs2 = request(reqs);
      result = {
        ...reqs,
        ...reqs2
      };
    } else {
      result = reqs;
    }
  }
  return result; //false or request object
}

module.exports = chgRequest;
