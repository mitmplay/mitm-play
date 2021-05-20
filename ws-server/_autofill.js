const attach = require('../playwright/attach')
const c = require('ansi-colors')

module.exports = async ({ data }) => {
  const c = require('ansi-colors')
  const { autofill, browser: b, _page: p, _frame: f } = data
  const browser = global.mitm.browsers[b]
  let page = await browser.currentTab(p, f)
  let oldPage = page

  async function _page(url) {
    let pages
    let newpage
    if (browser.pages) {
      pages = await browser.pages()
    } else {
      pages = browser.contexts()[0].pages()
    }
    if (pages && pages.length > 1) {
      const {origin} = new URL(url)
      for (const pg of pages) {
        if (pg.url().match(origin)) {
          await pg.bringToFront()
          newpage = pg
          break
        }
      }  
    }
    if (!newpage) {
      newpage = await browser.newPage()
      attach(newpage)
    } else if (newpage._page===undefined) {
      console.log(c.redBright('Non automation page...'))
      attach(newpage)
    }
    if (newpage.url()!==url) {
      await newpage.goto(url)
    }
    page = newpage
  }

  async function _save(selector, store) {
    const obj2 = await page.$eval(selector, (e, opt) => {
      const [attr, key] = opt.split(':')
      const [id1, id2] = attr.split('~')
      const value = id2 ? e[id1](id2) : e[id1]
      return {key, value}
    }, store);
    await oldPage.$eval('body', (e, obj2) => {
      const {key, value: val} = obj2
      localStorage.setItem(key, val)
    }, obj2);
  }

  async function _leave() {
    await oldPage.bringToFront()
    page = oldPage
  }

  async function _close() {
    await oldPage.bringToFront()
    await page.close()
    page = oldPage
  }

  async function _input(act, selector, value) {
    if (value.match(/^:/)) {
      value = await page.$eval('body', (e, key) => {
        return localStorage.getItem(key)
      }, value.slice(1));
    }
    page[act](selector, value)
  }

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
        const [act, store] = value.split('~>').map(x => x.trim())
        if (store) {
          obj = { selector, act, store }
        } else {
          obj = { selector, act: value }
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
      store='',
      value,
      act,
    } = obj

    try {
      if (act) {
        const [action, val] = act.split(':')
        let options = {delay: val ? +val : 100}
        if (action === 'save'        ) { await _save(selector, store)              } else
        if (action === 'type'        ) { await _input('type', selector, store)     } else
        if (action === 'fill'        ) { await page.fill(selector, store, options) } else
        if (action === 'selectOption') { await page.selectOption(selector, store)  } else
        if (action === 'wait'        ) { await page.waitForSelector(selector)      } else
        if (action === 'press'       ) { await page.press(selector, store)         } else
        if (action === 'click'       ) { await page.click(selector, store)         } else
        if (action === 'uncheck'     ) { await page.uncheck(selector)              } else
        if (action === 'check'       ) { await page.check(selector)                } else
        if (action === 'focus'       ) { await page.focus(selector)                } else
        if (action === 'page'        ) { await _page(store)                        } else
        if (action === 'close'       ) { await _close()                            } else
        if (action === 'leave'       ) { await _leave()                            }
      } else if (value) {
        await _input('fill', selector, value)
      }        
    } catch (error) {
      console.log(error)
    }
  }
  return { ok: 'OK' }
}
