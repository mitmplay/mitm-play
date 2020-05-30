const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');

module.exports = () => {
  let {
    argv,
    fn: {
      clear,
      loadJS,
    }
  } = mitm;

  let prm0 = argv._[0] || 'default';
  prm0 = `${mitm.home}/argv/${prm0}.js`;

  let saveArgs; ;
  if (fs.existsSync(prm0)) {
    saveArgs = JSON.parse(fs.readFileSync(prm0));
    console.log(c.green('>> cmd: mitm-play', saveArgs._args));
  }

  if (saveArgs && !argv.save) {
    console.log(c.green('>> cmd2 mitm-play', process.argv.slice(2).join(' ')))
    const {_args, _argv} = saveArgs;
    global.mitm.argv = {..._argv, ...argv};
    argv = mitm.argv;
  }
  
  fs.ensureDir(mitm.home, err =>{});
  fs.ensureDir(`${mitm.home}/.${argv.browser}`, err => {});
  
  let {route} = argv;
  if (!route) {
    route = `${process.cwd()}/userroute`;
  } else if (route.match(/^\.$/)) {
    route = route.replace(/^\.$/, `${process.cwd()}`);
  } else if (route.match(/^\.\//)) {
    route = route.replace(/^\.\//, `${process.cwd()}/`);
  } else if (route.match(/^\..\//)) {
    route = route.replace(/^\..\//, `${process.cwd()}/../`);
  }
  route = route.replace(/\\/g, '/');
  argv.route = route;

  mitm.data.userroute = `${route}/*/*.js`;
  const files = fg.sync([mitm.data.userroute]);
  for (let file of files) {
    loadJS(file);
  }

  if (typeof(argv.go)!=='string') {
    if (argv._[0]) {
      for (let namespace in mitm.routes) {
        if (namespace.match(argv._[0])) {
          argv.go = mitm.routes[namespace].url;
        }
      }  
    }
    if (typeof(argv.go)!=='string') {
      argv.go = 'http://whatsmyuseragent.org/';
    }
  }
  if (!argv.go.match('http')) {
    argv.go = `https://${argv.go}`;
  }

  clear();

  if (argv.save) {
    const { save, ...rest } = argv;
    const _args = process.argv.slice(2).join(' ');
    const fpath = `${mitm.home}/argv/${save===true ? 'default' : save}.js`;
    const body = JSON.stringify({_args,_argv: rest}, null, 2);
    fs.ensureFile(fpath, err => {
      fs.writeFile(fpath, body, err => {});
    });
  }  
};
