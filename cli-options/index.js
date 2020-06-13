const c = require('ansi-colors');
const yargs = require('yargs-parser');
const initfn = require('./init-fn');
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');
const uroute = require('./uroute');
const helper = require('./helper');

const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME).replace(/\\/g, '/');

global.mitm = {
  session: (new Date).toISOString().split('.')[0].replace(/[:-]/g,''),
  argv: yargs(process.argv.slice(2)),
  data: {userroute: './**/*.js'},
  home: `${home}/.mitm-play`,
  port: 3000,
};
global.mitm.argv.browser = {};

module.exports = () => {
  const {argv} = global.mitm;
  const _package = require('../package.json')

  cliChg();
  if (argv.help) {
    helper(_package);
  }

  initfn();
  routes();
  cliCmd();
  
  if (global.mitm.argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  console.log(c.greenBright(JSON.stringify(argv, null, 2)));
  console.log(c.green(`v${_package.version}\n`));
  uroute();
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
