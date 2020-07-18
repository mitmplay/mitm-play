require(['vs/editor/editor.main'], function () {
  window.monaco = monaco;
  window.monacoEl = document.getElementById('container');
  window.monacoEditor = monaco.editor.create(window.monacoEl, {
    value: '',
    language: 'javascript'
  });
  const monacoEl = window.document.getElementById('monaco');
  monacoEl.appendChild(window.monacoEl);
}.bind(this));