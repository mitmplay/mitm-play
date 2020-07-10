import App from './App.svelte';

const app = new App({
	target: document.body,
});

let inprocess = false;
const replay = ()=>{
  setTimeout(() => {
    inprocess = false;
  },500);
}
function reportWindowSize() {
  if (!inprocess) {
    inprocess = true;
    const {innerWidth, innerHeight: height, ws__send} = window;
    chrome.windows.get(-2, {}, data => {
      const {width:_w} = data;
      const width = _w - innerWidth;
      console.log({width, height, _w});
      ws__send('setViewport', {width, height, _w}, replay);
    })  
  }
}
// window.addEventListener("resize", reportWindowSize);

export default app;
