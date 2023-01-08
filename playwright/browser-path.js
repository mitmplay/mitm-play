const {c} = global.mitm.lib

const channel = {
  msedge: true,
  chrome: true,
  'chrome-dev': true,
  'msedge-dev': true,
  'chrome-beta': true,
  'msedge-beta': true,
}

function browserPath(browserName, options) {
  const {
    argv,
    fn: { home }
  } = global.mitm
  let execPath = argv.browser[browserName]
  if (typeof (execPath) === 'string') {
    if (channel[execPath]) {
      options.channel = execPath
    } else {
      execPath = execPath.replace(/\\/g, '/')
      if (browserName !== 'chromium') {
        console.log(c.redBright('executablePath is unsupported for non Chrome!'))
      } else if (process.platform === 'darwin') {
        execPath += '/Contents/MacOS/Google Chrome'
      }
      options.executablePath = home(execPath)  
    }
  } else {
    const _browser = require('playwright')[browserName]
    execPath = _browser.executablePath().replace(/\\/g, '/')
  }
  if (browserName !== 'chromium') {
    console.log(c.yellow(`Exec. path: ${execPath}`))
  }
}
module.exports = browserPath
