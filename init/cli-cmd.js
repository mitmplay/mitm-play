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
      argv.urls = [`https://${argv.url}`];
    } else {
      argv.urls = [argv.url];
    }
  } else {
    let argv0 = argv._[0];
    const _urls = [];
    if (argv0) {
      // on window comma change to space
      argv0 = argv0.trim().split(/[, ]+/);
      const {routes} = global.mitm;
      for (let namespace in routes) {
        const {url, urls} = routes[namespace];
        for (key of argv0) {
          const rgx = toRegex(key);
          let urlsSet = false;
          // find on urls
          if (urls) {
            for (let loc in urls) {
              if (loc.match(rgx)) {
                _urls.push(urls[loc]);
                urlsSet = true; // found
              }
            }
          }
          /**
           * find on url if urls cannot be found
           */
          if (!urlsSet && url && url.match(rgx)) {
            _urls.push(url);
          }  
        }
      }  
      if (_urls.length) {
        argv.urls = _urls;
      } else {
        argv.urls = ['http://whatsmyuseragent.org/'];
      }
    }
  }
  delete argv.url;

  clear();

  if (argv.save) {
    const { save,...rest } = argv;
    let _args = (process.argv.slice(2).join(' ')+' ');
    _args = _args.replace(/\=([^ ]+)/g, (x, x1)=> `='${x1}'`);
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
