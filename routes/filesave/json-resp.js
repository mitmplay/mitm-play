const c = require('ansi-colors');
const _ext = require('../filepath/ext');
const searchParams = require('./search-params');
const cookieRequest = require('./cookier');
const {xjson} = searchParams;

module.exports = ({reqs, resp, match}) => {
  let _resp, respBody;
  respBody = `${resp.body}`;
  const {log, parse} = match.route;
  if (_ext(resp)==='json' || log) {
    let {method, body: reqsBody, headers: reqsHeader} = reqs;
    let {url, status, headers: respHeader} = resp;
    try {
      if (typeof(log)==='string') {
        respBody = log;
      } else {
        if (typeof(log)==='function') {
          _resp = log(resp);
          _resp.body && (respBody = `${_resp.body}`);
          _resp.headers && (respHeader = _resp.headers);
        }
      }
      cookieRequest(reqsHeader);
      const urlParams = searchParams(url);      
      if (respBody && respBody.match(xjson)) {
        respBody = JSON.parse(`${respBody}`);
      }
      if (reqsBody) {
        reqsBody = `${reqsBody}`;
        if (reqsBody.match(xjson)) {
          reqsBody = JSON.parse(reqsBody);
        } else if (reqsBody.match(/[\n ]*(\w+=).+(&)/)) {
          const formField = searchParams(reqsBody);
          reqsBody = {'*form*':formField, raw: reqsBody};      
        }
      } else {
        reqsBody = ''
      }
      let jsonResp = {
        general: {
          ext: _ext(resp),
          status,  
          method,
          url,
        },
        respBody,
        respHeader,
        reqsBody,
        reqsHeader,
      };
      if (Object.keys(urlParams).length>1) {
        jsonResp.urlParams = urlParams;
      }  
      parse && (jsonResp = parse(jsonResp));
      respBody = JSON.stringify(jsonResp, null, 2);
    } catch (error) {
      console.log(c.redBright('>> Error JSON.stringify'));
      console.log(error);
    }
  }
  return respBody
}
