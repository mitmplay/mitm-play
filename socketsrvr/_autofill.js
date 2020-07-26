module.exports = async ({data}) =>{
  const {autofill, browser} = data; 
  const page = global.mitm.pages[browser];

  for (let obj of autofill) {
    console.log('autofill', obj);
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
