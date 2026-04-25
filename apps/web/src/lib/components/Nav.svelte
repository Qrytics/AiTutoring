<script lang="ts">
	import { base } from '$app/paths';
	import { tutor } from '$lib/data/tutor';
	import { page } from '$app/state';

	let scrolled = $state(false);
	let navOpen = $state(false);
	let compact = $state(false);
	let theme = $state<'dark' | 'light'>('dark');
	let themeReady = $state(false);
	const isDarkTheme = $derived(theme === 'dark');

	function applyTheme(nextTheme: 'dark' | 'light') {
		document.documentElement.dataset.theme = nextTheme;
		document.documentElement.style.colorScheme = nextTheme;
		const themeColor = document.querySelector('meta[name="theme-color"]');
		themeColor?.setAttribute('content', nextTheme === 'dark' ? '#0b0e12' : '#FFFFFF');
	}

	function toggleTheme() {
		theme = isDarkTheme ? 'light' : 'dark';
		applyTheme(theme);
		window.localStorage.setItem('theme', theme);
	}

	$effect(() => {
		const savedTheme = window.localStorage.getItem('theme');
		if (savedTheme === 'dark' || savedTheme === 'light') {
			theme = savedTheme;
		} else {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		applyTheme(theme);
		themeReady = true;

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onPrefChange = (e: MediaQueryListEvent) => {
			if (window.localStorage.getItem('theme')) return;
			theme = e.matches ? 'dark' : 'light';
			applyTheme(theme);
		};
		media.addEventListener('change', onPrefChange);
		return () => media.removeEventListener('change', onPrefChange);
	});

	$effect(() => {
		function onScroll() {
			scrolled = window.scrollY > 8;
		}
		function onResize() {
			compact = window.innerWidth < 640;
			if (!compact) navOpen = false;
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		onResize();
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});

	const navLinks = [
		{ href: `${base}/#subjects`, label: 'subjects' },
		{ href: `${base}/#pricing`, label: 'pricing' },
		{ href: `${base}/#faq`, label: 'faq' },
		{ href: `${base}/book`, label: 'book a session', cta: true }
	];
</script>

<a href="#main" class="skip">Skip to content</a>

{#if navOpen && compact}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="nav-backdrop" onclick={() => (navOpen = false)}></div>
{/if}

<header
	class="site-header"
	class:site-header--scrolled={scrolled}
	class:site-header--compact={compact}
>
	<div class="site-header__inner">
		<a href={tutor.portfolioUrl} class="site-header__title">{tutor.handle}</a>

		<div class="site-header__tools">
			{#if themeReady}
				<button
					type="button"
					class="theme-toggle"
					onclick={toggleTheme}
					aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
					aria-pressed={!isDarkTheme}
				>
					<span class="theme-toggle__icon" aria-hidden="true">{isDarkTheme ? '☀' : '☾'}</span>
				</button>
			{/if}
		</div>

		<button
			type="button"
			class="site-header__menu"
			aria-label="Toggle navigation"
			aria-expanded={navOpen}
			onclick={() => (navOpen = !navOpen)}
		>
			menu
		</button>

		<nav class="site-nav" class:site-nav--open={navOpen} aria-label="Main navigation">
			<ul>
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class:nav-cta={link.cta}
							onclick={() => (navOpen = false)}
						>{link.label}</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</header>

<style>
	.nav-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
	}

	.skip {
		position: absolute;
		left: -9999px;
		top: 0.75rem;
		padding: 0.6rem 0.85rem;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--text);
		font-family: var(--font-mono);
		z-index: 300;
		text-decoration: none;
	}
	.skip:focus {
		left: 1rem;
	}

	.site-header {
		z-index: 200;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		background: color-mix(in srgb, var(--panel) 84%, transparent);
		border-bottom: 1px solid var(--border);
		transition: background-color 0.18s, backdrop-filter 0.18s, border-color 0.18s;
		position: sticky;
		top: 0;
		pointer-events: none;
	}

	.site-header--scrolled {
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		border-bottom-color: var(--border);
	}

	.site-header__inner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 86rem;
		min-height: 2rem;
		margin: 0 auto;
		padding: 0.9rem clamp(1.25rem, 4vw, 3rem);
		position: relative;
		pointer-events: auto;
	}

	.site-header__tools {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		pointer-events: auto;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		z-index: 4;
	}

	@media (max-width: 639px) {
		.site-header__tools {
			position: static;
			transform: none;
		}
	}

	.theme-toggle {
		display: inline-grid;
		place-items: center;
		padding: 0.25rem 0.55rem;
		min-width: 2.05rem;
		border: 1px solid var(--border-2);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.01)),
			var(--panel-2);
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 0.82rem;
		line-height: 1.2;
		cursor: pointer;
		transition: border-color 0.14s, color 0.14s, transform 0.14s, background-color 0.14s;
	}

	.theme-toggle:hover {
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.theme-toggle__icon {
		display: block;
		line-height: 1;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.site-header__title {
		position: relative;
		z-index: 2;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: clamp(1rem, 1.5vw, 1.15rem);
		font-weight: 600;
		line-height: 1.2;
		text-decoration: none;
		transition: color 0.18s;
	}
	.site-header__title:hover {
		color: var(--text);
	}

	.site-header__menu {
		font: inherit;
		color: var(--text);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.25rem 0;
		font-family: var(--font-mono);
		line-height: 1.2;
		display: none;
	}

	.site-nav {
		display: block;
		position: relative;
		z-index: 2;
	}

	.site-nav ul {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.site-nav a {
		color: var(--text);
		padding: 0.2rem 0;
		font-family: var(--font-mono);
		font-size: 0.95rem;
		line-height: 1.4;
		text-decoration: none;
		transition: color 0.18s;
		display: inline-block;
		position: relative;
	}

	.site-nav a::after {
		content: '';
		opacity: 0;
		pointer-events: none;
		background: currentColor;
		height: 1px;
		transition: opacity 0.18s, transform 0.18s;
		position: absolute;
		bottom: -0.1rem;
		left: 0;
		right: 0;
		transform: translateY(3px);
	}

	.site-nav a:hover,
	.site-nav a:focus-visible {
		color: var(--accent);
	}

	.site-nav a:hover::after,
	.site-nav a:focus-visible::after {
		opacity: 0.85;
		transform: translateY(0);
	}

	.nav-cta {
		color: var(--accent) !important;
		border: 1px solid rgba(54, 242, 194, 0.35);
		padding: 0.2rem 0.65rem !important;
		transition: background-color 0.14s, border-color 0.14s, color 0.14s !important;
	}

	.nav-cta:hover {
		background: rgba(54, 242, 194, 0.08);
		border-color: rgba(54, 242, 194, 0.6) !important;
	}

	/* Compact / mobile */
	.site-header--compact .site-header__menu {
		display: inline-block;
		position: relative;
		z-index: 3;
	}

	.site-header--compact .site-nav {
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		border: 1px solid var(--border);
		min-width: 10rem;
		display: none;
		position: absolute;
		top: calc(100% + 0.25rem);
		right: clamp(1.25rem, 4vw, 3rem);
		z-index: 10;
	}

	.site-header--compact .site-nav--open {
		display: block;
	}

	.site-header--compact .site-nav ul {
		flex-direction: column;
		align-items: flex-start;
		gap: 0;
		padding: 0.5rem 0.9rem;
	}

	.site-header--compact .site-nav li {
		width: 100%;
	}

	.site-header--compact .site-nav a {
		width: 100%;
		padding: 0.45rem 0;
		display: block;
	}

	.site-header--compact .nav-cta {
		border: none;
		padding: 0.45rem 0 !important;
	}
</style>
