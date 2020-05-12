require('./match');

function jsonResponse({url}) {
  let result;
  for (let key in mitm.route.skip) {
    result = url.match(key);
    if (result) {
      return true;
    }
  }
}

module.exports = jsonResponse;
