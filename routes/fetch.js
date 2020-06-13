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

function script_src(body, src) {
  let el = src.map(el=>`<script nonce src="/mitm-play/${el}"></script>`).join('\n');
  let b = body+'';
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>\n${el}`);
  } else {
    const h = b.match(/(<html[^>]*>)/i);
    if (h) {
      b = b.replace(h[0], `${h[0]}\n${el}`);
    } else {
      b = `${el}\n${b}`;
    }
  }
  return b;
}

function source(body, src) {
  let el = src.map(el=>`(${el})();`).join('\n');
  return `${body}\n${el}`;
}

function e_head(body, fn) {
  let el = fn.map(el=>`(${el})();`).join('\n');
  const script = `\n<script>${el}</script>\n`;
  let b = body+'';
  let h = b.match(/<head[^>]*>/i);
  !h && (h = b.match(/<html[^>]*>/i));

  if (h) {
    b = b.replace(h[0], `${h[0]}${script}`);
  } else {
    b = `${script}${b}`;
  }
  return b;
}

function e_end(body, fn) {
  let el = fn.map(el=>`(${el})();`).join('\n');
  const script = `\n<script>${el}</script>\n`;
  let b = body+'';
  if (b.match(/<\/body>/i)) {
    b = b.replace(/<\/body>/i, `${script}</body>`);
  } else if (b.match(/<\/html>/i)) {
    b = b.replace(/<\/html>/i, `${script}</html>`);
  } else {
    b = b + script;
  }
  return b;
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
    console.log(c.grey(`>> proxy (${url.split(/([&?;,]|:\w|url)/)[0]})`));
  }

  _fetch(url, {...reqs, ...opts}).then(resp => {
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
    })
  // }).catch(err => {
  //   console.log('fetch error:', err);
  })
}

module.exports = {
  script_src,
  extract,
  source,
  e_head,
  e_end,
  fetch,
}