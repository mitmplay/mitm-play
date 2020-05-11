const playwright = require('playwright');
const exitHook = require('exit-hook');
const route = require('../route');

module.exports = () => {
  (async () => {
    const br = mitm.argv.browser;
    // buggy route will not work :(
    // const browser = await playwright[br].launchPersistentContext(`${mitm.home}/.${br}`,{
    //   headless: false
    // });
    // const page = await browser.pages()[0];
    const browser = await playwright[br].launch({
      headless: false
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.route(/.*/, route);
    // page.route('**/*', (route, request) => {
    //   console.log('>> URL', route.request().url());
    //   route.continue({});
    // })
    const { argv } = global.mitm;
    await page.goto(argv.go || 'http://whatsmyuseragent.org/');

    exitHook(async function() {
      await browser.close();
    })
    
    global.mitm.browser = browser;
    global.mitm.page = page;
  })();  
}
