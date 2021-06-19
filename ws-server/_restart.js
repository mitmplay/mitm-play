const fs = require('fs-extra')
const { logmsg } = global.mitm.fn

module.exports = async ({data}) => {
  if (!mitm.browsers.chromium) {
    return 
  }
  const { path: { userroute } } = global.mitm
  const ppath = userroute.split('*')[0] + '_plugins_'
  const pages = mitm.browsers.chromium.pages().map(x => x.url())

  if (data!==null) {
    fs.writeFileSync(`${ppath}/index.json`, JSON.stringify(data, null, 2))
  }

  global.mitm.restart = true
  logmsg('pages', pages)

  global.mitm.bcontexts.chromium.unroute(/.*/)
  global.mitm.pages.chromium.close()

  global.wsserver.isAlive()
  global.wsservers.isAlive()
  await global.mitm.play('chromium')
  delete mitm.restart
}
