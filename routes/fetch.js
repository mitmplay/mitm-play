const _fetch = require('make-fetch-happen');

function extract(route, request) {
  return {
    url: route.request().url(),
    headers: request.headers(),      
    method: route.request.method,  
  }
}

function e_head(body, fn) {
  let el = fn.map(el=>`(${el})()`).join('\n');
  let b = body+'';
  if (b.match(/<head>/i)) {
    b = b.replace(/<head>/i, `<head>\n<script>${el}</script>`);
  } else {
    const h = b.match(/(<html[^>]+>)/i);
    if (!h) {
      console.log('>> err', b.length)
    } else {
      b = b.replace(h[0], `${h[0]}\n<script>${el}</script>`);
    }
  }
  return b;

}

function e_end(body, fn) {
  let el = fn.map(el=>`(${el})()`).join('\n');
  let b = body+'';
  if (b.match(/<\/body>/i)) {
    b = b.replace(/<\/body>/i, `\n<script>${el}</script></body>`);
  } else {
    b = b + `\n<script>${el}</script>`;
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
  extract,
  e_head,
  e_end,
  fetch,
}