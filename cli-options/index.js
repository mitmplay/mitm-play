const yargs = require('yargs-parser');
const script = require('../userroute');
const initfn = require('./init-fn');
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');

const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME).replace(/\\/g, '/');

global.mitm = {
  argv: yargs(process.argv.slice(2)),
  home: `${home}/.mitm-play`,
  port: 3000,
  data: {
    userroute: './**/*.js',
  },
  fn: {},
};

initfn();
cliChg();
cliCmd();

module.exports = () => {
  const {argv} = mitm;
  const package = require('../package.json')
  if (argv.help) {
    console.log(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    -h --help     \t show this help
    -g --go       \t go to location
    -b --browser  \t browser: chromium/firefox/webkit
    -p --pristine \t pristine browser not recommended
    -l --logurl   \t test route to log url & headers
    -r --route    \t set userscript folder of routes
    -c --clear    \t clear cache and/or logs
    -s --save     \t save as default <profl>
    --chromium    \t browser = chromium
    --firefox     \t browser = firefox
    --webkit      \t browser = webkit

  v${package.version}
`);
    process.exit();
  }
  console.log(argv);
  console.log(`v${package.version}\n`);
  routes();
  script();
}
