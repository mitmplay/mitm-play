const fs = require('fs-extra')

const profile = `/_profiles_/chromium/Local State`
const state = '"exited_cleanly":'

module.exports = () => {
  const {home} = global.mitm.path
  const oldstate = fs.readFileSync(`${home}${profile}`)
  const newstate = `${oldstate}`.replace(`${state}false`, `${state}true`)
  fs.writeFileSync(`${home}${profile}`, newstate)
}