const fs = require('fs-extra');
const c = require('ansi-colors');

function ehandler(err) {
  if (err) {
    console.log(c.redBright('Error remove files'), err);
  }
}

function clear(o) {
  const {path} = global.mitm; 
  if (o) {
    const {browserName, delete: d} = o;
    fs.remove(`${path.home}/${browserName}/${d}`,  ehandler);
  } else {
    const {browser, delete: d} = global.mitm.argv;
    for (let browserName in browser) {
      if (d===true) {
        fs.remove(`${path.home}/${browserName}/cache`, ehandler);
        fs.remove(`${path.home}/${browserName}/log`,   ehandler);
      } else {
        fs.remove(`${path.home}/${browserName}/${d}`,  ehandler);
      }
    }  
  }
}

module.exports = clear;
