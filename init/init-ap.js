const yargs = require('yargs-parser')

let _home
const { platform, env: { HOME, HOMEPATH } } = process
if (platform === 'win32') {
  _home = HOMEPATH
  if (!_home.match(/^[^:]:/)) {
    _home = `${process.cwd().match(/^[^:]/)[0].toUpperCase()}:${_home}`
  }
} else {
  _home = HOME
}

const app = global.__app
const cwd = process.cwd()
const home = `${_home.replace(/\\/g, '/')}/.mitm-play`
const userroute = './**/*.js'

const splitter = /([&?;,]|:\w|url|\/\w+=)/
const session = (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '') // cli-options\fn\session.js
const win32 = platform === 'win32'
const argv = { ommit: {}, browser: {}, ...yargs(process.argv.slice(2)) }
const path = { app, cwd, home, userroute }
const files = { _cache: {}, cache: [], _log: {}, log: [] }
const client = {
  csp: false,
  noarglogs: false,
  nohostlogs: false,
  postmessage: false
}

/**
 * Common Global vars
 */
global.mitm = {
  splitter,
  session,
  client,
  files,
  win32,
  path,
  argv,
  fn: {},
  data: {},
  pages: {},
  browsers: {},
  watcher: {},
  routes: { _global_: { config: {} } },
  router: { _global_: { config: {} } },
  source: {},
  __mock: {},
  __tag1: {},
  __tag2: {},
  __tag3: {},
  __tag4: {},
  wscmd: {},
  cdp: {}
}
