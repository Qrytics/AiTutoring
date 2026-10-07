<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { tutor } from '$lib/data/tutor';

	let { children } = $props();

	const SITE = 'https://mario-belmonte.com';
	const routeMeta: Record<string, { title: string; description: string }> = {
		'/': {
			title: `Tutoring — ${tutor.name}`,
			description: `${tutor.headline} 1-on-1 live sessions in web development, programming, system design and circuits. Book online, pay with Venmo, Cash App or Zelle.`
		},
		'/book': {
			title: `Book a session — ${tutor.name}`,
			description: 'Pick an open time in your own time zone, pay with Venmo, Cash App or Zelle, and send your booking request in under a minute.'
		}
	};

	const path = $derived(page.url.pathname.slice(base.length).replace(/(.)\/$/, '$1') || '/');
	const meta = $derived(routeMeta[path] ?? routeMeta['/']);
	const canonical = $derived(`${SITE}${base}${path === '/' ? '/' : `${path}/`}`);
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content="{SITE}/og.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Nav />

<main id="main">
	{@render children()}
</main>

<Footer />
<Toast />
