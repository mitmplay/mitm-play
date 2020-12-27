const yargs = require('yargs-parser')
const _home = require('os').homedir();

const { platform } = process

const app = global.__app || ''
const cwd = process.cwd().replace(/\\/g, '/')
const home = `${_home.replace(/\\/g, '/')}/.mitm-play`
const userroute = './**/*.js'

const splitter = /([&?;,]|:\w|url|\/\w+=)/
const session = (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '') // cli-options\fn\session.js
const win32 = platform === 'win32'
const argv = { ommit: {}, browser: {}, ...yargs(process.argv.slice(2)) }
const path = { app, cwd, home, userroute }
const files = {
  _markdown: {}, // feat: markdown
  markdown: [],
  _profile: {}, // feat: profile
  profile: [],
  _cache: {},
  cache: [],
  _log: {},
  log: []
}
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
  watcher: {},
  browsers: {},
  activity: {}, // feat: activity
  routes: { _global_: { config: {} } },
  router: { _global_: { config: {} } },
  source: {},
  __args: {},
  __flag: {},
  __tag1: {},
  __tag2: {},
  __tag3: {},
  __tag4: {},
  __mock: {},
  __page: {},
  wscmd: {},
  cdp: {}
}
