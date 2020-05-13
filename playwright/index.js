const playwright = require('playwright');
const exitHook = require('exit-hook');
const route = require('../route');

module.exports = () => {
  (async () => {
    let page, browser;
    const { argv } = global.mitm;
    const br = mitm.argv.browser;
    if (argv.pristine) {
      // buggy route will not work :(
      browser = await playwright[br].launchPersistentContext(`${mitm.home}/.${br}`,{
        headless: false
      });
      page = await browser.pages()[0];
    } else {
      browser = await playwright[br].launch({
        headless: false
      });
      const context = await browser.newContext();
      page = await context.newPage();  
    }
    if (argv.logurl) {
      page.route('**/*', (route, request) => {
        const arr = route.request().url().split(/([&?;,]|:\w|url)/);
        console.log(`${arr[0]}${arr.length>1 ? '?' : ''}`);
        route.continue({});
      });
    } else {
      page.route(/.*/, route);
    }

    await page.goto(argv.go);

    exitHook(async function() {
      await browser.close();
    })
    
    global.mitm.browser = browser;
    global.mitm.page = page;
  })();  
}
