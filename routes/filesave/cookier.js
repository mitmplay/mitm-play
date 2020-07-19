module.exports = reqsHeader => {
  if (reqsHeader.cookie && typeof(reqsHeader.cookie)==='string') {
    const cookieObj = {};
    reqsHeader.cookie.split('; ').sort().forEach(element => {
      const [k,v] = element.split('=');
      cookieObj[k]= v;
    });
    reqsHeader.cookie = cookieObj;
  }
}
