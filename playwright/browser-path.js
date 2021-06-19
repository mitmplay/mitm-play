const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

function browserPath(browserName, options) {
  const {
    argv,
    fn: { home }
  } = global.mitm
  let execPath = argv.browser[browserName]
  if (typeof (execPath) === 'string') {
    execPath = execPath.replace(/\\/g, '/')
    if (browserName !== 'chromium') {
      logmsg(c.redBright('executablePath is unsupported for non Chrome!'))
    } else if (process.platform === 'darwin') {
      execPath += '/Contents/MacOS/Google Chrome'
    }
    options.executablePath = home(execPath)
  } else {
    const _browser = require('playwright')[browserName]
    execPath = _browser.executablePath().replace(/\\/g, '/')
  }
  if (browserName !== 'chromium') {
    logmsg(c.yellow(`Exec. path: ${execPath}`))
  }
}
module.exports = browserPath
