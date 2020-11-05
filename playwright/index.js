const c = require('ansi-colors')
const playwright = require('playwright')
const args = require('./chromium-args')
const _options = require('./options')
const routes = require('../routes')

const pages = {}
const browsers = {}
const bcontexts = {}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function currentTab (browser) {
  browser.currentTab = async function (_page) {
    let pages
    if (browser.pages) {
      pages = await browser.pages()
    } else {
      pages = browser.contexts()[0].pages()
    }
    for (const page of pages) {
      if (_page === page._page) {
        return page
      }
    }
    console.log(c.red('(*undetect page*)'))
    return pages[0]
  }
}

module.exports = () => {
  const {
    argv,
    fn: { home }
  } = global.mitm

  process.on('unhandledRejection', (err, p) => {
    const econtext = `${err}`.match('Execution context was destroyed')
    if (argv.debug || !econtext) {
      console.log('An unhandledRejection occurred')
      console.log(`Rejected Promise: ${p}`)
      console.log(`Rejection: ${err}`)
    } else {
      console.log(c.red('(*execution context was destroyed*)'))
    }
  });
  (async () => {
    global.mitm.pages = pages
    global.mitm.browsers = browsers
    console.log(c.whiteBright('RUN PLAYWRIGHT'))
    for (const browserName in argv.browser) {
      const msg = `Init Browser: [${browserName}]`
      console.log(c.yellowBright('='.repeat(msg.length)))
      console.log(c.whiteBright(msg))
      const options = _options()
      let page, browser, bcontext

      if (browserName === 'chromium') {
        const { fn: { flist }, path: { userroute } } = global.mitm
        const ppath = userroute.split('*')[0] + '_plugins_'
        options.excludeSwitches = ['enable-automation']
        const plugins = flist(ppath)
        const p = `${global.__app}/plugins`
        let path = `${process.cwd()}/`
        if (plugins.length) {
          path = `${p}/chrome,${ppath}/`
          path += plugins.join(`,${path}`)
        } else {
          path = `${p}/chrome`
        }
        path = path.replace(/\\/g, '/')
        console.log('>>> Plugins:', path.split(','))
        args.push(`--disable-extensions-except=${path}`)
        args.push(`--load-extension=${path}`)
        if (argv.proxypac) {
          console.log(c.red.bgYellowBright(`>>> Chromium browser will use --proxypac ${argv.proxypac}`))
          args.push(`--proxy-pac-url=${argv.proxypac}`)
        } else if (typeof argv.proxy === 'string') {
          let msg = argv.proxy
          const arr = msg.match(/([^:]+:[^@]+)@\w+/)
          if (arr) {
            // feat: hide password
            msg = msg.replace(arr[1], '******:******')
          }
          console.log(c.red.bgYellowBright(`>>> Chromium browser will use --proxy ${msg}`))
        }
        options.viewport = null
        options.args = args
      }
      if (argv.proxy === true) {
        console.log(c.red.bgYellowBright('>>> mitm-play will use --proxy but browser will not!'))
      }
      let execPath = argv.browser[browserName]
      if (typeof (execPath) === 'string') {
        execPath = execPath.replace(/\\/g, '/')
        if (browserName !== 'chromium') {
          console.log(c.redBright('executablePath is unsupported for non Chrome!'))
        } else if (process.platform === 'darwin') {
          execPath += '/Contents/MacOS/Google Chrome'
        }
        options.executablePath = home(execPath)
      } else {
        const _browser = require('playwright')[browserName]
        execPath = _browser.executablePath().replace(/\\/g, '/')
      }
      if (browserName !== 'chromium') {
        console.log(c.yellow(`>>> executablePath: ${execPath}`))
      }
      const playBrowser = playwright[browserName]
      if (argv.pristine) {
        // buggy route will not work :(
        const bprofile = `${global.mitm.path.home}/.${browserName}`
        console.log('>>> Browser profile', bprofile)
        browser = await playBrowser.launchPersistentContext(bprofile, options)
        page = await browser.pages()[0]
        bcontext = page.context()
      } else {
        console.log('>>> Browser option', options)
        browser = await playBrowser.launch(options)
        // const context = await browser.newContext({viewport: { height: 734, width: 800 }});
        const context = await browser.newContext({ viewport: null })
        page = await context.newPage()
        bcontext = context
      }
      currentTab(browser)
      if (browserName === 'chromium') {
        const cdp = await page.context().newCDPSession(page)
        global.mitm.cdp = cdp
      } else {
        await sleep(300)
      }
      bcontexts[browserName] = bcontext
      browsers[browserName] = browser
      pages[browserName] = page
      if (browserName === 'chromium' && argv.pristine === undefined) {
        await page.goto('chrome://extensions/')
        await page.click('#detailsButton')
        await page.click('#crToggle')
      }
      console.log(c.whiteBright(`MITM Hooked [${browserName}]`))
      bcontext.route(/.*/, (route, request) => {
        routes({ route, request, bcontext, browserName })
      })
      bcontext.on('page', attach)
      let count = 0
      for (const url of argv.urls) {
        newPage(browser, page, url, count)
        count += 1
      }
      page.on('close', () => {
        process.exit()
      })
    }
  })()
}

async function attach (page) {
  const _page = 'page~' + (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '')

  page._page = _page
  global.mitm.__page[_page] = { session: {} }
  await page.setExtraHTTPHeaders({ 'xplay-page': _page })

  const { argv } = global.mitm
  await page.waitForNavigation()
  argv.debug && console.log('xplay-page load', _page)
  await page.evaluate(_page => { window['xplay-page'] = _page }, _page)

  page.on('worker', worker => {
    argv.debug && console.log('Worker created: ' + worker.url())
    worker.on('close', worker => console.log('Worker destroyed: ' + worker.url()))
  })
  page.on('load', async () => {
    await page.waitForNavigation()
    argv.debug && console.log('xplay-page load', _page)
    await page.evaluate(_page => { window['xplay-page'] = _page }, _page)
  })
  page.on('frameattached', async (frame) => {
    await frame.waitForNavigation()
    argv.debug && console.log('xplay-page frame', _page, frame.url())
    const url = await frame.evaluate(_page => {
      if (window['xplay-page'] === undefined) {
        window['xplay-page'] = _page
      }
      return document.URL
    }, _page)
    argv.debug && console.log('URL', url)
  })
}

async function goto (page, url) {
  attach(page)
  await page.goto(url)
}

const newPage = async (browser, page, url, count) => {
  if (count > 0) {
    const page = await browser.newPage()
    await goto(page, url)
  } else {
    await goto(page, url)
  }
}
