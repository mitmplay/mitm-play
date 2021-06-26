const c = require('ansi-colors')

let repeat = 1
let lastMsg = undefined
const {stdout} = process

function logmsg(msg) {
  const args = arguments
  const {argv={}} = global.mitm
  if (!argv.offline) {
    console.log(...args)
  } else {
    if (lastMsg===undefined || lastMsg!==msg) {
      if (repeat > 1) {
        console.log(`(${repeat})`)
        repeat = 1
      } else if ( lastMsg!==msg) {
        console.log('')
      }
      try {
        for (let i = 0; i <args.length; i++) {
          let m = args[i]
          if (typeof m!=='string') {
            m = JSON.stringify(m, null, 2)
          }
          if (i!==0) {
            m = ` ${m}`
          }
          stdout.write(m)
        }
      } catch (error) {
        console.log('')
        stdout.write(c.red(`${error}`))
      }
    } else {
      repeat += 1
    }
    lastMsg = msg  
  }
}
module.exports = logmsg
