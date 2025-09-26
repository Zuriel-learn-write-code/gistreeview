// Allow importing CSS modules and packages that expose CSS paths without
// TypeScript types (e.g. 'swiper/css'). This prevents TS2307 errors when
// importing plain CSS from JS/TS files.
declare module '*.css';
declare module '*.scss';
declare module 'swiper/css';
declare module 'swiper/css/*';

export {};
