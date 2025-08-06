// src/lib/language/index.ts
import { catalog as enCatalog } from './en';
// import { catalog as daCatalog } from './da';

// for now, hard-code English; later you’ll read this from a store, cookie, URL, etc.
const CURRENT_LOCALE = 'en';

// pick the right catalog by locale
const catalogs = {
    en: enCatalog,
    // da: daCatalog
} as const;

export const catalog = catalogs[CURRENT_LOCALE];
export type Catalog = typeof catalog;


//TODO when you add da.ts, just uncomment the import and the da: entry above, and then decide CURRENT_LOCALE = 'da' (or wire it up dynamically to a Svelte store or an Accept-Language header