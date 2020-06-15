const c = require('ansi-colors');
const _match = require('./match');
const {matched,searchFN} = _match;

function chgRequest(reqs) {
  const search = searchFN('request', reqs);
  const match = matched(search, reqs);
  if (match) {
    if (!match.url.match('/mitm-play/websocket')) {
      console.log(c.cyanBright(match.log));
    }
    if (match.route.request) {
      const reqs2 = match.route.request(reqs);
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
