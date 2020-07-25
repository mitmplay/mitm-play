const _ws_namespace = require('./_ws_namespace');

const event = new Event('urlchanged');
function funcRef(event) {
  const namespace = _ws_namespace();
  if (namespace) {
    console.log(namespace, location);
  }
}

module.exports = () => {
  window.addEventListener('urlchanged', funcRef);
  const fn = history.pushState;
  history.pushState = function () {
    fn.apply(history, arguments);
    window.dispatchEvent(event);
  };
  funcRef();
}
