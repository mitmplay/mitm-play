let repeat = 1
let lastMsg
module.exports = function(msg) {
  if (lastMsg===undefined) {
    console.log(msg)
  } else if(lastMsg===msg) {
    repeat += 1
  } else {
    if (repeat > 1) {
      console.log(msg, `(${repeat})`)
      repeat = 1
    } else {
      console.log(msg)
    }
  }
  lastMsg = msg
}
