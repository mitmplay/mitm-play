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

  // user-route/keybr.com/_macros_/macros.js
  var require_macros = __commonJS((exports, module) => {
    var rbuttons = {
      "right|yellow"() {
        console.log("right");
      }
    };
    var lbuttons = {
      "left1|yellow"() {
        console.log("left");
      },
      "left2|yellow"() {
        console.log("left");
      },
      "left3|yellow"() {
        console.log("left");
      }
    };
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
          window.mitm.autofill = ['input[type="password"] => password'];
          window.mitm.rightbuttons = rbuttons;
          window.mitm.autobuttons = rbuttons;
          window.mitm.leftbuttons = lbuttons;
        },
        zero: "0"
      };
    };
  });

  // user-route/_global_/_macros_/macros.js
  var require_macros2 = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "global";
      window.mitm.macros = {global: hello};
      return window.mitm.macros;
    };
  });

  // user-route/keybr.com/_macros_/build.js
  if (window._ws_connect === void 0) {
    window._ws_connect = {};
  }
  window.mitm.fn.getCookie = function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop().split(";").shift();
  };
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
  var {macros} = window.mitm;
  var _body1 = require_macros();
  if (typeof _body1 === "function") {
    _body1 = _body1();
  }
  var global = require_macros2();
  if (typeof global === "function") {
    global = global();
  }
  window.mitm.macros = __objSpread(__objSpread(__objSpread({}, global), macros), _body1);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgcmJ1dHRvbnMgPSB7XHJcbiAgJ3JpZ2h0fHllbGxvdycoKSB7XHJcbiAgICBjb25zb2xlLmxvZygncmlnaHQnKVxyXG4gIH0sXHJcbn1cclxuY29uc3QgbGJ1dHRvbnMgPSB7XHJcbiAgJ2xlZnQxfHllbGxvdycoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnbGVmdCcpXHJcbiAgfSxcclxuICAnbGVmdDJ8eWVsbG93JygpIHtcclxuICAgIGNvbnNvbGUubG9nKCdsZWZ0JylcclxuICB9LFxyXG4gICdsZWZ0M3x5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ2xlZnQnKVxyXG4gIH0sXHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcbiAgcmV0dXJuIHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJ29sYWgnKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0tleUEnKVxyXG4gICAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvZmlsbCA9IFsnaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdID0+IHBhc3N3b3JkJ11cclxuICAgICAgd2luZG93Lm1pdG0ucmlnaHRidXR0b25zID0gcmJ1dHRvbnNcclxuICAgICAgd2luZG93Lm1pdG0uYXV0b2J1dHRvbnMgID0gcmJ1dHRvbnNcclxuICAgICAgd2luZG93Lm1pdG0ubGVmdGJ1dHRvbnMgID0gbGJ1dHRvbnNcclxuICAgIH0sXHJcbiAgICB6ZXJvOiAnMCdcclxuICB9XHJcbn0iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiBoZWxsb31cclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn1cclxuIiwgIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59XG53aW5kb3cubWl0bS5mbi5nZXRDb29raWUgPSBmdW5jdGlvbiBnZXRDb29raWUobmFtZSkge1xyXG4gIGNvbnN0IHZhbHVlID0gYDsgJHtkb2N1bWVudC5jb29raWV9YDtcclxuICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KGA7ICR7bmFtZX09YCk7XHJcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgcmV0dXJuIHBhcnRzLnBvcCgpLnNwbGl0KCc7Jykuc2hpZnQoKTtcclxufVxud2luZG93Lm1pdG0uZm4uYXV0b2NsaWNrID0gKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ0bi1hdXRvZmlsbCcpLmNsaWNrKClcclxuICB9LCAxMDAwKVxyXG59XG53aW5kb3cubWl0bS5mbi5ob3RLZXlzID0gb2JqID0+IHtcclxuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAuLi53aW5kb3cubWl0bS5tYWNyb2tleXMsXHJcbiAgICAuLi5vYmpcclxuICB9XHJcbn1cbndpbmRvdy5taXRtLl9tYWNyb3NfID0gKCkgPT4ge1xuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7fVxufVxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufVxuY29uc3Qge21hY3Jvc30gPSB3aW5kb3cubWl0bVxubGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbmlmICh0eXBlb2YgX2JvZHkxPT09J2Z1bmN0aW9uJykge1xuICBfYm9keTEgPSBfYm9keTEoKVxufVxubGV0IGdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3JvcycpXG5pZiAodHlwZW9mIGdsb2JhbD09PSdmdW5jdGlvbicpIHsgXG4gIGdsb2JhbCA9IGdsb2JhbCgpXG59XG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gIC4uLmdsb2JhbCxcbiAgLi4ubWFjcm9zLFxuICAuLi5fYm9keTEsXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsUUFBTSxXQUFXO0FBQUEsTUFDZixpQkFBaUI7QUFDZixnQkFBUSxJQUFJO0FBQUE7QUFBQTtBQUdoQixRQUFNLFdBQVc7QUFBQSxNQUNmLGlCQUFpQjtBQUNmLGdCQUFRLElBQUk7QUFBQTtBQUFBLE1BRWQsaUJBQWlCO0FBQ2YsZ0JBQVEsSUFBSTtBQUFBO0FBQUEsTUFFZCxpQkFBaUI7QUFDZixnQkFBUSxJQUFJO0FBQUE7QUFBQTtBQUdoQixXQUFPLFVBQVUsTUFBTTtBQUNyQixZQUFNLFFBQVE7QUFDZCxhQUFPO0FBQUEsUUFDTCxNQUFNO0FBQ0osa0JBQVEsSUFBSTtBQUNaLGlCQUFPLEtBQUssWUFBWTtBQUFBLFlBQ3RCLE9BQVM7QUFDUCxzQkFBUSxJQUFJO0FBQ1osb0JBQU07QUFBQTtBQUFBO0FBR1YsaUJBQU8sS0FBSyxXQUFXLENBQUM7QUFDeEIsaUJBQU8sS0FBSyxlQUFlO0FBQzNCLGlCQUFPLEtBQUssY0FBZTtBQUMzQixpQkFBTyxLQUFLLGNBQWU7QUFBQTtBQUFBLFFBRTdCLE1BQU07QUFBQTtBQUFBO0FBQUE7OztBQ2hDVjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0ZyQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUV2QixTQUFPLEtBQUssR0FBRyxZQUFZLG1CQUFtQixNQUFNO0FBQ2xELFVBQU0sUUFBUSxLQUFLLFNBQVM7QUFDNUIsVUFBTSxRQUFRLE1BQU0sTUFBTSxLQUFLO0FBQy9CLFFBQUksTUFBTSxXQUFXO0FBQUcsYUFBTyxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQUE7QUFFeEQsU0FBTyxLQUFLLEdBQUcsWUFBWSxNQUFNO0FBQy9CLGVBQVcsTUFBTTtBQUNmLGVBQVMsY0FBYyxpQkFBaUI7QUFBQSxPQUN2QztBQUFBO0FBRUwsU0FBTyxLQUFLLEdBQUcsVUFBVSxTQUFPO0FBQzlCLFdBQU8sS0FBSyxZQUFZLDRCQUNuQixPQUFPLEtBQUssWUFDWjtBQUFBO0FBR1AsU0FBTyxLQUFLLFdBQVcsTUFBTTtBQUMzQixXQUFPLEtBQUssWUFBWTtBQUFBO0FBRTFCLFNBQU8sWUFBWSxnQkFBZ0IsVUFBUTtBQUN6QyxZQUFRLElBQUksc0NBQXNDO0FBQUE7QUFFcEQsTUFBTSxDQUFDLFVBQVUsT0FBTztBQUN4QixNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsU0FBTyxLQUFLLFNBQVMsd0NBQ2hCLFNBQ0EsU0FDQTsiLAogICJuYW1lcyI6IFtdCn0K
