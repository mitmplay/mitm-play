const fs = require('fs-extra');

function clear() {
  const {browser,delete: d} = global.mitm.argv;
  for (let browserName in browser) {
    if (d===true) {
      fs.remove(`${global.mitm.home}/${browserName}/cache`);
      fs.remove(`${global.mitm.home}/${browserName}/log`);     
    } else {
      fs.remove(`${global.mitm.home}/${browserName}/${d}`);
    }
  }
}

module.exports = clear;
