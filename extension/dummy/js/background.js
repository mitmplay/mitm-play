'use strict';

window.browser = window.chrome || window.msBrowser || window.browser;

browser.runtime.onInstalled.addListener(details => {
	console.log('previousVersion', details.previousVersion);
});
