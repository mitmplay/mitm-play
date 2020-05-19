const fs = require('fs-extra');

module.exports = () => {
  let {argv, fn: {clear}} = mitm;
  let arg = argv._[0] || 'default';
  arg = `${mitm.home}/argv/${arg}.js`;

  let saveArgs; ;
  if (fs.existsSync(arg)) {
    saveArgs = JSON.parse(fs.readFileSync(arg));
    console.log('>> cmd: mitm-play', saveArgs._args);
  }

  if (saveArgs && !argv.save) {
    console.log('>> cmd2 mitm-play', process.argv.slice(2).join(' '))
    const {_args, _argv} = saveArgs;
    global.mitm.argv = {..._argv, ...argv};
    argv = mitm.argv;
  }
  
  fs.ensureDir(mitm.home, err =>{});
  fs.ensureDir(`${mitm.home}/.${argv.browser}`, err => {});
  
  if (typeof(argv.go)!=='string') {
    argv.go = 'http://whatsmyuseragent.org/';
  }
  if (!argv.go.match('http')) {
    argv.go = `https://${argv.go}`;
  }

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
  argv.route = route.replace(/\\/g, '/');
  mitm.data.userroute = `${route}/*/*.js`;

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
//process.argv.slice(2).join(' ');