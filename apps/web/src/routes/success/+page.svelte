<script lang="ts">
	import { base } from '$app/paths';
	import { tutor, pricingTiers } from '$lib/data/tutor';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Look up a human-readable name for the session type
	const tierName = $derived(
		data.session?.sessionType
			? pricingTiers.find((t) => t.id === data.session?.sessionType)?.name ??
					data.session.sessionType
			: null
	);

	// Format the amount in dollars
	const amountFormatted = $derived(
		data.session?.amountTotal != null
			? new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: data.session.currency ?? 'usd'
				}).format(data.session.amountTotal / 100)
			: null
	);

	const bookingTime = $derived(
		data.booking
			? `${new Date(data.booking.slotStart).toLocaleDateString()} ${new Date(
					data.booking.slotStart
			  ).toLocaleTimeString([], {
					hour: 'numeric',
					minute: '2-digit'
			  })} - ${new Date(data.booking.slotEnd).toLocaleTimeString([], {
					hour: 'numeric',
					minute: '2-digit'
			  })}`
			: null
	);
</script>

<svelte:head>
	<title>Tutoring</title>
</svelte:head>

<div class="page">
	<div class="page__inner">
		<div class="success-card">
			<span class="success-icon" aria-hidden="true">✓</span>

			<h1 class="success-title">You're all set!</h1>

			{#if data.session}
				<p class="success-desc">
					{#if data.session.customerEmail}
						A confirmation has been sent to
						<strong>{data.session.customerEmail}</strong>.
					{:else}
						Your payment was successful.
					{/if}
				</p>
				<dl class="session-details">
					{#if tierName}
						<div class="detail-row">
							<dt>Session type</dt>
							<dd>{tierName}</dd>
						</div>
					{/if}
					{#if amountFormatted}
						<div class="detail-row">
							<dt>Amount paid</dt>
							<dd>{amountFormatted}</dd>
						</div>
					{/if}
					{#if bookingTime}
						<div class="detail-row">
							<dt>Scheduled time</dt>
							<dd>{bookingTime}</dd>
						</div>
					{/if}
				</dl>
			{:else}
				<p class="success-desc">
					Your payment was successful. Check your email for confirmation details.
				</p>
			{/if}

			<div class="next-steps">
				<h2 class="next-steps__heading">What happens next</h2>
				<ol class="next-steps__list">
					<li>You'll receive a payment receipt from Stripe.</li>
					<li>Your scheduled time is confirmed above on this page.</li>
					<li>Join the video call at the scheduled time and we'll start right away.</li>
				</ol>
			</div>

			<div class="success-actions">
				<a href="{base}/" class="btn btn--ghost">← Back to tutoring home</a>
				<a href="mailto:{tutor.email}" class="btn btn--primary">Contact me</a>
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
		max-width: 48rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.success-card {
		background: var(--panel);
		border: 1px solid rgba(54, 242, 194, 0.3);
		padding: clamp(2rem, 4vw, 3rem);
		text-align: center;
		box-shadow: 0 0 0 1px rgba(54, 242, 194, 0.07), 0 8px 40px rgba(0, 0, 0, 0.4);
	}

	.success-icon {
		display: inline-grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border: 2px solid var(--accent);
		color: var(--accent);
		font-size: 1.25rem;
		margin-bottom: 1.25rem;
		font-family: var(--font-mono);
	}

	.success-title {
		font-size: clamp(1.5rem, 3vw, 2rem);
		margin-bottom: 0.75rem;
		color: var(--accent);
	}

	.success-desc {
		font-size: 0.95rem;
		color: var(--muted);
		line-height: 1.7;
		margin-bottom: 1.5rem;
		max-width: 44ch;
		margin-inline: auto;
	}

	.session-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: var(--panel-2);
		border: 1px solid var(--border-2);
		padding: 1rem 1.25rem;
		margin-bottom: 1.75rem;
		text-align: left;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		font-size: 0.88rem;
	}

	.detail-row dt {
		color: var(--muted);
		font-family: var(--font-mono);
	}

	.detail-row dd {
		color: var(--text);
		font-family: var(--font-mono);
		margin: 0;
	}

	.next-steps {
		background: var(--panel-2);
		border: 1px solid var(--border-2);
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.75rem;
		text-align: left;
	}

	.next-steps__heading {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	.next-steps__list {
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.6;
	}

	.success-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 0.5rem;
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
