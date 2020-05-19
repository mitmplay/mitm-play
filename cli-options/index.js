const fs = require('fs-extra');
const fg = require('fast-glob');
const yargs = require('yargs-parser');
const stringify = require('./stringify');
const script = require('../userroute');
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
