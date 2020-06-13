function argsChg(id, key) {
  let {argv} = global.mitm;
  if (argv[id]) {
    argv[key] = argv[id];
    delete argv[id];
  }
}

function browser(id) {
  let {argv} = global.mitm;
  if (argv[id]) {
    argv.browser = id;
    if (typeof(argv[id])==='string') {
      argv.executablePath = argv[id];
    }
    delete argv[id];
    return true;
  }  
}

module.exports = () => {
  let {argv} = global.mitm;

  argsChg('u', 'url');
  argsChg('h', 'help');
  argsChg('s', 'save');
  argsChg('g', 'group');
  argsChg('r', 'route');
  argsChg('d', 'delete');
  argsChg('l', 'logurl');
  argsChg('b', 'browser');
  argsChg('z', 'lazylog');
  argsChg('i', 'insecure');
  argsChg('p', 'pristine');
  argsChg('n', 'nosocket');

  if (!argv.browser || ['firefox','webkit'].indexOf(argv.browser)===-1) {
    argv.browser = 'chromium';
  }

  let br = browser('chromium');
  !br && (br = browser('webkit'));
  !br && (br = browser('firefox'));
}
