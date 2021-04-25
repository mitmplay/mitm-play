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

  // user-route/keybr.com/hi@macros.js
  var require_hi_macros = __commonJS((exports, module) => {
    module.exports = () => {
      const lol = require_test();
      const hello = "hi macros";
      window.mitm.macros = {
        one: "1",
        two: "2"
      };
      console.log(lol);
      return window.mitm.macros;
    };
  });

  // user-route/_global_/macros.js
  var require_macros = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "global";
      window.mitm.macros = {global: hello};
      return window.mitm.macros;
    };
  });

  // user-route/keybr.com/macros.js
  var require_macros2 = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "world";
      return {
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
    };
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
  (function(global, _body1) {
    let _body2 = require_hi_macros();
    if (typeof _body2 === "function") {
      _body2 = _body2();
    }
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread(__objSpread(__objSpread({}, global), macro1), _body1), _body2);
  })(function() {
    let _global = require_macros();
    if (typeof _global === "function") {
      return _global();
    } else if (_global !== void 0) {
      return _global;
    }
  }(), function() {
    let _body1 = require_macros2();
    if (typeof _body1 === "function") {
      return _body1();
    } else if (_body1 !== void 0) {
      return _body1;
    }
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiX21hY3Jvc18vdGVzdC5qcyIsICJoaUBtYWNyb3MuanMiLCAiLi4vX2dsb2JhbF8vbWFjcm9zLmpzIiwgIm1hY3Jvcy5qcyIsICJoaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgZG9kb2wgPSAnbGlwcmV0J1xyXG5jb25zb2xlLmxvZyhkb2RvbClcclxubW9kdWxlLmV4cG9ydHMgPSBkb2RvbFxyXG4iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbG9sID0gcmVxdWlyZSgnLi9fbWFjcm9zXy90ZXN0JylcclxuICBjb25zdCBoZWxsbyA9ICdoaSBtYWNyb3MnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtcclxuICAgICAgb25lOiAnMScsXHJcbiAgICAgIHR3bzogJzInXHJcbiAgfVxyXG4gIGNvbnNvbGUubG9nKGxvbClcclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn0iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiBoZWxsb31cclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn1cclxuIiwgIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ3dvcmxkJ1xyXG4gIHJldHVybiB7XHJcbiAgICAnLycoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdvbGFoJylcclxuICAgICAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgICAgICdLZXlBJygpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdLZXlBJylcclxuICAgICAgICAgIGFsZXJ0KCdBbGVydCBLZXlBJylcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgd2luZG93Lm1pdG0uYXV0b2J1dHRvbnMgPSB7XHJcbiAgICAgICAgJ29uZXx5ZWxsb3cnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ29uZScpXHJcbiAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAnaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdID0+IHBhc3N3b3JkJ1xyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB6ZXJvOiAnMCdcclxuICB9XHJcbn0iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn07XG5cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufTtcblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59O1xuXG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge307XG59O1xuXG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59O1xuXG4oZnVuY3Rpb24oZ2xvYmFsLCBfYm9keTEpIHtcbiAgLy8gZmlsZTogaGlAbWFjcm9zLmpzXG4gIGxldCBfYm9keTIgPSByZXF1aXJlKCcuL2hpQG1hY3Jvcy5qcycpXG4gIGlmICh0eXBlb2YgX2JvZHkyPT09J2Z1bmN0aW9uJykge1xuICAgIF9ib2R5MiA9IF9ib2R5MigpXG4gIH1cbiAgLy8gbWFjcm9zLmpzICsgaGlAbWFjcm9zLmpzXG4gIGNvbnN0IHttYWNyb3M6IG1hY3JvMX0gPSB3aW5kb3cubWl0bVxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gICAgLi4uZ2xvYmFsLFxuICAgIC4uLm1hY3JvMSxcbiAgICAuLi5fYm9keTEsXG4gICAgLi4uX2JvZHkyXG4gIH1cbn0pKChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogX2dsb2JhbF8vbWFjcm9zLmpzXG4gIGxldCBfZ2xvYmFsID0gcmVxdWlyZSgnLi4vX2dsb2JhbF8vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyByZXR1cm4gX2dsb2JhbCgpXG4gIH0gZWxzZSBpZiAoX2dsb2JhbCE9PXVuZGVmaW5lZCApIHsgcmV0dXJuIF9nbG9iYWwgfVxufSkoKSwgKGZ1bmN0aW9uKCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgbGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7IHJldHVybiBfYm9keTEoKVxuICB9IGVsc2UgaWYgKF9ib2R5MSE9PXVuZGVmaW5lZCApIHsgcmV0dXJuIF9ib2R5MSB9XG59KSgpKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQSxRQUFNLFFBQVE7QUFDZCxZQUFRLElBQUk7QUFDWixXQUFPLFVBQVU7QUFBQTs7O0FDRmpCO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxNQUFNO0FBQ1osWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVM7QUFBQSxRQUNqQixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUE7QUFFVCxjQUFRLElBQUk7QUFDWixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ1RyQjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0pyQjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUNkLGFBQU87QUFBQSxRQUNMLE1BQU07QUFDSixrQkFBUSxJQUFJO0FBQ1osaUJBQU8sS0FBSyxZQUFZO0FBQUEsWUFDdEIsT0FBUztBQUNQLHNCQUFRLElBQUk7QUFDWixvQkFBTTtBQUFBO0FBQUE7QUFHVixpQkFBTyxLQUFLLGNBQWM7QUFBQSxZQUN4QixlQUFlO0FBQ2Isc0JBQVEsSUFBSTtBQUNaLHFCQUFPO0FBQUEsZ0JBQ0w7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBS1IsTUFBTTtBQUFBO0FBQUE7QUFBQTs7O0FDbEJWLE1BQUksT0FBTyxnQkFBYyxRQUFXO0FBQ2xDLFdBQU8sY0FBYztBQUFBO0FBR3ZCLFNBQU8sS0FBSyxHQUFHLFlBQVksTUFBTTtBQUMvQixlQUFXLE1BQU07QUFDZixlQUFTLGNBQWMsaUJBQWlCO0FBQUEsT0FDdkM7QUFBQTtBQUdMLFNBQU8sS0FBSyxHQUFHLFVBQVUsU0FBTztBQUM5QixXQUFPLEtBQUssWUFBWSw0QkFDbkIsT0FBTyxLQUFLLFlBQ1o7QUFBQTtBQUlQLFNBQU8sS0FBSyxXQUFXLE1BQU07QUFDM0IsV0FBTyxLQUFLLFlBQVk7QUFBQTtBQUcxQixTQUFPLFlBQVksZ0JBQWdCLFVBQVE7QUFDekMsWUFBUSxJQUFJLHNDQUFzQztBQUFBO0FBR3BELEVBQUMsVUFBUyxRQUFRLFFBQVE7QUFFeEIsUUFBSSxTQUFTO0FBQ2IsUUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixlQUFTO0FBQUE7QUFHWCxVQUFNLENBQUMsUUFBUSxVQUFVLE9BQU87QUFDaEMsV0FBTyxLQUFLLFNBQVMsb0RBQ2hCLFNBQ0EsU0FDQSxTQUNBO0FBQUEsS0FFSCxXQUFXO0FBRWIsUUFBSSxVQUFVO0FBQ2QsUUFBSSxPQUFPLFlBQVUsWUFBWTtBQUFFLGFBQU87QUFBQSxlQUMvQixZQUFVLFFBQVk7QUFBRSxhQUFPO0FBQUE7QUFBQSxPQUNyQyxXQUFXO0FBRWhCLFFBQUksU0FBUztBQUNiLFFBQUksT0FBTyxXQUFTLFlBQVk7QUFBRSxhQUFPO0FBQUEsZUFDOUIsV0FBUyxRQUFZO0FBQUUsYUFBTztBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
