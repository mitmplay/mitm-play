const c = require('ansi-colors');
const searchParams = require('./search-params');
const {xjson} = searchParams;

module.exports = ({reqs, resp}) => {
  let {method, body: reqsBody, headers: reqsHeader} = reqs;
  let meta, {url, status, headers: respHeader} = resp;
  let setCookie;
  if (respHeader['set-cookie']) {
    setCookie = [];
    for (let cookie of respHeader['set-cookie']) {
      const id = cookie.split('=')[0];
      const arr = cookie.split(/; */);
      const items = {};
      for (let itm of arr) {
        const [k,v] = itm.split('=');
        items[k] = v || true;
      }
      const expire = cookie.match(/expires=([^;]+)/);
      if (expire) {
        const elapsed = Date.parse(expire[1]) - Date.now();
        items._elapsed = elapsed;  
      }
      setCookie.push(items);
    }
  }
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
      general: {
        status,  
        method,
        url,
      },
      respHeader,
      reqsHeader,
      reqsBody,
    };
    if (Object.keys(urlParams).length>1) {
      meta.urlParams = urlParams;
    }
    if (setCookie) {
      meta.setCookie = setCookie;
    }
  } catch (error) {
    console.log(c.redBright('>> Error JSON.stringify'));
    console.log(error);
  }
  return meta
}
