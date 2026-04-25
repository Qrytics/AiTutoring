<script lang="ts">
	import { tutor } from '$lib/data/tutor';

	const year = new Date().getFullYear();

	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function copyEmail() {
		navigator.clipboard.writeText(tutor.email).then(() => {
			if (toastTimer !== undefined) clearTimeout(toastTimer);
			toastVisible = true;
			toastTimer = setTimeout(() => (toastVisible = false), 2500);
		});
	}

	function backToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<footer class="footer">
	<div class="footer__inner">
		<span>© {year} {tutor.name}</span>
		<span class="footer__sep">·</span>
		<button class="email-btn footer-link" onclick={copyEmail}>{tutor.email}</button>
		<span class="footer__sep">·</span>
		<a href={tutor.portfolioUrl} class="footer-link">portfolio</a>
		<span class="footer__sep">·</span>
		<a href={tutor.github} target="_blank" rel="noopener noreferrer" class="footer-link">
			github
		</a>
		<span class="footer__sep">·</span>
		<a href={tutor.linkedin} target="_blank" rel="noopener noreferrer" class="footer-link">
			linkedin
		</a>
	</div>
	<button class="back-to-top footer-link" type="button" onclick={backToTop}>back to top ↑</button>
</footer>

{#if toastVisible}
	<div class="toast" role="status" aria-live="polite">email copied to clipboard</div>
{/if}

<style>
	.footer {
		margin-top: clamp(2.25rem, 5vw, 3.5rem);
		padding: 1.25rem clamp(1.25rem, 4vw, 3rem);
		border-top: 1px solid var(--border-2);
		position: relative;
		z-index: 1;
	}

	.footer__inner {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		font-size: 0.95rem;
		max-width: 86rem;
		margin: 0 auto;
		font-family: var(--font-mono);
	}

	.footer__sep {
		color: rgba(243, 246, 255, 0.35);
	}

	@media (max-width: 36rem) {
		.footer {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.footer__inner {
			flex-direction: column;
			gap: 0.5rem;
		}
		.footer__sep {
			display: none;
		}
		.back-to-top {
			position: static;
			transform: none;
			margin-top: 1rem;
		}
	}

	.footer-link {
		color: rgba(54, 242, 194, 0.92);
		text-decoration: none;
		border-bottom: 1px solid rgba(54, 242, 194, 0.3);
		transition: border-color 0.14s ease, color 0.14s ease;
		font-family: var(--font-mono);
	}

	.footer-link:hover {
		color: var(--accent);
		border-color: rgba(54, 242, 194, 0.55);
	}

	.email-btn {
		background: none;
		border: none;
		border-bottom: 1px solid rgba(54, 242, 194, 0.3);
		padding: 0;
		font: inherit;
		cursor: pointer;
	}

	.back-to-top {
		position: absolute;
		right: clamp(1.25rem, 4vw, 3rem);
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.back-to-top:focus-visible {
		outline: 2px solid rgba(54, 242, 194, 0.6);
		outline-offset: 4px;
	}

	.toast {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translate(-50%);
		background: var(--panel);
		color: rgba(243, 246, 255, 0.92);
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
		z-index: 1000;
		text-align: center;
		max-width: calc(100vw - 2rem);
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		animation: toast-in 0.2s ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%) translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translate(-50%) translateY(0);
		}
	}
</style>
