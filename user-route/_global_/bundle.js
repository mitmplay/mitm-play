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

  // user-route/_global_/macros.js
  var require_macros = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "global";
      window.mitm.macros = {global: hello};
      return window.mitm.macros;
    };
  });

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
    let _body1 = require_macros();
    if (typeof _body1 === "function") {
      _body1 = _body1();
    }
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread(__objSpread({}, global), macro1), _body1);
  })(function() {
    let _global = require_macros();
    if (typeof _global === "function") {
      return _global();
    } else if (_global !== void 0) {
      return _global;
    }
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFjcm9zLmpzIiwgImJ1aWxkLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufVxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn07XG5cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufTtcblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59O1xuXG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge307XG59O1xuXG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59O1xuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIC8vIGZpbGU6IG1hY3Jvcy5qc1xuICBsZXQgX2JvZHkxID0gcmVxdWlyZSgnLi9tYWNyb3MnKVxuICBpZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHtcbiAgICBfYm9keTEgPSBfYm9keTEoKVxuICB9XG4gIGNvbnN0IHttYWNyb3M6IG1hY3JvMX0gPSB3aW5kb3cubWl0bVxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gICAgLi4uZ2xvYmFsLFxuICAgIC4uLm1hY3JvMSxcbiAgICAuLi5fYm9keTEsXG4gIH1cbn0pKChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogX2dsb2JhbF8vbWFjcm9zLmpzXG4gIGxldCBfZ2xvYmFsID0gcmVxdWlyZSgnLi4vX2dsb2JhbF8vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyByZXR1cm4gX2dsb2JhbCgpXG4gIH0gZWxzZSBpZiAoX2dsb2JhbCE9PXVuZGVmaW5lZCApIHsgcmV0dXJuIF9nbG9iYWwgfVxufSkoKSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQzlCLGFBQU8sT0FBTyxLQUFLO0FBQUE7QUFBQTs7O0FDRnJCLE1BQUksT0FBTyxnQkFBYyxRQUFXO0FBQ2xDLFdBQU8sY0FBYztBQUFBO0FBR3ZCLFNBQU8sS0FBSyxHQUFHLFlBQVksTUFBTTtBQUMvQixlQUFXLE1BQU07QUFDZixlQUFTLGNBQWMsaUJBQWlCO0FBQUEsT0FDdkM7QUFBQTtBQUdMLFNBQU8sS0FBSyxHQUFHLFVBQVUsU0FBTztBQUM5QixXQUFPLEtBQUssWUFBWSw0QkFDbkIsT0FBTyxLQUFLLFlBQ1o7QUFBQTtBQUlQLFNBQU8sS0FBSyxXQUFXLE1BQU07QUFDM0IsV0FBTyxLQUFLLFlBQVk7QUFBQTtBQUcxQixTQUFPLFlBQVksZ0JBQWdCLFVBQVE7QUFDekMsWUFBUSxJQUFJLHNDQUFzQztBQUFBO0FBR3BELEVBQUMsVUFBUyxRQUFRO0FBRWhCLFFBQUksU0FBUztBQUNiLFFBQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsZUFBUztBQUFBO0FBRVgsVUFBTSxDQUFDLFFBQVEsVUFBVSxPQUFPO0FBQ2hDLFdBQU8sS0FBSyxTQUFTLHdDQUNoQixTQUNBLFNBQ0E7QUFBQSxLQUVILFdBQVc7QUFFYixRQUFJLFVBQVU7QUFDZCxRQUFJLE9BQU8sWUFBVSxZQUFZO0FBQUUsYUFBTztBQUFBLGVBQy9CLFlBQVUsUUFBWTtBQUFFLGFBQU87QUFBQTtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
