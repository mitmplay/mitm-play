const c = require('ansi-colors');
const yargs = require('yargs-parser');
const initfn = require('./init-fn');
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');
const uroute = require('./uroute');

const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME).replace(/\\/g, '/');

global.mitm = {
  session: (new Date).toISOString().split('.')[0].replace(/[:-]/g,''),
  argv: yargs(process.argv.slice(2)),
  data: {userroute: './**/*.js'},
  home: `${home}/.mitm-play`,
  port: 3000,
};

initfn();
cliChg();
routes();
cliCmd();

if (mitm.argv.insecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

module.exports = () => {
  const {argv} = mitm;
  const package = require('../package.json')
  if (argv.help) {
    console.log(c.greenBright(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    -h --help     \t show this help
    -u --url      \t go to specific url
    -g --group    \t create cache group/rec
    -d --delete   \t clear/delete logs or cache
    -i --insecure \t set nodejs env to accept insecure cert
    -p --pristine \t pristine browser, not recommended to use
    -n --nosocket \t no websocket injection to html page
    -z --lazylog  \t debounce save after millsec invoked
    -b --browser  \t browser: chromium/firefox/webkit
    -l --logurl   \t test route to log url & headers
    -r --route    \t set userscript folder of routes
    -s --save     \t save as default <profl>
    --proxypac    \t set chromium proxypac 
    --chromium    \t browser = chromium
    --firefox     \t browser = firefox
    --webkit      \t browser = webkit
    --proxy       \t a proxy request

  v${package.version}
`));
    process.exit();
  }
  console.log(c.greenBright(JSON.stringify(argv, null, 2)));
  console.log(c.green(`v${package.version}\n`));
  uroute();
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -cspr='.'