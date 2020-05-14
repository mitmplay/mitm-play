const _match = require('./match');

function mockResponse(route, reqs) {
  const match = _match('mock', reqs);
  if (match) {
    let resp2;
    let resp = {
      status: 200,
      headers: {
        'content-type': 'text/plain',
      },
      body: 'Hello mock! - mitm-play'
    };
    if (match.route.resp) {
      resp2 = match.route.resp(resp);
      resp = {
        ...resp,
        ...resp2
      };
    };
    console.log(match.log);
    route.fulfill(resp);
    return true;
  }
}

module.exports = mockResponse;
//https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse