import { writable } from 'svelte/store';

export const tabstore = writable({
  editor: {},
  tab: 0,
});
