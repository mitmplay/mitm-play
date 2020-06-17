const c = require('ansi-colors');
const _fetch = require('make-fetch-happen');

function extract({route, browserName}) {
  const {
    _url: url, 
    _method: method, 
    _headers: headers,
    _postData: body,
  } = route._request;
  return {url, method, headers, body, browserName};
}

function fetch(route, {url, proxy, ...reqs}, handler) {
  const opts = {redirect: 'manual'};

  if (proxy) {
    if (proxy===true) {
      const { 
        HTTP_PROXY, NO_PROXY,
        http_proxy, no_proxy,
      } = process.env;
      if (HTTP_PROXY || http_proxy) {
        opts.proxy = HTTP_PROXY || http_proxy;
        opts.noProxy = NO_PROXY || no_proxy || '';
      } 
    } else {
      opts.proxy = proxy;
    }
  }

  _fetch(url, {...reqs, ...opts}).then(resp => {
    if (proxy && global.mitm.argv.verbose) {
      console.log(c.grey(`>> proxy (${url.split(/([&?;,]|:\w|url)/)[0]})`));
    }
    const _headers = resp.headers.raw();
    const status = resp.status;
    const headers = {};
    resp.buffer().then(body => {
      for (let key in _headers) {
        if (key!=='set-cookie') {
          headers[key] = _headers[key].join(',');
        } else {
          headers[key] = _headers[key];
        }
      }
      const resp2 = handler({url, status, headers, body});
      route.fulfill(resp2);
    });
    //.nextact.catch(err => {
    //   console.log(c.redBright('>> fetch error:'), err);
    // });
  })
}

module.exports = {
  extract,
  fetch,
};
