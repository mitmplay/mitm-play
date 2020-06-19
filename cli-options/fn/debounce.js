function debounce(fn, delay=500) {
  let debunk;
  return function() {
    const _this = this;
    const args = arguments;
    debunk && clearTimeout(debunk);
    debunk = setTimeout(() => {
      fn.apply(_this, args);
    }, delay)
  }
}
module.exports = debounce;