const yargs = require('yargs-parser');
const stringify = require('./stringify');
const script = require('../script');
const cliCmd = require('./cli-cmd');
const routes = require('./routes');
const fg = require('fast-glob');

const {platform, env: {HOME, HOMEPATH}} = process;
const home = (platform === 'win32' ? HOMEPATH : HOME);

function tldomain(fullpath) {
  return fullpath.
    match(/^\w+:\/\/([\w.]+)/)[1].
    split('.').reverse().
    slice(0,2).reverse().
    join('.');
}

global.mitm = {
  argv: yargs(process.argv.slice(2)),
  home: `${home}/.mitm-play`,
  port: 3000,
  fn: {
    stringify,
    tldomain,
    fg,
  },
};

cliCmd();

module.exports = () => {
  const {argv} = mitm;
  if (argv.h || argv.help) {
    console.log(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    --help/-h  \t show this help
    --go       \t go to specific website location
    --browser  \t set browser: chromium/firefox/webkit
    --pristine \t set a pristine browser (not recommended)
    --logurl/-l\t test route to log url & headers 
    --clear    \t clear cache and/or logs
    --save     \t save as default <profl>
  `);
    process.exit();
  }
  console.log(argv);
  routes();
  script();
}
