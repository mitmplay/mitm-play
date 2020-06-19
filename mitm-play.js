const c = require('ansi-colors');

global.__app = __dirname;
console.log(c.yellow(`>> app ${__app}`));

require('./cli-options')();
require('./playwright')();
require('./socketsrvr')();
