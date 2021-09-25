
module.exports = () => {

  return {
    '/'() {
      const node = document.querySelector('style.mitm-class')
      node.innerText += `
      #banner,
      #sparkles-container,
      .ytp-ad-overlay-slot {
        display: none !important;
      }
      `    
    }
  }
}