import App from './App.svelte';

const app = new App({
	target: document.body,
});

// let inprocess = false;
// const replay = ()=>{
//   setTimeout(() => {
//     inprocess = false;
//   },500);
// }
// function reportWindowSize() {
//   if (!inprocess) {
//     inprocess = true;
//     const {innerWidth, innerHeight: height, ws__send} = window;
//     chrome.windows.get(-2, {}, data => {
//       const {width:_w} = data;
//       const width = _w - innerWidth;
//       console.log({width, height, _w});
//       ws__send('setViewport', {width, height, _w}, replay);
//     })  
//   }
// }
// window.addEventListener("resize", reportWindowSize);

window.mitm.macro = {page:{}} 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  const {macro: m} = window.mitm;
  m.page = {
    ...m.page,
    ...changeInfo,
  }
  if (changeInfo.status === 'loading') {
    m.page.title = '';
  } else if (m.page.status === 'complete' && m.page.title) {
    console.log(m.page);
  }
});

window.addEventListener('message', event => {
  console.log({event});
})

export default app;
