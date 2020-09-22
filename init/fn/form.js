function formToObj(search, docode=false) {
  const hashes = search.split('&');
  const params = {};
  hashes.map(hash => {
    const [key, val] = hash.split('=');
    params[key] = decode ? decodeURIComponent(val) : val;
  })
  return params;
}

function objToForm(params, encode=false) {
  const arr = [];
  for (let key in params) {
    const val = `${key}=${params[key]}`;
    arr.push(encode ? encodeURIComponent(val) : val)
  }
  return arr.join('&');
}

module.exports = {
  formToObj,
  objToForm,
}
