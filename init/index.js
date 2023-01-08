const {c} = global.mitm.lib

module.exports = () => {
  console.log(c.red('[init/index.js]'))
  const pkg = require('../package.json')
  global.mitm.version = pkg.version

  require('./init-ap')
  require('./cli-arg')() // deal with cli args
  const {argv} = global.mitm
  if (argv.help) {
    require('./helper')(pkg)
    process.exit()
  }
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
  msg = global.mitm.fn.tilde(msg)
  console.log(c.redBright('Profile Combine:'), msg)
  console.log(c.green(`v${pkg.version}`))
  // must be last or other watcher wont work
  require('./chokidar')
}
// mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
