const c = require('ansi-colors')

function log(msg) {
  const { argv, __flag } = global.mitm
  if (argv.debug || __flag['page-load']) {
    console.log(c.red(`(*${msg})`))
  }
}

module.exports = async function(page) {
  const _page = 'page~' + (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '')

  page._page = _page
  global.mitm.__page[_page] = { session: {} }
  await page.setExtraHTTPHeaders({ 'xplay-page': _page })

  page.on('worker', worker => {
    log(`xplay-page worker ${_page}`)
    worker.on('close', worker => log('Worker destroyed: ' + worker.url()))
  })

  page.on('load', async () => {
    await page.waitForNavigation()
    log(`xplay-page load ${_page}`)
    await page.waitForTimeout(1000)
    await page.evaluate(_page => { window['xplay-page'] = _page }, _page)
  })
  page.on('frameattached', async (frame) => {
    if (frame.isDetached()) {
      console.log('DETACHED IFRAME URL', frame.url())
      return
    }
    try {
      await frame.waitForNavigation()
      log(`xplay-page frame ${_page}`)
      await frame.waitForTimeout(1000)
      await frame.evaluate(_page => {
        if (window['xplay-page'] === undefined) {
          window['xplay-page'] = _page
        }
      }, _page)
    } catch (error) {
      if (!error.message.match('Execution Context is not available')) {
        console.log('ERROR', error)
      }
    }
  })  

  await page.waitForNavigation()
  log(`xplay-page init ${_page}`)
  await page.waitForTimeout(1000)
  await page.evaluate(_page => { window['xplay-page'] = _page }, _page)
}