const c = require('ansi-colors')
const logmsg = require('./init/logmsg')

const {NODE_OPTIONS: opt} = process.env
const argv = process.argv.map(x=>x.replace(/\\/g, '/'))

global.mitm = {fn: {logmsg}}

// process.argv.splice(1,0,'--max-http-header-size=80001')
logmsg(c.red('\n[mitm-play.js]'))
logmsg(c.yellow(`Argv as seen from NodeJS`), argv)
if (opt) {
  if (opt.match(/--max-http-header-size/)) {
    logmsg(c.red('Please check your NODE_OPTIONS: --max-http-header-size atleast 40960'))
    logmsg(c.cyan(opt))
  } else {
    process.env.NODE_OPTIONS += ' --max-http-header-size=40960'
  }
} else {
  process.env.NODE_OPTIONS = '--max-http-header-size=40960'
}
logmsg(c.yellow(`NODE_OPTIONS=${process.env.NODE_OPTIONS}`))

global.__app = __dirname.replace(/\\/g, '/')
logmsg(c.yellow(`App Path: ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
