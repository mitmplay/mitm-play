const { chromium, firefox } = require("playwright")

const {c} = global.mitm.lib

const regex = /(chromium|firefox|webkit)\/log\/page~(\d+)-(session~(\d+)|undefined)/

module.exports = () => {
  const browser = { chromium: 0, firefox_: 0, webkit__: 0 }
  const { files: { _log, log } } = global.mitm
  const logSorted = log.sort()
  const data = {}
  const temp = {}
  logSorted.forEach(element => {
    const arr  = element.match(regex)
    if (arr!==null) {
      const id1 = arr.slice(2).join('-')
      const brw = arr[1].padEnd(8, '_')
      const grp1 = `${brw}~${id1}`
      if (temp[grp1]===undefined) {
        temp[grp1] = {browser}
        browser[brw] += 1
      }
      const id2 = `${browser[brw]}`.padStart(2, '0')
      const grp2 = `${brw}~${id2}`
      if (data[grp2]===undefined) {
        data[grp2] = {}
      }
      const [path, title] = element.split('@')
      data[grp2][element] = {
        ..._log[element],
        title,
        path
      }  
    } else {
      console.log(c.red(`Error in log file ${element}`))
    }
  })
  return data
}
