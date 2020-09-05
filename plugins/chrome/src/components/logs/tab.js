import { writable } from 'svelte/store';

export const tabstore = writable({
  tab: 0,
});
