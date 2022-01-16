var app = (function () {
  'use strict';

  var macros$1 = () => {
    const hello = 'global';

    window.mitm.macros = {global: hello};
    return window.mitm.macros
  };

  // [Ctrl] + [Alt] + [A] => run hotkey KeyA
  // [Ctrl] + [Shift] => Hide / Show Buttons
  const {macros} = window.mitm;
  let _body1 = macros$1;
  if (typeof _body1==='function') {
    _body1 = _body1();
  }
  let global = macros$1;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjcm9zLmpzIiwic291cmNlcyI6WyIuLi9fbWFjcm9zXy9tYWNyb3MuanMiLCIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xuXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXG59XG4iLCIvLyBbQ3RybF0gKyBbQWx0XSArIFtBXSA9PiBydW4gaG90a2V5IEtleUFcbi8vIFtDdHJsXSArIFtTaGlmdF0gPT4gSGlkZSAvIFNob3cgQnV0dG9uc1xuY29uc3Qge21hY3Jvc30gPSB3aW5kb3cubWl0bVxubGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbmlmICh0eXBlb2YgX2JvZHkxPT09J2Z1bmN0aW9uJykge1xuICBfYm9keTEgPSBfYm9keTEoKVxufVxubGV0IGdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3JvcycpXG5pZiAodHlwZW9mIGdsb2JhbD09PSdmdW5jdGlvbicpIHsgXG4gIGdsb2JhbCA9IGdsb2JhbCgpXG59XG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gIC4uLmdsb2JhbCxcbiAgLi4ubWFjcm9zLFxuICAuLi5fYm9keTEsXG59XG4iXSwibmFtZXMiOlsicmVxdWlyZSQkMCIsInJlcXVpcmUkJDEiXSwibWFwcGluZ3MiOiI7OztFQUFBLFlBQWMsR0FBRyxNQUFNO0VBQ3ZCLEVBQUUsTUFBTSxLQUFLLEdBQUcsU0FBUTtBQUN4QjtFQUNBLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFDO0VBQ3RDLEVBQUUsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU07RUFDM0I7O0VDTEE7RUFDQTtFQUNBLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSTtFQUM1QixJQUFJLE1BQU0sR0FBR0EsU0FBbUI7RUFDaEMsSUFBSSxPQUFPLE1BQU0sR0FBRyxVQUFVLEVBQUU7RUFDaEMsRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFFO0VBQ25CLENBQUM7RUFDRCxJQUFJLE1BQU0sR0FBR0MsU0FBeUM7RUFDdEQsSUFBSSxPQUFPLE1BQU0sR0FBRyxVQUFVLEVBQUU7RUFDaEMsRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFFO0VBQ25CLENBQUM7RUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRztFQUNyQixFQUFFLEdBQUcsTUFBTTtFQUNYLEVBQUUsR0FBRyxNQUFNO0VBQ1gsRUFBRSxHQUFHLE1BQU07RUFDWDs7Ozs7Ozs7Ozs7OyJ9
