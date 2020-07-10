<script>
const screenshotHandler = (data) => {
  console.log(data);
}

function btnCapture(e) {
  let fname, host;
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    const url = new URL( tabs[0].url);
    host = url.hostname;
    fname = url.pathname
    .replace(/^\//,'')
    .replace(/\//g,'-');
  });  
  chrome.tabs.captureVisibleTab(null, {}, function(imageUrl) {
    const data = {
      host,
      fname,
      imageUrl,
    };
    window.ws__send('screencap', data, screenshotHandler);
    // console.log(image);
  });
};
</script>

<button on:click={btnCapture}>Capture</button>