const c = require('ansi-colors')

if (process.env.NODE_OPTIONS.match(/--max-http-header-size/)) {
  console.log(c.red('Please check your NODE_OPTIONS: --max-http-header-size atleast 40960'))
} else {
  process.env.NODE_OPTIONS += ' --max-http-header-size=40960'
}

global.__app = __dirname.replace(/\\/g, '/')
console.log(c.yellow(`>>> app ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
