const args = require('./chromium-args');

function initChrome(options) {
  const {
    argv,
    fn: {flist},
    path: {userroute}
  } = global.mitm;
  const ppath = userroute.split('*')[0]+'_plugins_';
  options.excludeSwitches = ['enable-automation'];
  const plugins = flist(ppath);
  const p = `${global.__app}/plugins`;
  let path = `${process.cwd()}/`;
  if (plugins.length) {
    path = `${ppath}/`;
    path += plugins.join(`,${path}`);
    path += `,${p}/chrome`;
  } else {
    path = `${p}/chrome`;
  }
  path = path.replace(/\\/g, '/');
  console.log('>> Plugins:', path.split(','));
  args.push(`--disable-extensions-except=${path}`);
  args.push( `--load-extension=${path}`);
  if (typeof(argv.proxy)==='string') {
    console.log(c.red.bgYellowBright(`>> --proxy ${argv.proxy} will take presedence over --proxypac ${argv.proxypac}`))
  } else if (argv.proxypac) {
    console.log(c.red.bgYellowBright(`>> Chromium browser will use --proxypac ${argv.proxypac}`))
    args.push(`--proxy-pac-url=${argv.proxypac}`);
  }
  options.viewport = null,
  options.args = args;
}

module.exports = initChrome;
