const c = require('ansi-colors');
const _match = require('./match');
const inject = require('./inject');
const {matched,searchFN} = _match;
const {source} = inject;

const mock = () => {
  return {
    status: 200,
    headers: {
      'content-type': 'text/plain',
    },
    body: ''
  }
};

function mockResponse({reqs, route}, _3d) {
  const search = searchFN('mock', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  if (match) {
    const {js, response} = match.route;
    if (!match.url.match('/mitm-play/websocket')) {
      console.log(c.cyanBright(match.log));
    }
    let resp = mock();
    if (typeof(match.route)==='string') {
      resp.body = match.route;
    } else {          
      if (response || js) {
        if (response) {
          const resp2 = response(resp);
          resp2 && (resp = {...resp, ...resp2});
        }
        if (js) {
          resp.body = source(resp.body, js);
          resp.headers['content-type'] = 'application/javascript';
        }
      } else {
        resp.body = 'Hello mock! - mitm-play';
      }
    }
    route.fulfill(resp);
    return true;
  }
}

module.exports = mockResponse;
//https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse