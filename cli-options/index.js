const fs = require('fs-extra');
const fg = require('fast-glob');
const yargs = require('yargs-parser');
const stringify = require('./stringify');
const script = require('../userroute');
const cliChg = require('./cli-chg');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');

const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME).replace(/\\/g, '/');

function tldomain(fullpath) {
  let fp;
  if (fullpath.match(/^chrome/)) {
    return fullpath;
  }
  try {
    fp = fullpath.
    match(/^\w+:\/\/([\w.]+)/)[1].
    split('.').reverse().
    slice(0,2).reverse().
    join('.');    
  } catch (error) {
    console.log('Error tldomain', error);
  }
  return fp;
}

function clear() {
  const {clear:c} = global.mitm.argv;
  (c===true || c==='cache') && fs.remove(`${mitm.home}/cache`);
  (c===true || c==='log') && fs.remove(`${mitm.home}/log`);
}

global.mitm = {
  argv: yargs(process.argv.slice(2)),
  home: `${home}/.mitm-play`,
  port: 3000,
  data: {
    userroute: './**/*.js',
  },
  fn: {
    stringify,
    tldomain,
    clear,
    fg,
  },
};

cliChg();
cliCmd();

module.exports = () => {
  const {argv} = mitm;
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
`);
    process.exit();
  }
  console.log(argv);
  routes();
  script();
}
