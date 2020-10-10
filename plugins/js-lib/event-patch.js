(() => {
  const Event = window.Event;
  window.Event = function () {
    const args = [].slice.call(arguments);
    window.Event._history.push(args);
    return new Event(...args);
  };
  window.Event._history = [];
})();
