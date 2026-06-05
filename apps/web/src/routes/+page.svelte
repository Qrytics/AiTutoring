<script lang="ts">
	import { base } from '$app/paths';
	import WaveCheckeredBackground from '$lib/components/WaveCheckeredBackground.svelte';
	import { tutor, subjects, pricingTiers, steps, faq } from '$lib/data/tutor';

	// FAQ accordion state — tracks which item is open
	let openFaqIndex = $state<number | null>(null);
	function toggleFaq(i: number) {
		openFaqIndex = openFaqIndex === i ? null : i;
	}
</script>

<svelte:head>
	<title>{tutor.name} — 1-on-1 Technical Tutoring</title>
</svelte:head>

<!-- ═══════════════════════════════════════════════ HERO -->
<section class="hero" aria-label="Introduction">
	<div class="hero__bg" aria-hidden="true">
		<WaveCheckeredBackground />
	</div>
	<div class="hero__content">
		<p class="hero__kicker">tutoring · sessions · cmu engineer</p>
		<h1 class="hero__headline">{tutor.headline}</h1>
		<p class="hero__desc">{tutor.description}</p>
		<div class="hero__actions">
			<a href="{base}/book" class="btn btn--primary">Book a Session →</a>
			<a href="#pricing" class="btn btn--ghost">View pricing</a>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ SUBJECTS -->
