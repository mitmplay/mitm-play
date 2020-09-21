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

const noURL = /(brave|edge|chrome-extension):\/\//;
const wNull = /\/null$/;
const _resp = {
  status: 200,
  headers: {},
  body: ''
};

module.exports =  ({route, request, browserName}) => {
  const {router, argv: {nosocket, proxy}} = global.mitm;
  const reqs = extract({route, request, browserName});
  const {logs} = router._global_.config;

  // catch unknown url scheme & handle by browser 
  if (reqs.url.match(noURL) || reqs.url.match(wNull)) {
    route.fulfill(_resp);
    return;
  }

  const _3ds = _3rdparties(reqs);
  const skip = _skipResponse(reqs, _3ds);
  const {origin, pathname} = new URL(reqs.url);
  if (skip) {
    if (logs.skip) {
      const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
      console.log(c.grey(`>> skip (${origin}${msg}).match(${skip})`));
    }
    route.continue();
    return;
  }

  if (_mockResponse({reqs, route}, _3ds)) {
    return;
  }

  if (proxy && _proxyRequest(reqs, _3ds)) {
    reqs.proxy = proxy;
  }

  const responseHandler = [];
  //--resp can be undefined or local cached & can skip logs (.nolog)
  let {match, resp} = _cacheResponse(reqs, responseHandler, _3ds);

  //--order is important and log must not contain the body modification
  _logResponse (reqs, responseHandler, _3ds, match);
  _htmlResponse(reqs, responseHandler, _3ds);
  _jsonResponse(reqs, responseHandler, _3ds);
  _cssResponse (reqs, responseHandler, _3ds);
  _jsResponse  (reqs, responseHandler, _3ds);
  _chgResponse (reqs, responseHandler, _3ds);

  if (!nosocket) {
    //--inject websocket client to html
    _addWebSocket(reqs, responseHandler, _3ds);
  }

  if (resp) {
    Events(responseHandler, resp, route);
  } else {
    const rqs2 = _chngRequest(reqs, _3ds);
    if (rqs2) {
      const {headers, method} = rqs2;
      const msg = JSON.stringify({headers, method});
      console.log(c.redBright(`>> request (${msg})`));
    }
    if (responseHandler.length) { //fetch from remote server
      fetch(route, browserName, (rqs2 || reqs), function(resp) {
        Events(responseHandler, resp, route);
      });
    } else { //not handle 
      if (!rqs2 && logs) {
        const msg = pathname.length <= 100 ? pathname : pathname.slice(0,100)+'...';
        if (_3ds) {
          if (logs['no-namespace']) {
            console.log(c.redBright(`>> no-namespace (${origin}${msg})`));
          }
        } else {
          if (logs['browser-reqs']) {
            console.log(c.redBright.italic(`>> browser-reqs (${origin}${msg})`));
          }
        }  
      }
      const {headers, method, body: postData} = rqs2 || reqs;
      route.continue({headers, method, postData});
    }  
  } 
}

function Events(responseHandler, resp, route) {
  for (let fn of responseHandler) {
    const resp2 = fn(resp);
    if (resp2===undefined) {
      break;
    }
    resp =resp2;
  }
  route.fulfill(resp);
}
