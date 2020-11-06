const pc = require('child_process')

module.exports = ({ data }) => {
  const { platform } = process
  if (platform === 'win32') {
    pc.exec(`start "" "${data.path}"`)
  } else if (platform === 'darwin') {
    pc.exec(`open "${data.path}"`)
  } else {
    pc.exec(`xdg-open "${data.path}"`)
  }
  return 'OK'
}
