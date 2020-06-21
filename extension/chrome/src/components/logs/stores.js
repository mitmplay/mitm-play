import { writable } from 'svelte/store';

export const source = writable({
  element:'',
  title:'',
  path:'',
  url:'',
});
