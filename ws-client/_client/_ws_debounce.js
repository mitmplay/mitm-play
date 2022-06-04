function debounce (fn, delay = 500) {
  let _timeout
  return function () {
    const _this = this
    const args = arguments
    _timeout && clearTimeout(_timeout)
    _timeout = setTimeout(() => {
      fn.apply(_this, args)
    }, delay)
  }
}
module.exports = debounce
