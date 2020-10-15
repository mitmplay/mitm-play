const c = require('ansi-colors');

let delayFN;
if (global.mitm.argv.lazylog) {
  console.log(c.redBright('>>> delay console.log'));

  delayFN = function() {
    const {lazylog} = mitm.argv;
    const delay = lazylog===true ? 500 : lazylog;
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
} else {
  delayFN = () => {};
}

module.exports = delayFN;