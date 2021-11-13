const yargs = require('yargs-parser')
const _home = require('os').homedir();

const { platform } = process

const app = global.__app || ''
const cwd = process.cwd().replace(/\\/g, '/')
const home = `${_home.replace(/\\/g, '/')}/.mitm-play`
const userroute = './**/*.js'

const splitter = /([&?;,]|:\w|url|\/\w+=)/
const session = (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '') // cli-options\fn\session.js
const argv = { ommit: {}, browser: {}, ...yargs(process.argv.slice(2)) }
const path = { app, cwd, home, userroute }
const win32 = platform === 'win32'

const info = {
  csp: {}
}
const files = {
  _markdown:{}, // feat: markdown
  _profile: {}, // feat: profile
  _cache:   {},
  _log:     {},
  markdown: [],
  profile:  [],
  cache:    [],
  log:      []
}
const client = {
  postmessage: false,
  nohostlogs: false,
  noarglogs: false,
  csp: false
}

/**
 * Common Global vars
 */
const {mitm} = global
global.mitm = {
  ...mitm,
  splitter,
  session,
  client,
  files,
  win32,
  path,
  argv,
  info,
  data: {},
  pages: {},
  watcher: {},
  plugins: {},
  browsers: {},
  activity: {}, // feat: activity
  routes: { _global_: { config: {} } },
  router: { _global_: { config: {} } },
  __mocks: {}, // feat: __mocks
  __mockr: {},
  routex: {},
  source: {},
  __args: {},
  __flag: {},
  __tag1: {},
  __tag2: {},
  __tag3: {},
  __tag4: {},
  __page: {},
  wscmd: {},
  wsrun: {
    $ping ({ data }) { // ws__send('ping', 'hi', d=>console.log(`result ${d}`))
      return `pong ${data}!`
    },
  },
  cdp: {}
}
