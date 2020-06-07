module.exports = () => {
  let {argv, fn: {clear}} = mitm;

  function argsChg(id, key) {
    if (argv[id]) {
      argv[key] = argv[id];
      delete argv[id];
    }
  }

  argsChg('g', 'go');
  argsChg('h', 'help');
  argsChg('s', 'save');
  argsChg('c', 'clear');
  argsChg('d', 'delog');
  argsChg('r', 'route');
  argsChg('l', 'logurl');
  argsChg('b', 'browser');
  argsChg('z', 'lazylog');
  argsChg('n', 'nosocket');
  argsChg('p', 'pristine');

  if (!argv.browser || ['firefox','webkit'].indexOf(argv.browser)===-1) {
    argv.browser = 'chromium';
  }

  if (argv.chromium) {
    argv.browser = 'chromium';
    if (typeof(argv.chromium)==='string') {
      argv.executablePath = argv.chromium;
    }
    delete argv.chromium;
  } else if (argv.firefox) {
    argv.browser = 'firefox';
    if (typeof(argv.chromium)==='string') {
      argv.executablePath = argv.firefox;
    }
    delete argv.firefox;
  } else if (argv.webkit) {
    argv.browser = 'webkit';
    if (typeof(argv.chromium)==='string') {
      argv.executablePath = argv.webkit;
    }
    delete argv.webkit;
  }
}
