const { extract, fetch } = require('./fetch');
const _logResponse = require('./_logResponse');
const _addWebSocket = require('./_addWebSocket');
const _cacheResponse = require('./_cacheResponse');
const _htmlResponse = require('./_htmlResponse');
const _jsonResponse = require('./_jsonResponse');
const _cssResponse = require('./_cssResponse');
const _jsResponse = require('./_jsResponse');
const patchReqHeader = require('./patchReqHeader');

module.exports =  (route, request) => {
  // console.log('>> ROUTE...');
  const reqs = extract(route, request);
  const respEvents = [];
  let resp = undefined;

  // resp can be undefined or local cached
  resp = _cacheResponse(respEvents, reqs);

  // order is important and log must not contain the body modification
  _logResponse(respEvents, reqs);

  _htmlResponse(respEvents, reqs);
  _jsonResponse(respEvents, reqs);
  _cssResponse(respEvents, reqs);
  _jsResponse(respEvents, reqs);

  _addWebSocket(respEvents, reqs);

  // respond need to log or modify
  if (respEvents.length) {
    if (resp) {
      // do log or modification of cached & respond with cached
      for (const fn of respEvents) {
        resp = fn(resp);
      }
      console.log('cached1', reqs.url);
      console.log;('------------------------------------------------------------');
      route.fulfill(resp); // exec route.fulfill()
    } else {
      // call to BE and do log or modification & respond
      fetch(route, reqs, function(resp) {
        for (const fn of respEvents) {
          resp = fn(resp);
        }
        console.log('response', reqs.url.split('?')[0]);
        console.log('------------------------------------------------------------');
        return resp; // exec route.fulfill()
      });  
    }
  } else {
    if (resp) {
      // respond with cached
      console.log('cached2', reqs.url);
      console.log;('------------------------------------------------------------');
      route.fulfill(resp); // exec route.fulfill()
    } else {
      // normal flow: with reg headers getting update
      patchReqHeader(route, reqs); // exec route.continue();
    }
  }
}
