const fs = require('fs-extra');

const rpath = require.resolve('../../socketclnt');

module.exports = function () {
  return fs.readFileSync(rpath)+'';
};
