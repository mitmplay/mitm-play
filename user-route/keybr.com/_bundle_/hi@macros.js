(()=>{var __defProp=Object.defineProperty;var __getOwnPropSymbols=Object.getOwnPropertySymbols;var __hasOwnProp=Object.prototype.hasOwnProperty;var __propIsEnum=Object.prototype.propertyIsEnumerable;var __defNormalProp=(obj,key,value)=>key in obj?__defProp(obj,key,{enumerable:true,configurable:true,writable:true,value}):obj[key]=value;var __spreadValues=(a,b)=>{for(var prop in b||(b={}))if(__hasOwnProp.call(b,prop))__defNormalProp(a,prop,b[prop]);if(__getOwnPropSymbols)for(var prop of __getOwnPropSymbols(b)){if(__propIsEnum.call(b,prop))__defNormalProp(a,prop,b[prop])}return a};var __commonJS=(cb,mod)=>function __require(){return mod||(0,cb[Object.keys(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports};var require_macros=__commonJS({"user-route/keybr.com/_macros_/macros.js"(exports,module){var _c="color: cornflowerblue";var rbuttons={"Right|#1445d733":async function(){console.log('%cMacro: Clicked on "Right" button',"color:#bc0099")}};module.exports=()=>{const hello="world";async function observeOnce(){console.log("%cMacro: execute after observer once",_c)}return{"/"(){console.log("%cMacro: olleh >< hello",_c,hello);window.mitm.macrokeys={"KeyA"(_e){console.log(`%cMacro: ${_e.code}`,_c,_e)}};window.mitm.autofill=['input[type="password"] => password'];window.mitm.autobuttons=rbuttons;return observeOnce},zero:"0"}}}});var require_test=__commonJS({"user-route/keybr.com/_macros_/test.js"(exports,module){var dodol="lipret";console.log(dodol);module.exports=dodol}});var require_hi_macros=__commonJS({"user-route/keybr.com/_macros_/hi@macros.js"(exports,module){module.exports=()=>{const lol=require_test();const hello="hi macros";window.mitm.macros={one:"1",two:"2",thr:"3",fou:"4"};console.log(lol);return window.mitm.macros}}});var require_macros2=__commonJS({"user-route/_global_/_macros_/macros.js"(exports,module){module.exports=()=>{const hello="global";window.mitm.macros={global:hello};return window.mitm.macros}}});var{macros}=window.mitm;var _body1=require_macros();if(typeof _body1==="function"){_body1=_body1()}var _body2=require_hi_macros();if(typeof _body2==="function"){_body2=_body2()}var global=require_macros2();if(typeof global==="function"){global=global()}window.mitm.macros=__spreadValues(__spreadValues(__spreadValues(__spreadValues({},global),macros),_body1),_body2);})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uL19tYWNyb3NfL3Rlc3QuanMiLCAiLi4vX21hY3Jvc18vaGlAbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9oaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX2MgPSAnY29sb3I6IGNvcm5mbG93ZXJibHVlJ1xyXG5cclxuY29uc3QgcmJ1dHRvbnMgPSB7XHJcbiAgJ1JpZ2h0fCMxNDQ1ZDczMyc6IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKCclY01hY3JvOiBDbGlja2VkIG9uIFwiUmlnaHRcIiBidXR0b24nLCAnY29sb3I6I2JjMDA5OScpXHJcbiAgfSxcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIG9ic2VydmVPbmNlKCkge1xyXG4gICAgY29uc29sZS5sb2coJyVjTWFjcm86IGV4ZWN1dGUgYWZ0ZXIgb2JzZXJ2ZXIgb25jZScsIF9jKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJyVjTWFjcm86IG9sbGVoID48IGhlbGxvJywgX2MsIGhlbGxvKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKF9lKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJWNNYWNybzogJHtfZS5jb2RlfWAsIF9jLCBfZSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdpbmRvdy5taXRtLmF1dG9maWxsID0gWydpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyAgPSByYnV0dG9uc1xyXG5cclxuICAgICAgcmV0dXJuIG9ic2VydmVPbmNlXHJcbiAgICB9LFxyXG4gICAgemVybzogJzAnXHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBkb2RvbCA9ICdsaXByZXQnXHJcbmNvbnNvbGUubG9nKGRvZG9sKVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRvZG9sXHJcbiIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBsb2wgPSByZXF1aXJlKCcuL3Rlc3QnKVxyXG4gIGNvbnN0IGhlbGxvID0gJ2hpIG1hY3JvcydcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICAgICBvbmU6ICcxJyxcclxuICAgICAgdHdvOiAnMicsXHJcbiAgICAgIHRocjogJzMnLFxyXG4gICAgICBmb3U6ICc0JyxcclxuICB9XHJcbiAgY29uc29sZS5sb2cobG9sKVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufSIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufVxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG1cbmxldCBfYm9keTEgPSByZXF1aXJlKCcuL21hY3JvcycpXG5pZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHsgXG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgX2JvZHkyID0gcmVxdWlyZSgnLi9oaUBtYWNyb3MuanMnKVxuaWYgKHR5cGVvZiBfYm9keTI9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MiA9IF9ib2R5MigpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbiAgLi4uX2JvZHkyXG59XG4iXSwKICAibWFwcGluZ3MiOiAiMnNCQUFBLDRGQUFNLElBQUssd0JBRVgsR0FBTSxVQUFXLENBQ2Ysa0JBQW1CLGdCQUFrQixDQUNuQyxRQUFRLElBQUkscUNBQXNDLG1CQUl0RCxPQUFPLFFBQVUsSUFBTSxDQUNyQixLQUFNLE9BQVEsUUFFZCw0QkFBNkIsQ0FDM0IsUUFBUSxJQUFJLHVDQUF3QyxJQUd0RCxNQUFPLENBQ0wsS0FBTSxDQUNKLFFBQVEsSUFBSSwwQkFBMkIsR0FBSSxPQUMzQyxPQUFPLEtBQUssVUFBWSxDQUN0QixPQUFPLEdBQUksQ0FDVCxRQUFRLElBQUksWUFBWSxHQUFHLE9BQVEsR0FBSSxNQUkzQyxPQUFPLEtBQUssU0FBVyxDQUFDLHNDQUN4QixPQUFPLEtBQUssWUFBZSxTQUUzQixNQUFPLGNBRVQsS0FBTSxTQzdCVix3RkFBTSxPQUFRLFNBQ2QsUUFBUSxJQUFJLE9BQ1osT0FBTyxRQUFVLFNDRmpCLHNHQUFPLFFBQVUsSUFBTSxDQUNyQixLQUFNLEtBQU0sZUFDWixLQUFNLE9BQVEsWUFFZCxPQUFPLEtBQUssT0FBUyxDQUNqQixJQUFLLElBQ0wsSUFBSyxJQUNMLElBQUssSUFDTCxJQUFLLEtBRVQsUUFBUSxJQUFJLEtBQ1osTUFBTyxRQUFPLEtBQUssV0NYckIsZ0dBQU8sUUFBVSxJQUFNLENBQ3JCLEtBQU0sT0FBUSxTQUVkLE9BQU8sS0FBSyxPQUFTLENBQUMsT0FBUSxPQUM5QixNQUFPLFFBQU8sS0FBSyxXQ0ZyQixHQUFNLENBQUMsUUFBVSxPQUFPLEtBQ3hCLEdBQUksUUFBUyxpQkFDYixHQUFJLE1BQU8sVUFBUyxXQUFZLENBQzlCLE9BQVMsU0FFWCxHQUFJLFFBQVMsb0JBQ2IsR0FBSSxNQUFPLFVBQVMsV0FBWSxDQUM5QixPQUFTLFNBRVgsR0FBSSxRQUFTLGtCQUNiLEdBQUksTUFBTyxVQUFTLFdBQVksQ0FDOUIsT0FBUyxTQUVYLE9BQU8sS0FBSyxPQUFTLCtEQUNoQixRQUNBLFFBQ0EsUUFDQSIsCiAgIm5hbWVzIjogW10KfQo=
