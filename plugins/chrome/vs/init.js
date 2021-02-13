require(['vs/editor/editor.main'], function () {
  window.monaco = monaco;
  console.log('monaco is loaded!')
  for (const id in window.mitm.monaco) {
    window.mitm.monaco[id](id)
  }
}.bind(this));
