const c = require('ansi-colors')
const {logmsg} = global.mitm.fn

module.exports = () => {
  logmsg(c.red('\n[init/index.js]'))
  const pkg = require('../package.json')
  global.mitm.version = pkg.version

  require('./init-ap')
  require('./cli-arg')() // deal with cli args
  const {argv} = global.mitm
  if (argv.help) {
    require('./helper')(pkg)
    process.exit()
  }
  require('./console')() // init logmsg
  require('./init-fn')() // must be first, init _debounce
  require('./routing')() // populate mitm.fn object
  require('./cli-cmd')() // setup folders & clean up
  if (!argv.nosql) {
    require('./init-db')() // load sqlite db
  }
  if (argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  if (argv.inspect) {
    process.env.PWDEBUG = '1'
  }

  let msg = JSON.stringify(argv, null, 2)
  // feat: hide password
  let arr1
  let arr2
  arr1 = msg.match(/"proxy": "([^:]+:[^@]+)@\w+/)
  arr2 = msg.match(/"basic": "([^:]+:\w+)"/)
  arr1 && (msg = msg.replace(arr1[1], '******:******'))
  arr2 && (msg = msg.replace(arr2[1], '******:******'))
  const {tilde } = global.mitm.fn
  logmsg(c.redBright('Profile Combine:'), c.greenBright(tilde(msg)))
  logmsg(c.green(`\nv${pkg.version}\n`))
  logmsg(c.red('\n[init/chokidar/*.js]'))
  // must be last or other watcher wont work
  require('./chokidar/profile')() // file watcher for profile // feat: profile
  require('./chokidar/macros')() // file watcher for macros
  require('./chokidar/route')() // file watcher for routes
  require('./chokidar/logs')() // file watcher for logs
  require('./chokidar/md')() // file watcher for md
  // require('./chokidar/cache')(); // file watcher for cache
}
// mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
