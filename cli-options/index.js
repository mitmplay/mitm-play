const c = require('ansi-colors');
const yargs = require('yargs-parser');
const logsWatch = require('../chokidar/logs');
const urouteWatch = require('../chokidar/uroute');
const initfn = require('./init-fn');
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');
const helper = require('./helper');

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
  session: (new Date).toISOString().split('.')[0].replace(/[:-]/g,''),
  argv: yargs(process.argv.slice(2)),
  win32: platform==='win32',
  path: {
    userroute: './**/*.js',
    cwd: process.cwd(),
    app: global.__app,
  },
  home: `${home}/.mitm-play`,
  port: 3000,
  files: {
    cache: [],
    log: []
  },
  data: {},
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

  console.log(c.greenBright(JSON.stringify(global.mitm.argv, null, 2)));
  console.log(c.green(`\nv${_package.version}\n`));
  urouteWatch();
  logsWatch();
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
