const c = require('ansi-colors');
const _ext = require('../filepath/ext');

module.exports = ({meta, resp}) => {
  const {
    url,
    method,
    status,
    respHeader,
    reqsHeader,
    reqsBody,
  } = meta
  let respBody = resp.body;
  if (_ext(resp)==='json') {
    try {
      const contentLength = resp.headers['content-length'];
      if (contentLength && contentLength[0]!=='0') {
        respBody = JSON.parse(`${respBody}`);
      }
      respBody = JSON.stringify({
        url,
        method,
        status,
        respBody,
        respHeader,
        reqsHeader,
        reqsBody,
      }, null, 2);
    } catch (error) {
      console.log(c.redBright(`>> Error JSON.stringify`));
      console.log(error);
    }
  }
  return respBody
}
