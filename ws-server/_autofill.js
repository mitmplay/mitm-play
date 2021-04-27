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
      if (lastObj && obj.match(/^ *[=-]>/)) {
        obj = `${lastObj.split(/^(.*)([=-]>)/)[1]}${obj}`
      }
      lastObj = obj
      const [selector, typ, value] = obj.match(/^(.*)([=-]>)(.*)$/).slice(1).map(x => x.trim())
      if (typ === '=>') {
        obj = { selector, value }
      } else if (typ === '->') {
        const [action, options] = value.split('~>').map(x => x.trim())
        if (options) {
          obj = { selector, action, options }
        } else {
          obj = { selector, action: value }
        }
      } else {
        continue
      }
    } else {
      console.log(c.greenBright(`${JSON.stringify(obj, null, 2)}`))
    }
    /**
     * valid variations
     * =========================
     * input[name="firstname"]=>
     * => how are you
     * -> newpage ~> https://mailinator.com
     * #addOverlay -> type ~> widi
     * -> press ~> Enter
     * #inbox_field -> wait
     * -> save ~> getAttribute~class:mailinator
     * -> close
     * input[name="email"] => :mailinator
     */
    const {
      selector,
      action,
      value,
    } = obj

    if (action) {
      const options = obj.options || {}
      if (action === 'type') {
        await input('type', selector, options)
      } else if (action === 'wait') {
        await page.waitForSelector(selector)
      } else if (action === 'press') {
        await page.press(selector, options)
      } else if (action === 'click') {
        await page.click(selector, options)
      } else if (action === 'focus') {
        await page.focus(selector)
      } else if (action === 'check') {
        await page.check(selector)
      } else if (action === 'uncheck') {
        await page.uncheck(selector)
      } else if (action === 'selectOption') {
        await page.selectOption(selector, options)
      } else if (action === 'newpage') {
        page = await browser.newPage()
        attach(page)
        await page.goto(options)
      } else if (action === 'close') {
        await page.close()
        page = oldPage
      } else if (action === 'save') {
        const obj2 = await page.$eval(selector, (e, opt) => {
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
    } else if (value) {
      await input('fill', selector, value)
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

