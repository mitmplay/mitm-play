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
    argv.browser[id] = argv[id];
  }  
}

module.exports = () => {
  argsChg('i', 'insecure');
  argsChg('p', 'pristine');
  argsChg('n', 'nosocket');
  argsChg('c', 'chromium');
  argsChg('f', 'firefox');
  argsChg('w', 'webkit');
  argsChg('d', 'delete');
  argsChg('l', 'logurl');
  argsChg('g', 'group');
  argsChg('r', 'route');
  argsChg('h', 'help');
  argsChg('s', 'save');
  argsChg('u', 'url');
  browser('chromium');
  browser('firefox');
  browser('webkit');
  if (Object.keys(global.mitm.argv.browser).length===0) {
    global.mitm.argv.browser.chromium = true;
  }
}
