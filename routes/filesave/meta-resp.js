const c = require('ansi-colors');
const searchParams = require('./search-params');
const {xjson} = searchParams;

module.exports = ({reqs, resp}) => {
  let {method, body: reqsBody, headers: reqsHeader} = reqs;
  let meta, {url, status, headers: respHeader} = resp;
  try {
    const urlParams = searchParams(url);
    if (reqsBody) {
      const raw = reqsBody;
      if (reqsBody.match(xjson)) {
        reqsBody = JSON.parse(reqsBody);
      } else if (reqsBody.match(/[\n ]*(\w+=).+(&)/)) {
        const formField = searchParams(reqsBody);
        reqsBody = {'*form*':formField, raw};      
      }
    }
    meta = {
      url,
      method,
      status,
      respHeader,
      reqsHeader,
      reqsBody,
    };
    if (Object.keys(urlParams).length>1) {
      meta.urlParams = urlParams;
    }
  } catch (error) {
    console.log(c.redBright('>> Error JSON.stringify'));
    console.log(error);
  }
  return meta
}
