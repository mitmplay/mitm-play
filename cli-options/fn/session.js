const c = require('ansi-colors');

function session(host, path='') {
  const session = (new Date).toISOString().split('.')[0].replace(/[:-]/g,'');
  console.log(c.yellowBright(`>> session ${session}-${host}`));
  global.mitm.session = `${session}-${host}${path}`;
}
module.exports = session;