console.log('Start:')
const fs = require('fs-extra')
const c = require('ansi-colors')

global.mitm = {
  lib: {c, fs},
  fn: {},
}
let {env, argv} = process

console.log(c.red('[mitm-play.js]'))
console.log(c.yellow(`Argv as seen from NodeJS`), argv.map(x=>x.replace(/\\/g, '/')))

if (env.NODE_OPTIONS) {
  if (env.NODE_OPTIONS.match(/--max-http-header-size/)) {
    console.log(c.red('Please check your NODE_OPTIONS: --max-http-header-size atleast 40960'))
    console.log(c.cyan(env.NODE_OPTIONS))
  } else {
    env.NODE_OPTIONS += ' --max-http-header-size=40960'
  }
} else {
  env.NODE_OPTIONS = '--max-http-header-size=40960'
}
console.log(c.yellow(`NODE_OPTIONS=${env.NODE_OPTIONS}`))

global.__app = __dirname.replace(/\\/g, '/')
console.log(c.yellow(`App Path: ${global.__app}`))

require('./init')()
require('./ws-server')()
require('./playwright')()
