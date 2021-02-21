module.exports = async () => {
  if (!mitm.browsers.chromium) {
    return 
  }
  const pages = mitm.browsers.chromium.pages().map(x => x.url())

  global.mitm.restart = true
  console.log('pages', pages)

  global.mitm.bcontexts.chromium.unroute(/.*/)
  global.mitm.pages.chromium.close()

  global.wsservers.isAlive()
  await global.mitm.play('chromium')
  delete mitm.restart
}
