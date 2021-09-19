const fs = require('fs-extra')
const c = require('ansi-colors')
const { logmsg } = global.mitm.fn
module.exports = ({ fpath1, body }, { fpath2, meta }, typ) => {
  fs.ensureFile(fpath1, err0 => {
    if (err0) {
      logmsg(c.bgYellowBright.bold.red('>>> Error saving body'), fpath1)
    } else {
      fs.writeFile(fpath1, body, err1 => {
        err1 && logmsg(c.bgYellowBright.bold.red(`>>> Error write body ${typ}`), err1)
      })
    }
  })
  fs.ensureFile(fpath2, err0 => {
    if (err0) {
      logmsg(c.bgYellowBright.bold.red('>>> Error saving meta'), fpath2)
    } else {
      fs.writeFile(fpath2, JSON.stringify(meta, null, 2), err1 => {
        err1 && logmsg(c.bgYellowBright.bold.red(`>>> Error write meta ${typ}`), err1)
      })
    }
  })
}
