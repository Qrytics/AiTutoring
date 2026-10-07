<script lang="ts">
	import { toastState } from '$lib/toast.svelte';
</script>

<div class="toast" class:toast--visible={toastState.visible} role="status" aria-live="polite">
	{toastState.visible ? toastState.message : ''}
</div>

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: max(1.25rem, env(safe-area-inset-bottom));
		z-index: 500;
		padding: 0.7rem 1.1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
		background: var(--panel);
		color: var(--text);
		font-size: 0.86rem;
		box-shadow: 0 12px 32px -12px color-mix(in srgb, #000 55%, transparent);
		transform: translate(-50%, 1.5rem);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.18s ease, transform 0.18s ease;
	}

	.toast--visible {
		opacity: 1;
		transform: translate(-50%, 0);
	}
</style>
