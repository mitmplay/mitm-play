const fs = require('fs-extra');
const c = require('ansi-colors');

function ehandler(err) {
  if (err) {
    console.log(c.redBright('Error remove files'), err);
  }
}

function clear(o) {
  if (o) {
    const {browserName, delete: d} = o;
    fs.remove(`${global.mitm.home}/${browserName}/${d}`,  ehandler);
  } else {
    const {browser, delete: d} = global.mitm.argv;
    for (let browserName in browser) {
      if (d===true) {
        fs.remove(`${global.mitm.home}/${browserName}/cache`, ehandler);
        fs.remove(`${global.mitm.home}/${browserName}/log`,   ehandler);
      } else {
        fs.remove(`${global.mitm.home}/${browserName}/${d}`,  ehandler);
      }
    }  
  }
}

module.exports = clear;
