<script lang="ts">
	import { onMount } from 'svelte';
	import { tutor } from '$lib/data/tutor';
	import { onSoundChange, playSound, setSoundEnabled, soundEnabled } from '$lib/sound';
	import { toast } from '$lib/toast.svelte';

	const year = new Date().getFullYear();
	let soundOn = $state(true);

	onMount(() => {
		soundOn = soundEnabled();
		return onSoundChange((on) => (soundOn = on));
	});

	function copyEmail() {
		navigator.clipboard?.writeText(tutor.email).then(
			() => toast('email copied'),
			() => toast(tutor.email)
		);
	}

	function toggleSound() {
		setSoundEnabled(!soundOn);
		if (!soundOn) playSound('pop');
	}
</script>

<footer class="footer">
	<div class="footer__inner">
		<span class="footer__copy">© {year} {tutor.name}</span>
		<button type="button" class="footer-link email-btn" onclick={copyEmail} aria-label="Copy email address {tutor.email}">
			{tutor.email}
		</button>
		<nav class="footer__links" aria-label="Elsewhere">
			<a href={tutor.portfolioUrl} class="footer-link">portfolio</a>
			<a href={tutor.github} target="_blank" rel="noopener noreferrer" class="footer-link">github</a>
			<a href={tutor.linkedin} target="_blank" rel="noopener noreferrer" class="footer-link">linkedin</a>
		</nav>
		<button type="button" class="sound-toggle" aria-pressed={!soundOn} onclick={toggleSound}>
			<span aria-hidden="true">{soundOn ? '♪' : '♪̸'}</span> sound {soundOn ? 'on' : 'off'}
		</button>
	</div>
</footer>

<style>
	.footer {
		margin-top: clamp(2rem, 5vw, 3.5rem);
		padding: 1.5rem clamp(1rem, 4vw, 3rem);
		border-top: 1px solid var(--border-2);
	}

	.footer__inner {
		max-width: 76rem;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.5rem;
		font-size: 0.88rem;
		color: var(--muted);
	}

	.footer__copy {
		color: var(--muter);
	}

	.footer__links {
		display: flex;
		gap: 1.1rem;
	}

	.footer-link {
		color: var(--accent-text);
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.footer-link:hover {
		border-bottom-color: var(--accent);
	}

	.email-btn {
		background: none;
		border: 0;
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		padding: 0;
		font: inherit;
		cursor: pointer;
	}

	.sound-toggle {
		margin-left: auto;
		min-height: 2.25rem;
		padding: 0 0.7rem;
		border: 1px solid var(--border-2);
		background: transparent;
		color: var(--muter);
		font: inherit;
		font-size: 0.78rem;
		cursor: pointer;
	}

	.sound-toggle:hover {
		color: var(--accent-text);
		border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
	}

	@media (max-width: 640px) {
		.footer__inner {
			flex-direction: column;
			text-align: center;
			gap: 0.65rem;
		}

		.sound-toggle {
			margin: 0.35rem 0 0;
			min-height: 2.75rem;
		}
	}
</style>
