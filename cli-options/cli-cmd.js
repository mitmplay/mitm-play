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

  const dirhandler = (err) => {
    err && console.log(c.redBright('>> Error creating browser profile folder'), err)
  }

  fs.ensureDir(global.mitm.home, err => {
    if (err) {
      console.log(c.redBright('>> Error creating home folder'), err)
    } else {
      fs.ensureDir(`${global.mitm.home}/.chromium`, dirhandler);
      fs.ensureDir(`${global.mitm.home}/.firefox`, dirhandler);
      fs.ensureDir(`${global.mitm.home}/.webkit`, dirhandler);    
    }
  });
  
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

  global.mitm.path.userroute = `${route}/**/*.js`;
  const files = fg.sync([global.mitm.path.userroute]);
  global.mitm.data.nolog = true;
  for (let file of files) {
    loadJS(file);
  }
  delete global.mitm.data.nolog;

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
    fs.ensureFile(fpath, err => {
      if (err) {
        console.log(c.redBright('>> Error saving cli options'), fpath)
      } else {
        fs.writeFile(fpath, body, err => {
          err && console.log(c.redBright('>> Error saving cli options'), err);
        });
      }
    });
  }  
};
