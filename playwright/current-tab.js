const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

function currentTab (browser) {
  browser.currentTab = async function (_page, _frame) {
    let pages
    if (browser.pages) {
      pages = await browser.pages()
    } else {
      pages = browser.contexts()[0].pages()
    }
    const pageobj = global.mitm.__page[_page]
    if (pageobj) {
      if (_frame) {
        const frame = pageobj.iframes[_frame]
        if (frame) {
          return frame
        }
      } else {
        for (const page of pages) {
          if (_page === page._page) {
            return page
          }
        }
      }
    }

    logmsg(c.red('(*undetect page*)'))
    return pages[0]
  }
}
module.exports = currentTab
