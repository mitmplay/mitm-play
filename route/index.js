const { extract, fetch } = require('./fetch');
const _logResponse = require('./_logResponse');
const _addWebSocket = require('./_addWebSocket');
const _cacheResponse = require('./_cacheResponse');
const _patchResponse = require('./_patchResponse');
const patchReqHeader = require('./patchReqHeader');

module.exports =  (route, request) => {
  const reqs = extract(route, request);
  const respEvents = [];

  // resp can be undefined or local cached
  let resp = _cacheResponse(respEvents, reqs);

  // order is important and log must not contain the body modification
  _logResponse(respEvents, reqs);
  _patchResponse(respEvents, reqs);
  _addWebSocket(respEvents, reqs);

  // respond need to log or modify
  if (respEvents.length) {
    if (resp) {
      // do log or modification of cached & respond with cached
      for (const fn of respEvents) {
        resp = fn(resp);
      }
      console.log('cached1', reqs.url);
      route.fulfill(resp); // exec route.fulfill()
    } else {
      // call to BE and do log or modification & respond
      fetch(route, reqs, function(resp) {
        for (const fn of respEvents) {
          resp = fn(resp);
        }
        return resp; // exec route.fulfill()
      });  
    }
  } else {
    if (resp) {
      // respond with cached
      console.log('cached2', reqs.url);
      route.fulfill(resp); // exec route.fulfill()
    } else {
      // normal flow: with reg headers getting update
      patchReqHeader(route, reqs); // exec route.continue();
    }
  }
}