<section class="section" id="subjects" aria-label="Subjects">
	<div class="section__inner">
		<h2 class="section-title">what i teach</h2>
		<div class="subjects-grid">
			{#each subjects as subject}
				<div class="card subject-card">
					<span class="subject-card__icon" aria-hidden="true">{subject.icon}</span>
					<h3 class="subject-card__title">{subject.title}</h3>
					<p class="subject-card__desc">{subject.description}</p>
					<div class="subject-card__tags">
						{#each subject.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ HOW IT WORKS -->
<section class="section section--alt" id="how-it-works" aria-label="How it works">
	<div class="section__inner">
		<h2 class="section-title">how it works</h2>
		<div class="steps-grid">
			{#each steps as step}
				<div class="step-card">
					<span class="step-card__number" aria-hidden="true">{step.number}</span>
					<h3 class="step-card__title">{step.title}</h3>
					<p class="step-card__desc">{step.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ PRICING -->
<section class="section" id="pricing" aria-label="Pricing">
	<div class="section__inner">
		<h2 class="section-title">pricing</h2>
		<p class="section-lead">Simple, transparent pricing. Book your time first, then pay.</p>
		<div class="pricing-grid">
			{#each pricingTiers as tier}
				{@const disabledTier = tier.id !== 'single'}
				<div class="pricing-card" class:pricing-card--popular={tier.popular}>
					{#if tier.popular}
						<span class="popular-badge">most popular</span>
					{/if}
					{#if disabledTier}
						<span class="coming-soon-badge">native scheduling soon</span>
					{/if}
					<div class="pricing-card__header">
						<h3 class="pricing-card__name">{tier.name}</h3>
						<div class="pricing-card__price">
							<span class="pricing-card__amount">${tier.price}</span>
							<span class="pricing-card__unit">{tier.unit}</span>
						</div>
						{#if tier.pricePerHour}
							<p class="pricing-card__per-hr">${tier.pricePerHour}/hr · saves ${tier.savings}</p>
						{/if}
					</div>
					<p class="pricing-card__desc">{tier.description}</p>
					<ul class="pricing-card__features">
						{#each tier.features as feature}
							<li><span class="feature-check" aria-hidden="true">✓</span> {feature}</li>
						{/each}
					</ul>
					<a
						class="btn btn--primary pricing-card__cta"
						href={disabledTier ? '#' : `${base}/book`}
						aria-disabled={disabledTier}
					>
						{disabledTier ? 'Coming soon' : 'Book this session →'}
					</a>
				</div>
			{/each}
		</div>
		<p class="pricing-note">
			Single sessions are <strong>$20/hour</strong>.
		</p>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ FAQ -->
<section class="section section--alt" id="faq" aria-label="FAQ">
	<div class="section__inner section__inner--narrow">
		<h2 class="section-title">faq</h2>
		<div class="faq-list">
			{#each faq as item, i}
				<div class="faq-item" class:faq-item--open={openFaqIndex === i}>
					<button
						class="faq-item__trigger"
						onclick={() => toggleFaq(i)}
						aria-expanded={openFaqIndex === i}
						aria-controls="faq-answer-{i}"
					>
						<span>{item.question}</span>
						<span class="faq-item__chevron" aria-hidden="true"
							>{openFaqIndex === i ? '−' : '+'}</span
						>
					</button>
					<div class="faq-item__answer" id="faq-answer-{i}" hidden={openFaqIndex !== i}>
						<p>{item.answer}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════ BOTTOM CTA -->
<section class="section cta-section" aria-label="Call to action">
	<div class="section__inner section__inner--narrow cta-inner">
		<h2 class="cta-heading">Ready to get started?</h2>
		<p class="cta-desc">
			Pick a time that works for you and we'll get to work. First session comes with a
			satisfaction guarantee — if you don't find it useful, I'll refund it.
		</p>
		<a href="{base}/book" class="btn btn--primary btn--large">Book a Session →</a>
	</div>
</section>

<style>
	/* ── Hero ───────────────────────────────────────────── */
	.hero {
		position: relative;
		min-height: 320px;
		z-index: 1;
	}

	.hero__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.22;
	}

	.hero__content {
		position: relative;
		z-index: 1;
		padding: clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 6vw, 5rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		min-height: 320px;
		justify-content: center;
	}

	.hero__kicker {
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	.hero__headline {
		font-size: clamp(1.5rem, 3.5vw, 2.25rem);
		font-weight: 700;
		max-width: 68ch;
		line-height: 1.35;
		margin-bottom: 1rem;
	}

	.hero__desc {
		font-size: clamp(0.9rem, 1.7vw, 1rem);
		max-width: 60ch;
		color: var(--muted);
		line-height: 1.7;
		margin-bottom: 1.75rem;
	}

	[data-theme='light'] .hero__bg {
		opacity: 0.12;
	}

	.hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	/* ── Buttons ────────────────────────────────────────── */
	.btn {
		display: inline-block;
		padding: 0.55rem 1.2rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.4;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
	}

	.btn--primary {
		background: rgba(54, 242, 194, 0.1);
		border-color: rgba(54, 242, 194, 0.5);
		color: var(--accent);
	}

	.btn--primary:hover {
		background: rgba(54, 242, 194, 0.18);
		border-color: rgba(54, 242, 194, 0.75);
		color: var(--accent);
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

	.btn--large {
		padding: 0.75rem 1.75rem;
		font-size: 1rem;
	}

	.btn[aria-disabled='true'] {
		opacity: 0.55;
		pointer-events: none;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Sections ───────────────────────────────────────── */
	.section {
		padding: clamp(2.5rem, 5vw, 4rem) 0;
		position: relative;
		z-index: 1;
	}

	.section--alt {
		background: var(--panel-2);
		border-top: 1px solid var(--border-2);
		border-bottom: 1px solid var(--border-2);
	}

	.section__inner {
		max-width: 86rem;
		margin: 0 auto;
		padding: 0 clamp(1.25rem, 4vw, 3rem);
	}

	.section__inner--narrow {
		max-width: 56rem;
	}

	.section-title {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 1.75rem;
	}

	.section-lead {
		font-size: 0.95rem;
		color: var(--muted);
		margin-top: -1rem;
		margin-bottom: 2rem;
		max-width: 60ch;
	}

	/* ── Subject cards ──────────────────────────────────── */
	.subjects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.35rem 1.5rem;
		transition: border-color 0.18s, box-shadow 0.18s;
	}

	.card:hover {
		border-color: rgba(54, 242, 194, 0.25);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
	}

	.subject-card__icon {
		display: block;
		font-size: 1.4rem;
		margin-bottom: 0.6rem;
		line-height: 1;
	}

	.subject-card__title {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.45rem;
		color: var(--text);
	}

	.subject-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 0.9rem;
	}

	.subject-card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.tag {
		font-size: 0.72rem;
		padding: 0.15rem 0.5rem;
		background: rgba(54, 242, 194, 0.07);
		border: 1px solid rgba(54, 242, 194, 0.2);
		color: rgba(54, 242, 194, 0.85);
		font-family: var(--font-mono);
	}

	/* ── Steps ──────────────────────────────────────────── */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.step-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.5rem;
		position: relative;
	}

	.step-card__number {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: rgba(54, 242, 194, 0.2);
		line-height: 1;
		margin-bottom: 0.75rem;
		font-family: var(--font-mono);
	}

	.step-card__title {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text);
	}

	.step-card__desc {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.6;
	}

	/* ── Pricing cards ──────────────────────────────────── */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.pricing-card {
		background: var(--panel);
		border: 1px solid var(--border);
		padding: 1.75rem 1.5rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0;
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

	.pricing-note {
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
	}

	/* ── FAQ ────────────────────────────────────────────── */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--border);
	}

	.faq-item {
		border-bottom: 1px solid var(--border-2);
	}

	.faq-item:last-child {
		border-bottom: none;
	}

	.faq-item__trigger {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--panel);
		border: none;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.14s, color 0.14s;
	}

	.faq-item__trigger:hover {
		background: color-mix(in srgb, var(--panel) 60%, var(--panel-2));
		color: var(--accent);
	}

	.faq-item--open .faq-item__trigger {
		color: var(--accent);
	}

	.faq-item__chevron {
		flex-shrink: 0;
		font-size: 1.1rem;
		color: var(--muted);
		transition: color 0.14s;
	}

	.faq-item__answer {
		padding: 0.85rem 1.25rem 1.1rem;
		background: var(--panel-2);
		border-top: 1px solid var(--border-2);
	}

	.faq-item__answer[hidden] {
		display: none;
	}

	.faq-item__answer p {
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.7;
		margin: 0;
	}

	/* ── Bottom CTA ─────────────────────────────────────── */
	.cta-section {
		border-top: 1px solid var(--border-2);
	}

	.cta-inner {
		text-align: center;
	}

	.cta-heading {
		font-size: clamp(1.25rem, 2.5vw, 1.75rem);
		margin-bottom: 0.75rem;
	}

	.cta-desc {
		font-size: 0.9rem;
		color: var(--muted);
		line-height: 1.7;
		max-width: 52ch;
		margin: 0 auto 1.75rem;
	}
</style>
