const c = require('ansi-colors');
const {extract, fetch} = require('./fetch');
const _3rdparties    = require('./_3rdparties');
const _jsResponse    = require('./_jsResponse');
const _chngRequest   = require('./_chngRequest');
const _cssResponse   = require('./_cssResponse');
const _logResponse   = require('./_logResponse');
const _jsonResponse  = require('./_jsonResponse');
const _htmlResponse  = require('./_htmlResponse');
const _chgResponse   = require('./_chgResponse');
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

module.exports =  ({route, request, browserName}) => {
  const {routes, argv: {nosocket, proxy}} = global.mitm;
  const reqs = extract({route, request, browserName});
  const {url} = reqs;
  const {origin, pathname} = new URL(url);
  const {logs} = routes._global_.config;
  const responseHandler = [];

  // catch unknown url scheme & respond it 
  if (url.match('(brave|edge)://')) {
    route.fulfill(_resp);
    return;
  }

  const _3d = _3rdparties(reqs);
  const skip = _skipResponse(reqs, _3d);
  if (skip) {
    if (logs.skip) {
      const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
      console.log(c.grey(`>> skip (${origin}${msg}).match(${skip})`));
    }
    route.continue({});
    return;
  }

  if (_mockResponse({reqs, route}, _3d)) {
    return;
  }

  if (proxy && _proxyRequest(reqs, _3d)) {
    reqs.proxy = proxy;
  }

  //--resp can be undefined or local cached & can skip logs (.nolog)
  let {match, resp} = _cacheResponse(reqs, responseHandler, _3d);

  //--order is important and log must not contain the body modification
  _logResponse (reqs, responseHandler, _3d, match);
  _htmlResponse(reqs, responseHandler, _3d);
  _jsonResponse(reqs, responseHandler, _3d);
  _cssResponse (reqs, responseHandler, _3d);
  _jsResponse  (reqs, responseHandler, _3d);
  _chgResponse (reqs, responseHandler, _3d);
  if (!nosocket) {
    //--inject websocket client to html
    _addWebSocket(reqs, responseHandler, _3d);
  }

  if (resp) {
    Events(responseHandler, resp, route);
  } else {
    const rqs2 = _chngRequest(reqs, _3d);
    if (responseHandler.length) { //call BE 
      fetch(route, browserName, (rqs2 || reqs), function(resp) {
        Events(responseHandler, resp, route);
      });
    } else {
      let rqs;
      if (rqs2) {
        const {headers, method, body: postData} = rqs2;
        rqs = {headers, method, postData};
        const msg = JSON.stringify({headers, method});
        console.log(c.redBright(`>> request (${msg})`));
      } else if (logs) {
        const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
        if (_3d) {
          if (logs['no-namespace']) {
            console.log(c.redBright(`>> no-namespace (${origin}${msg})`));
          }
        } else {
          if (logs['browser-reqs']) {
            console.log(c.redBright.italic(`>> browser-reqs (${origin}${msg})`));
          }
        }  
      }
      route.continue(rqs);
    }  
  } 
}

function Events(responseHandler, resp, route) {
  for (let fn of responseHandler) {
    resp = fn(resp);
    if (resp===undefined) {
      break;
    }
  }
  resp && route.fulfill(resp);
}
