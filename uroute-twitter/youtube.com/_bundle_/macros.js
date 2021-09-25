var app = (function () {
  'use strict';

  var macros$1 = () => {

    return {
      '/'() {
        const node = document.querySelector('style.mitm-class');
        node.innerText += `
      #banner,
      #sparkles-container,
      .ytp-ad-overlay-slot {
        display: none !important;
      }
      `;    
      }
    }
  };

  // [Ctrl] + [Alt] + [A] => run hotkey KeyA
  // [Ctrl] + [Shift] => Hide / Show Buttons
  const {macros} = window.mitm;
  let _body1 = macros$1;
  if (typeof _body1==='function') {
    _body1 = _body1();
  }
  let global = {};
  if (typeof global==='function') { 
    global = global();
  }
  window.mitm.macros = {
    ...global,
    ...macros,
    ..._body1,
  };

  var build = {

  };

  return build;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjcm9zLmpzIiwic291cmNlcyI6WyIuLi9fbWFjcm9zXy9tYWNyb3MuanMiLCIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICAnLycoKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdzdHlsZS5taXRtLWNsYXNzJylcclxuICAgICAgbm9kZS5pbm5lclRleHQgKz0gYFxyXG4gICAgICAjYmFubmVyLFxyXG4gICAgICAjc3BhcmtsZXMtY29udGFpbmVyLFxyXG4gICAgICAueXRwLWFkLW92ZXJsYXktc2xvdCB7XHJcbiAgICAgICAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O1xyXG4gICAgICB9XHJcbiAgICAgIGAgICAgXHJcbiAgICB9XHJcbiAgfVxyXG59IiwiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG1cbmxldCBfYm9keTEgPSByZXF1aXJlKCcuL21hY3JvcycpXG5pZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHtcbiAgX2JvZHkxID0gX2JvZHkxKClcbn1cbmxldCBnbG9iYWwgPSB7fVxuaWYgKHR5cGVvZiBnbG9iYWw9PT0nZnVuY3Rpb24nKSB7IFxuICBnbG9iYWwgPSBnbG9iYWwoKVxufVxud2luZG93Lm1pdG0ubWFjcm9zID0ge1xuICAuLi5nbG9iYWwsXG4gIC4uLm1hY3JvcyxcbiAgLi4uX2JvZHkxLFxufVxuIl0sIm5hbWVzIjpbInJlcXVpcmUkJDAiXSwibWFwcGluZ3MiOiI7OztFQUNBLFlBQWMsR0FBRyxNQUFNO0FBQ3ZCO0VBQ0EsRUFBRSxPQUFPO0VBQ1QsSUFBSSxHQUFHLEdBQUc7RUFDVixNQUFNLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEVBQUM7RUFDN0QsTUFBTSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUM7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sRUFBQztFQUNQLEtBQUs7RUFDTCxHQUFHO0VBQ0g7O0VDZkE7RUFDQTtFQUNBLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUM1QixJQUFJLE1BQU0sR0FBR0EsU0FBbUI7RUFDaEMsSUFBSSxPQUFPLE1BQU0sR0FBRyxVQUFVLEVBQUU7RUFDaEMsRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFFO0VBQ25CLENBQUM7RUFDRCxJQUFJLE1BQU0sR0FBRyxHQUFFO0VBQ2YsSUFBSSxPQUFPLE1BQU0sR0FBRyxVQUFVLEVBQUU7RUFDaEMsRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFFO0VBQ25CLENBQUM7RUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRztFQUNyQixFQUFFLEdBQUcsTUFBTTtFQUNYLEVBQUUsR0FBRyxNQUFNO0VBQ1gsRUFBRSxHQUFHLE1BQU07RUFDWDs7Ozs7Ozs7Ozs7OyJ9
