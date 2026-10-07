<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { tutor } from '$lib/data/tutor';
	import { getItem, setItem } from '$lib/storage';

	let scrolled = $state(false);
	let navOpen = $state(false);
	let menuBtn = $state<HTMLButtonElement | undefined>();
	let navEl = $state<HTMLElement | undefined>();

	/*
	 * The blocking script in `app.html` sets `data-theme` before first paint, so the theme is readable
	 * synchronously and the icon (CSS-driven off that attribute) is right on the very first frame.
	 * The old version rendered no toggle at all until an effect ran, then popped it into the header.
	 */
	function currentTheme(): 'dark' | 'light' {
		if (typeof document === 'undefined') return 'dark';
		return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	}

	let theme = $state<'dark' | 'light'>(currentTheme());

	function applyTheme(next: 'dark' | 'light') {
		document.documentElement.dataset.theme = next;
		document.documentElement.style.colorScheme = next;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', next === 'dark' ? '#0b0e12' : '#f7faf9');
	}

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		applyTheme(theme);
		setItem('theme', theme);
	}

	onMount(() => {
		theme = currentTheme();
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onPref = (e: MediaQueryListEvent) => {
			if (getItem('theme')) return;
			theme = e.matches ? 'dark' : 'light';
			applyTheme(theme);
		};
		media.addEventListener('change', onPref);

		const onScroll = () => (scrolled = window.scrollY > 8);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		// Close the sheet if the viewport grows past the breakpoint, where its toggle is hidden.
		const wide = window.matchMedia('(min-width: 760px)');
		const onWide = (e: MediaQueryListEvent) => {
			if (e.matches) navOpen = false;
		};
		wide.addEventListener('change', onWide);

		return () => {
			media.removeEventListener('change', onPref);
			window.removeEventListener('scroll', onScroll);
			wide.removeEventListener('change', onWide);
		};
	});

	$effect(() => {
		if (!navOpen) return;
		navEl?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			navOpen = false;
			menuBtn?.focus({ preventScroll: true });
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const onBookPage = $derived(page.url.pathname.startsWith(`${base}/book`));

	const navLinks = [
		{ href: `${base}/#subjects`, label: 'subjects' },
		{ href: `${base}/#how-it-works`, label: 'how it works' },
		{ href: `${base}/#pricing`, label: 'pricing' },
		{ href: `${base}/#faq`, label: 'faq' }
	];
</script>

<a href="#main" class="skip">Skip to content</a>

{#if navOpen}
	<button type="button" class="nav-backdrop" aria-label="Close menu" onclick={() => (navOpen = false)}
	></button>
{/if}

<header class="site-header" class:site-header--scrolled={scrolled}>
	<div class="site-header__inner">
		<a href="{base}/" class="site-header__title">
			<span class="site-header__prompt" aria-hidden="true">~/</span>tutoring
		</a>

		<nav
			bind:this={navEl}
			id="site-nav"
			class="site-nav"
			class:site-nav--open={navOpen}
			aria-label="Main navigation"
		>
			<ul>
				{#each navLinks as link (link.href)}
					<li><a href={link.href} onclick={() => (navOpen = false)}>{link.label}</a></li>
				{/each}
				<li class="site-nav__portfolio">
					<a href={tutor.portfolioUrl} onclick={() => (navOpen = false)}>portfolio ↗</a>
				</li>
			</ul>
		</nav>

		<div class="site-header__tools">
			<button
				type="button"
				class="icon-btn theme-toggle"
				onclick={toggleTheme}
				aria-label="Light mode"
				aria-pressed={theme === 'light'}
				title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				<svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" stroke="currentColor" stroke-width="1.5" /></svg>
				<svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
			</button>
			{#if !onBookPage}
				<a href="{base}/book" class="book-btn">book<span class="book-btn__long">&nbsp;a session</span>&nbsp;→</a>
			{/if}
			<button
				bind:this={menuBtn}
				type="button"
				class="icon-btn site-header__menu"
				aria-expanded={navOpen}
				aria-controls="site-nav"
				onclick={() => (navOpen = !navOpen)}
			>
				menu
			</button>
		</div>
	</div>
</header>

<style>
	.skip {
		position: absolute;
		left: -9999px;
		top: 0.75rem;
		padding: 0.6rem 0.85rem;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--text);
		z-index: 300;
		text-decoration: none;
	}

	.skip:focus {
		left: 1rem;
	}

	.nav-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
		appearance: none;
		border: 0;
		padding: 0;
		background: color-mix(in srgb, #000 60%, transparent);
		cursor: default;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 200;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
		transition: background-color 0.18s, border-color 0.18s;
	}

	/* Frosted only where there's a GPU budget for it; phones get the flat fill above. */
	@media (min-width: 901px) {
		.site-header {
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			background: color-mix(in srgb, var(--panel) 84%, transparent);
		}

		.site-header--scrolled {
			background: color-mix(in srgb, var(--panel) 94%, transparent);
		}
	}

	.site-header__inner {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		max-width: 76rem;
		margin: 0 auto;
		padding: 0.7rem clamp(1rem, 4vw, 3rem);
	}

	.site-header__title {
		color: var(--accent-text);
		font-weight: 700;
		font-size: 1.02rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.site-header__prompt {
		color: var(--muter);
		font-weight: 400;
	}

	.site-header__title:hover {
		color: var(--text);
	}

	.site-nav {
		margin-left: auto;
	}

	.site-nav ul {
		display: flex;
		gap: 1.25rem;
		list-style: none;
	}

	.site-nav a {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.site-nav a:hover,
	.site-nav a:focus-visible {
		color: var(--accent-text);
	}

	.site-header__tools {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0 0.7rem;
		border: 1px solid var(--border-2);
		background: var(--panel-2);
		color: var(--text);
		font: inherit;
		font-size: 0.86rem;
		cursor: pointer;
	}

	.icon-btn:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
		color: var(--accent-text);
	}

	.theme-toggle {
		padding: 0;
	}

	.theme-toggle__icon--moon,
	:global([data-theme='light']) .theme-toggle__icon--sun {
		display: none;
	}

	:global([data-theme='light']) .theme-toggle__icon--moon {
		display: block;
	}

	.book-btn {
		display: inline-flex;
		align-items: center;
		height: 2.5rem;
		padding: 0 0.95rem;
		border: 1px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent-text);
		font-size: 0.86rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition: background-color 0.15s, color 0.15s;
	}

	.book-btn:hover {
		background: var(--accent);
		color: var(--bg);
	}

	:global([data-theme='light']) .book-btn {
		background: var(--accent-text);
		border-color: var(--accent-text);
		color: #fff;
	}

	:global([data-theme='light']) .book-btn:hover {
		background: var(--clr-primary-a30);
	}

	.site-header__menu {
		display: none;
	}

	@media (max-width: 759px) {
		.site-header__inner {
			gap: 0.5rem;
		}

		.site-header__tools {
			margin-left: auto;
		}

		.site-header__menu {
			display: inline-grid;
		}

		.icon-btn,
		.book-btn {
			height: 2.75rem;
			min-width: 2.75rem;
		}

		.book-btn__long {
			display: none;
		}

		.site-header__menu[aria-expanded='true'] {
			border-color: var(--accent);
			color: var(--accent-text);
		}

		/* Full-width sheet under the header row. */
		.site-nav {
			display: none;
			position: absolute;
			top: calc(100% + 1px);
			left: 0;
			right: 0;
			margin: 0;
			background: var(--panel);
			border-bottom: 1px solid var(--border);
			box-shadow: 0 18px 40px color-mix(in srgb, #000 35%, transparent);
			z-index: 10;
		}

		.site-nav--open {
			display: block;
		}

		.site-nav ul {
			flex-direction: column;
			gap: 0;
			padding: 0.35rem 0;
		}

		.site-nav li + li {
			border-top: 1px solid var(--border-2);
		}

		.site-nav a {
			display: block;
			padding: 0.9rem 1.25rem;
			font-size: 1rem;
			color: var(--text);
		}
	}

	@media (min-width: 760px) and (max-width: 959px) {
		.site-nav__portfolio {
			display: none;
		}
	}
</style>
