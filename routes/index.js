const c = require('ansi-colors');
const {extract, fetch} = require('./fetch');
const _jsResponse    = require('./_jsResponse');
const _chngRequest   = require('./_chngRequest');
const _cssResponse   = require('./_cssResponse');
const _logResponse   = require('./_logResponse');
const _jsonResponse  = require('./_jsonResponse');
const _htmlResponse  = require('./_htmlResponse');
const _proxyRequest  = require('./_proxyRequest');
const _skipResponse  = require('./_skipResponse');
const _mockResponse  = require('./_mockResponse');
const _addWebSocket  = require('./_addWebSocket');
const _cacheResponse = require('./_cacheResponse');

const _resp = {
  status: 200,
  headers: {},
  body: ''
};

module.exports =  (route, request) => {
  const reqs = extract(route, request);
  const {nosocket, proxy} = mitm.argv;
  const respEvents = [];

  // catch unknown url scheme & respond it 
  if (reqs.url.match('(brave|edge)://')) {
    route.fulfill(_resp);
    return;
  }

  let skip = _skipResponse(reqs);
  if (skip) {
    console.log(c.grey(`>> skip (${skip})`));
    route.continue({});
    return;
  }

  if (_mockResponse(route, reqs)) {
    return;
  }

  if (proxy && _proxyRequest(reqs)) {
    reqs.proxy = proxy;
  }

  //--resp can be undefined or local cached & can skip logs (.nolog)
  let {match, resp} = _cacheResponse(respEvents, reqs);

  //--order is important and log must not contain the body modification
  if (!match || !match.route.nolog) {
    _logResponse(respEvents, reqs);
  }

  _htmlResponse(respEvents, reqs);
  _jsonResponse(respEvents, reqs);
  _cssResponse(respEvents, reqs);
  _jsResponse(respEvents, reqs);

  if (!nosocket) {
    //--inject websocket client to html
    _addWebSocket(respEvents, reqs);
  }

  if (resp) {
    route.fulfill(Events(respEvents, resp));
  } else if (respEvents.length) { //call BE 
    _chngRequest(reqs);
    fetch(route, reqs, function(resp) {
      return Events(respEvents, resp)
    });
  } else {
    route.continue({});
  }
}

function Events(respEvents, resp) {
  respEvents.forEach(fn => (resp = fn(resp)));
  return resp;
}
