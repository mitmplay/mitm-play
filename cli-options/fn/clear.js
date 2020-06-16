const fs = require('fs-extra');

function ehandler(err) {
  if (err) {
    console.log('Error remove files', err);
  }
}

function clear() {
  const {browser,delete: d} = global.mitm.argv;
  for (let browserName in browser) {
    if (d===true) {
      fs.remove(`${global.mitm.home}/${browserName}/cache`, ehandler);
      fs.remove(`${global.mitm.home}/${browserName}/log`,   ehandler);
    } else {
      fs.remove(`${global.mitm.home}/${browserName}/${d}`,  ehandler);
    }
  }
}

module.exports = clear;
