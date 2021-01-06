import { rerender } from './rerender.js';

export function urls () {
  console.log('urls is called!')
  rerender.set({
    toggle: true
  })
}
