require(['vs/editor/editor.main'], function () {
  const _c = 'color: red'
  window.monaco = monaco;
  console.log('%cVSC: monaco is loaded!', _c)
  for (const id in window.mitm.monaco) {
    window.mitm.monaco[id](id)
  }
}.bind(this));
