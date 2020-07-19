import { writable } from 'svelte/store';

export const logstore = writable({
  respHeader: {},
  response: '',
  headers: '',
  logid: '',
  title: '',
  path: '',
  url: '',
  ext: '',
});
