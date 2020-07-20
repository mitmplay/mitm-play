const c = require('ansi-colors');
const yargs = require('yargs-parser');
const initfn = require('./init-fn'); // must be first, init _debounce
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');
const helper = require('./helper');
const logsWatch = require('../chokidar/logs');
//const cacheWatch = require('../chokidar/cache');
const urouteWatch = require('../chokidar/uroute');

let home;
const {platform, env: {HOME, HOMEPATH}} = process;
if (platform==='win32') {
  home = HOMEPATH.replace(/\\/g, '/');
  if (!home.match(/^[^:]:/)) {
    home = `${process.cwd().match(/^[^:]/)[0].toUpperCase()}:${home}`;
  }
} else {
  home = HOME;
}

global.mitm = {
  splitter: /([&?;,]|:\w|url|\/\w+=)/,
  session: (new Date).toISOString().split('.')[0].replace(/[:-]/g,''),
  argv: yargs(process.argv.slice(2)),
  win32: platform==='win32',
  path: {
    userroute: './**/*.js',
    cwd: process.cwd(),
    app: global.__app,
  },
  home: `${home}/.mitm-play`,
  watcher: {},
  port: 3000,
  files: {
    _cache: {},
    cache: [],
    _log: {},
    log: []
  },
  data: {},
  client: {
    csp: false,
    nohostlogs:false,
    postmessage: false,
  }
};
global.mitm.argv.browser = {};
global.mitm.argv.ommit = {};

module.exports = () => {
  const _package = require('../package.json')

  cliChg();
  if (global.mitm.argv.help) {
    helper(_package);
  }

  initfn();
  routes();
  cliCmd();
  
  if (global.mitm.argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  process.env.PWDEBUG = '1';

  console.log(c.greenBright(JSON.stringify(global.mitm.argv, null, 2)));
  console.log(c.green(`\nv${_package.version}\n`));

  // cacheWatch();
  logsWatch();

  //must be last or other watcher wont work
  urouteWatch(); 
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
