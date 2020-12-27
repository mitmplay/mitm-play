const pc = require('child_process')

module.exports = ({ data }) => {
  const { home } = global.mitm.path
  const { platform } = process
  if (platform === 'win32') {
    pc.exec(`start "" "${home}"`)
  } else if (platform === 'darwin') {
    pc.exec(`open "${home}"`)
  } else {
    pc.exec(`xdg-open "${home}"`)
  }
  return 'OK'
}
