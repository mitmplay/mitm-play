const fs = require('fs-extra');
const c = require('ansi-colors');

function argsChg(id, key) {
  let {argv} = global.mitm;
  if (argv[id]) {
    argv[key] = argv[id];
    delete argv[id];
  }
}

function obj(key,id) {
  let {argv} = global.mitm;
  if (argv[id]) {
    argv[key][id] = argv[id];
  }  
}

module.exports = () => {
  let {argv} = global.mitm;
  let prm0 = argv._[0] || 'default';
  prm0 = `${global.mitm.home}/argv/${prm0}.js`;

  let saveArgs; 
  if (fs.existsSync(prm0)) {
    saveArgs = JSON.parse(fs.readFileSync(prm0));
    console.log(c.green(`>> cmd: mitm-play ${JSON.stringify(saveArgs._args, null, 2)}`));
  }

  if (saveArgs && !argv.save) {
    const msg2 = process.argv.slice(2).join(' ');
    console.log(c.green(`>> cmd2 mitm-play ${msg2}`));
    const {_argv} = saveArgs;
    global.mitm.argv = {..._argv, ...argv};
    argv = global.mitm.argv;
  }

  argsChg('c', 'chromium');
  argsChg('d', 'delete');
  argsChg('f', 'firefox');
  argsChg('g', 'group');
  argsChg('h', 'help');
  argsChg('i', 'insecure');
  argsChg('k', 'cookie');
  argsChg('n', 'nosocket');
  argsChg('o', 'ommitlog');
  argsChg('p', 'pristine');
  argsChg('r', 'route');
  argsChg('s', 'save');
  argsChg('t', 'incognito');
  argsChg('u', 'url');
  argsChg('v', 'verbose');
  argsChg('w', 'webkit');
  argsChg('x', 'proxy');
  argsChg('z', 'lazy');

  obj('browser','chromium');
  obj('browser','firefox');
  obj('browser','webkit');

  if (Object.keys(argv.browser).length===0) {
    argv.browser.chromium = true;
    argv.chromium = true;
  }

  let {ommitlog} = argv;
  if (ommitlog) {
    ommitlog.split(',').forEach(element => {
      argv.ommit[element] = true;
    });
  }

  if (argv.chromium) {
    if (argv.incognito) {
      argv.pristine && (delete argv.pristine)
    } else if (argv.pristine===undefined) {
      argv.pristine = true;
    }
  }
}
