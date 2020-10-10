(() => {
  const {debug, error, info, warn, log} = console;
  const ori = {debug, error, info, warn, log};
  
  const logs = id => {
    const f = id.charAt(0).toUpperCase() + id.slice(1);
    console[`filter${f}`] = undefined;
    console[id] = function() {
      const arg = [].slice.call(arguments);
      const filter = console[`filter${f}`];
      if (!filter || arg.filter(m => m.match(filter)).length) {
        ori[id](`${id} ~`, ...arg);
      }
    }
  }  
  logs('debug');
  logs('error');
  logs('info' );
  logs('warn' );
  logs('log'  );
})();
