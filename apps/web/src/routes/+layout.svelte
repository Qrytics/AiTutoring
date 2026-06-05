<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { tutor } from '$lib/data/tutor';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="description" content="{tutor.headline} — {tutor.description}" />
	<meta property="og:title" content="{tutor.name} — Tutoring" />
	<meta property="og:description" content="{tutor.headline}" />
	<meta property="og:url" content="https://mario-belmonte.com/tutoring" />
	<meta name="twitter:card" content="summary" />
	<meta name="theme-color" content="#0b0e12" />
	<title>Tutoring</title>
</svelte:head>

<Nav />

<main id="main">
	{@render children()}
</main>

<Footer />
