const stringify = require("json-stringify-pretty-compact");

const {c, fs} = global.mitm.lib

module.exports = ({ fpath1, body }, { fpath2, meta }, typ) => {
  fs.ensureFile(fpath1, err0 => {
    if (err0) {
      console.log(c.bgYellowBright.bold.red('>>> Error saving body'), fpath1)
    } else {
      fs.writeFile(fpath1, body, err1 => {
        err1 && console.log(c.bgYellowBright.bold.red(`>>> Error write body ${typ}`), err1)
      })
    }
  })
  fs.ensureFile(fpath2, err0 => {
    if (err0) {
      console.log(c.bgYellowBright.bold.red('>>> Error saving meta'), fpath2)
    } else {
      fs.writeFile(fpath2, stringify(meta, null, 2), err1 => {
        err1 && console.log(c.bgYellowBright.bold.red(`>>> Error write meta ${typ}`), err1)
      })
    }
  })
}
