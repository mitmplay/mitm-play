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

function initBrowserMsg(browserName) {
  const msg = `Init Browser: [${browserName}]`
  console.log(c.yellowBright('='.repeat(msg.length)))
  console.log(c.whiteBright(msg))
}

function browserProxy() {
  const {proxy} = global.mitm.argv
  if (proxy === true) {
    console.log(c.red.bgYellowBright('>>> mitm-play will use --proxy but browser will not!'))
  }
}

module.exports = () => {
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

  function browserPath(browserName) {
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
  }

  async function setup(browserName, options) {
    let page, browser, bcontext
    const playBrowser = playwright[browserName]
    if (argv.pristine) {
      // buggy route will not work :(
      const { fn: { tilde } } = global.mitm
      const bprofile = `${global.mitm.path.home}/_profiles_/${browserName}`  // browwser profile
      console.log('>>> Browser profile', tilde(bprofile))
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
      if (argv.pristine === undefined) {
        await page.goto('chrome://extensions/')
        await page.click('#detailsButton')
        await page.click('#crToggle')
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
    const options = _options()
    initBrowserMsg(browserName)
    if (browserName === 'chromium') {
      plugins(args)
      proxies(args)
      options.ignoreDefaultArgs = ["--enable-automation"],
      // options.excludeSwitches = ['--enable-automation']
      // options.useAutomationExtension = false
      options.viewport = null
      options.args = args
    }
    browserProxy()
    browserPath(browserName)
    const {page, browser, bcontext} = await setup(browserName, options)
    console.log(c.whiteBright(`MITM Hooked [${browserName}]`))
    bcontext.route(/.*/, (route, request) => {
      routes({ route, request, browserName, bcontext })
    })
    bcontext.on('page', attach)
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
    console.log(c.whiteBright('RUN PLAYWRIGHT'))
    for (const browserName in argv.browser) {
      await play(browserName)
    }
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
