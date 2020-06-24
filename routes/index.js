const c = require('ansi-colors');
const {extract, fetch} = require('./fetch');
const _3rdparties    = require('./_3rdparties');
const _jsResponse    = require('./_jsResponse');
const _allResponse   = require('./_allResponse');
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

module.exports =  ({route, browserName}) => {
  const {nosocket, proxy} = global.mitm.argv;
  const reqs = extract({route, browserName});
  const responseHandler = [];

  // catch unknown url scheme & respond it 
  if (reqs.url.match('(brave|edge)://')) {
    route.fulfill(_resp);
    return;
  }

  if (_3rdparties(reqs)) {
    return;
  };

  let skip = _skipResponse(reqs);
  if (skip) {
    if (global.mitm.argv.verbose) {
      console.log(c.grey(`>> skip (${skip})`));
    }
    route.continue({});
    return;
  }

  if (_mockResponse({reqs, route})) {
    return;
  }

  if (proxy && _proxyRequest(reqs)) {
    reqs.proxy = proxy;
  }

  //--resp can be undefined or local cached & can skip logs (.nolog)
  let {match, resp} = _cacheResponse(reqs, responseHandler);

  //--order is important and log must not contain the body modification
  if (!match || !match.route.nolog) {
    _logResponse(reqs, responseHandler);
  }

  _htmlResponse(reqs, responseHandler);
  _jsonResponse(reqs, responseHandler);
  _cssResponse (reqs, responseHandler);
  _jsResponse  (reqs, responseHandler);
  _allResponse (reqs, responseHandler);
  if (!nosocket) {
    //--inject websocket client to html
    _addWebSocket(reqs, responseHandler);
  }

  if (resp) {
    route.fulfill(Events(responseHandler, resp));
  } else if (responseHandler.length) { //call BE 
    fetch(route, (_chngRequest(reqs) || reqs), function(resp) {
      return Events(responseHandler, resp)
    });
  } else {
    route.continue({});
  }
}

function Events(responseHandler, resp) {
  responseHandler.forEach(fn => (resp = fn(resp)));
  return resp;
}
