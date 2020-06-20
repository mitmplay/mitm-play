function debounce(fn, delay=500, msg) {
  let _timeout;
  return function() {
    const _this = this;
    const args = arguments;
    msg && console.log('debounce', msg);
    _timeout && clearTimeout(_timeout);
    _timeout = setTimeout(() => {
      fn.apply(_this, args);
    }, delay)
  }
}
global._debounce = debounce;
module.exports = debounce;
