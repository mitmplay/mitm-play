const c = require('ansi-colors')
const playwright = require('playwright')
const _options = require('./options')
const plugins = require('./plugins')
const proxies = require('./proxies')
const cleanX = require('./clean-x')
const routes = require('../routes')
const attach = require('./attach')

const pages = {}
const browsers = {}
const bcontexts = {}
const browserServer = {}
global.browserServer = browserServer

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function currentTab (browser) {
  browser.currentTab = async function (_page, _frame) {
    let pages
    if (browser.pages) {
      pages = await browser.pages()
    } else {
      pages = browser.contexts()[0].pages()
    }
    for (const page of pages) {
      if (_frame && _frame === page._page) {
        return page
      } else if (_page === page._page) {
        return page
      }
    }
    console.log(c.red('(*undetect page*)'))
    return pages[0]
  }
}

function initBrowserMsg(browserName, opt) {
  const msg = `Init Browser: [${browserName}]`
  console.log(c.redBright('='.repeat(msg.length + 2)))
  console.log(c.yellow(`${msg} ${JSON.stringify(opt, null, 2)}`))
}

function browserProxy() {
  const {proxy} = global.mitm.argv
  if (proxy === true) {
    console.log(c.red.bgYellowBright('>>> mitm-play will use --proxy but browser will not!'))
  }
}

module.exports = () => {
  console.log(c.red('\n[playwright/index.js]'))
  cleanX()
  const {
    argv,
    fn: { home }
  } = global.mitm
  global.mitm.pages = pages
  global.mitm.browsers = browsers
  global.mitm.bcontexts = bcontexts

  const args = require('./args-c')(argv);

  // process.on('unhandledRejection', (err, p) => {
  //   const econtext = `${err}`.match('Execution context was destroyed')
  //   if (argv.debug || !econtext) {
  //     console.log('An unhandledRejection occurred')
  //     console.log(`Rejected Promise: ${p}`)
  //     console.log(`Rejection: ${err}`)
  //   } else {
  //     console.log(c.red('(*execution context was destroyed*)'))
  //   }
  // });

  function browserPath(browserName, options) {
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
      console.log(c.yellow(`Exec. path: ${execPath}`))
    }
  }

  async function setup(browserName, options) {
    let page, browser, bcontext
    const playBrowser = playwright[browserName]
    if (bcontexts[browserName]!==undefined) {
      const context = bcontexts[browserName]
      await context.close()
      bcontexts[browserName] = undefined
    }
    if (browsers[browserName]!==undefined) {
      const browser = browsers[browserName]
      await browser.close()
      browsers[browserName] = undefined
    }
    let ctxoption = {}
    const device = playwright.devices[argv.device] || {}
    if (argv.device) {
      if (device) {
        delete options.viewport
        options.deviceScaleFactor = 1
        ctxoption = {
          ...ctxoption,
          ...device
        }
      }
    }
    if (argv.pristine===true) {
      const { fn: { tilde } } = global.mitm
      const bprofile = `${global.mitm.path.home}/_profiles_/${browserName}`  // browwser profile
      console.log(c.yellow(`Browser profile ${tilde(bprofile)}`))
      browser = await playBrowser.launchPersistentContext(bprofile, {
        ...device,
        ...options
      })
      page = await browser.pages()[0]
      bcontext = page.context()
    } else {
      if (argv.device===undefined) {
        ctxoption.viewport = null
      }
      console.log('>>> Browser option', options)
      if (argv.pristine==='server') {
        const server = await playBrowser.launchServer(options)
        const wsEndpoint = server.wsEndpoint()
        browserServer[browserName] = server
        server.wsEndpoint = wsEndpoint

        console.log(c.yellow(`Browser wsEndpoint ${wsEndpoint}`))

        browser = await playBrowser.connect({wsEndpoint})
      } else {
        browser = await playBrowser.launch(options)
      }
      // const context = await browser.newContext({viewport: { height: 734, width: 800 }});
      const context = await browser.newContext(ctxoption)
      page = await context.newPage()
      bcontext = context
    }
    currentTab(browser)
    if (browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page)
      global.mitm.cdp = cdp
      if (argv.pristine!==true) {
        await page.goto('chrome://extensions/')
        const nodes = await page.$$('#detailsButton')
        for (const node of nodes) {
          await node.click()
          await page.click('#crToggle')
          await page.click('#closeButton')
        }
      }
    } else {
      await sleep(300)
    }
    pages[browserName] = page
    browsers[browserName] = browser
    bcontexts[browserName] = bcontext
    return {page, browser, bcontext}
  }

  async function play(browserName) {
    const {options, logs} = _options()
    initBrowserMsg(browserName, logs)
    if (browserName === 'chromium') {
      plugins(args)
      proxies(args)
      options.ignoreDefaultArgs = [
        // '--origin-trial-disabled-features=SecurePaymentConfirmation',
        '--disable-extensions',
        '--enable-automation'
      ],
      options.viewport = null
      options.args = args
    }
    browserProxy()
    browserPath(browserName, options)
    const {page, browser, bcontext} = await setup(browserName, options)
    console.log(c.redBright(`MITM Hooked [${browserName}]`))
    bcontext.on('page', attach)
    await bcontext.route(/.*/, (route, request) => {
      routes({ route, request, browserName, bcontext })
    })
    let count = 0
    for (const url of argv.urls) {
      newPage(browser, page, url, count)
      count += 1
    }
    page.on('close', () => {
      if (!global.mitm.restart) {
        process.exit()
      }
    })
  }

  (async () => {
    console.log(c.redBright('START: INIT *PLAYWRIGHT*'))
    for (const browserName in argv.browser) {
      await play(browserName)
    }
    console.log(c.redBright('END: INIT *PLAYWRIGHT*'))
  })()
  global.mitm.play = play
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
