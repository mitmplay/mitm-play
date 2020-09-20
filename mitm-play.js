const c = require('ansi-colors');
const {options} = require('https').globalAgent;
options.ca = require('ssl-root-cas/latest').create();

global.__app = __dirname;
console.log(c.yellow(`>> app ${__app}`));

require('./init')();
require('./playwright')();
require('./ws-server')();
