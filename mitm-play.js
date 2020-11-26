const c = require('ansi-colors')

global.__app = __dirname.replace(/\\/g, '/')
console.log(c.yellow(`>>> app ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
