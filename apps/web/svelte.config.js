import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		paths: {
			// The site is served under /tutoring on mario-belmonte.com.
			// All internal links and asset URLs will be prefixed with this base.
			base: '/tutoring',
			relative: false
		}
	}
};

export default config;
