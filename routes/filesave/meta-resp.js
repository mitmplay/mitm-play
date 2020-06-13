const c = require('ansi-colors');

module.exports = ({reqs, resp}) => {
  let {method, body: reqsBody, headers: reqsHeader} = reqs;
  let meta, {url, status, headers: respHeader} = resp;
  try {
    if (reqsBody && reqsBody.match('^{"')) {
      reqsBody = JSON.parse(reqsBody);
    }
    meta = {
      url,
      method,
      status,
      respHeader,
      reqsHeader,
      reqsBody,
    };
  } catch (error) {
    console.log(c.redBright('>> Error JSON.stringify'));
    console.log(error);
  }
  return meta
}
