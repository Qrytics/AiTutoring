<script lang="ts">
	import { base } from '$app/paths';
	import { tutor } from '$lib/data/tutor';
</script>

<svelte:head>
	<title>Tutoring</title>
</svelte:head>

<div class="page">
	<div class="page__inner">
		<div class="cancel-card">
			<span class="cancel-icon" aria-hidden="true">✕</span>
			<h1 class="cancel-title">Payment cancelled</h1>
			<p class="cancel-desc">
				No charge was made. If you ran into a problem or have questions, feel free to reach out.
			</p>

			<div class="cancel-actions">
				<a href="{base}/checkout" class="btn btn--primary">Try again →</a>
				<a href="{base}/" class="btn btn--ghost">← Back to home</a>
				<a href="mailto:{tutor.email}" class="btn btn--ghost">Contact me</a>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		padding: clamp(3rem, 6vw, 5rem) 0;
		position: relative;
		z-index: 1;
	}

	.page__inner {
		max-width: 40rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.cancel-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: clamp(2rem, 4vw, 3rem);
		text-align: center;
	}

	.cancel-icon {
		display: inline-grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border: 2px solid rgba(255, 91, 87, 0.5);
		color: #ff7b78;
		font-size: 1rem;
		margin-bottom: 1.25rem;
		font-family: var(--font-mono);
	}

	.cancel-title {
		font-size: clamp(1.35rem, 3vw, 1.85rem);
		margin-bottom: 0.75rem;
		color: var(--text);
	}

	.cancel-desc {
		font-size: 0.93rem;
		color: var(--muted);
		line-height: 1.7;
		margin-bottom: 1.75rem;
		max-width: 40ch;
		margin-inline: auto;
	}

	.cancel-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn {
		display: inline-block;
		padding: 0.55rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.4;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s;
	}

	.btn--primary {
		background: rgba(54, 242, 194, 0.1);
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.btn--primary:hover {
		background: rgba(54, 242, 194, 0.18);
		border-color: rgba(54, 242, 194, 0.75);
	}

	.btn--ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--muted);
	}

	.btn--ghost:hover {
		border-color: rgba(222, 232, 255, 0.3);
		color: var(--text);
	}
</style>
