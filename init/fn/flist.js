const fs = require('fs-extra');
const _path = require('path');

function flist(path, file=false) {
  path = _path.normalize(path).replace(/\\/, '/');
  filter = f => {
    const ls = fs.lstatSync(`${path}/${f}`);
    const fl = ls.isFile();
    return file ? fl : !fl;
  }
  return fs.readdirSync(path).filter(filter);
}

module.exports = flist;
