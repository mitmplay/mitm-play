const _match = require('./match');
const addReplaceBody = require('./add-replace-body');
const {matched,searchFN} = _match;

function jsResponse(arr, reqs) {
  const search = searchFN('js', reqs);
  const match = matched(search, reqs);
  if (match) {
    arr.push(resp => {
      const contentType = `${resp.headers['content-type']}`;
      if (contentType.match('javascript')) {
        console.log(match.log);
        if (typeof(match.route)==='string') {
          resp.body = addReplaceBody(resp.body, match);
        } else {
          let resp2;
          if (match.route.resp) {
            resp2 = match.route.resp(resp);
          }
          resp = {
            ...resp,
            ...resp2,
          }
        };
      }
      return resp;
    });
  }
}

module.exports = jsResponse;
