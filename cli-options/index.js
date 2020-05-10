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
  fs.remove('cache');
  fs.remove('log');
}

if (argv.save) {
  const { save, ...rest } = argv;
  const fpath = `${mitm.home}/argv/${save===true ? 'default' : save}.js`;
  const body = JSON.stringify(rest, null, 2);
  fs.ensureFile(fpath, err => {
    fs.writeFile(fpath, body, err => {});
  });
}

module.exports = () => {
  console.log(argv);
  
  if (argv.help) {
    console.log(
  `
  Usage: mitm <cmd> [options]
  
  Options:
    --go   \t go to specific website
    --clear\t clear cache and/or logs
    --save \t save as default options
  `);
    process.exit();
  }  
}
