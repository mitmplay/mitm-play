import { writable } from 'svelte/store';

export const source = writable({
  respHeader: {},
  headers: '',
  content: '',
  logid: '',
  title: '',
  path: '',
  url: '',
});
