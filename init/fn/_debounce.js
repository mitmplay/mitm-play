function debounce (fn, delay = 500, msg='') {
  let _timeout = null
  return function () {
    const _this = this
    const args = arguments
    _timeout && clearTimeout(_timeout)
    _timeout = setTimeout(() => {
      fn.apply(_this, args)
    }, delay)
  }
}
global._debounce = debounce
module.exports = debounce
