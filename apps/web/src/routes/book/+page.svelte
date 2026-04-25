<script lang="ts">
	import { base } from '$app/paths';
	import { tutor } from '$lib/data/tutor';
	import { PUBLIC_CALENDLY_URL } from '$env/static/public';

	// Falls back to the static value in tutor.ts if the env var is not set.
	const calendlyUrl = PUBLIC_CALENDLY_URL || tutor.calendlyUrl;

	// Simple embed — load the Calendly widget script on mount
	import { onMount } from 'svelte';

	let scriptLoaded = $state(false);

	onMount(() => {
		if (document.getElementById('calendly-script')) {
			scriptLoaded = true;
			return;
		}
		const script = document.createElement('script');
		script.id = 'calendly-script';
		script.src = 'https://assets.calendly.com/assets/external/widget.js';
		script.async = true;
		script.onload = () => (scriptLoaded = true);
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>Book a Session — {tutor.name}</title>
	<link
		href="https://assets.calendly.com/assets/external/widget.css"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<div class="page__inner">
		<!-- Back link -->
		<a href="{base}/" class="back-link">← back to tutoring home</a>

		<h1 class="page-title">Book a Session</h1>
		<p class="page-lead">
			Choose a time below. After scheduling you'll be directed to complete payment.
		</p>

		<!-- Step indicators -->
		<ol class="steps" aria-label="Booking steps">
			<li class="step step--active" aria-current="step">
				<span class="step__num">1</span>
				<span class="step__label">Pick a time</span>
			</li>
			<li class="step">
				<span class="step__num">2</span>
				<span class="step__label">Pay securely</span>
			</li>
			<li class="step">
				<span class="step__num">3</span>
				<span class="step__label">Join &amp; learn</span>
			</li>
		</ol>

		<!-- Calendly inline embed -->
		<div class="calendly-wrapper">
			{#if calendlyUrl}
				<div
					class="calendly-inline-widget"
					data-url="{calendlyUrl}?hide_event_type_details=1&primary_color=36f2c2"
					style="min-width:320px;height:700px;"
				></div>
			{:else}
				<div class="calendly-placeholder">
					<p>
						Calendly embed will appear here after you set <code>PUBLIC_CALENDLY_URL</code> in your
						environment. See the <a href="{base}/../README.md">README</a> for setup instructions.
					</p>
					<a
						href="https://calendly.com"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn--primary"
					>
						Set up Calendly →
					</a>
				</div>
			{/if}
		</div>

		<!-- After scheduling CTA -->
		<div class="payment-cta">
			<div class="payment-cta__card">
				<p class="payment-cta__label">Step 2 — Complete payment</p>
				<p class="payment-cta__desc">
					Once you've selected a time slot above, click below to choose your session type and pay via
					Stripe Checkout.
				</p>
				<a href="{base}/checkout" class="btn btn--primary">Proceed to Payment →</a>
			</div>
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
		max-width: 72rem;
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
		margin-bottom: 2rem;
		max-width: 56ch;
	}

	/* Step indicator */
	.steps {
		display: flex;
		gap: 0;
		list-style: none;
		margin-bottom: 2.5rem;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 1.1rem;
		flex: 1;
		background: var(--panel);
		border-right: 1px solid var(--border);
		font-size: 0.85rem;
		color: var(--muter);
		transition: background-color 0.15s, color 0.15s;
	}

	.step:last-child {
		border-right: none;
	}

	.step--active {
		background: rgba(54, 242, 194, 0.06);
		color: var(--accent);
	}

	.step__num {
		display: inline-grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border: 1px solid currentColor;
		font-size: 0.72rem;
		flex-shrink: 0;
		font-family: var(--font-mono);
	}

	.step__label {
		font-family: var(--font-mono);
	}

	@media (max-width: 480px) {
		.steps {
			flex-direction: column;
		}
		.step {
			border-right: none;
			border-bottom: 1px solid var(--border);
		}
		.step:last-child {
			border-bottom: none;
		}
	}

	/* Calendly embed */
	.calendly-wrapper {
		border: 1px solid var(--border);
		background: var(--panel);
		overflow: hidden;
		margin-bottom: 2rem;
	}

	.calendly-placeholder {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--muted);
		font-size: 0.9rem;
		line-height: 1.7;
	}

	.calendly-placeholder code {
		font-size: 0.85rem;
	}

	.calendly-placeholder a:not(.btn) {
		color: var(--accent);
	}

	.calendly-placeholder .btn {
		display: inline-block;
		margin-top: 1.25rem;
		padding: 0.55rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		text-decoration: none;
		background: rgba(54, 242, 194, 0.1);
		border: 1px solid rgba(54, 242, 194, 0.5);
		color: var(--accent);
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}

	.calendly-placeholder .btn:hover {
		background: rgba(54, 242, 194, 0.18);
	}

	/* Payment CTA */
	.payment-cta__card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		padding: 1.5rem 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.payment-cta__label {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.payment-cta__desc {
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.6;
		max-width: 56ch;
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
		align-self: flex-start;
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
</style>
