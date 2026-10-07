// Every page is static. Slots, payment links and the booking request are all built in the browser,
// so there is nothing to render per request — and no server to keep alive.
export const prerender = true;
export const trailingSlash = 'never';
