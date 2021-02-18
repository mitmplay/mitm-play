const c = require('ansi-colors')

const {NODE_OPTIONS: opt} = process.env
// process.argv.splice(1,0,'--max-http-header-size=80001')
console.log(c.yellow(`>>> argv`), process.argv)
if (opt) {
  if (opt.match(/--max-http-header-size/)) {
    console.log(c.red('Please check your NODE_OPTIONS: --max-http-header-size atleast 40960'))
    console.log(c.cyan(opt))
  } else {
    process.env.NODE_OPTIONS += ' --max-http-header-size=40960'
  }
} else {
  process.env.NODE_OPTIONS = '--max-http-header-size=40960'
}
console.log(c.yellow(`>>> NODE_OPTIONS-2 ${process.env.NODE_OPTIONS}`))

global.__app = __dirname.replace(/\\/g, '/')
console.log(c.yellow(`>>> app ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
