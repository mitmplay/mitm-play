const c = require('ansi-colors');

module.exports = () => {
  const package = require('../package.json')

  require('./init-ap');
  require('./cli-arg')(); // deal with cli args
  require('./console')(); // init console.log
  if (global.mitm.argv.help) {
    require('./helper')(package);
  }

  require('./init-fn')(); // must be first, init _debounce
  require('./routing')(); // populate mitm.fn object
  require('./cli-cmd')(); // setup folders & clean up
  
  if (global.mitm.argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  process.env.PWDEBUG = '1';

  console.log(c.greenBright(JSON.stringify(global.mitm.argv, null, 2)));
  console.log(c.green(`\nv${package.version}\n`));
  console.log(c.whiteBright('FILE WATCHER!'));
  //must be last or other watcher wont work
  require('./chokidar/route')(); // file watcher for routes
  require('./chokidar/logs')(); // file watcher for logs
  //require('./chokidar/cache')(); // file watcher for cache
}
//mitm-play zd --chromium='D:\Apps\chrome-gog\chrome.exe' -dpsr='.'
