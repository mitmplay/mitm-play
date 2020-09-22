const c = require('ansi-colors');
const _ext = require('../filepath/ext');
const searchParams = require('./search-params');
const cookieRequest = require('./cookier');
const _setCookie = require('./set-cookie');
const {xjson} = searchParams;

module.exports = ({reqs, resp}) => {
  let {method, body: reqsBody, headers: reqsHeader} = reqs;
  let meta, {url, status, headers: respHeader} = resp;
  let setCookie = _setCookie(respHeader);
  let CSP =  respHeader['content-security-policy'] || 
             respHeader['content-security-policy-report-only'];
  if (CSP) {
    const obj = {};
    CSP.split(/ *; */).forEach(element => {
      const [id,...arr] = element.split(/ +/);
      id && (obj[id] = arr.sort().join(' '));
    });
    CSP = obj;
  }
  try {
    if (respHeader['report-to']) {
      respHeader['report-to'] = JSON.parse(respHeader['report-to']);
      console.log(respHeader['report-to']);
    }
  } catch (error) {
    respHeader['report-to'] = 'JSON Error!';
  }
  try {
    const urlParams = searchParams(url);
    if (reqsBody) {
      reqsBody = `${reqsBody}`;
      const raw = reqsBody;
      if (reqsBody.match(xjson)) {
        reqsBody = JSON.parse(reqsBody);
      } else if (reqsBody.match(/[\n ]*(\w+=).+(&)/)) {
        const formField = searchParams(reqsBody);
        reqsBody = {'*form*':formField, raw};      
      }
    } else {
      reqsBody = ''
    }
    cookieRequest(reqsHeader);  
    meta = {
      general: {
        ext: _ext(resp),
        status,  
        method,
        url,
      },
      respHeader,
      reqsBody,
      reqsHeader,
    };
    if (Object.keys(urlParams).length>1) {
      meta.urlParams = urlParams;
    }
    if (setCookie) {
      meta.setCookie = setCookie;
    }
    if (CSP) {
      meta.CSP = CSP;
    }
  } catch (error) {
    console.log(c.redBright('>> Error JSON.stringify'));
    console.log(error);
  }
  return meta
}
