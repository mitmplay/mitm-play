const attach = require('../playwright/attach')

module.exports = async ({ data }) => {
  const c = require('ansi-colors')
  const { autofill, browser: b, _page, _frame } = data
  const browser = global.mitm.browsers[b]
  let page = await browser.currentTab(_page, _frame)
  let oldPage = page

  console.log(c.greenBright('>>> autofill'))
  let lastObj;
  for await (let obj of autofill) {
    if (typeof (obj) === 'string') {
      console.log(c.greenBright(`   ${obj}`))
      if (obj.match(/^ *[=-]>/)) {
        obj = `${lastObj.split(/^(.+)([=-]>)/)[1]}${obj}`
      }
      lastObj = obj
      const [selector, typ, value] = obj.match(/^(.+)([=-]>)(.+)$/).slice(1).map(x => x.trim())
      if (typ === '=>') {
        obj = { selector, value }
      } else if (typ === '->') {
        let arr = value.split('~>')
        if (arr[1]) {
          arr = arr.map(x => x.trim())
          obj = { selector, action: arr[0], options: arr[1] }
        } else {
          obj = { selector, action: value }
        }
      } else {
        continue
      }
    } else {
      console.log(c.greenBright(`${JSON.stringify(obj, null, 2)}`))
    }
    if (obj.action) {
      const options = obj.options || {}
      if (obj.action === 'type') {
        await input('type', obj.selector, options)
      } else if (obj.action === 'wait') {
        await page.waitForSelector(obj.selector)
      } else if (obj.action === 'press') {
        await page.press(obj.selector, options)
      } else if (obj.action === 'click') {
        await page.click(obj.selector, options)
      } else if (obj.action === 'focus') {
        await page.focus(obj.selector)
      } else if (obj.action === 'check') {
        await page.check(obj.selector)
      } else if (obj.action === 'uncheck') {
        await page.uncheck(obj.selector)
      } else if (obj.action === 'selectOption') {
        await page.selectOption(obj.selector, options)
      } else if (obj.action === 'newpage') {
        page = await browser.newPage()
        attach(page)
        await page.goto(options)
      } else if (obj.action === 'close') {
        await page.close()
        page = oldPage
      } else if (obj.action === 'save') {
        const obj2 = await page.$eval(obj.selector, (e, opt) => {
          const [attr, key] = opt.split(':')
          const [id1, id2] = attr.split('~')
          const value = id2 ? e[id1](id2) : e[id1]
          return {key, value}
        }, options);
        await oldPage.$eval('body', (e, obj2) => {
          const {key, value: val} = obj2
          localStorage.setItem(key, val)
        }, obj2);
      }
    } else if (obj.value) {
      await input('fill', obj.selector, obj.value)
    }
  }
  return { ok: 'OK' }
  async function input(act, selector, value) {
    if (value.match(/^:/)) {
      value = await page.$eval('body', (e, key) => {
        return localStorage.getItem(key)
      }, value.slice(1));
    }
    page[act](selector, value)
  }
}

