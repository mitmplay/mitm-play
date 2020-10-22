'use strict'
/* global browser */
window.browser = window.chrome || window.msBrowser || window.browser

browser.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion)
})
