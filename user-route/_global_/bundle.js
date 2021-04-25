(() => {
  var __defProp = Object.defineProperty;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
  var __objSpread = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // user-route/_global_/build.js
  if (window._ws_connect === void 0) {
    window._ws_connect = {};
  }
  window.mitm.fn.autoclick = () => {
    setTimeout(() => {
      document.querySelector(".btn-autofill").click();
    }, 1e3);
  };
  window.mitm.fn.hotKeys = (obj) => {
    window.mitm.macrokeys = __objSpread(__objSpread({}, window.mitm.macrokeys), obj);
  };
  window.mitm._macros_ = () => {
    window.mitm.macrokeys = {};
  };
  window._ws_connect.macrosOnMount = (data) => {
    console.log("macros code executed after ws open", data);
  };
  (function(global) {
    const hello = "global";
    window.mitm.macros = {global: "0"};
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread({}, global), macro1);
  })(function() {
    const hello = "global";
    window.mitm.macros = {global: "0"};
    return window.mitm.macros;
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYnVpbGQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59O1xuXG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn07XG5cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufTtcblxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9O1xufTtcblxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG4gIFxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6ICcwJ31cclxuICBcbiAgY29uc3Qge21hY3JvczogbWFjcm8xfSA9IHdpbmRvdy5taXRtXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgICAuLi5nbG9iYWwsXG4gICAgLi4ubWFjcm8xLFxuICB9XG59KSgoZnVuY3Rpb24oKSB7XG4gIC8vIGZpbGU6IF9nbG9iYWxfL21hY3Jvcy5qc1xuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcbiAgXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogJzAnfVxyXG4gIFxuICAvLyBwYXNzIHRvIGZ1bmN0aW9uIHBhcmFtc1xuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXG59KSgpKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUd2QixTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFHTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFJUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFHMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUdwRCxFQUFDLFVBQVMsUUFBUTtBQUVoQixVQUFNLFFBQVE7QUFFZCxXQUFPLEtBQUssU0FBUyxDQUFDLFFBQVE7QUFFOUIsVUFBTSxDQUFDLFFBQVEsVUFBVSxPQUFPO0FBQ2hDLFdBQU8sS0FBSyxTQUFTLDRCQUNoQixTQUNBO0FBQUEsS0FFSCxXQUFXO0FBRWIsVUFBTSxRQUFRO0FBRWQsV0FBTyxLQUFLLFNBQVMsQ0FBQyxRQUFRO0FBRzlCLFdBQU8sT0FBTyxLQUFLO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
