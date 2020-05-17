const fs = require('fs-extra');

module.exports = () => {
  let {argv, fn: {clear}} = mitm;
  let arg = argv._[0] || 'default';
  arg = `${mitm.home}/argv/${arg}.js`;

  if (!argv.save) {
    if (fs.existsSync(arg)) {
      const _argv = JSON.parse(fs.readFileSync(arg));
      global.mitm.argv = {..._argv, ...argv};
      argv = mitm.argv;
    } 
  }
  
  fs.ensureDir(mitm.home, err =>{});

  if (!argv.browser || ['firefox','webkit'].indexOf(argv.browser)===-1) {
    argv.browser = 'chromium';
  } else {
    fs.ensureDir(`${mitm.home}/.${argv.browser}`, err => {});
  }
  
  if (typeof(argv.go)!=='string') {
    argv.go = 'http://whatsmyuseragent.org/';
  }
  if (!argv.go.match('http')) {
    argv.go = `https://${argv.go}`;
  }

  let {route} = argv;
  if (!route) {
    route = `${process.cwd()}/script`;
  } else if (route.match(/^\.$/)) {
    route = route.replace(/^\.$/, `${process.cwd()}`);
  } else if (route.match(/^\.\//)) {
    route = route.replace(/^\.\//, `${process.cwd()}/`);
  } else if (route.match(/^\..\//)) {
    route = route.replace(/^\..\//, `${process.cwd()}/../`);
  }
  argv.route = route.replace(/\\/g, '/');
  mitm.data.userroute = `${route}/*/*.js`;

  clear();

  if (argv.save) {
    const { save, ...rest } = argv;
    const fpath = `${mitm.home}/argv/${save===true ? 'default' : save}.js`;
    const body = JSON.stringify(rest, null, 2);
    fs.ensureFile(fpath, err => {
      fs.writeFile(fpath, body, err => {});
    });
  }  
};
