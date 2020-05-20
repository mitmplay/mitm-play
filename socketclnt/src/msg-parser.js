let windowRef;
const wccmd = {
  //ex: ws__help()
  _help({data}) {
    // console.log(data);
  },
  //ex: ws__ping("there") 
  _ping({data}) {
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
};

module.exports = (event, msg) => {
  if (msg.length>40) {
    console.log('received: `%s...`', msg.slice(0,40));
  } else {
    console.log('received: `%s`', msg);
  }
  const arr = msg.replace(/\s+$/, '').match(/^ *(\w+) *(\{.*)/);
  if (arr) {
    let [,cmd,json] = arr;
    try {
      if (typeof(json)==='string') {
        json = JSON.parse(json);
      }
    } catch (error) {
      console.error(json,error);
    }        
    if (wccmd[cmd]) {
      console.log(json.data);
      wccmd[cmd].call(event, json)
    }       
  }    
}