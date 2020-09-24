const _path = require('path');
const c = require('ansi-colors');
const yargs = require('yargs-parser');

let _home;
const {platform, env: {HOME, HOMEPATH}} = process;
if (platform==='win32') {
  _home = HOMEPATH;
  if (!_home.match(/^[^:]:/)) {
    _home = `${process.cwd().match(/^[^:]/)[0].toUpperCase()}:${_home}`;
  }
} else {
  _home = HOME;
}

const app = global.__app;
const cwd = process.cwd();
const home = _path.join(_home, '.mitm-play');
const userroute = './**/*.js';

const splitter = /([&?;,]|:\w|url|\/\w+=)/;
const session = (new Date).toISOString().slice(0,18).replace(/[T:-]/g,''); // cli-options\fn\session.js
const win32 = platform==='win32';
const argv = {ommit: {},browser: {},...yargs(process.argv.slice(2))};
const path = {app, cwd, home, userroute};
const files = {_cache: {}, cache: [], _log: {}, log: []};
const client = {
  csp: false,
  noarglogs: false,
  nohostlogs: false,
  postmessage: false,
};

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
  routes: {},
  router: {},
  source: {},
  __mock: {},
  __tag1: {},
  __tag2: {},
  __tag3: {},
  __tag4: {},
  wscmd: {},
  cdp: {},
};

module.exports = () => {
  const package = require('../package.json')

  require('./cli-arg')(); // deal with cli args
  if (global.mitm.argv.help) {
    require('./helper')(package);
  }

  require('./init-fn')(); // must be first, init _debounce
  require('./routing')(); // populate mitm.fn object
  require('./cli-cmd')(); // setup folders & clean up
  
  if (global.mitm.argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  process.env.PWDEBUG = '1';

  console.log(c.greenBright(JSON.stringify(global.mitm.argv, null, 2)));
  console.log(c.green(`\nv${package.version}\n`));
  console.log(c.whiteBright('FILE WATCHER!'));
  //must be last or other watcher wont work
  require('./chokidar/route')(); // file watcher for routes
  require('./chokidar/logs')(); // file watcher for logs
  //require('./chokidar/cache')(); // file watcher for cache
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
