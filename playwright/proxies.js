const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

function chromeProxy(args) {
  const {proxypac, proxy} = global.mitm.argv
  if (proxypac) {
    logmsg(c.red.bgYellowBright(`>>> Chromium browser will use --proxypac ${proxypac}`))
    args.push(`--proxy-pac-url=${proxypac}`)
  } else if (typeof proxy === 'string') {
    let msg = proxy
    const arr = msg.match(/([^:]+:[^@]+)@\w+/)
    if (arr) {
      // feat: hide password
      msg = msg.replace(arr[1], '******:******')
    }
    logmsg(c.red.bgYellowBright(`>>> Chromium browser will use --proxy ${msg}`))
  }
}

module.exports = chromeProxy