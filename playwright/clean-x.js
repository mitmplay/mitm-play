const fs = require('fs-extra')

const profile = `/_profiles_/chromium/Default/Preferences`
const exited = '"exited_cleanly":'
const exityp = '"exit_type":"'

module.exports = () => {
  const {home} = global.mitm.path
  const path = `${home}${profile}`
  if (fs.existsSync(path)) {
    const oldstate1 = fs.readFileSync(path)
    const newstate1 = `${oldstate1}`.replace(`${exited}false`  , `${exited}true`)
    const newstate2 = `${newstate1}`.replace(`${exityp}Crashed`, `${exityp}none`)
    fs.writeFileSync(path, newstate2)
  }
}