const c = require('ansi-colors');
const playwright = require('playwright');
const initChrome = require('./chromium-init');
const _options = require('./options');
const routes = require('../routes');

const {
  sleep,
  newPage,
  currentTab,
  browserPath,
} = require('./browser');

const pages = {};
const browsers = {};
const bcontexts = {};

module.exports = () => {
  (async () => {
    global.mitm.pages = pages;
    global.mitm.browsers = browsers;  

    const {argv} = global.mitm;

    for (let browserName in argv.browser) {
      console.log(c.whiteBright(`RUN PLAYWRIGHT: ${browserName}`));

      const options = _options();
      browserPath(browserName, options);
      
      if (browserName==='chromium') {
        initChrome(options);
      }

      if (argv.proxy===true) {
        console.log(c.red.bgYellowBright(`>> mitm-play will use --proxy but browser will not!`));
      }      

      let page, browser, bcontext;
      const playBrowser = playwright[browserName];

      if (argv.pristine) {
        // buggy route will not work :(
        const bprofile = `${global.mitm.path.home}/.${browserName}`;
        console.log('>> Browser profile', bprofile);
        browser = await playBrowser.launchPersistentContext(bprofile, options);
        page = await  browser.pages()[0];
        bcontext = browser;
      } else {
        console.log('>> Browser option', options);
        browser = await playBrowser.launch(options);
        //const context = await browser.newContext({viewport: { height: 734, width: 800 }});
        const context = await browser.newContext({ viewport: null });
        page = await context.newPage();
        bcontext = context;
      }

      currentTab(browser);

      if (browserName==='chromium') {
        const cdp = await page.context().newCDPSession(page);
        global.mitm.cdp = cdp;
      } else {
        await sleep(300);
      }

      bcontexts[browserName] = bcontext;
      browsers[browserName] = browser;
      pages[browserName] = page;

      if (browserName==='chromium' && argv.pristine===undefined) {
        await page.goto('chrome://extensions/');
        await page.click('#detailsButton');
        await page.click('#crToggle');
      }

      console.log(c.whiteBright('MITM Hooked!!!'));

      bcontext.route(/.*/, (route, request) => {
        routes({route, request, bcontext, browserName});
      });

      let count = 0;
      console.log(c.whiteBright('Open URL'));

      for (let url of argv.urls) {
        newPage(browser, page, url, count);
        count += 1;
      }

      page.on('close', () => {
        console.log(c.whiteBright('Exit Process.'));
        process.exit();
      });
    }
  })();
}
