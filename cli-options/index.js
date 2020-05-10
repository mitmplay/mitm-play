const fs = require('fs-extra');
const argv = require('yargs-parser')(process.argv.slice(2))
const port = 3000;
global.mitm = {
  port,
  argv,
};

if (argv.go && !argv.go.match('http')) {
  argv.go = `https://${argv.go}`;
}

if (argv.clear) {
  fs.remove('cache');
  fs.remove('log');
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
