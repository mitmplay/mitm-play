const xjson = /^[\n\t ]*({").+(})/;

function searchParams(url) {
  const urlParams = {};
  const urlSearch = new URLSearchParams(url);
  for (const [key, value] of urlSearch) {
    if (value.match(xjson)) {
      urlParams[key] = JSON.parse(`${value}`);
    } else {
      urlParams[key] = value;
    }
  }
  return urlParams;
}
searchParams.xjson = xjson;
module.exports = searchParams;