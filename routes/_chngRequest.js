const c = require('ansi-colors');
const _match = require('./match');
const {matched,searchFN} = _match;

function chgRequest(reqs, _3d) {
  const search = searchFN('request', reqs);
  const match =  _3d ? search('_global_') : matched(search, reqs);
  if (match) {
    const {hidden, request} = match.route;
    if (!match.url.match('/mitm-play/websocket')) {
      if (!global.mitm.argv.ommit.request && !hidden) {
        console.log(c.cyanBright(match.log));
      }
    }
    if (request) {
      const reqs2 = request(reqs);
      if (reqs2) {
        return {
          ...reqs,
          ...reqs2
        };
      }
    }
  }
}

module.exports = chgRequest;
