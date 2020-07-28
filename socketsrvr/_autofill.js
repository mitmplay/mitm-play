module.exports = async ({data}) =>{
  const c = require('ansi-colors');
  const {autofill, browser} = data; 
  // const page = global.mitm.pages[browser];
  const page = await global.mitm.browsers[browser].currentTab();

  console.log(c.greenBright('>> autofill'));
  for (let obj of autofill) {
    console.log(c.greenBright(`   ${obj}`));
    if (typeof(obj)==='string') {
      const [selector, typ, value] = obj.match(/^(.+)([=-]>)(.+)$/).slice(1).map(x => x.trim());
      if (typ==='=>') {
        obj = {selector, value}
      } else if (typ==='->') {
        let arr = value.split('~>');
        if (arr[1]) {
          arr = arr.map(x => x.trim());
          obj = {selector, action: arr[0], options: arr[1]}
        } else {
          obj = {selector, action: value}
        }
      } else {
        continue;
      }
    }
    if (obj.action) {
      const options = obj.options || {};
      if (obj.action==='type') {
        await page.type(obj.selector, options);
      } else if (obj.action==='press') {
        await page.press(obj.selector, options);
      } else if (obj.action==='click') {
        await page.click(obj.selector, options);
      } else if (obj.action==='check') {
        await page.check(obj.selector);
      } else if (obj.action==='uncheck') {
        await page.uncheck(obj.selector);
      } else if (obj.action==='selectOption') {
        await page.selectOption(obj.selector, options);
      }
    } else if (obj.value) {
      await page.fill(obj.selector, obj.value);
    }
  }
  return {ok:'OK'};
};
