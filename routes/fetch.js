const _fetch = require('make-fetch-happen');

function extract(route, request) {
  return {
    url: route.request().url(),
    headers: request.headers(),      
    method: route.request.method,  
  }
}

function script_src(body, src) {
  let el = src.map(el=>`<script src="/mitm-play/${el}"></script>`).join('\n');
  let b = body+'';
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>\n${el}`);
  } else {
    const h = b.match(/(<html[^>]+>)/i);
    if (!h) {
      console.log('>> err', b.length)
    } else {
      b = b.replace(h[0], `${h[0]}\n${el}`);
    }
  }
  return b;
}

function e_head(body, fn) {
  let el = fn.map(el=>`(${el})()`).join('\n');
  const script = `\n<script>${el}</script>`;
  let b = body+'';
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>>${script}`);
  } else {
    const h = b.match(/(<html[^>]+>)/i);
    if (!h) {
      console.log('>> err', b.length)
    } else {
      b = b.replace(h[0], `${h[0]}>${script}`);
    }
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

function fetch(route, {url, headers, method}, handler) {
  // console.log(url, JSON.stringify(headers, null, 2))
  _fetch(url, {headers,method, redirect: 'manual'}).then(resp => {
    const headers = resp.headers.raw();
    const status = resp.status;

    resp.buffer().then(body => {
      const resp = handler({url, status, headers, body});
      route.fulfill(resp);
    })
  }).catch(err => {
    console.log('fetch error:', err);
  })
}

module.exports = {
  script_src,
  extract,
  e_head,
  e_end,
  fetch,
}