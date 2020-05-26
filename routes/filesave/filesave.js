const fs = require('fs-extra');
const c = require('ansi-colors');

module.exports = ({fpath1, body}, {fpath2, meta}, typ) => {
  fs.ensureFile(fpath1, err => {
    fs.writeFile(fpath1, body , err => {
      err && console.log(c.redBright(`>> Error write body ${typ}`), err);
    })
  })
  fs.ensureFile(fpath2, err => {
    fs.writeFile(fpath2, meta, err => {
      err && console.log(c.redBright(`>> Error write meta ${typ}`), err);
    })
  })
}
