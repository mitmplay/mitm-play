module.exports = ({reqs, resp, ext, meta}) => {
  let {url, status, body} = resp;
  let {method} = reqs;
  if (ext==='json') {
    try {
      const contentLength = resp.headers['content-length'];
      if (contentLength && contentLength[0]!=='0') {
        body = JSON.parse(`${body}`);
      }
      if (meta) {
        body = {
          url,
          method,
          status,
          respBody: body,
          respHeader: resp.headers
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
