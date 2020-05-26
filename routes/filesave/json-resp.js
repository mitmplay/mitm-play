module.exports = ({reqs, resp, ext, meta}) => {
  let {url, status, body} = resp;
  let {method} = reqs;
  if (ext==='json') {
    try {
      const contentLength = resp.headers['content-length'];
      if (contentLength && contentLength[0]!=='0') {
        body = JSON.parse(`${body}`);
      }
      const headers = {};
      for (let key in resp.headers) {
        if (key!=='set-cookie') {
          headers[key] = resp.headers[key].join(',');
        } else {
          headers[key] = resp.headers[key];
        }
      }
      if (method==='POST')
         debugger;
      let reqsBody;
      if (reqs.body && reqs.body.match('^{"')) {
        reqsBody = JSON.parse(reqs.body);
      } else {
        reqsBody = reqs.body;
      }
      if (meta) {
        body = {
          url,
          method,
          status,
          respBody: body,
          reqsBody: reqsBody,
          respHeader: headers,
          reqsHeader: reqs.headers,
        }
      }
      body = JSON.stringify(body, null, 2);
    } catch (error) {
      console.log(c.redBright(`>> Error JSON.stringify`));
      console.log(error);
    }
  }
  return body
}
