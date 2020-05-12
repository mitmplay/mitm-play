const _skipResponse = require('./_skipResponse');
const _mockResponse = require('./_mockResponse');
const _cacheResponse = require('./_cacheResponse');
const _logResponse = require('./_logResponse');
const _htmlResponse = require('./_htmlResponse');
const _jsonResponse = require('./_jsonResponse');
const _cssResponse = require('./_cssResponse');
const _jsResponse = require('./_jsResponse');
const _addWebSocket = require('./_addWebSocket');
const patchReqHeader = require('./patchReqHeader');
const { extract, fetch } = require('./fetch');

module.exports =  (route, request) => {
  const reqs = extract(route, request);
  const respEvents = [];
  let resp = undefined;

  if (_skipResponse(reqs)) {
    route.continue({});
    return;
  }

  if (_mockResponse(route, reqs)) {
    return;
  }

  //--resp can be undefined or local cached
  resp = _cacheResponse(respEvents, reqs);

  //--order is important and log must not contain the body modification
  _logResponse(respEvents, reqs);

  _htmlResponse(respEvents, reqs);
  _jsonResponse(respEvents, reqs);
  _cssResponse(respEvents, reqs);
  _jsResponse(respEvents, reqs);

  //--inject websocket client to html
  _addWebSocket(respEvents, reqs);

  //--respond need to log or modify
  if (respEvents.length) {
    if (resp) {
      //--do log or modification of cached & respond with cached
      for (const fn of respEvents) {
        resp = fn(resp);
      }
      console.log('cached1', reqs.url);
      console.log('------------------------------------------------------------');
      route.fulfill(resp); // exec route.fulfill()
    } else {
      //--call to BE and do log or modification & respond
      fetch(route, reqs, function(resp) {
        for (const fn of respEvents) {
          resp = fn(resp);
        }
        const ctype = `${resp.headers['content-type']}`;
        if (ctype.match('(video|image)')) {
          console.log('url', resp.url);
        }
        console.log(`------------------------------------------------------------${ctype}`);
        return resp; // exec route.fulfill()
      });
    }
  } else {
    if (resp) {
      //--respond with cached
      console.log('cached2', reqs.url);
      console.log('------------------------------------------------------------');
      route.fulfill(resp); // exec route.fulfill()
    } else {
      //--normal flow: with reg headers getting update
      patchReqHeader(route, reqs); // exec route.continue();
    }
  }
}
