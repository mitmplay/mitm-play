const c = require('ansi-colors')
const logmsg = require('./init/logmsg')

global.mitm = {fn: {logmsg}}
let {env, argv} = process

logmsg(c.red('\n[mitm-play.js]'))
logmsg(c.yellow(`Argv as seen from NodeJS`), argv.map(x=>x.replace(/\\/g, '/')))

if (env.NODE_OPTIONS) {
  if (env.NODE_OPTIONS.match(/--max-http-header-size/)) {
    logmsg(c.red('Please check your NODE_OPTIONS: --max-http-header-size atleast 40960'))
    logmsg(c.cyan(env.NODE_OPTIONS))
  } else {
    env.NODE_OPTIONS += ' --max-http-header-size=40960'
  }
} else {
  env.NODE_OPTIONS = '--max-http-header-size=40960'
}
logmsg(c.yellow(`NODE_OPTIONS=${env.NODE_OPTIONS}`))

global.__app = __dirname.replace(/\\/g, '/')
logmsg(c.yellow(`App Path: ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
