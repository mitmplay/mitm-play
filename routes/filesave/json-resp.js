const c = require('ansi-colors');
const _ext = require('../filepath/ext');

module.exports = ({meta, resp, match}) => {
  let _resp, respBody;
  respBody = `${resp.body}`;
  const {log, parse} = match.route;
  if (_ext(resp)==='json' || log) {
    let {
      url,
      method,
      status,
      respHeader,
      reqsHeader,
      reqsBody,
    } = meta;
    try {
      if (typeof(log)==='string') {
        respBody = log;
      } else {
        if (typeof(log)==='function') {
          _resp = log(resp);
          _resp.body && (respBody = `${_resp.body}`);
          _resp.headers && (respHeader = _resp.headers);
        }
      };
      const urlParams = {};
      const urlSearch = new URLSearchParams(url);
      for (const [key, value] of urlSearch) {
        urlParams[key] = value;
      }
      const contentLength = resp.headers['content-length'];
      if (_ext(resp)==='json' && contentLength && contentLength[0]!=='0') {
        respBody = JSON.parse(`${respBody}`);
      }
      let jsonResp = {
        url,
        method,
        status,
        respBody,
        respHeader,
        reqsHeader,
        urlParams,
        reqsBody,
      };
      parse && (jsonResp = parse(jsonResp));
      respBody = JSON.stringify(jsonResp, null, 2);
    } catch (error) {
      console.log(c.redBright(`>> Error JSON.stringify`));
      console.log(error);
    }
  }
  return respBody
}
