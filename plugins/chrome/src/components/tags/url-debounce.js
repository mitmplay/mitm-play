import { rerender } from './rerender.js';
const _c = 'color: blueviolet'

export function urls () {
  console.log('%cTags: urls is called!', _c)
  rerender.set({
    toggle: true
  })
}
