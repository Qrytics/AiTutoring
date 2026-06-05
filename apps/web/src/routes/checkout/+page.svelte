<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { tutor, pricingTiers } from '$lib/data/tutor';

	let checkoutLoading = $state<string | null>(null);
	let checkoutError = $state<string | null>(null);
	let emailInput = $state('');
	let bookingId = $state<string | null>(null);
	let slotSummary = $state<string | null>(null);
	const singleTier = pricingTiers.find((tier) => tier.id === 'single');

	const isReadyForCheckout = $derived(Boolean(bookingId));

	function readBookingContextFromStorage() {
		const raw = localStorage.getItem('reserved-booking');
		if (!raw) return;
		try {
			const saved = JSON.parse(raw) as {
				bookingId?: string;
				slotStart?: string;
				slotEnd?: string;
			};
			if (!saved.bookingId || !saved.slotStart || !saved.slotEnd) return;

			if (!bookingId) {
				bookingId = saved.bookingId;
			}

			const start = new Date(saved.slotStart);
			const end = new Date(saved.slotEnd);
			slotSummary = `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
				hour: 'numeric',
				minute: '2-digit'
			})} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
		} catch {
			// Ignore corrupted local storage values.
		}
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		bookingId = params.get('bookingId');
		readBookingContextFromStorage();
	});

	async function startCheckout(tierId: string) {
		if (!bookingId) {
			checkoutError = 'Start from the booking page and reserve a time slot first.';
			return;
		}

		if (tierId !== 'single') {
			checkoutError = 'Only single sessions are enabled in native booking right now.';
			return;
		}

		checkoutLoading = tierId;
		checkoutError = null;
		try {
			const res = await fetch(`${base}/api/create-checkout-session`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionType: tierId,
					bookingId,
					customerEmail: emailInput.trim() || undefined
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Unknown error' }));
				throw new Error(err.message ?? 'Checkout failed');
			}
			const { url } = await res.json();
			window.location.href = url;
		} catch (e) {
			checkoutError = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
			checkoutLoading = null;
		}
	}
</script>

<svelte:head>
	<title>Checkout — {tutor.name}</title>
</svelte:head>

<div class="page">
	<div class="page__inner">
		<a href="{base}/book" class="back-link">← back to scheduling</a>

		<h1 class="page-title">Confirm and Pay</h1>
		<p class="page-lead">
			You already picked a time. Confirm your plan and finish payment on Stripe's secure checkout.
		</p>

		{#if slotSummary}
			<div class="booking-summary">
				<p class="booking-summary__label">Reserved slot</p>
				<p>{slotSummary}</p>
			</div>
		{/if}

		{#if !isReadyForCheckout}
			<p class="error-msg" role="alert">
				No active booking found. Go back to <a href="{base}/book">Book a Session</a> to reserve a
				time first.
			</p>
		{/if}

		<!-- Optional email pre-fill -->
		<div class="email-field">
			<label for="email-input" class="field-label">Email (optional — pre-fills Stripe form)</label>
			<input
				id="email-input"
				type="email"
				class="field-input"
				placeholder="you@example.com"
				bind:value={emailInput}
				autocomplete="email"
			/>
		</div>

		{#if checkoutError}
			<p class="error-msg" role="alert">{checkoutError}</p>
		{/if}

		{#if singleTier}
			<div class="pricing-grid">
				<div class="pricing-card" class:pricing-card--popular={singleTier.popular}>
					{#if singleTier.popular}
						<span class="popular-badge">most popular</span>
					{/if}
					<div class="pricing-card__header">
						<h2 class="pricing-card__name">{singleTier.name}</h2>
						<div class="pricing-card__price">
							<span class="pricing-card__amount">${singleTier.price}</span>
							<span class="pricing-card__unit">{singleTier.unit}</span>
						</div>
						{#if singleTier.pricePerHour}
							<p class="pricing-card__per-hr">
								${singleTier.pricePerHour}/hr · saves ${singleTier.savings}
							</p>
						{/if}
					</div>
					<p class="pricing-card__desc">{singleTier.description}</p>
					<ul class="pricing-card__features">
						{#each singleTier.features as feature}
							<li><span class="feature-check" aria-hidden="true">✓</span> {feature}</li>
						{/each}
					</ul>
					<button
						class="btn btn--primary pricing-card__cta"
						class:btn--loading={checkoutLoading === singleTier.id}
						disabled={checkoutLoading !== null || !isReadyForCheckout}
						onclick={() => startCheckout(singleTier.id)}
					>
						{checkoutLoading === singleTier.id ? 'Redirecting to Stripe…' : 'Pay with Stripe →'}
					</button>
				</div>
			</div>
		{/if}

		<div class="security-note">
			<span class="security-note__icon" aria-hidden="true">🔒</span>
			<p>
				Payments are processed by <strong>Stripe</strong>. Your card details are entered on Stripe's
				hosted page and are never stored or seen by this site.
			</p>
		</div>
	</div>
</div>

<style>
	.page {
		padding: clamp(2rem, 4vw, 3.5rem) 0;
		position: relative;
		z-index: 1;
	}

	.page__inner {
		max-width: 86rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.back-link {
		display: inline-block;
		font-size: 0.85rem;
		color: var(--muted);
		text-decoration: none;
		margin-bottom: 1.5rem;
		transition: color 0.15s;
	}
	.back-link:hover {
		color: var(--accent);
	}

	.page-title {
		font-size: clamp(1.35rem, 3vw, 2rem);
		margin-bottom: 0.6rem;
	}

	.page-lead {
		font-size: 0.95rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 1.75rem;
		max-width: 56ch;
	}

	/* Email field */
	.email-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-width: 26rem;
		margin-bottom: 1.75rem;
	}

	.field-label {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		font-family: var(--font-mono);
	}

	.field-input {
		background: var(--panel);
		border: 1px solid var(--border);
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		padding: 0.55rem 0.75rem;
		outline: none;
		transition: border-color 0.14s;
		width: 100%;
	}

	.field-input:focus {
		border-color: rgba(54, 242, 194, 0.5);
	}

	.field-input::placeholder {
		color: var(--muter);
	}

	.error-msg {
		margin-bottom: 1.25rem;
		padding: 0.65rem 1rem;
		background: rgba(255, 91, 87, 0.08);
		border: 1px solid rgba(255, 91, 87, 0.35);
		color: #ff7b78;
		font-size: 0.85rem;
	}

	.booking-summary {
		margin-bottom: 1.2rem;
		padding: 0.9rem 1rem;
		border: 1px solid rgba(54, 242, 194, 0.35);
		background: rgba(54, 242, 194, 0.06);
		font-size: 0.88rem;
		color: var(--muted);
	}

	.booking-summary__label {
		font-size: 0.72rem;
		font-family: var(--font-mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.2rem;
	}

	/* Pricing grid */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
		align-items: start;
		margin-bottom: 2rem;
	}

	.pricing-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.75rem 1.5rem;
		position: relative;
		display: flex;
		flex-direction: column;
		transition: border-color 0.18s, box-shadow 0.18s;
	}

	.pricing-card--popular {
		border-color: rgba(54, 242, 194, 0.4);
		box-shadow: 0 0 0 1px rgba(54, 242, 194, 0.12), 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.popular-badge {
		position: absolute;
		top: -1px;
		right: 1.25rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: var(--accent);
		color: var(--bg);
		padding: 0.15rem 0.55rem;
		font-family: var(--font-mono);
	}

	.coming-soon-badge {
		position: absolute;
		top: -1px;
		left: 1.25rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(222, 232, 255, 0.18);
		color: var(--muted);
		padding: 0.15rem 0.55rem;
		font-family: var(--font-mono);
	}

	.pricing-card__header {
		margin-bottom: 0.75rem;
	}

	.pricing-card__name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.5rem;
	}

	.pricing-card__price {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.pricing-card__amount {
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		font-weight: 700;
		color: var(--text);
		line-height: 1;
	}

	.pricing-card__unit {
		font-size: 0.9rem;
		color: var(--muted);
	}

	.pricing-card__per-hr {
		font-size: 0.78rem;
		color: var(--accent);
		margin-top: 0.25rem;
	}

	.pricing-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 1.1rem;
	}

	.pricing-card__features {
		list-style: none;
		font-size: 0.85rem;
		color: var(--muted);
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-bottom: 1.5rem;
		flex: 1;
	}

	.feature-check {
		color: var(--accent);
		margin-right: 0.4rem;
	}

	.pricing-card__cta {
		width: 100%;
		text-align: center;
	}

	/* Buttons */
	.btn {
		display: inline-block;
		padding: 0.6rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.4;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
		text-align: center;
	}

	.btn--primary {
		background: rgba(54, 242, 194, 0.1);
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.btn--primary:hover:not(:disabled) {
		background: rgba(54, 242, 194, 0.18);
		border-color: rgba(54, 242, 194, 0.75);
	}

	.btn--loading,
	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	/* Security note */
	.security-note {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.9rem 1.1rem;
		background: var(--panel);
		border: 1px solid var(--border-2);
		max-width: 52ch;
		margin-inline: auto;
	}

	.security-note__icon {
		font-size: 1rem;
		flex-shrink: 0;
		line-height: 1.6;
	}

	.security-note p {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.6;
		margin: 0;
	}

	.security-note strong {
		color: var(--text);
	}
</style>
