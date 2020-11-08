const c = require('ansi-colors')

module.exports = () => {
  const pkg = require('../package.json')

  require('./init-ap')
  require('./cli-arg')() // deal with cli args
  global.mitm.version = pkg.version
  if (global.mitm.argv.help) {
    require('./helper')(pkg)
  }
  require('./console')() // init console.log
  require('./init-fn')() // must be first, init _debounce
  require('./routing')() // populate mitm.fn object
  require('./cli-cmd')() // setup folders & clean up

  if (global.mitm.argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
  process.env.PWDEBUG = '1'

  let msg = JSON.stringify(global.mitm.argv, null, 2)
  const arr = msg.match(/"proxy": "([^:]+:[^@]+)@\w+/)
  if (arr) {
    // feat: hide password
    msg = msg.replace(arr[1], '******:******')
  }
  const { tilde } = global.mitm.fn
  console.log(c.greenBright(tilde(msg)))
  console.log(c.green(`\nv${pkg.version}\n`))
  console.log(c.whiteBright('FILE WATCHER!'))
  // must be last or other watcher wont work
  require('./chokidar/profile')() // file watcher for profile // feat: profile
  require('./chokidar/route')() // file watcher for routes
  require('./chokidar/logs')() // file watcher for logs
  // require('./chokidar/cache')(); // file watcher for cache
}
// mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
