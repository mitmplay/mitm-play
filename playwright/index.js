const playwright = require('playwright');
const exitHook = require('exit-hook');
const route = require('../route');

module.exports = () => {
  (async () => {
    const browser = await playwright.chromium.launchPersistentContext('./chrome-profile',{
      headless: false
    });
    const page = await browser.pages()[0];

    page.route('**', route);
    const { argv } = global.mitm;
    await page.goto(argv.go || 'http://whatsmyuseragent.org/');
    // await page.waitForSelector('.intro-text');
    // await page.screenshot({ path: `example-chrome.png` });

    exitHook(async function() {
      await browser.close();
    })
    
    global.mitm.browser = browser;
    global.mitm.page = page;
  })();  
}
