const c = require('ansi-colors')

module.exports = () => {
  console.log(c.red('\n[init/index.js]'))
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

  if (global.mitm.argv.inspect) {
    process.env.PWDEBUG = '1'
  }

  let msg = JSON.stringify(global.mitm.argv, null, 2)
  // feat: hide password
  let arr1
  let arr2
  arr1 = msg.match(/"proxy": "([^:]+:[^@]+)@\w+/)
  arr2 = msg.match(/"basic": "([^:]+:\w+)"/)
  arr1 && (msg = msg.replace(arr1[1], '******:******'))
  arr2 && (msg = msg.replace(arr2[1], '******:******'))
  const { tilde } = global.mitm.fn
  console.log(c.redBright('Profile Combine:'), c.greenBright(tilde(msg)))
  console.log(c.green(`\nv${pkg.version}\n`))
  console.log(c.red('\n[init/chokidar/*.js]'))
  // must be last or other watcher wont work
  require('./chokidar/profile')() // file watcher for profile // feat: profile
  require('./chokidar/macros')() // file watcher for macros
  require('./chokidar/route')() // file watcher for routes
  require('./chokidar/logs')() // file watcher for logs
  require('./chokidar/md')() // file watcher for md
  // require('./chokidar/cache')(); // file watcher for cache
}
// mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
