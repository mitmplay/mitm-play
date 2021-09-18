const c = require('ansi-colors')
let { logmsg } = global.mitm.fn

let delayFN
if (global.mitm.argv.lazylog) {
  logmsg(c.redBright('>>> delay logmsg'))

  delayFN = function () {
    const { lazylog } = global.mitm.argv
    const delay = lazylog === true ? 500 : lazylog
    let msg = ['']
    let _timeout = null
    const { log } = console

    logmsg = function () {
      msg = msg.concat([].slice.call(arguments), '\n')
      _timeout && clearTimeout(_timeout)
      _timeout = setTimeout(() => {
        msg.pop()
        log.apply(console, msg)
        msg = ['']
      }, delay)
    }
  }
} else {
  delayFN = () => {
    // This is intentional
  }
}

module.exports = delayFN
