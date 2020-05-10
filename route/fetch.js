const _fetch = require('make-fetch-happen');

function extract(route, request) {
  return {
    url: route.request().url(),
    headers: request.headers(),      
    method: route.request.method,  
  }
}

function addJS(body, fn) {
  return (body+'').replace('<head>', `<head>\n<script>(${fn})()</script>`);

}

function fetch(route, {url, headers, method}, handler) {
  console.log(url, JSON.stringify(headers, null, 2))
  _fetch(url, {headers,method}).then(resp => {
    const headers = resp.headers.raw();
    const status = resp.status;

    resp.buffer().then(body => {
      const response = handler({status, headers, body});
      route.fulfill(response);
    })
  })
}

module.exports = {
  extract,
  addJS,
  fetch,
}