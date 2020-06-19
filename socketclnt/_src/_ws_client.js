module.exports = () => {
  let windowRef;
  return {
    //ex: ws__help()
    _help() { //{data}
      // console.log(data);
    },
    //ex: ws__ping("there") 
    _ping() { //{data}
      // console.log(data);
    },
    //ex: ws__open({url: "https://google.com"})
    _open({data}) {
      const features = 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,width=800,height=600';
      windowRef = window.open(data.url, '_logs', features);
      windowRef.blur();
    },
    //ex: ws__style('.intro=>background:red;')
    _style({data}) {
      const {q,css} = data;
      document.querySelectorAll(q).forEach(
        node => (node.style.cssText = css)
      );
    },
    //ex: ws__
    _fileCache({typ, data}) {
      window.mitm.files[typ] = data;
      console.log('cache');
    },    
    //ex: ws__
    _fileLogs({typ, data}) {
      window.mitm.files[typ] = data;
      console.log('logs');
    },    
  };
}
