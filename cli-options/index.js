const fs = require('fs-extra');
let argv = require('yargs-parser')(process.argv.slice(2));

global.mitm = {
  home: `${process.env.HOME}/.mitm-play`,
  port: 3000,
  argv,
};

fs.ensureDir(mitm.home, err =>{});

let arg = argv._[0] || 'default';
arg = `${mitm.home}/argv/${arg}.js`;
if (fs.existsSync(arg)) {
  const _argv = JSON.parse(fs.readFileSync(arg));
  argv = {..._argv, ...argv};
  global.mitm.argv = argv;
}

if (argv.go && !argv.go.match('http')) {
  argv.go = `https://${argv.go}`;
}

if (argv.clear) {
  fs.remove(`${mitm.home}/cache`);
  fs.remove(`${mitm.home}/log`);
}

if (argv.save) {
  const { save, ...rest } = argv;
  const fpath = `${mitm.home}/argv/${save===true ? 'default' : save}.js`;
  const body = JSON.stringify(rest, null, 2);
  fs.ensureFile(fpath, err => {
    fs.writeFile(fpath, body, err => {});
  });
}

if (!argv.browser || ['firefox','webkit'].indexOf(argv.browser)===-1) {
  mitm.argv.browser = 'chromium';
}

module.exports = () => {
  if (argv.help) {
    console.log(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    --go     \t go to specific website location
    --browser\t set browser: chromium/firefox/webkit
    --clear  \t clear cache and/or logs
    --save   \t save as default <profl>
  `);
    process.exit();
  }
  console.log(argv);
}
