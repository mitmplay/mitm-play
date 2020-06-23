import { writable } from 'svelte/store';

export const source = writable({
  saveDisabled: true,
  goDisabled: true,
  content:'',
  path:'',
});
