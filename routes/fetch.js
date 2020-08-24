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

function fetch(route, browserName, {url, proxy, ...reqs}, handler) {
  const {argv, splitter} = global.mitm;
  const opts = {redirect: true};
  if (argv.redirect && argv.redirect!==true) {
    opts.redirect = 'manual';
  }
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

  const okCallback = resp => {
    const _headers = resp.headers.raw();
    let status = resp.status;
    if (proxy && argv.verbose) {
      console.log(c.grey(`>> proxy (${url.split(splitter)[0]})`));
    }
    const headers = {};
    for (let key in _headers) {
      if (key!=='set-cookie') {
        headers[key] = _headers[key].join(',');
      } else {
        headers[key] = _headers[key];
      }
    }
    if (status===301 || status===302) {
      if (argv.redirect==='browser') {
        route.continue({headers, status});
      } else if (argv.redirect==='manual') {
        const url = headers.location;
        if (url) {
          delete headers.location;
          delete headers['content-security-policy'];
          headers['content-type'] = 'text/html';
          route.fulfill({headers, body: `
Redirect...
<script>window.location = '${url}';</script>
          `});
        }
        return;
      }
    }
    resp.buffer().then(body => {
      if (status===undefined) {
        status = headers['x-app-status'];
      }
      if (status>=400) {
        console.log(c.redBright(`[${reqs.method}] ${url} => ${status}`));
        console.log(c.red(`${body}`));
      }
      handler({url, status, headers, body});
    });
  }

  function delay(t) {
    return new Promise(resolve => setTimeout(resolve, t));
  }

  const fetchRetry = async (url, opt, n) => {
    for (let i=1; i <= n; i++) {
      try {
        const resp = await _fetch(url, opt);
        okCallback(resp);
        break;
      } catch (err) {
        if (err.code==='ECONNRESET' && i <= n) {
          console.log(c.yellowBright(`RETRY:${i}`), url);
          await delay(2500);
        } else {
          throw err;
        }
      }
    }
  }
  fetchRetry(url, {...reqs, ...opts}, 2);
}

module.exports = {
  extract,
  fetch,
};
