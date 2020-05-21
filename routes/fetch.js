const _fetch = require('make-fetch-happen');

function extract(route, request) {
  const {
    _url: url, 
    _method: method, 
    _headers: headers,
    _postData: body,
  } = route._request;
  return {url, method, headers, body};
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
  let el = fn.map(el=>`(${el})()`).join('\n');
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
  let el = fn.map(el=>`(${el})()`).join('\n');
  const script = `\n<script>${el}</script>`;
  let b = body+'';
  if (b.match(/<\/body>/i)) {
    b = b.replace(/<\/body>/i, `${script}</body>`);
  } else {
    b = b + script;
  }
  return b;
}

function fetch(route, {url, ...reqs}, handler) {
  _fetch(url, {...reqs, redirect: 'manual'}).then(resp => {
    const headers = resp.headers.raw();
    const status = resp.status;

    resp.buffer().then(body => {
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