const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');

module.exports = () => {
  let {
    argv,
    fn: {
      home,
      clear,
      loadJS,
      toRegex,
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
    route = `${cwd}/user-route`;
  } else {
    route = home(route);
    if (route.match(/^\.$/)) {
      route = route.replace(/^\.$/, `${cwd}`);
    } else if (route.match(/^\.\//)) {
      route = route.replace(/^\.\//, `${cwd}/`);
    } else if (route.match(/^\..\//)) {
      route = route.replace(/^\..\//, `${cwd}/../`);
    }
  }
  route = route.replace(/\\/g, '/');
  argv.route = route;

  global.mitm.path.userroute = `${route}/**/index.js`;
  const files = fg.sync([global.mitm.path.userroute]);
  if (!files.length) {
    console.log(c.red('Routes path is incorrect'), argv.route);
    console.log(c.yellow(`Please pass option: -r='...' / --route='your routing path'`))
    process.exit();
  }
  global.mitm.data.nolog = true;
  for (let file of files) {
    loadJS(file);
  }
  delete global.mitm.data.nolog;

  if (typeof(argv.url)==='string') {
    if (!argv.url.match('http')) {
      argv.url = [`https://${argv.url}`];
    } else {
      argv.url = [argv.url];
    }
  } else {
    let argv0 = argv._[0];
    argv.url = [];
    if (argv0) {
      argv0 = argv0.trim().split(/ +/);
      const {routes} = global.mitm;
      for (let namespace in routes) {
        const {url} = routes[namespace];
        for (key of argv0) {
          if (url && url.match(toRegex(key))) {
            argv.url.push(url);
          }  
        }
      }  
    }
    if (argv.url.length===0) {
      argv.url = ['http://whatsmyuseragent.org/'];
    }
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
