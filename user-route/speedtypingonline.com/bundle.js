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

  // user-route/speedtypingonline.com/build.js
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
    window.mitm.macros = {
      "/typing-test"() {
        const {observer} = _ws_route().screenshot;
        if (!observer) {
          console.log("please set screenshot.observer.iframe = false in route!");
        } else {
          observer.iframe = (el) => {
            el.setAttribute("src", "https://example.com/");
            el.setAttribute("sandbox", "");
            console.log("OBSERVED", el);
          };
        }
      }
    };
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread({}, global), macro1);
  })(function() {
    const hello = "global";
    window.mitm.macros = {global: "0"};
    return window.mitm.macros;
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYnVpbGQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59O1xuXG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn07XG5cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufTtcblxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9O1xufTtcblxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICAgJy90eXBpbmctdGVzdCcoKSB7XHJcbiAgICAgIGNvbnN0IHtvYnNlcnZlcn0gPSBfd3Nfcm91dGUoKS5zY3JlZW5zaG90XHJcbiAgICAgIGlmICghb2JzZXJ2ZXIpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygncGxlYXNlIHNldCBzY3JlZW5zaG90Lm9ic2VydmVyLmlmcmFtZSA9IGZhbHNlIGluIHJvdXRlIScpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb2JzZXJ2ZXIuaWZyYW1lID0gZWwgPT4ge1xyXG4gICAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdzcmMnLCAnaHR0cHM6Ly9leGFtcGxlLmNvbS8nKVxyXG4gICAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdzYW5kYm94JywgJycpXHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnT0JTRVJWRUQnLCBlbClcclxuICAgICAgICB9ICBcclxuICAgICAgfVxyXG4gICAgfSxcclxuICB9XHJcbiAgXG4gIGNvbnN0IHttYWNyb3M6IG1hY3JvMX0gPSB3aW5kb3cubWl0bVxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gICAgLi4uZ2xvYmFsLFxuICAgIC4uLm1hY3JvMSxcbiAgfVxufSkoKGZ1bmN0aW9uKCkge1xuICAvLyBmaWxlOiBfZ2xvYmFsXy9tYWNyb3MuanNcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG4gIFxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6ICcwJ31cclxuICBcbiAgLy8gcGFzcyB0byBmdW5jdGlvbiBwYXJhbXNcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xufSkoKSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBSSxPQUFPLGdCQUFjLFFBQVc7QUFDbEMsV0FBTyxjQUFjO0FBQUE7QUFHdkIsU0FBTyxLQUFLLEdBQUcsWUFBWSxNQUFNO0FBQy9CLGVBQVcsTUFBTTtBQUNmLGVBQVMsY0FBYyxpQkFBaUI7QUFBQSxPQUN2QztBQUFBO0FBR0wsU0FBTyxLQUFLLEdBQUcsVUFBVSxTQUFPO0FBQzlCLFdBQU8sS0FBSyxZQUFZLDRCQUNuQixPQUFPLEtBQUssWUFDWjtBQUFBO0FBSVAsU0FBTyxLQUFLLFdBQVcsTUFBTTtBQUMzQixXQUFPLEtBQUssWUFBWTtBQUFBO0FBRzFCLFNBQU8sWUFBWSxnQkFBZ0IsVUFBUTtBQUN6QyxZQUFRLElBQUksc0NBQXNDO0FBQUE7QUFHcEQsRUFBQyxVQUFTLFFBQVE7QUFFaEIsV0FBTyxLQUFLLFNBQVM7QUFBQSxNQUNuQixpQkFBaUI7QUFDZixjQUFNLENBQUMsWUFBWSxZQUFZO0FBQy9CLFlBQUksQ0FBQyxVQUFVO0FBQ2Isa0JBQVEsSUFBSTtBQUFBLGVBQ1A7QUFDTCxtQkFBUyxTQUFTLFFBQU07QUFDdEIsZUFBRyxhQUFhLE9BQU87QUFDdkIsZUFBRyxhQUFhLFdBQVc7QUFDM0Isb0JBQVEsSUFBSSxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNaEMsVUFBTSxDQUFDLFFBQVEsVUFBVSxPQUFPO0FBQ2hDLFdBQU8sS0FBSyxTQUFTLDRCQUNoQixTQUNBO0FBQUEsS0FFSCxXQUFXO0FBRWIsVUFBTSxRQUFRO0FBRWQsV0FBTyxLQUFLLFNBQVMsQ0FBQyxRQUFRO0FBRzlCLFdBQU8sT0FBTyxLQUFLO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
