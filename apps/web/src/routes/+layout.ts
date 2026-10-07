// Every page is static. Slots, payment links and the booking request are all built in the browser,
// so there is nothing to render per request — and no server to keep alive.
export const prerender = true;
// 'always', so every page is emitted as `<route>/index.html`. With 'never', adapter-vercel wrote the
// page override as `book.html → tutoring/book` while the file sat at `tutoring/book.html` (the base
// path), so a direct visit to /tutoring/book was a 404 — only client-side navigation reached it.
// A directory index resolves on any static host regardless of the adapter's override map.
export const trailingSlash = 'always';
