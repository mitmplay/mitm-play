const c = require('ansi-colors');

if (global.mitm.argv.debug) {
  return;
}

console.log(c.redBright('>> delay console.log'));

module.exports = function(delay=500) {
  let msg = [''];
  let _timeout = null;
  const {log} = console;
  
  console.log = function() {
    msg = msg.concat([].slice.call(arguments), '\n');
    _timeout && clearTimeout(_timeout);
    _timeout = setTimeout(() => {
      msg.pop();
      log.apply(console, msg);
      msg = [''];
    }, delay)
  }; 
}
