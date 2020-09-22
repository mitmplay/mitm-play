const c = require('ansi-colors');
const initSocket = require('./init-socket');

module.exports = () => {
  console.log(c.whiteBright('RUN SERVER!'));
  initSocket()  
}
