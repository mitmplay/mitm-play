const fs = require('fs-extra');
const c = require('ansi-colors');
const args = require('../playwright/chromium-args');

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
    if (argv[key]===undefined) {
      argv[key] = {};
    }
    argv[key][id] = argv[id];
  }  
}

module.exports = () => {
  let {argv} = global.mitm;
  let prm0 = argv._[0];

  argv.profile = false;
  let browser, saveArgs; 

  function loadProfile(profile) {
    const path = `${global.mitm.home}/argv/${profile}.js`;
    const exist = fs.existsSync(path);
    if (!exist) {
      return false;
    }
    saveArgs = JSON.parse(fs.readFileSync(path));
    console.log(c.green(`>> cmd: mitm-play ${JSON.stringify(saveArgs._args, null, 2)}`),`(${profile})`);
    return true;
  }

  if (prm0 && loadProfile(prm0)) {
    argv.profile = true;
  } else if (prm0!=='default') {
    loadProfile('default');
  }

  if (saveArgs && !argv.save) {
    const msg2 = process.argv.slice(2).join(' ');
    console.log(c.green(`>> cmd2 mitm-play ${msg2}`));
    const {_argv: {
      browser: b,
      chromium,
      firefox,
      webkit,
      ...rest
    }} = saveArgs;
    browser = b;
    global.mitm.argv = {...rest, ...argv};
    argv = global.mitm.argv;
  }

  argsChg('c', 'relaxcsp');
  argsChg('d', 'delete');
  argsChg('g', 'group');
  argsChg('h', 'help');
  argsChg('i', 'insecure');
  argsChg('k', 'cookie');
  argsChg('n', 'nosocket');
  argsChg('p', 'pristine');
  argsChg('r', 'route');
  argsChg('s', 'save');
  argsChg('t', 'incognito');
  argsChg('u', 'url');
  argsChg('x', 'proxy');
  argsChg('z', 'lazy');

  argsChg('D', 'debug');
  argsChg('O', 'ommitlog');
  argsChg('P', 'plugins');
  argsChg('R', 'redirect');
  argsChg('V', 'verbose');
  argsChg('X', 'proxypac');

  argsChg('C', 'chromium');
  argsChg('F', 'firefox');
  argsChg('W', 'webkit');

  obj('browser','chromium');
  obj('browser','firefox');
  obj('browser','webkit');

  if (argv.browser===undefined) {
    argv = {
      ...argv,
      browser,
    }
  }

  if (Object.keys(argv.browser).length===0) {
    argv.browser.chromium = true;
  }

  let {ommitlog} = argv;
  if (ommitlog) {
    ommitlog.split(',').forEach(element => {
      argv.ommit[element] = true;
    });
  }

  if (argv.browser.chromium) {
    if (argv.incognito) {
      argv.pristine && (delete argv.pristine)
    } else if (argv.pristine===undefined) {
      argv.pristine = true;
    }
  }
}
