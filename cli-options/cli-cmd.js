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
  } = global.mitm;

  let prm0 = argv._[0] || 'default';
  prm0 = `${global.mitm.home}/argv/${prm0}.js`;

  let saveArgs; 
  if (fs.existsSync(prm0)) {
    saveArgs = JSON.parse(fs.readFileSync(prm0));
    console.log(c.green('>> cmd: mitm-play', saveArgs._args));
  }

  if (saveArgs && !argv.save) {
    console.log(c.green('>> cmd2 mitm-play', process.argv.slice(2).join(' ')))
    const {_argv} = saveArgs;
    global.mitm.argv = {..._argv, ...argv};
    argv = global.mitm.argv;
  }
  
  fs.ensureDir(global.mitm.home, () =>{});
  fs.ensureDir(`${global.mitm.home}/.chromium`, () => {});
  fs.ensureDir(`${global.mitm.home}/.firefox`, () => {});
  fs.ensureDir(`${global.mitm.home}/.webkit`, () => {});
  
  let {route} = argv;
  const cwd = process.cwd();
  if (!route) {
    route = `${cwd}/userroute`;
  } else if (route.match(/^\.$/)) {
    route = route.replace(/^\.$/, `${cwd}`);
  } else if (route.match(/^\.\//)) {
    route = route.replace(/^\.\//, `${cwd}/`);
  } else if (route.match(/^\..\//)) {
    route = route.replace(/^\..\//, `${cwd}/../`);
  }
  route = route.replace(/\\/g, '/');
  argv.route = route;

  global.mitm.data.userroute = `${route}/**/*.js`;
  const files = fg.sync([global.mitm.data.userroute]);
  for (let file of files) {
    loadJS(file);
  }

  if (typeof(argv.url)!=='string') {
    if (argv._[0]) {
      for (let namespace in global.mitm.routes) {
        if (namespace.match(argv._[0])) {
          argv.url = global.mitm.routes[namespace].url;
        }
      }  
    }
    if (typeof(argv.url)!=='string') {
      argv.url = 'http://whatsmyuseragent.org/';
    }
  }
  if (!argv.url.match('http')) {
    argv.url = `https://${argv.url}`;
  }

  clear();

  if (argv.save) {
    const { save, ...rest } = argv;
    const _args = process.argv.slice(2).join(' ');
    const fpath = `${global.mitm.home}/argv/${save===true ? 'default' : save}.js`;
    const body = JSON.stringify({_args,_argv: rest}, null, 2);
    fs.ensureFile(fpath, () => {
      fs.writeFile(fpath, body, () => {});
    });
  }  
};
