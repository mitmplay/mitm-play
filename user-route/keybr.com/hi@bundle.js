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
  var __commonJS = (cb, mod) => () => (mod || cb((mod = {exports: {}}).exports, mod), mod.exports);

  // user-route/keybr.com/_macros_/test.js
  var require_test = __commonJS((exports, module) => {
    var dodol = "lipret";
    console.log(dodol);
    module.exports = dodol;
  });

  // user-route/keybr.com/hi@build.js
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
  (function(global, macro1) {
    const lol = require_test();
    const hello = "hi macros";
    window.mitm.macros = {
      one: "1",
      two: "2"
    };
    console.log(lol);
    const {macros: macro2} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread(__objSpread({}, global), macro1), macro2);
  })(function() {
    const hello = "global";
    window.mitm.macros = {global: "0"};
    return window.mitm.macros;
  }(), function() {
    const hello = "world";
    window.mitm.macros = {
      "/"() {
        console.log("olah");
        window.mitm.macrokeys = {
          KeyA() {
            console.log("KeyA");
            alert("Alert KeyA");
          }
        };
        window.mitm.autobuttons = {
          "one|yellow"() {
            console.log("one");
            return [
              'input[type="password"] => password'
            ];
          }
        };
      },
      zero: "0"
    };
    return window.mitm.macros;
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiX21hY3Jvc18vdGVzdC5qcyIsICJoaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgZG9kb2wgPSAnbGlwcmV0J1xyXG5jb25zb2xlLmxvZyhkb2RvbClcclxubW9kdWxlLmV4cG9ydHMgPSBkb2RvbFxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn07XG5cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufTtcblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59O1xuXG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge307XG59O1xuXG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59O1xuXG4oZnVuY3Rpb24oZ2xvYmFsLCBtYWNybzEpIHtcbiAgLy8gZmlsZTogaGlAbWFjcm9zLmpzXG4gIGNvbnN0IGxvbCA9IHJlcXVpcmUoJy4vX21hY3Jvc18vdGVzdCcpXHJcbiAgY29uc3QgaGVsbG8gPSAnaGkgbWFjcm9zJ1xyXG4gIFxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtcclxuICAgICAgb25lOiAnMScsXHJcbiAgICAgIHR3bzogJzInXHJcbiAgfVxyXG4gIGNvbnNvbGUubG9nKGxvbClcbiAgLy8gbWFjcm9zLmpzICsgaGlAbWFjcm9zLmpzXG4gIGNvbnN0IHttYWNyb3M6IG1hY3JvMn0gPSB3aW5kb3cubWl0bVxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gICAgLi4uZ2xvYmFsLFxuICAgIC4uLm1hY3JvMSxcbiAgICAuLi5tYWNybzIsXG4gIH1cbn0pKChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogX2dsb2JhbF8vbWFjcm9zLmpzXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuICBcclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiAnMCd9XHJcbiAgXG4gIC8vIHBhc3MgdG8gZnVuY3Rpb24gcGFyYW1zXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3Ncbn0pKCksIChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogbWFjcm9zLmpzXG4gIGNvbnN0IGhlbGxvID0gJ3dvcmxkJ1xyXG4gIFxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJ29sYWgnKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0tleUEnKVxyXG4gICAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyA9IHtcclxuICAgICAgICAnb25lfHllbGxvdycoKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnb25lJylcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHplcm86ICcwJ1xyXG4gIH1cclxuICBcbiAgLy8gcGFzcyB0byBmdW5jdGlvbiBwYXJhbXNcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xufSkoKSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsUUFBTSxRQUFRO0FBQ2QsWUFBUSxJQUFJO0FBQ1osV0FBTyxVQUFVO0FBQUE7OztBQ0FqQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUd2QixTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFHTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFJUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFHMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUdwRCxFQUFDLFVBQVMsUUFBUSxRQUFRO0FBRXhCLFVBQU0sTUFBTTtBQUNaLFVBQU0sUUFBUTtBQUVkLFdBQU8sS0FBSyxTQUFTO0FBQUEsTUFDakIsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBO0FBRVQsWUFBUSxJQUFJO0FBRVosVUFBTSxDQUFDLFFBQVEsVUFBVSxPQUFPO0FBQ2hDLFdBQU8sS0FBSyxTQUFTLHdDQUNoQixTQUNBLFNBQ0E7QUFBQSxLQUVILFdBQVc7QUFFYixVQUFNLFFBQVE7QUFFZCxXQUFPLEtBQUssU0FBUyxDQUFDLFFBQVE7QUFHOUIsV0FBTyxPQUFPLEtBQUs7QUFBQSxPQUNkLFdBQVc7QUFFaEIsVUFBTSxRQUFRO0FBRWQsV0FBTyxLQUFLLFNBQVM7QUFBQSxNQUNuQixNQUFNO0FBQ0osZ0JBQVEsSUFBSTtBQUNaLGVBQU8sS0FBSyxZQUFZO0FBQUEsVUFDdEIsT0FBUztBQUNQLG9CQUFRLElBQUk7QUFDWixrQkFBTTtBQUFBO0FBQUE7QUFHVixlQUFPLEtBQUssY0FBYztBQUFBLFVBQ3hCLGVBQWU7QUFDYixvQkFBUSxJQUFJO0FBQ1osbUJBQU87QUFBQSxjQUNMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtSLE1BQU07QUFBQTtBQUlSLFdBQU8sT0FBTyxLQUFLO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
