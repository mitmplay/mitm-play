import { writable } from 'svelte/store';

export const source = writable({
  content:'',
  path:'',
});