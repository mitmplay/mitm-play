
module.exports = () => {

  return {
    '/'() {
      const node = document.querySelector('style.mitm-class')
      node.innerText += `
      [data-testid="placementTracking"] {
        display: none !important;
      }
      `
    }
  }
}