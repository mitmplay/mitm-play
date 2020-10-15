const c = require('ansi-colors');

function session(host, path='') {
  const session = (new Date).toISOString().slice(0,18).replace(/[T:-]/g,'');
  console.log(c.yellowBright(`>>> session ${session}`));
  global.mitm.session = `${session}${path}`;
}
module.exports = session;