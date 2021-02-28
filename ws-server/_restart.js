const fs = require('fs-extra')

module.exports = async ({data}) => {
  if (!mitm.browsers.chromium) {
    return 
  }
  const { path: { userroute } } = global.mitm
  const ppath = userroute.split('*')[0] + '_plugins_'
  const pages = mitm.browsers.chromium.pages().map(x => x.url())

  if (data!==null) {
    fs.writeJSONSync(`${ppath}/index.json`, data)
  }

  global.mitm.restart = true
  console.log('pages', pages)

  global.mitm.bcontexts.chromium.unroute(/.*/)
  global.mitm.pages.chromium.close()

  global.wsservers.isAlive()
  await global.mitm.play('chromium')
  delete mitm.restart
}
